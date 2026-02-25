import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export function Input({ label, error, className = "", ...props }: InputProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm mb-3 text-(--text-primary) font-medium">
                    {label}
                </label>
            )}
            <input
                className={`w-full px-4 py-3 bg-(--bg-primary) border-2 border-(--border-color) rounded-lg text-(--text-primary) placeholder-(--text-tertiary) focus:outline-none focus:ring-2 focus:ring-(--primary-500) focus:border-transparent transition-all ${className}`}
                {...props}
            />
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
    );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export function TextArea({ label, error, className = "", ...props }: TextAreaProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm mb-3 text-(--text-primary) font-medium">
                    {label}
                </label>
            )}
            <textarea
                className={`w-full px-4 py-3 bg-(--bg-primary) border-2 border-(--border-color) rounded-lg text-(--text-primary) placeholder-(--text-tertiary) focus:outline-none focus:ring-2 focus:ring-(--primary-500) focus:border-transparent transition-all ${className}`}
                {...props}
            />
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
    );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
}

export function Select({ label, error, options, className = "", ...props }: SelectProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm mb-3 text-(--text-primary) font-medium">
                    {label}
                </label>
            )}
            <select
                className={`w-full px-4 py-3 bg-(--bg-primary) border-2 border-(--border-color) rounded-lg text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--primary-500) focus:border-transparent transition-all ${className}`}
                {...props}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
    );
}
