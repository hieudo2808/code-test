import React from "react";
import {
    Code2,
    Home,
    Trophy,
    FileText,
    LayoutDashboard,
    Users,
    Settings,
    Award,
} from "lucide-react";
import type { UserRole } from "../../data/mockData";

interface SidebarProps {
    currentPage: string;
    onNavigate: (page: string) => void;
    userRole: UserRole;
}

export function Sidebar({ currentPage, onNavigate, userRole }: SidebarProps) {
    const studentMenuItems = [
        { id: "home", icon: Home, label: "Home" },
        { id: "contests", icon: Trophy, label: "Contests" },
        { id: "problems", icon: FileText, label: "Problems" },
    ];

    const instructorMenuItems = [
        { id: "instructor-dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { id: "create-problem", icon: FileText, label: "Create Problem" },
        { id: "create-contest", icon: Trophy, label: "Create Contest" },
    ];

    const adminMenuItems = [
        { id: "admin-dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { id: "user-management", icon: Users, label: "User Management" },
        { id: "settings", icon: Settings, label: "Settings" },
    ];

    const menuItems =
        userRole === "student"
            ? studentMenuItems
            : userRole === "instructor"
            ? instructorMenuItems
            : adminMenuItems;

    return (
        <div className="w-72 h-screen bg-white border-r-2 border-gray-200 flex flex-col shadow-sm">
            <div className="px-8 py-10 border-b-2 border-gray-200 bg-gradient-to-br from-red-50 to-pink-50">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Code2 className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h2 className="text-gray-900 font-bold text-xl">CodeJudge</h2>
                        <p className="text-xs text-gray-500 mt-0.5 font-medium">
                            Online Programming Platform
                        </p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-5 py-8 space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`w-full flex items-center gap-3.5 px-5 py-3.5 rounded-xl transition-all duration-200 group ${
                                isActive
                                    ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            }`}
                        >
                            <Icon
                                className={`w-5 h-5 transition-transform duration-200 ${
                                    isActive ? "" : "group-hover:scale-110"
                                }`}
                            />
                            <span className="font-semibold">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {userRole === "student" ? "S" : userRole === "instructor" ? "I" : "A"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate font-semibold">
                            {userRole === "student"
                                ? "Student"
                                : userRole === "instructor"
                                ? "Instructor"
                                : "Admin"}{" "}
                            User
                        </p>
                        <p className="text-xs text-gray-500 truncate">{userRole}@example.com</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
