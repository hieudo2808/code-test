package com.example.app.repository;

import com.example.app.entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<Users, UUID> {
    Optional<Users> findByEmail(String email);
    
    @Query("SELECT u FROM Users u " +
           "LEFT JOIN FETCH u.role r " +
           "LEFT JOIN FETCH r.permissions " +
           "WHERE u.email = :email")
    Optional<Users> findByEmailWithRoleAndPermissions(@Param("email") String email);
    
    boolean existsByEmail(String email);
}
