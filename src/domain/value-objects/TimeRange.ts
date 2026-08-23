/**
 * value-objects/TimeRange.ts
 *
 * Immutable value object for an intra-day time range (HH:MM format).
 * Used by: HorarioTrabajo, Citas duration validation.
 *
 * Business invariant: end must be strictly after start.
 */

import { ValidationError } from '../types';

/** HH:MM string — e.g. '09:00', '18:30' */
export type TTimeString = string;

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

function parseMinutes(time: TTimeString): number {
  const [hh = '0', mm = '0'] = time.split(':');
  return parseInt(hh, 10) * 60 + parseInt(mm, 10);
}

export class TimeRange {
  private readonly _start: TTimeString;
  private readonly _end: TTimeString;
  private readonly _startMinutes: number;
  private readonly _endMinutes: number;

  private constructor(start: TTimeString, end: TTimeString) {
    this._start = start;
    this._end = end;
    this._startMinutes = parseMinutes(start);
    this._endMinutes = parseMinutes(end);
  }

  // ── Factory ────────────────────────────────────────────────────────
  static create(start: TTimeString, end: TTimeString): TimeRange {
    if (!TIME_REGEX.test(start)) {
      throw new ValidationError(`Invalid start time: "${start}"`, 'startTime');
    }
    if (!TIME_REGEX.test(end)) {
      throw new ValidationError(`Invalid end time: "${end}"`, 'endTime');
    }
    if (parseMinutes(start) >= parseMinutes(end)) {
      throw new ValidationError('End time must be strictly after start time', 'timeRange');
    }
    return new TimeRange(start, end);
  }

  // ── Accessors ──────────────────────────────────────────────────────
  get start(): TTimeString {
    return this._start;
  }
  get end(): TTimeString {
    return this._end;
  }

  /** Duration in minutes */
  get durationMinutes(): number {
    return this._endMinutes - this._startMinutes;
  }

  // ── Queries ────────────────────────────────────────────────────────
  containsTime(time: TTimeString): boolean {
    const minutes = parseMinutes(time);
    return minutes >= this._startMinutes && minutes <= this._endMinutes;
  }

  overlaps(other: TimeRange): boolean {
    return this._startMinutes < other._endMinutes && this._endMinutes > other._startMinutes;
  }

  equals(other: TimeRange): boolean {
    return this._start === other._start && this._end === other._end;
  }

  toString(): string {
    return `${this._start}–${this._end}`;
  }
}
