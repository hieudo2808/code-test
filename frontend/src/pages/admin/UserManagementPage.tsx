import { Navigate } from "react-router-dom";
import { UserManagement as UserManagementComponent } from "~/features/admin/components/UserManagement";

export function UserManagementPage() {
    const handleNavigate = (page: string) => {
        switch (page) {
            case "admin-dashboard":
                <Navigate to="/admin" />;
                break;
            default:
                <Navigate to="/admin" />;
        }
    };

    return <UserManagementComponent onNavigate={handleNavigate} />;
}
