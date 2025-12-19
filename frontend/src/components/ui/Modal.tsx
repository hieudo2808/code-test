import React from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-[var(--bg-primary)] rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden mx-4">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
                    <h3>{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">{children}</div>
                {footer && (
                    <div className="px-6 py-4 border-t border-[var(--border-color)] flex justify-end gap-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
