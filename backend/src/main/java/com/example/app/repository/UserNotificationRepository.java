package com.example.app.repository;

import com.example.app.entity.UserNotification;
import com.example.app.entity.UserNotificationId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UserNotificationRepository extends JpaRepository<UserNotification, UserNotificationId> {

    @Query("SELECT un FROM UserNotification un " +
           "WHERE un.user.userId = :userId " +
           "ORDER BY un.notification.createdAt DESC")
    Page<UserNotification> findByUserId(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT COUNT(un) FROM UserNotification un " +
           "WHERE un.user.userId = :userId AND un.isRead = false")
    long countUnreadByUserId(@Param("userId") UUID userId);

    @Modifying
    @Query("UPDATE UserNotification un SET un.isRead = true WHERE un.user.userId = :userId")
    void markAllAsRead(@Param("userId") UUID userId);

    @Modifying
    @Query("UPDATE UserNotification un SET un.isRead = true " +
           "WHERE un.user.userId = :userId AND un.notification.notificationId = :notificationId")
    void markAsRead(@Param("userId") UUID userId, @Param("notificationId") UUID notificationId);
}
