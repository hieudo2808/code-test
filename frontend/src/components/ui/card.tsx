import React from "react";

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
}

export function Card({ children, className = "", hover = false }: CardProps) {
    return (
        <div
            className={`group bg-(--bg-secondary) border border-(--border-color) rounded-2xl shadow-md transition-all duration-300 overflow-hidden ${
                hover ? "hover:shadow-xl hover:-translate-y-1 cursor-pointer" : ""
            } ${className}`}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className = "" }: CardProps) {
    return (
        <div
            className={`px-4 py-3 border-b border-(--border-color) bg-(--bg-tertiary) ${className}`}
        >
            {children}
        </div>
    );
}

export function CardBody({ children, className = "" }: CardProps) {
    return <div className={`px-4 py-3 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = "" }: CardProps) {
    return (
        <div
            className={`px-4 py-3 border-t border-(--border-color) bg-(--bg-tertiary) ${className}`}
        >
            {children}
        </div>
    );
}
