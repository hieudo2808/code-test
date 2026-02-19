import { useNavigate } from "react-router-dom";
import { InstructorDashboard as InstructorDashboardComponent } from "~/features/instructor/components/InstructorDashboard";

export function InstructorDashboardPage() {
    const navigate = useNavigate();

    const handleNavigate = (page: string, id?: string) => {
        switch (page) {
            case "create-problem":
                navigate("/instructor/problems/new");
                break;
            case "edit-problem":
                if (id) navigate(`/instructor/problems/${id}/edit`);
                break;
            case "create-contest":
                navigate("/instructor/contests/new");
                break;
            case "plagiarism":
                navigate("/instructor/plagiarism");
                break;
            case "problems":
                navigate("/instructor/problems");
                break;
            case "contests":
                navigate("/instructor/contests");
                break;
            default:
                navigate("/instructor");
        }
    };

    return <InstructorDashboardComponent onNavigate={handleNavigate} />;
}
