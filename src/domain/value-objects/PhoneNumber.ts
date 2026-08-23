import { ValidationError } from '../types';

// Accepts Spanish mobile (+34 6xx/7xx) and landline (+34 8xx/9xx), or international E.164
const PHONE_REGEX = /^(\+\d{1,3}\s?)?\d{6,14}$/;

export class PhoneNumber {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(raw: string): PhoneNumber {
    const normalized = raw.trim().replace(/\s+/g, '');
    if (!normalized) {
      throw new ValidationError('Phone number is required', 'telefono');
    }
    if (!PHONE_REGEX.test(normalized)) {
      throw new ValidationError(`"${raw}" is not a valid phone number`, 'telefono');
    }
    return new PhoneNumber(normalized);
  }

  get value(): string {
    return this._value;
  }

  equals(other: PhoneNumber): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
