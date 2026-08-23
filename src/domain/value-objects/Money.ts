/**
 * value-objects/Money.ts
 *
 * Immutable value object for monetary amounts.
 * Used by: Servicios (precio, descuento), Citas (total cobrado).
 *
 * Storage: integer cents internally to avoid floating-point errors.
 * Display: formatted per locale externally.
 */

import { ValidationError } from '../types';

export class Money {
  /** Amount in smallest currency unit (cents) */
  private readonly _cents: number;
  private readonly _currency: string;

  private constructor(cents: number, currency: string) {
    this._cents = cents;
    this._currency = currency;
  }

  // ── Factory ────────────────────────────────────────────────────────
  /** @param amount - decimal euros (e.g. 49.90) */
  static fromEuros(amount: number, currency = 'EUR'): Money {
    if (amount < 0) {
      throw new ValidationError('Amount cannot be negative', 'amount');
    }
    if (!isFinite(amount)) {
      throw new ValidationError('Amount must be a finite number', 'amount');
    }
    return new Money(Math.round(amount * 100), currency);
  }

  static fromCents(cents: number, currency = 'EUR'): Money {
    if (!Number.isInteger(cents) || cents < 0) {
      throw new ValidationError('Cents must be a non-negative integer', 'cents');
    }
    return new Money(cents, currency);
  }

  static zero(currency = 'EUR'): Money {
    return new Money(0, currency);
  }

  // ── Accessors ──────────────────────────────────────────────────────
  get cents(): number {
    return this._cents;
  }
  get currency(): string {
    return this._currency;
  }
  get euros(): number {
    return this._cents / 100;
  }
  get isZero(): boolean {
    return this._cents === 0;
  }
  get isPositive(): boolean {
    return this._cents > 0;
  }

  // ── Arithmetic ─────────────────────────────────────────────────────
  add(other: Money): Money {
    this.#assertSameCurrency(other);
    return new Money(this._cents + other._cents, this._currency);
  }

  subtract(other: Money): Money {
    this.#assertSameCurrency(other);
    const result = this._cents - other._cents;
    if (result < 0) {
      throw new ValidationError('Subtraction would result in negative amount', 'amount');
    }
    return new Money(result, this._currency);
  }

  /** @param percentage 0–100 */
  applyDiscount(percentage: number): Money {
    if (percentage < 0 || percentage > 100) {
      throw new ValidationError('Discount must be between 0 and 100', 'discount');
    }
    const discounted = Math.round(this._cents * (1 - percentage / 100));
    return new Money(discounted, this._currency);
  }

  multiply(factor: number): Money {
    if (factor < 0) {
      throw new ValidationError('Factor cannot be negative', 'factor');
    }
    return new Money(Math.round(this._cents * factor), this._currency);
  }

  // ── Comparison ─────────────────────────────────────────────────────
  equals(other: Money): boolean {
    return this._cents === other._cents && this._currency === other._currency;
  }

  greaterThan(other: Money): boolean {
    this.#assertSameCurrency(other);
    return this._cents > other._cents;
  }

  lessThan(other: Money): boolean {
    this.#assertSameCurrency(other);
    return this._cents < other._cents;
  }

  // ── Display ────────────────────────────────────────────────────────
  format(locale = 'es-ES'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this._currency,
    }).format(this.euros);
  }

  toString(): string {
    return this.format();
  }

  // ── Private ────────────────────────────────────────────────────────
  #assertSameCurrency(other: Money): void {
    if (this._currency !== other._currency) {
      throw new ValidationError(
        `Currency mismatch: ${this._currency} vs ${other._currency}`,
        'currency',
      );
    }
  }
}
