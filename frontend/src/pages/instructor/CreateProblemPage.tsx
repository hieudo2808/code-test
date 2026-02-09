import { useNavigate, useParams } from "react-router-dom";
import { CreateProblem as CreateProblemComponent } from "~/features/instructor/components/CreateProblem";

export function CreateProblemPage() {
    const navigate = useNavigate();
    const { id } = useParams();

    const handleNavigate = (page: string) => {
        if (page === "instructor-dashboard") {
            navigate("/instructor");
        } else {
            navigate("/instructor");
        }
    };

    return <CreateProblemComponent onNavigate={handleNavigate} problemId={id} />;
}
