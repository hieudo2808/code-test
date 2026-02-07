import { Navigate } from "react-router-dom";
import { CreateContest as CreateContestComponent } from "~/features/instructor/components/CreateContest";

export function CreateContestPage() {
    const handleNavigate = (page: string) => {
        switch (page) {
            case "instructor-dashboard":
                <Navigate to="/instructor" />;
                break;
            default:
                <Navigate to="/instructor" />;
        }
    };

    return <CreateContestComponent onNavigate={handleNavigate} />;
}
