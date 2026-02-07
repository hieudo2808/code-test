import { Navigate } from "react-router-dom";
import { InstructorDashboard as InstructorDashboardComponent } from "~/features/instructor/components/InstructorDashboard";

export function InstructorDashboardPage() {
    const handleNavigate = (page: string) => {
        switch (page) {
            case "create-problem":
                <Navigate to="/instructor/problems/new" />;
                break;
            case "create-contest":
                <Navigate to="/instructor/contests/new" />;
                break;
            default:
                <Navigate to="/instructor" />;
        }
    };

    return <InstructorDashboardComponent onNavigate={handleNavigate} />;
}
