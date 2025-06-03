// resources/js/Components/ui/select.tsx
import React, { SelectHTMLAttributes, forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, AlertCircle, CheckCircle, Search, X } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  error?: string;
  helperText?: string;
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  success?: boolean;
  loading?: boolean;
  variant?: 'default' | 'filled' | 'underlined';
  selectSize?: 'sm' | 'default' | 'lg';
  leftIcon?: React.ReactNode;
  clearable?: boolean;
  searchable?: boolean;
  emptyMessage?: string;
  onClear?: () => void;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({
    className,
    error,
    helperText,
    label,
    placeholder = "Select an option...",
    options,
    success,
    loading,
    variant = 'default',
    selectSize = 'default',
    leftIcon,
    clearable = false,
    searchable = false,
    emptyMessage = "No options found",
    disabled,
    value,
    onClear,
    onChange,
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);

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
        "hover:border-gray-300 transition-all duration-200",
        "focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10",
        error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
        success && "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/10",
        disabled && "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
      ),
      filled: cn(
        "border-0 bg-gray-100 rounded-lg",
        "hover:bg-gray-200 transition-all duration-200",
        "focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border focus:border-blue-500",
        error && "bg-red-50 focus:bg-white focus:border-red-500 focus:ring-red-500/10",
        success && "bg-emerald-50 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500/10",
        disabled && "bg-gray-100 text-gray-500 cursor-not-allowed"
      ),
      underlined: cn(
        "border-0 border-b-2 border-gray-200 bg-transparent rounded-none px-0",
        "hover:border-gray-300 transition-all duration-200",
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
      const right = 'pr-11'; // Always reserve space for chevron and other icons
      return cn(base, left, right);
    };

    // Filter options based on search
    const filteredOptions = searchable
      ? options.filter(option =>
          option.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : options;

    // Group options if they have groups
    const groupedOptions = filteredOptions.reduce((groups, option) => {
      const group = option.group || '';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(option);
      return groups;
    }, {} as Record<string, SelectOption[]>);

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

    const hasValue = value !== undefined && value !== null && value !== '';

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

        {/* Select Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className={cn(
              "absolute left-0 top-0 bottom-0 flex items-center justify-center w-11 z-10",
              "text-gray-400 pointer-events-none",
              isFocused && "text-blue-500",
              error && "text-red-500",
              success && "text-emerald-500"
            )}>
              {leftIcon}
            </div>
          )}

          {/* Select Field */}
          <select
            className={cn(
              "flex w-full font-medium appearance-none cursor-pointer",
              "focus:outline-none transition-all duration-200",
              "disabled:cursor-not-allowed disabled:opacity-70",
              // Hide default arrow
              "bg-no-repeat bg-right",
              sizeClasses[selectSize],
              variantClasses[variant],
              getPaddingClasses(),
              // Custom styling for selected option
              !hasValue && "text-gray-400",
              className
            )}
            ref={ref}
            disabled={disabled || loading}
            value={value}
            onChange={onChange}
            onFocus={(e) => {
              setIsFocused(true);
              setIsOpen(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              setIsOpen(false);
              props.onBlur?.(e);
            }}
            {...props}
          >
            {/* Placeholder Option */}
            {placeholder && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}

            {/* Render Options */}
            {Object.entries(groupedOptions).map(([group, groupOptions]) => {
              if (group && groupOptions.length > 0) {
                return (
                  <optgroup key={group} label={group}>
                    {groupOptions.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                        className="py-2"
                      >
                        {option.label}
                      </option>
                    ))}
                  </optgroup>
                );
              } else {
                return groupOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className="py-2"
                  >
                    {option.label}
                  </option>
                ));
              }
            })}

            {/* Empty Message */}
            {filteredOptions.length === 0 && (
              <option value="" disabled>
                {emptyMessage}
              </option>
            )}
          </select>

          {/* Right Side Icons */}
          <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center">
            <div className="flex items-center space-x-1 pr-3">
              {/* Clear Button */}
              {clearable && hasValue && !disabled && !loading && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onClear?.();
                  }}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200 p-1"
                  tabIndex={-1}
                >
                  <X className="h-3 w-3" />
                </button>
              )}

              {/* Status Icons */}
              {loading ? (
                <LoadingSpinner />
              ) : error ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : success ? (
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              ) : null}

              {/* Chevron Icon */}
              <ChevronDown className={cn(
                "h-4 w-4 text-gray-400 transition-transform duration-200 pointer-events-none",
                isOpen && "rotate-180",
                disabled && "opacity-50"
              )} />
            </div>
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

Select.displayName = "Select";

export { Select };
export type { SelectOption };
