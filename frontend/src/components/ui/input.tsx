import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export function Input({ label, error, className = "", ...props }: InputProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm mb-3 text-[var(--text-primary)] font-medium">
                    {label}
                </label>
            )}
            <input
                className={`w-full px-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent transition-all ${className}`}
                {...props}
            />
            {error && <p className="mt-2 text-sm text-[var(--error-500)]">{error}</p>}
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
                <label className="block text-sm mb-3 text-[var(--text-primary)] font-medium">
                    {label}
                </label>
            )}
            <textarea
                className={`w-full px-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent transition-all ${className}`}
                {...props}
            />
            {error && <p className="mt-2 text-sm text-[var(--error-500)]">{error}</p>}
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
                <label className="block text-sm mb-3 text-[var(--text-primary)] font-medium">
                    {label}
                </label>
            )}
            <select
                className={`w-full px-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent transition-all ${className}`}
                {...props}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <p className="mt-2 text-sm text-[var(--error-500)]">{error}</p>}
        </div>
    );
}
