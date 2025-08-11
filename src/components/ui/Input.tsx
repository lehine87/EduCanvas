import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Input component props interface
 */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Label text for the input */
  label?: string;
  /** Helper text displayed below the input */
  helperText?: string;
  /** Error message to display */
  error?: string;
  /** Success state */
  success?: boolean;
  /** Size of the input */
  size?: 'sm' | 'md' | 'lg';
  /** Icon to display on the left side */
  leftIcon?: React.ReactNode;
  /** Icon to display on the right side */
  rightIcon?: React.ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Required field indicator */
  required?: boolean;
  /** Additional CSS classes for the input */
  inputClassName?: string;
  /** Additional CSS classes for the wrapper */
  wrapperClassName?: string;
}

/**
 * Reusable Input component with validation states and consistent styling
 * 
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="Enter your email"
 *   error={errors.email}
 *   required
 * />
 * ```
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    helperText,
    error,
    success = false,
    size = 'md',
    leftIcon,
    rightIcon,
    loading = false,
    required = false,
    inputClassName,
    wrapperClassName,
    className,
    disabled,
    id,
    ...props
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;
    const hasSuccess = success && !hasError;

    const baseInputStyles = 'block w-full border rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed';
    
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-3 text-base',
    };

    const stateStyles = {
      default: 'border-gray-300 focus:border-brand-500 focus:ring-brand-500',
      error: 'border-error-500 focus:border-error-500 focus:ring-error-500',
      success: 'border-success-500 focus:border-success-500 focus:ring-success-500',
    };

    const currentState = hasError ? 'error' : hasSuccess ? 'success' : 'default';
    
    const paddingWithIcon = {
      left: leftIcon ? 'pl-10' : '',
      right: rightIcon || loading ? 'pr-10' : '',
    };

    return (
      <div className={cn('w-full', wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">{leftIcon}</span>
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            disabled={disabled || loading}
            className={cn(
              baseInputStyles,
              sizeStyles[size],
              stateStyles[currentState],
              paddingWithIcon.left,
              paddingWithIcon.right,
              inputClassName,
              className
            )}
            {...props}
          />
          
          {(rightIcon || loading) && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 text-gray-400"
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
              ) : (
                <span className="text-gray-400">{rightIcon}</span>
              )}
            </div>
          )}
          
          {hasSuccess && !loading && !rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <svg
                className="h-5 w-5 text-success-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <div className="mt-1">
            {error && (
              <p className="text-sm text-error-500 flex items-center">
                <svg
                  className="h-4 w-4 mr-1 flex-shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </p>
            )}
            {!error && helperText && (
              <p className="text-sm text-gray-500">{helperText}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * Textarea component with same styling as Input
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: boolean;
  required?: boolean;
  wrapperClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    label,
    helperText,
    error,
    success = false,
    required = false,
    wrapperClassName,
    className,
    id,
    ...props
  }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;
    const hasSuccess = success && !hasError;

    const baseStyles = 'block w-full border rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed px-3 py-2 text-sm';
    
    const stateStyles = {
      default: 'border-gray-300 focus:border-brand-500 focus:ring-brand-500',
      error: 'border-error-500 focus:border-error-500 focus:ring-error-500',
      success: 'border-success-500 focus:border-success-500 focus:ring-success-500',
    };

    const currentState = hasError ? 'error' : hasSuccess ? 'success' : 'default';

    return (
      <div className={cn('w-full', wrapperClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            baseStyles,
            stateStyles[currentState],
            className
          )}
          {...props}
        />
        
        {(error || helperText) && (
          <div className="mt-1">
            {error && (
              <p className="text-sm text-error-500 flex items-center">
                <svg
                  className="h-4 w-4 mr-1 flex-shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </p>
            )}
            {!error && helperText && (
              <p className="text-sm text-gray-500">{helperText}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';