package com.example.app.dto.request.user;

import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUpdateUserRequest {
    @Pattern(regexp = "STUDENT|INSTRUCTOR|ADMIN")
    private String roleName;
    
    private Boolean isActive;
}
