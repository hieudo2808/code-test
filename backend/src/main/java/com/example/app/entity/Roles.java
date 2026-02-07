package com.example.app.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "Roles")
@Getter
@Setter
@RequiredArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Roles {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID roleId;
    String roleName;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "RolePermissions",
            joinColumns = @JoinColumn(name = "roleId"),
            inverseJoinColumns = @JoinColumn(name = "permissionId"))
    Set<Permission> permissions = new HashSet<>();
}
