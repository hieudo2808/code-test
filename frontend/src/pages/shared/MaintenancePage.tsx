import { Wrench, RefreshCw } from "lucide-react";

export function MaintenancePage() {
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
                    The system is currently undergoing scheduled maintenance. Please check back shortly.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium"
                >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                </button>
            </div>
        </div>
    );
}
