import { useNavigate } from "react-router-dom";
import { InstructorDashboard as InstructorDashboardComponent } from "~/features/instructor/components/InstructorDashboard";

export function InstructorDashboardPage() {
    const navigate = useNavigate();

    const handleNavigate = (page: string, id?: string) => {
        if (page === "create-problem") {
            navigate("/instructor/problems/new");
        } else if (page === "edit-problem" && id) {
            navigate(`/instructor/problems/${id}/edit`);
        } else if (page === "create-contest") {
            navigate("/instructor/contests/new");
        } else {
            navigate("/instructor");
        }
    };

    return <InstructorDashboardComponent onNavigate={handleNavigate} />;
}
