import React from "react";
import { useNavigate } from "react-router-dom";
import { InstructorDashboard as InstructorDashboardComponent } from "~/features/instructor/components/InstructorDashboard";

export function InstructorDashboardPage() {
    const navigate = useNavigate();

    const handleNavigate = (page: string) => {
        switch (page) {
            case "create-problem":
                navigate("/instructor/problems/new");
                break;
            case "create-contest":
                navigate("/instructor/contests/new");
                break;
            default:
                navigate("/instructor");
        }
    };

    return <InstructorDashboardComponent onNavigate={handleNavigate} />;
}
