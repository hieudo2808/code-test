import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function MainLayout() {
    const [darkMode, setDarkMode] = useState(false);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        if (!darkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    };

    return (
        <div className="flex h-screen bg-white dark:bg-gray-900">
            <Sidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />

                <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800">
                    <div className="max-w-7xl mx-auto px-6 py-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
