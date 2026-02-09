package com.example.app.mapper;

import com.example.app.dto.request.problem.CreateProblemRequest;
import com.example.app.dto.request.problem.UpdateProblemRequest;
import com.example.app.dto.response.ProblemResponse;
import com.example.app.dto.response.ProblemSummaryResponse;
import com.example.app.entity.Problem;
import org.mapstruct.*;

@Mapper(componentModel = "spring", 
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface ProblemMapper {

    @Mapping(target = "problemId", ignore = true)
    @Mapping(target = "problemCreator", ignore = true)
    @Mapping(target = "createAt", ignore = true)
    @Mapping(target = "updateAt", ignore = true)
    @Mapping(target = "testcases", ignore = true)
    Problem toProblem(CreateProblemRequest request);

    @Mapping(target = "creatorId", source = "problemCreator.userId")
    @Mapping(target = "creatorName", source = "problemCreator.fullName")
    @Mapping(target = "testcaseCount", expression = "java(problem.getTestcases() != null ? problem.getTestcases().size() : 0)")
    ProblemResponse toResponse(Problem problem);

    @Mapping(target = "testcaseCount", expression = "java(problem.getTestcases() != null ? problem.getTestcases().size() : 0)")
    ProblemSummaryResponse toSummary(Problem problem);

    @Mapping(target = "problemId", ignore = true)
    @Mapping(target = "problemCreator", ignore = true)
    @Mapping(target = "slug", ignore = true)
    @Mapping(target = "createAt", ignore = true)
    @Mapping(target = "updateAt", ignore = true)
    @Mapping(target = "testcases", ignore = true)
    void updateFromRequest(UpdateProblemRequest request, @MappingTarget Problem problem);
}
