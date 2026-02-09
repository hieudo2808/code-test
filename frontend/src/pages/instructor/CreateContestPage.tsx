import { useNavigate } from "react-router-dom";
import { CreateContest as CreateContestComponent } from "~/features/instructor/components/CreateContest";

export function CreateContestPage() {
    const navigate = useNavigate();

    const handleNavigate = (page: string) => {
        if (page === "instructor-dashboard") {
            navigate("/instructor");
        } else {
            navigate("/instructor");
        }
    };

    return <CreateContestComponent onNavigate={handleNavigate} />;
}
