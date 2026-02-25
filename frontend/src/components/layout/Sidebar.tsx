import { NavLink } from "react-router-dom";
import {
    Code2,
    Home,
    Trophy,
    FileText,
    LayoutDashboard,
    Users,
    Settings,
    ShieldAlert,
    Bell,
    BookOpen,
    PanelLeftClose,
    PanelLeftOpen,
    X,
    UserCircle,
} from "lucide-react";
import { useAuth } from "~/contexts/AuthContext";
import { UserRole } from "~/services/authService";

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    isMobile: boolean;
}

export function Sidebar({ isOpen, onToggle, isMobile }: SidebarProps) {
    const { user } = useAuth();
    const userRole = user?.role || UserRole.STUDENT;

    const studentMenuItems = [
        { path: "/", icon: Home, label: "Home" },
        { path: "/contests", icon: Trophy, label: "Contests" },
        { path: "/problems", icon: FileText, label: "Problems" },
        { path: "/profile", icon: UserCircle, label: "Profile" },
    ];

    const instructorMenuItems = [
        { path: "/instructor", icon: LayoutDashboard, label: "Dashboard" },
        { path: "/instructor/problems", icon: FileText, label: "Problems" },
        { path: "/instructor/contests", icon: Trophy, label: "Contests" },
        { path: "/instructor/plagiarism", icon: ShieldAlert, label: "Plagiarism" },
        { path: "/instructor/guide", icon: BookOpen, label: "Guide" },
        { path: "/instructor/profile", icon: UserCircle, label: "Profile" },
    ];

    const adminMenuItems = [
        { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
        { path: "/admin/users", icon: Users, label: "Users" },
        { path: "/admin/notifications", icon: Bell, label: "Notifications" },
        { path: "/admin/settings", icon: Settings, label: "Settings" },
        { path: "/admin/profile", icon: UserCircle, label: "Profile" },
    ];

    const menuItems =
        userRole === UserRole.STUDENT
            ? studentMenuItems
            : userRole === UserRole.INSTRUCTOR
              ? instructorMenuItems
              : adminMenuItems;

    const isCollapsed = !isMobile && !isOpen;

    const sidebarContent = (
        <div
            className={`h-screen bg-white dark:bg-gray-900 border-r-2 border-gray-200 dark:border-gray-700 flex flex-col shadow-sm transition-all duration-300 ease-in-out ${
                isMobile ? "w-72" : isOpen ? "w-72" : "w-16"
            }`}
        >
            {/* Logo */}
            <div className="px-4 py-4 border-b-2 border-gray-200 dark:border-gray-700 bg-linear-to-br from-red-50 to-pink-50 dark:from-gray-800 dark:to-gray-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 min-w-10 bg-linear-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <Code2 className="w-6 h-6 text-white" />
                    </div>
                    <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                        }`}
                    >
                        <h2 className="text-gray-900 dark:text-white font-bold text-lg whitespace-nowrap">
                            CodeJudge
                        </h2>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                            Online Programming Platform
                        </p>
                    </div>
                    {isMobile && (
                        <button
                            onClick={onToggle}
                            className="ml-auto p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const Icon = item.icon;

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={
                                item.path === "/" ||
                                item.path === "/instructor" ||
                                item.path === "/admin"
                            }
                            title={isCollapsed ? item.label : undefined}
                            onClick={() => {
                                if (isMobile) onToggle();
                            }}
                            className={({ isActive }) =>
                                `w-full flex items-center gap-3 rounded-xl transition-all duration-200 group ${
                                    isCollapsed ? "px-0 py-2.5 justify-center" : "px-4 py-2.5"
                                } ${
                                    isActive
                                        ? "bg-linear-to-r from-red-500 to-red-600 text-white shadow-md"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon
                                        className={`w-5 h-5 min-w-5 transition-transform duration-200 ${
                                            isActive ? "" : "group-hover:scale-110"
                                        }`}
                                    />
                                    <span
                                        className={`font-semibold whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                                            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                                        }`}
                                    >
                                        {item.label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Collapse toggle */}
            <div className="border-t border-gray-200 dark:border-gray-700">
                {!isMobile && (
                    <div className="px-3 py-3 bg-gray-50 dark:bg-gray-800">
                        <button
                            onClick={onToggle}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-xs font-medium"
                            title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
                        >
                            {isOpen ? (
                                <>
                                    <PanelLeftClose className="w-4 h-4" />
                                    <span>Collapse</span>
                                </>
                            ) : (
                                <PanelLeftOpen className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    if (isMobile) {
        return (
            <>
                <div
                    className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
                        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                    onClick={onToggle}
                />
                <div
                    className={`fixed top-0 left-0 z-50 h-full transition-transform duration-300 ease-in-out ${
                        isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
                >
                    {sidebarContent}
                </div>
            </>
        );
    }

    return <div className="flex-shrink-0">{sidebarContent}</div>;
}
