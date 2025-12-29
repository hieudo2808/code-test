import React from "react";
import { useNavigate } from "react-router-dom";
import { CreateContest as CreateContestComponent } from "~/features/instructor/components/CreateContest";

export function CreateContestPage() {
    const navigate = useNavigate();

    const handleNavigate = (page: string) => {
        switch (page) {
            case "instructor-dashboard":
                navigate("/instructor");
                break;
            default:
                navigate("/instructor");
        }
    };

    return <CreateContestComponent onNavigate={handleNavigate} />;
}
