import React from "react";
import { useNavigate } from "react-router-dom";
import { CreateProblem as CreateProblemComponent } from "~/features/instructor/components/CreateProblem";

export function CreateProblemPage() {
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

    return <CreateProblemComponent onNavigate={handleNavigate} />;
}
