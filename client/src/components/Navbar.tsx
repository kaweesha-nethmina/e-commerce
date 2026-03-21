'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useEffect, useState } from 'react';
import { notificationApi } from '@/lib/api';

export default function Navbar() {
    const pathname = usePathname();
    const { isAuthenticated, userName, userEmail, token, logout } = useAuth();
    const { toggleCart, totalItems } = useCart();
    const [unreadCount, setUnreadCount] = useState(0);

    const initial = userName ? userName[0].toUpperCase() : userEmail ? userEmail[0].toUpperCase() : '?';

    // Poll unread count
    useEffect(() => {
        if (!isAuthenticated || !token) {
            setUnreadCount(0);
            return;
        }

        const fetchUnread = () => {
            notificationApi.unreadCount(token)
                .then((r) => setUnreadCount(r.count))
                .catch(() => { });
        };

        fetchUnread();
        const interval = setInterval(fetchUnread, 10000);
        return () => clearInterval(interval);
    }, [isAuthenticated, token]);

    return (
        <nav className="navbar">
            <Link href="/" className="navbar-brand" style={{ textDecoration: 'none' }}>
                <div className="navbar-brand-icon">🛒</div>
                <span>OrderHub</span>
            </Link>

            <ul className="navbar-links">
                <li>
                    <Link
                        href="/"
                        className={`navbar-link ${pathname === '/' ? 'active' : ''}`}
                    >
                        📊 Dashboard
                    </Link>
                </li>
                <li>
                    <Link
                        href="/products"
                        className={`navbar-link ${pathname === '/products' ? 'active' : ''}`}
                    >
                        📦 Products
                    </Link>
                </li>
                <li>
                    <Link
                        href="/orders"
                        className={`navbar-link ${pathname === '/orders' ? 'active' : ''}`}
                    >
                        📋 Orders
                    </Link>
                </li>
                <li>
                    <Link
                        href="/notifications"
                        className={`navbar-link ${pathname === '/notifications' ? 'active' : ''}`}
                        style={{ position: 'relative' }}
                    >
                        🔔 Notifications
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: -4,
                                right: -8,
                                background: 'var(--error)',
                                color: '#fff',
                                borderRadius: '50%',
                                minWidth: 18,
                                height: 18,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '0 4px',
                            }}>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </Link>
                </li>
            </ul>

            <div className="navbar-actions">
                {isAuthenticated && (
                    <>
                        <button
                            className="btn btn-ghost"
                            onClick={toggleCart}
                            style={{ position: 'relative' }}
                            id="cart-toggle-btn"
                        >
                            🛒
                            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
                        </button>
                        <Link href="/profile" style={{ textDecoration: 'none' }}>
                            <div className="user-badge" style={{ cursor: 'pointer' }}>
                                <div className="user-badge-avatar">{initial}</div>
                                <span>{userName || userEmail || 'User'}</span>
                            </div>
                        </Link>
                        <button className="btn btn-ghost btn-sm" onClick={logout} id="logout-btn">
                            Logout
                        </button>
                    </>
                )}
                {!isAuthenticated && (
                    <Link href="/auth" className="btn btn-primary btn-sm">
                        Sign In
                    </Link>
                )}
            </div>
        </nav>
    );
}
