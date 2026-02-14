export const primitiveTypes = [
  'boolean',
  'number',
  'duration',
  'text',
] as const;

export type PrimitiveType = (typeof primitiveTypes)[number];

export interface PrimitiveValidation {
  required?: boolean;
  min?: number;
  max?: number;
  integer?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface PrimitiveFieldDefinition {
  fieldKey: string;
  primitiveType: PrimitiveType;
  unit?: string | null;
  validation?: PrimitiveValidation | null;
}

export interface EntryValueColumns {
  value_bool: boolean | null;
  value_num: number | null;
  value_duration_sec: number | null;
  value_text: string | null;
}

function hasOwn(obj: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export function parsePrimitiveType(rawPrimitiveType: string): PrimitiveType {
  if ((primitiveTypes as readonly string[]).includes(rawPrimitiveType)) {
    return rawPrimitiveType as PrimitiveType;
  }

  throw new Error(`Unsupported primitive type: ${rawPrimitiveType}`);
}

export function validatePrimitiveFieldDefinition(
  field: PrimitiveFieldDefinition,
): void {
  if (!field.fieldKey.trim()) {
    throw new Error('fieldKey is required.');
  }

  if (field.primitiveType === 'boolean' && field.unit) {
    throw new Error('Boolean fields cannot define a unit.');
  }

  const validation = field.validation;
  if (!validation) {
    return;
  }

  if (
    (field.primitiveType === 'number' || field.primitiveType === 'duration') &&
    validation.min !== undefined &&
    validation.max !== undefined &&
    validation.min > validation.max
  ) {
    throw new Error('validation.min cannot be greater than validation.max.');
  }

  if (field.primitiveType === 'duration') {
    if ((validation.min ?? 0) < 0) {
      throw new Error('Duration validation.min cannot be negative.');
    }

    if (validation.max !== undefined && validation.max < 0) {
      throw new Error('Duration validation.max cannot be negative.');
    }
  }

  if (field.primitiveType === 'text') {
    if (
      validation.minLength !== undefined &&
      validation.maxLength !== undefined &&
      validation.minLength > validation.maxLength
    ) {
      throw new Error(
        'validation.minLength cannot be greater than validation.maxLength.',
      );
    }

    if (validation.pattern !== undefined) {
      new RegExp(validation.pattern);
    }
  }
}

export function validatePrimitiveValue(
  field: PrimitiveFieldDefinition,
  value: unknown,
): boolean | number | string | null {
  validatePrimitiveFieldDefinition(field);
  const validation = field.validation ?? {};
  const required = validation.required === true;

  if (value === null || value === undefined) {
    if (required) {
      throw new Error(`Field "${field.fieldKey}" is required.`);
    }

    return null;
  }

  if (field.primitiveType === 'boolean') {
    if (typeof value !== 'boolean') {
      throw new Error(`Field "${field.fieldKey}" expects a boolean value.`);
    }

    return value;
  }

  if (field.primitiveType === 'number') {
    if (
      typeof value !== 'number' ||
      Number.isNaN(value) ||
      !Number.isFinite(value)
    ) {
      throw new Error(
        `Field "${field.fieldKey}" expects a finite numeric value.`,
      );
    }

    if (validation.integer && !Number.isInteger(value)) {
      throw new Error(`Field "${field.fieldKey}" expects an integer value.`);
    }

    if (validation.min !== undefined && value < validation.min) {
      throw new Error(
        `Field "${field.fieldKey}" must be >= ${validation.min}.`,
      );
    }

    if (validation.max !== undefined && value > validation.max) {
      throw new Error(
        `Field "${field.fieldKey}" must be <= ${validation.max}.`,
      );
    }

    return value;
  }

  if (field.primitiveType === 'duration') {
    if (
      typeof value !== 'number' ||
      Number.isNaN(value) ||
      !Number.isFinite(value)
    ) {
      throw new Error(
        `Field "${field.fieldKey}" expects a finite duration value in seconds.`,
      );
    }

    if (!Number.isInteger(value)) {
      throw new Error(
        `Field "${field.fieldKey}" duration must be an integer number of seconds.`,
      );
    }

    if (value < 0) {
      throw new Error(`Field "${field.fieldKey}" duration cannot be negative.`);
    }

    if (validation.min !== undefined && value < validation.min) {
      throw new Error(
        `Field "${field.fieldKey}" must be >= ${validation.min}.`,
      );
    }

    if (validation.max !== undefined && value > validation.max) {
      throw new Error(
        `Field "${field.fieldKey}" must be <= ${validation.max}.`,
      );
    }

    return value;
  }

  if (typeof value !== 'string') {
    throw new Error(`Field "${field.fieldKey}" expects a string value.`);
  }

  if (
    validation.minLength !== undefined &&
    value.length < validation.minLength
  ) {
    throw new Error(
      `Field "${field.fieldKey}" length must be >= ${validation.minLength}.`,
    );
  }

  if (
    validation.maxLength !== undefined &&
    value.length > validation.maxLength
  ) {
    throw new Error(
      `Field "${field.fieldKey}" length must be <= ${validation.maxLength}.`,
    );
  }

  if (
    validation.pattern !== undefined &&
    !new RegExp(validation.pattern).test(value)
  ) {
    throw new Error(
      `Field "${field.fieldKey}" does not match required pattern.`,
    );
  }

  return value;
}

export function toEntryValueColumns(
  field: PrimitiveFieldDefinition,
  value: unknown,
): EntryValueColumns {
  const validatedValue = validatePrimitiveValue(field, value);
  const empty: EntryValueColumns = {
    value_bool: null,
    value_num: null,
    value_duration_sec: null,
    value_text: null,
  };

  if (validatedValue === null) {
    return empty;
  }

  if (field.primitiveType === 'boolean') {
    return { ...empty, value_bool: validatedValue as boolean };
  }

  if (field.primitiveType === 'number') {
    return { ...empty, value_num: validatedValue as number };
  }

  if (field.primitiveType === 'duration') {
    return { ...empty, value_duration_sec: validatedValue as number };
  }

  return { ...empty, value_text: validatedValue as string };
}

export function validateEntryValueColumns(
  field: PrimitiveFieldDefinition,
  columns: EntryValueColumns,
): void {
  const keysByPrimitive: Record<PrimitiveType, keyof EntryValueColumns> = {
    boolean: 'value_bool',
    number: 'value_num',
    duration: 'value_duration_sec',
    text: 'value_text',
  };
  const allowedKey = keysByPrimitive[field.primitiveType];
  const hasValueInAnyColumn = Object.values(columns).some(
    (value) => value !== null,
  );

  for (const key of Object.keys(columns) as Array<keyof EntryValueColumns>) {
    if (key !== allowedKey && hasOwn(columns, key) && columns[key] !== null) {
      throw new Error(
        `Field "${field.fieldKey}" of type "${field.primitiveType}" cannot use column "${key}".`,
      );
    }
  }

  validatePrimitiveValue(field, columns[allowedKey]);

  if (!hasValueInAnyColumn && field.validation?.required) {
    throw new Error(`Field "${field.fieldKey}" is required.`);
  }
}
