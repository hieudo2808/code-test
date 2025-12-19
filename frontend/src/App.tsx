import React, { useState } from "react";
import { Sidebar } from "~/components/layout/Sidebar";
import { Header } from "~/components/layout/Header";
import { HomePage } from "~/features/student/components/HomePage";
import { ContestDetail } from "~/features/student/components/ContestDetail";
import { ProblemDetail } from "~/features/student/components/ProblemDetail";
import { SubmissionResult } from "~/features/student/components/SubmissionResult";
import { InstructorDashboard } from "~/features/instructor/components/InstructorDashboard";
import { CreateProblem } from "~/features/instructor/components/CreateProblem";
import { CreateContest } from "~/features/instructor/components/CreateContest";
import { AdminDashboard } from "~/features/admin/components/AdminDashboard";
import { UserManagement } from "~/features/admin/components/UserManagement";
import type { UserRole } from "~/lib/mock-data";

export default function App() {
    const [darkMode, setDarkMode] = useState(false);
    const [userRole, setUserRole] = useState<UserRole>("student");
    const [currentPage, setCurrentPage] = useState("home");
    const [selectedId, setSelectedId] = useState<string | undefined>();

    const handleNavigate = (page: string, id?: string) => {
        setCurrentPage(page);
        setSelectedId(id);
    };

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        if (!darkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    };

    const renderPage = () => {
        switch (currentPage) {
            // Student pages
            case "home":
            case "contests":
            case "problems":
                return <HomePage onNavigate={handleNavigate} />;
            case "contest-detail":
                return <ContestDetail contestId={selectedId!} onNavigate={handleNavigate} />;
            case "problem-detail":
                return <ProblemDetail problemId={selectedId!} onNavigate={handleNavigate} />;
            case "submission-result":
                return <SubmissionResult submissionId={selectedId!} onNavigate={handleNavigate} />;

            // Instructor pages
            case "instructor-dashboard":
                return <InstructorDashboard onNavigate={handleNavigate} />;
            case "create-problem":
                return <CreateProblem onNavigate={handleNavigate} />;
            case "create-contest":
                return <CreateContest onNavigate={handleNavigate} />;

            // Admin pages
            case "admin-dashboard":
                return <AdminDashboard onNavigate={handleNavigate} />;
            case "user-management":
                return <UserManagement onNavigate={handleNavigate} />;

            default:
                return <HomePage onNavigate={handleNavigate} />;
        }
    };

    // Set initial page based on role
    React.useEffect(() => {
        if (userRole === "student") {
            setCurrentPage("home");
        } else if (userRole === "instructor") {
            setCurrentPage("instructor-dashboard");
        } else {
            setCurrentPage("admin-dashboard");
        }
    }, [userRole]);

    return (
        <div className="flex h-screen bg-white dark:bg-gray-900">
            <Sidebar currentPage={currentPage} onNavigate={handleNavigate} userRole={userRole} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />

                <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800">
                    <div className="max-w-7xl mx-auto px-6 py-6">{renderPage()}</div>
                </main>

                {/* Role Switcher for Demo */}
                <div className="fixed bottom-8 right-8 z-50">
                    <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-6">
                        <p className="text-xs text-gray-500 mb-4 font-semibold uppercase tracking-wider">
                            Demo: Switch Role
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setUserRole("student")}
                                className={`px-5 py-2.5 rounded-xl text-sm transition-all font-semibold ${
                                    userRole === "student"
                                        ? "bg-linear-to-r from-red-500 to-red-600 text-white shadow-lg"
                                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                                }`}
                            >
                                Student
                            </button>
                            <button
                                onClick={() => setUserRole("instructor")}
                                className={`px-5 py-2.5 rounded-xl text-sm transition-all font-semibold ${
                                    userRole === "instructor"
                                        ? "bg-linear-to-r from-red-500 to-red-600 text-white shadow-lg"
                                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                                }`}
                            >
                                Instructor
                            </button>
                            <button
                                onClick={() => setUserRole("admin")}
                                className={`px-5 py-2.5 rounded-xl text-sm transition-all font-semibold ${
                                    userRole === "admin"
                                        ? "bg-linear-to-r from-red-500 to-red-600 text-white shadow-lg"
                                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                                }`}
                            >
                                Admin
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
