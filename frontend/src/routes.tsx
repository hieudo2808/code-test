import { createBrowserRouter, Navigate } from "react-router-dom";

// Layout
import { MainLayout } from "~/components/layout/MainLayout";

// Auth
import { ProtectedRoute } from "~/components/auth/ProtectedRoute";
import { LoginPage } from "~/pages/auth/LoginPage";
import { RegisterPage } from "~/pages/auth/RegisterPage";

// Student Pages
import { HomePage } from "~/pages/student/HomePage";
import { ContestListPage } from "~/pages/student/ContestListPage";
import { ProblemListPage } from "~/pages/student/ProblemListPage";
import { ContestDetailPage } from "~/pages/student/ContestDetailPage";
import { ProblemDetailPage } from "~/pages/student/ProblemDetailPage";
import { SubmissionDetailPage } from "~/pages/student/SubmissionDetailPage";

// Instructor Pages
import { InstructorDashboardPage } from "~/pages/instructor/DashboardPage";
import { CreateProblemPage } from "~/pages/instructor/CreateProblemPage";
import { CreateContestPage } from "~/pages/instructor/CreateContestPage";
import { PlagiarismPage } from "~/pages/instructor/PlagiarismPage";
import { PlagiarismResultsPage } from "~/pages/instructor/PlagiarismResultsPage";
import { PlagiarismDetailPage } from "~/pages/instructor/PlagiarismDetailPage";
import { MyProblemsPage } from "~/pages/instructor/MyProblemsPage";
import { MyContestsPage } from "~/pages/instructor/MyContestsPage";
import { ContestManagePage } from "~/pages/instructor/ContestManagePage";
import { ProblemSubmissionsPage } from "~/pages/instructor/ProblemSubmissionsPage";

// Admin Pages
import { AdminDashboardPage } from "~/pages/admin/DashboardPage";
import { UserManagementPage } from "~/pages/admin/UserManagementPage";
import { NotificationPage } from "~/pages/admin/NotificationPage";
import { SettingsPage } from "~/pages/admin/SettingsPage";
import { UserRole } from "~/services/authService";

// Shared Pages
import { ProfilePage } from "~/pages/shared/ProfilePage";

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
                element: <ContestListPage />,
            },
            {
                path: "contests/:id",
                element: <ContestDetailPage />,
            },
            {
                path: "problems",
                element: <ProblemListPage />,
            },
            {
                path: "problems/:id",
                element: <ProblemDetailPage />,
            },
            {
                path: "submissions/:id",
                element: <SubmissionDetailPage />,
            },
            {
                path: "profile",
                element: <ProfilePage />,
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
                path: "problems",
                element: <MyProblemsPage />,
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
                path: "problems/:problemId/submissions",
                element: <ProblemSubmissionsPage />,
            },
            {
                path: "contests",
                element: <MyContestsPage />,
            },
            {
                path: "contests/new",
                element: <CreateContestPage />,
            },
            {
                path: "contests/:contestId",
                element: <ContestManagePage />,
            },
            {
                path: "submissions/:id",
                element: <SubmissionDetailPage />,
            },
            {
                path: "plagiarism",
                element: <PlagiarismPage />,
            },
            {
                path: "plagiarism/:contestId",
                element: <PlagiarismResultsPage />,
            },
            {
                path: "plagiarism/:contestId/:checkId",
                element: <PlagiarismDetailPage />,
            },
            {
                path: "profile",
                element: <ProfilePage />,
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
                path: "notifications",
                element: <NotificationPage />,
            },
            {
                path: "settings",
                element: <SettingsPage />,
            },
            {
                path: "profile",
                element: <ProfilePage />,
            },
        ],
    },

    // Catch all - redirect to home
    {
        path: "*",
        element: <Navigate to="/" replace />,
    },
]);
