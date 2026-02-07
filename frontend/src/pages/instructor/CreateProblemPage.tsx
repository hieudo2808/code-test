import { Navigate } from "react-router-dom";
import { CreateProblem as CreateProblemComponent } from "~/features/instructor/components/CreateProblem";

export function CreateProblemPage() {
    const handleNavigate = (page: string) => {
        switch (page) {
            case "instructor-dashboard":
                <Navigate to="/instructor" />;
                break;
            default:
                <Navigate to="/instructor" />;
        }
    };

    return <CreateProblemComponent onNavigate={handleNavigate} />;
}
