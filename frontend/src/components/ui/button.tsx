import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    children: React.ReactNode;
}

export function Button({
    variant = "primary",
    size = "md",
    children,
    className = "",
    ...props
}: ButtonProps) {
    const baseStyles =
        "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 active:scale-95";

    const variantStyles = {
        primary:
            "bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform hover:scale-105",
        secondary:
            "bg-gray-100 hover:bg-gray-200 text-gray-900 shadow-sm hover:shadow-md hover:scale-105",
        outline:
            "border-2 border-red-500 text-red-600 hover:bg-red-50 hover:border-red-600 hover:shadow-md hover:scale-105",
        ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm",
        danger: "bg-linear-to-r from-error-500 to-error-600 hover:from-error-600 hover:to-error-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform hover:scale-105",
    };

    const sizeStyles = {
        sm: "px-5 py-2.5 text-sm gap-2",
        md: "px-7 py-3 gap-2.5 text-base",
        lg: "px-9 py-3.5 gap-3 text-lg",
    };

    const focusStyles = {
        primary: "focus:ring-red-200",
        secondary: "focus:ring-gray-200",
        outline: "focus:ring-red-200",
        ghost: "focus:ring-gray-200",
        danger: "focus:ring-error-200",
    };

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${focusStyles[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
