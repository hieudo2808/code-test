import React from "react";
import { Moon, Sun, Bell } from "lucide-react";
import { Button } from "../ui/Button";

interface HeaderProps {
    darkMode: boolean;
    onToggleDarkMode: () => void;
}

export function Header({ darkMode, onToggleDarkMode }: HeaderProps) {
    return (
        <header className="h-20 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-12 sticky top-0 z-40">
            <div className="flex items-center gap-4">
                <h1 className="text-gray-900 text-xl font-bold">Programming Judge Platform</h1>
            </div>

            <div className="flex items-center gap-3">
                <button className="relative p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
                </button>

                <button
                    onClick={onToggleDarkMode}
                    className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
                >
                    {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
            </div>
        </header>
    );
}

