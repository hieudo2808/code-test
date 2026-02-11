import { useNavigate } from "react-router-dom";
import { AdminDashboard as AdminDashboardComponent } from "~/features/admin/components/AdminDashboard";

export function AdminDashboardPage() {
    const navigate = useNavigate();

    const handleNavigate = (page: string) => {
        switch (page) {
            case "user-management":
                navigate("/admin/users");
                break;
            case "settings":
                navigate("/admin/settings");
                break;
            default:
                navigate("/admin");
        }
    };

    return <AdminDashboardComponent onNavigate={handleNavigate} />;
}
