import { NavLink } from "react-router-dom";
import {
    Code2,
    Home,
    Trophy,
    FileText,
    LayoutDashboard,
    Users,
    Settings,
    PlusCircle,
} from "lucide-react";
import { useAuth } from "~/contexts/AuthContext";
import { UserRole } from "~/services/authService";

export function Sidebar() {
    const { user } = useAuth();
    const userRole = user?.role || UserRole.STUDENT;

    const studentMenuItems = [
        { path: "/", icon: Home, label: "Trang chủ" },
        { path: "/contests", icon: Trophy, label: "Cuộc thi" },
        { path: "/problems", icon: FileText, label: "Bài tập" },
    ];

    const instructorMenuItems = [
        { path: "/instructor", icon: LayoutDashboard, label: "Dashboard" },
        { path: "/instructor/problems/new", icon: PlusCircle, label: "Tạo bài tập" },
        { path: "/instructor/contests/new", icon: Trophy, label: "Tạo cuộc thi" },
    ];

    const adminMenuItems = [
        { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
        { path: "/admin/users", icon: Users, label: "Quản lý người dùng" },
        { path: "/admin/settings", icon: Settings, label: "Cài đặt" },
    ];

    const menuItems =
        userRole === UserRole.STUDENT
            ? studentMenuItems
            : userRole === UserRole.INSTRUCTOR
              ? instructorMenuItems
              : adminMenuItems;

    const getRoleLabel = () => {
        switch (userRole) {
            case UserRole.STUDENT:
                return "Sinh viên";
            case UserRole.INSTRUCTOR:
                return "Giảng viên";
            case UserRole.ADMIN:
                return "Quản trị viên";
            default:
                return "";
        }
    };

    return (
        <div className="w-72 h-screen bg-white dark:bg-gray-900 border-r-2 border-gray-200 dark:border-gray-700 flex flex-col shadow-sm">
            <div className="px-4 py-4 border-b-2 border-gray-200 dark:border-gray-700 bg-linear-to-br from-red-50 to-pink-50 dark:from-gray-800 dark:to-gray-800">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-linear-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Code2 className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h2 className="text-gray-900 dark:text-white font-bold text-xl">
                            CodeJudge
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5 font-medium">
                            Online Programming Platform
                        </p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1">
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
                            className={({ isActive }) =>
                                `w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                                    isActive
                                        ? "bg-linear-to-r from-red-500 to-red-600 text-white shadow-md"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon
                                        className={`w-5 h-5 transition-transform duration-200 ${
                                            isActive ? "" : "group-hover:scale-110"
                                        }`}
                                    />
                                    <span className="font-semibold">{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <div className="w-11 h-11 rounded-xl bg-linear-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white truncate font-semibold">
                            {user?.name || "User"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {getRoleLabel()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
