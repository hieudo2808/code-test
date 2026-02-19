import { useState, useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "~/contexts/AuthContext";
import { NotificationProvider } from "~/contexts/NotificationContext";
import { router } from "~/routes";
import { onMaintenanceChange, checkMaintenanceStatus } from "~/services/api";
import { MaintenancePage } from "~/pages/shared/MaintenancePage";
import { useAuth } from "~/contexts/AuthContext";
import { UserRole } from "~/services/authService";

function MaintenanceGuard({ children }: { children: React.ReactNode }) {
    const [maintenance, setMaintenance] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        // Listen for 503 responses from API
        const unsubscribe = onMaintenanceChange((enabled) => {
            setMaintenance(enabled);
        });

        // Check maintenance status on mount
        checkMaintenanceStatus().then((enabled) => {
            setMaintenance(enabled);
        });

        return unsubscribe;
    }, []);

    // Admin users bypass maintenance mode
    const isAdmin = user?.role === UserRole.ADMIN;

    if (maintenance && !isAdmin) {
        return <MaintenancePage />;
    }

    return <>{children}</>;
}

export default function App() {
    return (
        <AuthProvider>
            <MaintenanceGuard>
                <NotificationProvider>
                    <RouterProvider router={router} />
                </NotificationProvider>
            </MaintenanceGuard>
        </AuthProvider>
    );
}
