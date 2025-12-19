import React from "react";

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
}

export function Card({ children, className = "", hover = false }: CardProps) {
    return (
        <div
            className={`group bg-white border-2 border-gray-200 rounded-2xl shadow-md transition-all duration-300 ${
                hover ? "hover:shadow-xl hover:-translate-y-1 cursor-pointer" : ""
            } ${className}`}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className = "" }: CardProps) {
    return (
        <div className={`px-8 py-5 border-b-2 border-gray-200 bg-gray-50 ${className}`}>
            {children}
        </div>
    );
}

export function CardBody({ children, className = "" }: CardProps) {
    return <div className={`px-8 py-6 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = "" }: CardProps) {
    return (
        <div className={`px-8 py-5 border-t-2 border-gray-200 bg-gray-50 ${className}`}>
            {children}
        </div>
    );
}
