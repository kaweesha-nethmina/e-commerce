package com.ctse.notification.store;

import com.ctse.notification.dto.Notification;
import com.ctse.notification.repository.NotificationRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * MongoDB-backed store for notifications.
 * Uses Spring Data MongoRepository under the hood.
 */
@Component
public class NotificationStore {

    private final NotificationRepository repository;

    public NotificationStore(NotificationRepository repository) {
        this.repository = repository;
    }

    public void add(Notification notification) {
        repository.save(notification);
    }

    /**
     * Returns all notifications, newest first.
     */
    public List<Notification> getAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    /**
     * Returns notifications for a specific user, newest first.
     */
    public List<Notification> getByUserId(String userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public int count() {
        return (int) repository.count();
    }

    /**
     * Get unread count for a specific user.
     */
    public long getUnreadCount(String userId) {
        return repository.countByUserIdAndReadFalse(userId);
    }

    /**
     * Mark a specific notification as read.
     */
    public boolean markAsRead(String notificationId, String userId) {
        Optional<Notification> opt = repository.findByIdAndUserId(notificationId, userId);
        if (opt.isPresent()) {
            Notification n = opt.get();
            n.setRead(true);
            repository.save(n);
            return true;
        }
        return false;
    }

    /**
     * Mark all notifications for a user as read.
     */
    public int markAllAsRead(String userId) {
        List<Notification> notifications = repository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId);
        for (Notification n : notifications) {
            n.setRead(true);
        }
        repository.saveAll(notifications);
        return notifications.size();
    }

    /**
     * Delete a specific notification.
     */
    public boolean delete(String notificationId, String userId) {
        Optional<Notification> opt = repository.findByIdAndUserId(notificationId, userId);
        if (opt.isPresent()) {
            repository.delete(opt.get());
            return true;
        }
        return false;
    }
}
