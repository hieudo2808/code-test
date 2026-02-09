package com.example.app.mapper;

import com.example.app.dto.response.TestcaseResponse;
import com.example.app.dto.response.TestcaseSummaryResponse;
import com.example.app.entity.Testcase;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface TestcaseMapper {

    @Mapping(target = "problemId", source = "problem.problemId")
    TestcaseResponse toResponse(Testcase testcase);

    TestcaseSummaryResponse toSummary(Testcase testcase);
}
