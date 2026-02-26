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
    difficulty: "EASY" | "MEDIUM" | "HARD";
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
    const displayText = difficulty.charAt(0) + difficulty.slice(1).toLowerCase();

    const difficultyStyles = {
        EASY: "bg-green-100 text-green-700 border border-green-200",
        MEDIUM: "bg-yellow-100 text-yellow-700 border border-yellow-200",
        HARD: "bg-red-100 text-red-700 border border-red-200",
    };

    return (
        <span
            className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold ${difficultyStyles[difficulty]}`}
        >
            {displayText}
        </span>
    );
}

export function StatusBadge({ status }: { status: string }) {
    const s = status?.toUpperCase() || "";
    let variant: "success" | "info" | "warning" | "error";
    if (s === "ACCEPTED") variant = "success";
    else if (s === "PARTIAL" || s === "SCORED" || s === "NEED_REVIEW" || s === "MANUAL")
        variant = "warning";
    else if (
        s === "PENDING" ||
        s === "COMPILING" ||
        s === "RUNNING" ||
        s === "JUDGING" ||
        s === "EVALUATING"
    )
        variant = "info";
    else variant = "error";

    const getDisplayText = () => {
        switch (s) {
            case "ACCEPTED":
                return "Accepted";
            case "MEMORY_LIMIT":
                return "Memory Limit Exceeded";
            case "TIME_LIMIT":
                return "Time Limit Exceeded";
            case "FAILED":
                return "Failed";
            case "COMPILE_ERROR":
                return "Compile Error";
            case "RUNTIME_ERROR":
                return "Runtime Error";
            case "PARTIAL":
                return "Partial";
            case "SCORED":
                return "Scored";
            case "MANUAL":
                return "Manual";
            case "NEED_REVIEW":
                return "Need Review";
            case "PENDING":
                return "Pending";
            case "COMPILING":
                return "Compiling";
            case "RUNNING":
                return "Running";
            case "EVALUATING":
                return "Evaluating";
            case "JUDGING":
                return "Judging";
            default:
                return status;
        }
    };

    return <Badge variant={variant}>{getDisplayText()}</Badge>;
}
