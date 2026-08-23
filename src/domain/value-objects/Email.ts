/**
 * value-objects/Email.ts
 *
 * Immutable value object for email addresses.
 * Encapsulates validation — the rest of the domain never
 * deals with raw email strings; it uses Email instances.
 */

import { ValidationError } from '../types';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/; // eslint-disable-line no-useless-escape

export class Email {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  // ── Factory ────────────────────────────────────────────────────────
  static create(raw: string): Email {
    const trimmed = raw.trim().toLowerCase();

    if (!trimmed) {
      throw new ValidationError('Email is required', 'email');
    }

    if (!EMAIL_REGEX.test(trimmed)) {
      throw new ValidationError(`"${raw}" is not a valid email address`, 'email');
    }

    return new Email(trimmed);
  }

  // ── Accessors ──────────────────────────────────────────────────────
  get value(): string {
    return this._value;
  }

  get domain(): string {
    return this._value.split('@')[1] ?? '';
  }

  get local(): string {
    return this._value.split('@')[0] ?? '';
  }

  // ── Equality ───────────────────────────────────────────────────────
  equals(other: Email): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
