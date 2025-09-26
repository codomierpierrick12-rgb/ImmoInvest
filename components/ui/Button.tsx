'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      'inline-flex items-center justify-center font-medium transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'rounded-md',
    ];

    const variantClasses = {
      primary: [
        'bg-blue-600 text-white shadow-sm',
        'hover:bg-blue-700 active:bg-blue-800',
        'border border-transparent',
      ],
      secondary: [
        'bg-gray-100 text-gray-900 shadow-sm',
        'hover:bg-gray-200 active:bg-gray-300',
        'border border-gray-300',
      ],
      outline: [
        'bg-transparent text-gray-900 shadow-sm',
        'hover:bg-gray-50 active:bg-gray-100',
        'border border-gray-300',
      ],
      ghost: [
        'bg-transparent text-gray-900',
        'hover:bg-gray-100 active:bg-gray-200',
        'border border-transparent',
      ],
      destructive: [
        'bg-red-600 text-white shadow-sm',
        'hover:bg-red-700 active:bg-red-800',
        'border border-transparent',
      ],
    };

    const sizeClasses = {
      sm: ['h-8 px-3 text-sm'],
      md: ['h-10 px-4 text-sm'],
      lg: ['h-12 px-6 text-base'],
    };

    const classes = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;