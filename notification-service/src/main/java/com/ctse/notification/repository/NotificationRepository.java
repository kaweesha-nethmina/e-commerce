package com.ctse.notification.repository;

import com.ctse.notification.dto.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findAllByOrderByCreatedAtDesc();
    
    // Find notifications by user ID
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);

    // Find by custom id field (not MongoDB _id)
    Optional<Notification> findById(String id);
    Optional<Notification> findByIdAndUserId(String id, String userId);

    // Count unread notifications for a user
    long countByUserIdAndReadFalse(String userId);

    // Find unread notifications for a user
    List<Notification> findByUserIdAndReadFalseOrderByCreatedAtDesc(String userId);

    // Delete by custom id
    void deleteByIdAndUserId(String id, String userId);
}
