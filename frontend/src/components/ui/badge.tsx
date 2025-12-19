import React from "react";

interface BadgeProps {
    children: React.ReactNode;
    variant?: "default" | "success" | "info" | "warning" | "error";
    className?: string;
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
    const variantStyles = {
        default: "bg-gray-100 text-gray-700 border border-gray-200",
        success: "bg-green-100 text-green-700 border border-green-200",
        info: "bg-blue-100 text-blue-700 border border-blue-200",
        warning: "bg-yellow-100 text-yellow-700 border border-yellow-200",
        error: "bg-red-100 text-red-700 border border-red-200",
    };

    return (
        <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${variantStyles[variant]} ${className}`}
        >
            {children}
        </span>
    );
}

interface DifficultyBadgeProps {
    difficulty: "Easy" | "Medium" | "Hard";
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
    const difficultyStyles = {
        Easy: "bg-green-100 text-green-700 border border-green-200",
        Medium: "bg-yellow-100 text-yellow-700 border border-yellow-200",
        Hard: "bg-red-100 text-red-700 border border-red-200",
    };

    return (
        <span
            className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold ${difficultyStyles[difficulty]}`}
        >
            {difficulty}
        </span>
    );
}

export function StatusBadge({ status }: { status: string }) {
    const variant = status === "Accepted" ? "success" : status === "Pending" ? "info" : "error";
    return <Badge variant={variant}>{status}</Badge>;
}
