import React from "react";
import { useNavigate } from "react-router-dom";
import { UserManagement as UserManagementComponent } from "~/features/admin/components/UserManagement";

export function UserManagementPage() {
    const navigate = useNavigate();

    const handleNavigate = (page: string) => {
        switch (page) {
            case "admin-dashboard":
                navigate("/admin");
                break;
            default:
                navigate("/admin");
        }
    };

    return <UserManagementComponent onNavigate={handleNavigate} />;
}
