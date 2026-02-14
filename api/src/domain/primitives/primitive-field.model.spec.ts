import {
  parsePrimitiveType,
  toEntryValueColumns,
  validateEntryValueColumns,
  validatePrimitiveFieldDefinition,
  validatePrimitiveValue,
  type PrimitiveFieldDefinition,
} from './primitive-field.model';

describe('primitive-field.model', () => {
  describe('parsePrimitiveType', () => {
    it('accepts known primitive types', () => {
      expect(parsePrimitiveType('boolean')).toBe('boolean');
      expect(parsePrimitiveType('number')).toBe('number');
      expect(parsePrimitiveType('duration')).toBe('duration');
      expect(parsePrimitiveType('text')).toBe('text');
    });

    it('rejects unknown primitive types', () => {
      expect(() => parsePrimitiveType('json')).toThrow(
        'Unsupported primitive type: json',
      );
    });
  });

  describe('validatePrimitiveFieldDefinition', () => {
    it('rejects blank field keys', () => {
      const field: PrimitiveFieldDefinition = {
        fieldKey: '   ',
        primitiveType: 'text',
      };

      expect(() => validatePrimitiveFieldDefinition(field)).toThrow(
        'fieldKey is required.',
      );
    });

    it('rejects invalid field metadata combinations', () => {
      const boolField: PrimitiveFieldDefinition = {
        fieldKey: 'complete',
        primitiveType: 'boolean',
        unit: 'seconds',
      };

      expect(() => validatePrimitiveFieldDefinition(boolField)).toThrow(
        'Boolean fields cannot define a unit.',
      );
    });

    it('rejects invalid numeric validation ranges', () => {
      const numberField: PrimitiveFieldDefinition = {
        fieldKey: 'weight',
        primitiveType: 'number',
        validation: { min: 100, max: 10 },
      };

      expect(() => validatePrimitiveFieldDefinition(numberField)).toThrow(
        'validation.min cannot be greater than validation.max.',
      );
    });

    it('rejects invalid text validation ranges', () => {
      const textField: PrimitiveFieldDefinition = {
        fieldKey: 'note',
        primitiveType: 'text',
        validation: { minLength: 10, maxLength: 5 },
      };

      expect(() => validatePrimitiveFieldDefinition(textField)).toThrow(
        'validation.minLength cannot be greater than validation.maxLength.',
      );
    });

    it('rejects negative duration validation limits', () => {
      const minField: PrimitiveFieldDefinition = {
        fieldKey: 'focus',
        primitiveType: 'duration',
        validation: { min: -1 },
      };
      const maxField: PrimitiveFieldDefinition = {
        fieldKey: 'focus',
        primitiveType: 'duration',
        validation: { max: -1 },
      };

      expect(() => validatePrimitiveFieldDefinition(minField)).toThrow(
        'Duration validation.min cannot be negative.',
      );
      expect(() => validatePrimitiveFieldDefinition(maxField)).toThrow(
        'Duration validation.max cannot be negative.',
      );
    });
  });

  describe('validatePrimitiveValue', () => {
    it('supports boolean values', () => {
      const field: PrimitiveFieldDefinition = {
        fieldKey: 'complete',
        primitiveType: 'boolean',
        validation: { required: true },
      };

      expect(validatePrimitiveValue(field, true)).toBe(true);
      expect(() => validatePrimitiveValue(field, 'true')).toThrow(
        'Field "complete" expects a boolean value.',
      );
    });

    it('supports number values', () => {
      const field: PrimitiveFieldDefinition = {
        fieldKey: 'weight',
        primitiveType: 'number',
        unit: 'kg',
        validation: { min: 0, max: 300 },
      };

      expect(validatePrimitiveValue(field, 82.5)).toBe(82.5);
      expect(() => validatePrimitiveValue(field, false)).toThrow(
        'Field "weight" expects a finite numeric value.',
      );
    });

    it('enforces number min/max constraints', () => {
      const field: PrimitiveFieldDefinition = {
        fieldKey: 'weight',
        primitiveType: 'number',
        validation: { min: 50, max: 100 },
      };

      expect(() => validatePrimitiveValue(field, 40)).toThrow(
        'Field "weight" must be >= 50.',
      );
      expect(() => validatePrimitiveValue(field, 120)).toThrow(
        'Field "weight" must be <= 100.',
      );
    });

    it('enforces required and integer constraints for number values', () => {
      const field: PrimitiveFieldDefinition = {
        fieldKey: 'reps',
        primitiveType: 'number',
        validation: { required: true, integer: true },
      };

      expect(() => validatePrimitiveValue(field, null)).toThrow(
        'Field "reps" is required.',
      );
      expect(() => validatePrimitiveValue(field, 1.2)).toThrow(
        'Field "reps" expects an integer value.',
      );
    });

    it('supports duration values', () => {
      const field: PrimitiveFieldDefinition = {
        fieldKey: 'focus',
        primitiveType: 'duration',
        unit: 'seconds',
        validation: { min: 60 },
      };

      expect(validatePrimitiveValue(field, 600)).toBe(600);
      expect(() => validatePrimitiveValue(field, -1)).toThrow(
        'Field "focus" duration cannot be negative.',
      );
    });

    it('enforces duration type and range constraints', () => {
      const field: PrimitiveFieldDefinition = {
        fieldKey: 'focus',
        primitiveType: 'duration',
        validation: { min: 60, max: 120 },
      };

      expect(() => validatePrimitiveValue(field, Number.NaN)).toThrow(
        'Field "focus" expects a finite duration value in seconds.',
      );
      expect(() => validatePrimitiveValue(field, 90.5)).toThrow(
        'Field "focus" duration must be an integer number of seconds.',
      );
      expect(() => validatePrimitiveValue(field, 30)).toThrow(
        'Field "focus" must be >= 60.',
      );
      expect(() => validatePrimitiveValue(field, 180)).toThrow(
        'Field "focus" must be <= 120.',
      );
    });

    it('supports text values', () => {
      const field: PrimitiveFieldDefinition = {
        fieldKey: 'note',
        primitiveType: 'text',
        validation: { minLength: 2, maxLength: 5 },
      };

      expect(validatePrimitiveValue(field, 'ok')).toBe('ok');
      expect(() => validatePrimitiveValue(field, 123)).toThrow(
        'Field "note" expects a string value.',
      );
    });

    it('enforces text length constraints', () => {
      const field: PrimitiveFieldDefinition = {
        fieldKey: 'note',
        primitiveType: 'text',
        validation: { minLength: 2, maxLength: 4 },
      };

      expect(() => validatePrimitiveValue(field, 'a')).toThrow(
        'Field "note" length must be >= 2.',
      );
      expect(() => validatePrimitiveValue(field, 'abcde')).toThrow(
        'Field "note" length must be <= 4.',
      );
    });

    it('enforces regex patterns for text values', () => {
      const field: PrimitiveFieldDefinition = {
        fieldKey: 'color',
        primitiveType: 'text',
        validation: { pattern: '^[A-Z]{3}$' },
      };

      expect(validatePrimitiveValue(field, 'RED')).toBe('RED');
      expect(() => validatePrimitiveValue(field, 'red')).toThrow(
        'Field "color" does not match required pattern.',
      );
    });
  });

  describe('entry value columns', () => {
    it('maps values to a single storage column by primitive type', () => {
      const field: PrimitiveFieldDefinition = {
        fieldKey: 'complete',
        primitiveType: 'boolean',
      };

      expect(toEntryValueColumns(field, true)).toEqual({
        value_bool: true,
        value_num: null,
        value_duration_sec: null,
        value_text: null,
      });
    });

    it('maps nullable values to all-null storage columns', () => {
      const field: PrimitiveFieldDefinition = {
        fieldKey: 'optional',
        primitiveType: 'text',
      };

      expect(toEntryValueColumns(field, null)).toEqual({
        value_bool: null,
        value_num: null,
        value_duration_sec: null,
        value_text: null,
      });
    });

    it('maps number, duration, and text values to their respective columns', () => {
      const numberField: PrimitiveFieldDefinition = {
        fieldKey: 'score',
        primitiveType: 'number',
      };
      const durationField: PrimitiveFieldDefinition = {
        fieldKey: 'focus',
        primitiveType: 'duration',
      };
      const textField: PrimitiveFieldDefinition = {
        fieldKey: 'note',
        primitiveType: 'text',
      };

      expect(toEntryValueColumns(numberField, 5)).toEqual({
        value_bool: null,
        value_num: 5,
        value_duration_sec: null,
        value_text: null,
      });
      expect(toEntryValueColumns(durationField, 90)).toEqual({
        value_bool: null,
        value_num: null,
        value_duration_sec: 90,
        value_text: null,
      });
      expect(toEntryValueColumns(textField, 'ok')).toEqual({
        value_bool: null,
        value_num: null,
        value_duration_sec: null,
        value_text: 'ok',
      });
    });

    it('rejects invalid type/value column combinations', () => {
      const numberField: PrimitiveFieldDefinition = {
        fieldKey: 'score',
        primitiveType: 'number',
      };

      expect(() =>
        validateEntryValueColumns(numberField, {
          value_bool: true,
          value_num: null,
          value_duration_sec: null,
          value_text: null,
        }),
      ).toThrow(
        'Field "score" of type "number" cannot use column "value_bool".',
      );
    });

    it('enforces required fields when all value columns are null', () => {
      const numberField: PrimitiveFieldDefinition = {
        fieldKey: 'score',
        primitiveType: 'number',
        validation: { required: true },
      };

      expect(() =>
        validateEntryValueColumns(numberField, {
          value_bool: null,
          value_num: null,
          value_duration_sec: null,
          value_text: null,
        }),
      ).toThrow('Field "score" is required.');
    });

    it('accepts valid columns for the field primitive type', () => {
      const durationField: PrimitiveFieldDefinition = {
        fieldKey: 'focus',
        primitiveType: 'duration',
      };

      expect(() =>
        validateEntryValueColumns(durationField, {
          value_bool: null,
          value_num: null,
          value_duration_sec: 180,
          value_text: null,
        }),
      ).not.toThrow();
    });
  });
});
