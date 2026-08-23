/**
 * DatePicker — Types
 * ISP: interfaces mínimas por responsabilidad.
 */

export type DatePickerVariant = 'default' | 'outlined' | 'ghost';
export type DatePickerSize = 'sm' | 'md' | 'lg';

interface DatePickerBaseProps {
  label?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  variant?: DatePickerVariant;
  size?: DatePickerSize;
  min?: Date;
  max?: Date;
  className?: string;
}

export interface DatePickerProps extends DatePickerBaseProps {
  name?: string;
  value?: Date | null;
  defaultValue?: Date | null;
  placeholder?: string;
  onChange?: (date: Date | null) => void;
}

export interface DateTimePickerProps extends DatePickerProps {
  timeStep?: number;
}

export interface DateRangeValue {
  start: Date | null;
  end: Date | null;
}

export interface DatePickerGroupProps extends DatePickerBaseProps {
  value?: DateRangeValue;
  defaultValue?: DateRangeValue;
  placeholderStart?: string;
  placeholderEnd?: string;
  nameStart?: string;
  nameEnd?: string;
  onChange?: (range: DateRangeValue) => void;
}

export interface DateTimePickerGroupProps extends DatePickerGroupProps {
  timeStep?: number;
}
