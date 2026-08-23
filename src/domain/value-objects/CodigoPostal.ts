import { ValidationError } from '../types';

// Spanish 5-digit postal codes: 01000–52999
const CP_REGEX = /^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/;

export class CodigoPostal {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(raw: string): CodigoPostal {
    const normalized = raw.trim();
    if (!normalized) {
      throw new ValidationError('Código postal is required', 'codigoPostal');
    }
    if (!CP_REGEX.test(normalized)) {
      throw new ValidationError(`"${raw}" is not a valid Spanish postal code`, 'codigoPostal');
    }
    return new CodigoPostal(normalized);
  }

  get value(): string {
    return this._value;
  }

  // Province code (first 2 digits)
  get provincia(): string {
    return this._value.slice(0, 2);
  }

  equals(other: CodigoPostal): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
