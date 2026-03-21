'use client';

import { useEffect, useState, useCallback } from 'react';
import { notificationApi } from '@/lib/api';
import type { NotificationItem } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Toast from '@/components/Toast';

const typeConfig: Record<string, { icon: string; color: string; bg: string }> = {
    order_created: {
        icon: '🛒',
        color: 'var(--success)',
        bg: 'var(--success-bg)',
    },
    order_status_changed: {
        icon: '🔄',
        color: 'var(--info)',
        bg: 'var(--info-bg)',
    },
    user_registered: {
        icon: '👋',
        color: 'var(--accent-primary)',
        bg: 'rgba(99, 102, 241, 0.15)',
    },
    payment_completed: {
        icon: '💳',
        color: 'var(--success)',
        bg: 'var(--success-bg)',
    },
};

const defaultConfig = {
    icon: '🔔',
    color: 'var(--accent-primary)',
    bg: 'rgba(99, 102, 241, 0.15)',
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const { token, isAuthenticated } = useAuth();

    const fetchNotifications = useCallback(() => {
        if (!isAuthenticated || !token) {
            setNotifications([]);
            return;
        }

        notificationApi
            .list(token)
            .then(setNotifications)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));

        notificationApi
            .unreadCount(token)
            .then((r) => setUnreadCount(r.count))
            .catch(() => { });
    }, [token, isAuthenticated]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Auto-refresh every 5 seconds
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(fetchNotifications, 5000);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchNotifications]);

    const handleMarkAsRead = async (id: string) => {
        if (!token) return;
        try {
            await notificationApi.markAsRead(id, token);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
            setUnreadCount((c) => Math.max(0, c - 1));
        } catch (err: any) {
            setToast({ type: 'error', message: err.message });
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!token) return;
        try {
            await notificationApi.markAllAsRead(token);
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
            setToast({ type: 'success', message: 'All notifications marked as read' });
        } catch (err: any) {
            setToast({ type: 'error', message: err.message });
        }
    };

    const handleDelete = async (id: string) => {
        if (!token) return;
        try {
            await notificationApi.delete(id, token);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
            setToast({ type: 'success', message: 'Notification deleted' });
        } catch (err: any) {
            setToast({ type: 'error', message: err.message });
        }
    };

    const formatTime = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffSec = Math.floor(diffMs / 1000);
            const diffMin = Math.floor(diffSec / 60);
            const diffHour = Math.floor(diffMin / 60);

            if (diffSec < 60) return `${diffSec}s ago`;
            if (diffMin < 60) return `${diffMin}m ago`;
            if (diffHour < 24) return `${diffHour}h ago`;
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    if (loading) {
        return (
            <div className="loading-center">
                <div className="spinner" />
                <span>Loading notifications from Notification Service...</span>
            </div>
        );
    }

    return (
        <div>
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            <div className="page-header fade-in">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 className="page-title">My Notifications</h1>
                        <p className="page-subtitle">
                            Your notifications • Powered by Java / Spring Boot on port 3004 via RabbitMQ
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {unreadCount > 0 && (
                            <button
                                className="btn btn-sm btn-primary"
                                onClick={handleMarkAllAsRead}
                                id="mark-all-read-btn"
                            >
                                ✓ Mark all read ({unreadCount})
                            </button>
                        )}
                        <button
                            className={`btn btn-sm ${autoRefresh ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            id="auto-refresh-toggle"
                        >
                            {autoRefresh ? '⏸ Pause' : '▶ Auto-refresh'}
                        </button>
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={fetchNotifications}
                            id="refresh-btn"
                        >
                            🔄 Refresh
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="alert alert-error" style={{ marginBottom: 24 }}>
                    ❌ Failed to load notifications: {error}
                    <p style={{ marginTop: 4, fontSize: '0.8rem', opacity: 0.8 }}>
                        Make sure the Notification Service is running on port 3004.
                    </p>
                </div>
            )}

            {/* Stats Bar */}
            <div className="stats-grid fade-in fade-in-delay-1" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                    <div className="stat-icon purple">🔔</div>
                    <div className="stat-info">
                        <h3>{notifications.length}</h3>
                        <p>Total notifications</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange">📬</div>
                    <div className="stat-info">
                        <h3>{unreadCount}</h3>
                        <p>Unread</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green">🛒</div>
                    <div className="stat-info">
                        <h3>{notifications.filter(n => n.type === 'order_created').length}</h3>
                        <p>Order events</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue">
                        {autoRefresh ? '🟢' : '🔴'}
                    </div>
                    <div className="stat-info">
                        <h3>{autoRefresh ? 'Live' : 'Paused'}</h3>
                        <p>Auto-refresh (5s)</p>
                    </div>
                </div>
            </div>

            {/* Notification List */}
            {!error && notifications.length === 0 ? (
                <div className="card fade-in fade-in-delay-2">
                    <div className="card-body">
                        <div className="empty-state">
                            <div className="empty-state-icon">🔔</div>
                            <h3>No notifications yet</h3>
                            <p>
                                Notifications appear here when orders are placed. The Notification Service
                                consumes events from RabbitMQ and resolves user details via the User Service.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card fade-in fade-in-delay-2">
                    <div className="card-header">
                        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
                            Event Feed
                        </h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {autoRefresh && '● Live'} {notifications.length} notification(s)
                        </span>
                    </div>
                    <div className="card-body" style={{ padding: '16px 24px' }}>
                        {notifications.map((notif, i) => {
                            const config = typeConfig[notif.type] || defaultConfig;
                            return (
                                <div
                                    className={`notification-card fade-in fade-in-delay-${Math.min(i + 1, 4)}`}
                                    key={notif.id}
                                    style={{
                                        opacity: notif.read ? 0.65 : 1,
                                        borderLeft: notif.read ? 'none' : `3px solid ${config.color}`,
                                    }}
                                >
                                    <div
                                        className="notification-icon"
                                        style={{ background: config.bg, color: config.color }}
                                    >
                                        {config.icon}
                                    </div>
                                    <div className="notification-content" style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <h4>{notif.title}</h4>
                                            {!notif.read && (
                                                <span style={{
                                                    display: 'inline-block', width: 8, height: 8,
                                                    borderRadius: '50%', background: 'var(--accent-primary)',
                                                    flexShrink: 0,
                                                }} />
                                            )}
                                        </div>
                                        <p>{notif.message}</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                                            {notif.order_id && (
                                                <span className="status-badge created" style={{ fontSize: '0.7rem' }}>
                                                    📋 {notif.order_id.slice(0, 8)}...
                                                </span>
                                            )}
                                            {notif.user_name && (
                                                <span className="status-badge completed" style={{ fontSize: '0.7rem' }}>
                                                    👤 {notif.user_name}
                                                </span>
                                            )}
                                            {notif.items && notif.items.length > 0 && (
                                                <span className="status-badge processing" style={{ fontSize: '0.7rem' }}>
                                                    📦 {notif.items.length} item(s)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                                        <span className="notification-time">
                                            {formatTime(notif.created_at)}
                                        </span>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            {!notif.read && (
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => handleMarkAsRead(notif.id)}
                                                    style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                                                    title="Mark as read"
                                                >
                                                    ✓
                                                </button>
                                            )}
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => handleDelete(notif.id)}
                                                style={{ fontSize: '0.7rem', padding: '2px 8px', color: 'var(--error)' }}
                                                title="Delete"
                                            >
                                                🗑
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Integration Info */}
            <div className="card fade-in fade-in-delay-3" style={{ marginTop: 24 }}>
                <div className="card-header">
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>🔗 How Notifications Work</h3>
                </div>
                <div className="card-body">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                        <div className="notification-card" style={{ flex: '1 1 220px', marginBottom: 0 }}>
                            <div className="notification-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>1️⃣</div>
                            <div className="notification-content">
                                <h4>Event Fired</h4>
                                <p>Services publish events to RabbitMQ Fanout Exchange</p>
                            </div>
                        </div>
                        <div className="notification-card" style={{ flex: '1 1 220px', marginBottom: 0 }}>
                            <div className="notification-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>2️⃣</div>
                            <div className="notification-content">
                                <h4>Event Consumed</h4>
                                <p>Java listener receives from dedicated bound queue</p>
                            </div>
                        </div>
                        <div className="notification-card" style={{ flex: '1 1 220px', marginBottom: 0 }}>
                            <div className="notification-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>3️⃣</div>
                            <div className="notification-content">
                                <h4>User Resolved</h4>
                                <p>Calls User Service (Node.js) for user details</p>
                            </div>
                        </div>
                        <div className="notification-card" style={{ flex: '1 1 220px', marginBottom: 0 }}>
                            <div className="notification-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>4️⃣</div>
                            <div className="notification-content">
                                <h4>Stored & Served</h4>
                                <p>Notification stored and exposed via REST API</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
