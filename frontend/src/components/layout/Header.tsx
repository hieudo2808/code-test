import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Moon, Sun, Bell, LogOut, User, Check, CheckCheck, PanelLeft } from "lucide-react";
import { useAuth } from "~/contexts/AuthContext";
import { useNotifications } from "~/contexts/NotificationContext";
import { Modal } from "~/components/ui/Modal";

interface HeaderProps {
    darkMode: boolean;
    onToggleDarkMode: () => void;
    onToggleSidebar: () => void;
}

export function Header({ darkMode, onToggleDarkMode, onToggleSidebar }: HeaderProps) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<any>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const getProfilePath = () => {
        if (!user) return "/profile";
        const role = user.role?.toLowerCase();
        if (role === "instructor") return "/instructor/profile";
        if (role === "admin") return "/admin/profile";
        return "/profile";
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
                return "Student";
            case "instructor":
                return "Instructor";
            case "admin":
                return "Admin";
            default:
                return "";
        }
    };

    const formatTime = (dateValue?: string | number | null) => {
        if (!dateValue) return "Just now";
        const date = typeof dateValue === "number" ? new Date(dateValue) : new Date(dateValue);
        if (isNaN(date.getTime()) || date.getTime() === 0) return "Just now";

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return "Just now";
        if (diffMin < 60) return `${diffMin}m ago`;
        const diffHours = Math.floor(diffMin / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleString("en-US", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <>
            <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between px-3 sm:px-6 sticky top-0 z-40">
                <div className="flex items-center gap-2 sm:gap-4">
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        title="Toggle sidebar"
                    >
                        <PanelLeft className="w-5 h-5" />
                    </button>
                    <h1 className="hidden md:block text-gray-900 dark:text-white font-bold text-sm lg:text-base">
                        Programming Judge Platform
                    </h1>
                </div>

                <div className="flex items-center gap-1 sm:gap-3">
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
                            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                                {/* Header */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                                        Notifications
                                    </h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={async () => {
                                                await markAllAsRead();
                                            }}
                                            className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                                        >
                                            <CheckCheck className="w-3.5 h-3.5" />
                                            Mark all as read
                                        </button>
                                    )}
                                </div>

                                {/* Notification list */}
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                                            No notifications
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
                                                    setSelectedNotification(n);
                                                    setShowDropdown(false);
                                                }}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            {!n.isRead && (
                                                                <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
                                                            )}
                                                            <p
                                                                className={`text-sm truncate ${
                                                                    !n.isRead
                                                                        ? "font-semibold text-gray-900 dark:text-white"
                                                                        : "font-medium text-gray-700 dark:text-gray-300"
                                                                }`}
                                                            >
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
                                                            className="p-1 text-gray-400 hover:text-green-500 transition-colors shrink-0"
                                                            title="Mark as read"
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
                            <div
                                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => navigate(getProfilePath())}
                                title="View profile"
                            >
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
                                    {user.avatarUrl ? (
                                        <img
                                            src={user.avatarUrl}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-linear-to-br from-red-500 to-red-600 flex items-center justify-center">
                                            <User className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="hidden sm:flex sm:flex-col sm:justify-center gap-1">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
                                        {user.name}
                                    </span>
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-none">
                                        {getRoleLabel(user.role)}
                                    </span>
                                </div>
                            </div>

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Notification Detail Modal */}
            <Modal
                isOpen={!!selectedNotification}
                onClose={() => setSelectedNotification(null)}
                title={selectedNotification?.title || "Notification Detail"}
            >
                <div className="space-y-3">
                    <div className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap text-sm leading-relaxed">
                        {selectedNotification?.message}
                    </div>
                    {selectedNotification && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {new Date(selectedNotification.createdAt || Date.now()).toLocaleString(
                                "vi-VN",
                                {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                }
                            )}
                        </p>
                    )}
                </div>
            </Modal>
        </>
    );
}
