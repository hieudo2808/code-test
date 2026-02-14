import { useState, useRef, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Moon, Sun, Bell, LogOut, User, Check, CheckCheck } from "lucide-react";
import { useAuth } from "~/contexts/AuthContext";
import { useNotifications } from "~/contexts/NotificationContext";

interface HeaderProps {
    darkMode: boolean;
    onToggleDarkMode: () => void;
}

export function Header({ darkMode, onToggleDarkMode }: HeaderProps) {
    const { user, logout } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        logout();
        <Navigate to="/login" />;
    };

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getRoleLabel = (role?: string) => {
        switch (role) {
            case "student":
                return "Sinh viên";
            case "instructor":
                return "Giảng viên";
            case "admin":
                return "Quản trị viên";
            default:
                return "";
        }
    };

    const formatTime = (dateValue: string | number) => {
        const date = typeof dateValue === "number"
            ? new Date(dateValue)
            : new Date(dateValue);
        if (isNaN(date.getTime())) return "";

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return "Vừa xong";
        if (diffMin < 60) return `${diffMin} phút trước`;
        const diffHours = Math.floor(diffMin / 60);
        if (diffHours < 24) return `${diffHours} giờ trước`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return date.toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between px-6 sticky top-0 z-40">
            <div className="flex items-center gap-4">
                <h1 className="text-gray-900 dark:text-white font-bold">
                    Programming Judge Platform
                </h1>
            </div>

            <div className="flex items-center gap-3">
                {/* Notifications */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="relative p-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </button>

                    {showDropdown && (
                        <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                                    Thông báo
                                </h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={async () => {
                                            await markAllAsRead();
                                        }}
                                        className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                                    >
                                        <CheckCheck className="w-3.5 h-3.5" />
                                        Đánh dấu tất cả đã đọc
                                    </button>
                                )}
                            </div>

                            {/* Notification list */}
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                                        Không có thông báo nào
                                    </div>
                                ) : (
                                    notifications.slice(0, 20).map((n) => (
                                        <div
                                            key={n.notificationId}
                                            className={`px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                                                !n.isRead
                                                    ? "bg-red-50/50 dark:bg-red-900/10"
                                                    : ""
                                            }`}
                                            onClick={async () => {
                                                if (!n.isRead) {
                                                    await markAsRead(n.notificationId);
                                                }
                                            }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        {!n.isRead && (
                                                            <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                                                        )}
                                                        <p className={`text-sm truncate ${
                                                            !n.isRead
                                                                ? "font-semibold text-gray-900 dark:text-white"
                                                                : "font-medium text-gray-700 dark:text-gray-300"
                                                        }`}>
                                                            {n.title}
                                                        </p>
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                                        {n.message}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                                                        {formatTime(n.createdAt)}
                                                    </p>
                                                </div>
                                                {!n.isRead && (
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            await markAsRead(n.notificationId);
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-green-500 transition-colors flex-shrink-0"
                                                        title="Đánh dấu đã đọc"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Dark Mode Toggle */}
                <button
                    onClick={onToggleDarkMode}
                    className="p-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
                >
                    {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* User Info */}
                {user && (
                    <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-linear-to-br from-red-500 to-red-600 flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                                    {user.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {getRoleLabel(user.role)}
                                </p>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
                            title="Đăng xuất"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
