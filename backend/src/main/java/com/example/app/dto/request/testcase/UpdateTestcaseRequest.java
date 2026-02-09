package com.example.app.dto.request.testcase;

import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateTestcaseRequest {

    @DecimalMin(value = "0.1", message = "Testcase point must be positive")
    Double testcasePoint;

    Boolean isHidden;
    
    // Files (input, output) are optional - handled separately via MultipartFile in controller
}
