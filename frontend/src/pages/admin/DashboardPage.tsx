import { Navigate } from "react-router-dom";
import { AdminDashboard as AdminDashboardComponent } from "~/features/admin/components/AdminDashboard";

export function AdminDashboardPage() {
    const handleNavigate = (page: string) => {
        switch (page) {
            case "user-management":
                <Navigate to="/admin/users" />;
                break;
            case "settings":
                <Navigate to="/admin/settings" />;
                break;
            default:
                <Navigate to="/admin" />;
        }
    };

    return <AdminDashboardComponent onNavigate={handleNavigate} />;
}
