'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      startIcon,
      endIcon,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const baseClasses = [
      'flex h-10 w-full rounded-md border px-3 py-2 text-sm',
      'file:border-0 file:bg-transparent file:text-sm file:font-medium',
      'placeholder:text-gray-500',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'transition-colors duration-200',
    ];

    const stateClasses = error
      ? [
          'border-red-300 text-red-900',
          'focus:border-red-500 focus:ring-red-500',
        ]
      : [
          'border-gray-300',
          'focus:border-blue-500 focus:ring-blue-500',
        ];

    const inputClasses = cn(
      baseClasses,
      stateClasses,
      startIcon && 'pl-10',
      endIcon && 'pr-10',
      className
    );

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium mb-2',
              error ? 'text-red-700' : 'text-gray-700',
              disabled && 'text-gray-400'
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          {startIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className={cn('h-5 w-5', error ? 'text-red-400' : 'text-gray-400')}>
                {startIcon}
              </div>
            </div>
          )}

          <input
            ref={ref}
            type={type}
            id={inputId}
            className={inputClasses}
            disabled={disabled}
            {...props}
          />

          {endIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className={cn('h-5 w-5', error ? 'text-red-400' : 'text-gray-400')}>
                {endIcon}
              </div>
            </div>
          )}
        </div>

        {(error || helperText) && (
          <p
            className={cn(
              'mt-2 text-sm',
              error ? 'text-red-600' : 'text-gray-500'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;