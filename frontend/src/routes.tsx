import { createBrowserRouter, Navigate } from "react-router-dom";

// Layout
import { MainLayout } from "~/components/layout/MainLayout";

// Auth
import { ProtectedRoute } from "~/components/auth/ProtectedRoute";
import { LoginPage } from "~/pages/auth/LoginPage";
import { RegisterPage } from "~/pages/auth/RegisterPage";

// Student Pages
import { HomePage } from "~/pages/student/HomePage";
import { ContestDetailPage } from "~/pages/student/ContestDetailPage";
import { ProblemDetailPage } from "~/pages/student/ProblemDetailPage";
import { SubmissionResultPage } from "~/pages/student/SubmissionResultPage";

// Instructor Pages
import { InstructorDashboardPage } from "~/pages/instructor/DashboardPage";
import { CreateProblemPage } from "~/pages/instructor/CreateProblemPage";
import { CreateContestPage } from "~/pages/instructor/CreateContestPage";

// Admin Pages
import { AdminDashboardPage } from "~/pages/admin/DashboardPage";
import { UserManagementPage } from "~/pages/admin/UserManagementPage";
import { UserRole } from "~/services/authService";

export const router = createBrowserRouter([
    // Public routes
    {
        path: "/login",
        element: <LoginPage />,
    },
    {
        path: "/register",
        element: <RegisterPage />,
    },

    // Protected routes with MainLayout
    {
        path: "/",
        element: (
            <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
                <MainLayout />
            </ProtectedRoute>
        ),
        children: [
            // Student routes (accessible by all authenticated users)
            {
                index: true,
                element: <HomePage />,
            },
            {
                path: "contests",
                element: <HomePage />,
            },
            {
                path: "contests/:id",
                element: <ContestDetailPage />,
            },
            {
                path: "problems",
                element: <HomePage />,
            },
            {
                path: "problems/:id",
                element: <ProblemDetailPage />,
            },
            {
                path: "submissions/:id",
                element: <SubmissionResultPage />,
            },
        ],
    },

    // Instructor routes
    {
        path: "/instructor",
        element: (
            <ProtectedRoute allowedRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]}>
                <MainLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <InstructorDashboardPage />,
            },
            {
                path: "problems/new",
                element: <CreateProblemPage />,
            },
            {
                path: "problems/:id/edit",
                element: <CreateProblemPage />,
            },
            {
                path: "contests/new",
                element: <CreateContestPage />,
            },
        ],
    },

    // Admin routes
    {
        path: "/admin",
        element: (
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <MainLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <AdminDashboardPage />,
            },
            {
                path: "users",
                element: <UserManagementPage />,
            },
            {
                path: "settings",
                element: (
                    <div className="text-center py-12">
                        <h2 className="text-gray-900 dark:text-white text-xl mb-4">
                            Cài đặt hệ thống
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">
                            Tính năng đang được phát triển...
                        </p>
                    </div>
                ),
            },
        ],
    },

    // Catch all - redirect to home
    {
        path: "*",
        element: <Navigate to="/" replace />,
    },
]);
