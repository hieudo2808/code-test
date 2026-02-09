package com.example.app.mapper;

import com.example.app.dto.request.user.AdminUpdateUserRequest;
import com.example.app.dto.request.user.CreateUserRequest;
import com.example.app.dto.request.user.UserProfileUpdateRequest;
import com.example.app.dto.response.UserResponse;
import com.example.app.entity.Users;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface UserMapper {
    
    @Mapping(source = "role.roleName", target = "roleName")
    @Mapping(source = "active", target = "active")
    UserResponse toUserResponse(Users user);

    @Mapping(source = "roleName", target = "role.roleName")
    Users toUser(CreateUserRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(source = "roleName", target = "role.roleName")
    void updateFromAdmin(AdminUpdateUserRequest request, @MappingTarget Users user);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateProfile(UserProfileUpdateRequest request, @MappingTarget Users user);
}


