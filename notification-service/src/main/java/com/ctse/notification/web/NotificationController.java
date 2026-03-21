package com.ctse.notification.web;

import com.ctse.notification.dto.Notification;
import com.ctse.notification.store.NotificationStore;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST endpoint to retrieve and manage stored notifications.
 * Consumed by the frontend to display notification history.
 */
@RestController
public class NotificationController {

    private final NotificationStore notificationStore;

    public NotificationController(NotificationStore notificationStore) {
        this.notificationStore = notificationStore;
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<Notification>> getNotifications(
            @RequestHeader(value = "X-User-ID", required = false) String userId) {
        if (userId != null && !userId.isEmpty()) {
            return ResponseEntity.ok(notificationStore.getByUserId(userId));
        } else {
            return ResponseEntity.ok(notificationStore.getAll());
        }
    }

    @GetMapping("/notifications/count")
    public ResponseEntity<Map<String, Integer>> getCount() {
        return ResponseEntity.ok(Map.of("count", notificationStore.count()));
    }

    @GetMapping("/notifications/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @RequestHeader(value = "X-User-ID", required = false) String userId) {
        if (userId == null || userId.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("count", 0L));
        }
        return ResponseEntity.ok(Map.of("count", notificationStore.getUnreadCount(userId)));
    }

    @PutMapping("/notifications/{id}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(
            @PathVariable String id,
            @RequestHeader(value = "X-User-ID", required = false) String userId) {
        if (userId == null || userId.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "authentication required"));
        }
        boolean success = notificationStore.markAsRead(id, userId);
        if (success) {
            return ResponseEntity.ok(Map.of("message", "marked as read", "id", id));
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/notifications/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead(
            @RequestHeader(value = "X-User-ID", required = false) String userId) {
        if (userId == null || userId.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "authentication required"));
        }
        int count = notificationStore.markAllAsRead(userId);
        return ResponseEntity.ok(Map.of("message", "all marked as read", "count", count));
    }

    @DeleteMapping("/notifications/{id}")
    public ResponseEntity<Map<String, Object>> deleteNotification(
            @PathVariable String id,
            @RequestHeader(value = "X-User-ID", required = false) String userId) {
        if (userId == null || userId.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "authentication required"));
        }
        boolean success = notificationStore.delete(id, userId);
        if (success) {
            return ResponseEntity.ok(Map.of("message", "notification deleted", "id", id));
        }
        return ResponseEntity.notFound().build();
    }
}
