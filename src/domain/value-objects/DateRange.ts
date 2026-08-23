/**
 * value-objects/DateRange.ts
 *
 * Immutable value object for a date interval.
 * Used by: Ausencias, reporting filters, availability checks.
 *
 * Business invariant: start must be before or equal to end.
 */

import { ValidationError } from '../types';

export class DateRange {
  private readonly _start: Date;
  private readonly _end: Date;

  private constructor(start: Date, end: Date) {
    this._start = new Date(start);
    this._end = new Date(end);
  }

  // ── Factory ────────────────────────────────────────────────────────
  static create(start: Date, end: Date): DateRange {
    if (!(start instanceof Date) || isNaN(start.getTime())) {
      throw new ValidationError('Start date is invalid', 'start');
    }
    if (!(end instanceof Date) || isNaN(end.getTime())) {
      throw new ValidationError('End date is invalid', 'end');
    }
    if (start > end) {
      throw new ValidationError('Start date must be before or equal to end date', 'dateRange');
    }
    return new DateRange(start, end);
  }

  /** Single-day range */
  static singleDay(date: Date): DateRange {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return new DateRange(start, end);
  }

  // ── Accessors ──────────────────────────────────────────────────────
  get start(): Date {
    return new Date(this._start);
  }
  get end(): Date {
    return new Date(this._end);
  }

  get durationMs(): number {
    return this._end.getTime() - this._start.getTime();
  }

  get durationDays(): number {
    return Math.ceil(this.durationMs / (1000 * 60 * 60 * 24));
  }

  // ── Queries ────────────────────────────────────────────────────────
  includes(date: Date): boolean {
    return date >= this._start && date <= this._end;
  }

  overlaps(other: DateRange): boolean {
    return this._start <= other._end && this._end >= other._start;
  }

  equals(other: DateRange): boolean {
    return (
      this._start.getTime() === other._start.getTime() &&
      this._end.getTime() === other._end.getTime()
    );
  }

  toString(): string {
    return `[${this._start.toISOString()} — ${this._end.toISOString()}]`;
  }
}
