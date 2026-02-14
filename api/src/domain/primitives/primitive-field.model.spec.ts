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
      expect(() => parsePrimitiveType('json')).toThrow('Unsupported primitive type: json');
    });
  });

  describe('validatePrimitiveFieldDefinition', () => {
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
      ).toThrow('Field "score" of type "number" cannot use column "value_bool".');
    });
  });
});
