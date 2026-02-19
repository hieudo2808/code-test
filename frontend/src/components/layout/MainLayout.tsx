import { useState, useEffect, useCallback } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useIsMobile } from "~/hooks/use-mobile";

function getInitialDarkMode(): boolean {
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getInitialSidebarOpen(isMobile: boolean): boolean {
    if (isMobile) return false;
    const stored = localStorage.getItem("sidebarOpen");
    if (stored !== null) return stored !== "false";
    return true;
}

export function MainLayout() {
    const isMobile = useIsMobile();
    const [darkMode, setDarkMode] = useState(getInitialDarkMode);
    const [sidebarOpen, setSidebarOpen] = useState(() => getInitialSidebarOpen(isMobile));

    // Apply dark class on mount and when darkMode changes
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
        localStorage.setItem("theme", darkMode ? "dark" : "light");
    }, [darkMode]);

    // Close sidebar on mobile when switching to mobile
    useEffect(() => {
        if (isMobile) {
            setSidebarOpen(false);
        } else {
            const stored = localStorage.getItem("sidebarOpen");
            setSidebarOpen(stored !== "false");
        }
    }, [isMobile]);

    const toggleDarkMode = useCallback(() => {
        setDarkMode((prev) => !prev);
    }, []);

    const toggleSidebar = useCallback(() => {
        setSidebarOpen((prev) => {
            const next = !prev;
            if (!isMobile) {
                localStorage.setItem("sidebarOpen", String(next));
            }
            return next;
        });
    }, [isMobile]);

    return (
        <div className="flex h-screen bg-white dark:bg-gray-900 overflow-hidden">
            <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} isMobile={isMobile} />

            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <Header
                    darkMode={darkMode}
                    onToggleDarkMode={toggleDarkMode}
                    onToggleSidebar={toggleSidebar}
                />

                <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
