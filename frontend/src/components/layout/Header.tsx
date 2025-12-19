import React from "react";
import { Moon, Sun, Bell } from "lucide-react";

interface HeaderProps {
    darkMode: boolean;
    onToggleDarkMode: () => void;
}

export function Header({ darkMode, onToggleDarkMode }: HeaderProps) {
    return (
        <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between px-6 sticky top-0 z-40">
            <div className="flex items-center gap-4">
                <h1 className="text-gray-900 dark:text-white font-bold">
                    Programming Judge Platform
                </h1>
            </div>

            <div className="flex items-center gap-3">
                <button className="relative p-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
                </button>

                <button
                    onClick={onToggleDarkMode}
                    className="p-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
                >
                    {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
            </div>
        </header>
    );
}
