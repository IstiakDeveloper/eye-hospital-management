import React, { InputHTMLAttributes, forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  helperText?: string;
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  success?: boolean;
  loading?: boolean;
  variant?: 'default' | 'filled' | 'underlined';
  inputSize?: 'sm' | 'default' | 'lg';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    error,
    helperText,
    label,
    leftIcon,
    rightIcon,
    success,
    loading,
    variant = 'default',
    inputSize = 'default',
    type,
    disabled,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    // Size variants
    const sizeClasses = {
      sm: "h-8 text-sm",
      default: "h-11 text-sm",
      lg: "h-12 text-base"
    };

    // Variant styles
    const variantClasses = {
      default: cn(
        "border border-gray-200 bg-white rounded-lg",
        "hover:border-gray-300 transition-colors duration-200",
        "focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10",
        error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
        success && "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/10",
        disabled && "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
      ),
      filled: cn(
        "border-0 bg-gray-100 rounded-lg",
        "hover:bg-gray-200 transition-colors duration-200",
        "focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border focus:border-blue-500",
        error && "bg-red-50 focus:bg-white focus:border-red-500 focus:ring-red-500/10",
        success && "bg-emerald-50 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500/10",
        disabled && "bg-gray-100 text-gray-500 cursor-not-allowed"
      ),
      underlined: cn(
        "border-0 border-b-2 border-gray-200 bg-transparent rounded-none px-0",
        "hover:border-gray-300 transition-colors duration-200",
        "focus:border-blue-500 focus:ring-0",
        error && "border-red-500 focus:border-red-500",
        success && "border-emerald-500 focus:border-emerald-500",
        disabled && "border-gray-200 text-gray-500 cursor-not-allowed"
      )
    };

    // Padding classes based on icons
    const getPaddingClasses = () => {
      const base = variant === 'underlined' ? 'py-2' : 'py-3';
      const left = leftIcon ? 'pl-11' : variant === 'underlined' ? 'pl-0' : 'pl-4';
      const right = (rightIcon || isPassword || success || error) ? 'pr-11' : variant === 'underlined' ? 'pr-0' : 'pr-4';
      return cn(base, left, right);
    };

    const LoadingSpinner = () => (
      <svg
        className="animate-spin h-4 w-4 text-gray-400"
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
    );

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label className={cn(
            "block text-sm font-medium mb-2 transition-colors duration-200",
            error ? "text-red-700" : success ? "text-emerald-700" : "text-gray-700",
            disabled && "text-gray-500"
          )}>
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className={cn(
              "absolute left-0 top-0 bottom-0 flex items-center justify-center w-11",
              "text-gray-400 pointer-events-none",
              isFocused && "text-blue-500",
              error && "text-red-500",
              success && "text-emerald-500"
            )}>
              {leftIcon}
            </div>
          )}

          {/* Input Field */}
          <input
            type={inputType}
            className={cn(
              "flex w-full font-medium placeholder:text-gray-400 placeholder:font-normal",
              "focus:outline-none transition-all duration-200",
              "disabled:cursor-not-allowed disabled:opacity-70",
              sizeClasses[inputSize],
              variantClasses[variant],
              getPaddingClasses(),
              className
            )}
            ref={ref}
            disabled={disabled || loading}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />

          {/* Right Side Icons */}
          <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-11">
            {loading ? (
              <LoadingSpinner />
            ) : error ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : success ? (
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            ) : isPassword ? (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            ) : rightIcon ? (
              <div className="text-gray-400 pointer-events-none">
                {rightIcon}
              </div>
            ) : null}
          </div>
        </div>

        {/* Helper Text / Error Message */}
        {(error || helperText) && (
          <div className="mt-2 flex items-start space-x-1">
            {error && <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />}
            <p className={cn(
              "text-sm leading-5",
              error ? "text-red-600" : "text-gray-500"
            )}>
              {error || helperText}
            </p>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
