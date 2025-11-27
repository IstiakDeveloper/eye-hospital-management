import React, { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';
import { Link } from '@inertiajs/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:shadow-md",
        destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md",
        outline: "border border-gray-200 bg-white text-gray-900 shadow-sm hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300",
        secondary: "bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200",
        ghost: "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
        link: "text-blue-600 underline-offset-4 hover:underline p-0 h-auto",
        success: "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:shadow-md",
        warning: "bg-amber-600 text-white shadow-sm hover:bg-amber-700 hover:shadow-md",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-lg",
        icon: "h-10 w-10 p-0",
        "icon-sm": "h-8 w-8 p-0",
        "icon-lg": "h-12 w-12 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  href?: string;
  active?: boolean;
  children: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    children,
    href,
    active,
    leftIcon,
    rightIcon,
    isLoading = false,
    loadingText = "Loading...",
    disabled,
    asChild,
    ...props
  }, ref) => {

    const classes = cn(
      buttonVariants({ variant, size }),
      active && "bg-blue-700 shadow-inner",
      isLoading && "cursor-not-allowed",
      className
    );

    const LoadingSpinner = () => (
      <svg
        className="animate-spin h-4 w-4"
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

    const ButtonContent = () => (
      <>
        {isLoading && <LoadingSpinner />}
        {!isLoading && leftIcon && (
          <span className={cn("shrink-0", children && "mr-2")}>
            {leftIcon}
          </span>
        )}
        {isLoading ? loadingText : children}
        {!isLoading && rightIcon && (
          <span className={cn("shrink-0", children && "ml-2")}>
            {rightIcon}
          </span>
        )}
      </>
    );

    // If href is provided, render as Link
    if (href) {
      return (
        <Link
          href={href}
          className={classes}
          {...(props as any)}
        >
          <ButtonContent />
        </Link>
      );
    }

    // If asChild is true, clone the child element with button props
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        className: cn(classes, children.props.className),
        ...props,
      });
    }

    // Default button element
    return (
      <button
        className={classes}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        <ButtonContent />
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
