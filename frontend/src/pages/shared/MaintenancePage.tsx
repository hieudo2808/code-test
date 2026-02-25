import { Wrench, RefreshCw, LogOut } from "lucide-react";
import { useAuth } from "~/contexts/AuthContext";
import { useState } from "react";

export function MaintenancePage() {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleReload = () => {
        setLoading(true);
        window.location.reload();
    };

    const handleLogout = () => {
        logout();
        window.location.href = "/login";
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="text-center max-w-md">
                <div className="mx-auto w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6">
                    <Wrench className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    Under Maintenance
                </h1>

                <p className="text-gray-500 dark:text-gray-400 mb-8">
                    The system is currently undergoing scheduled maintenance. Please check back
                    shortly.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                        onClick={handleReload}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium w-full sm:w-auto justify-center disabled:opacity-60"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Try Again
                    </button>

                    {user && (
                        <button
                            onClick={handleLogout}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium w-full sm:w-auto justify-center"
                        >
                            <LogOut className="w-4 h-4" />
                            Log Out
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
