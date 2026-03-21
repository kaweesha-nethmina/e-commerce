'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { userApi, orderApi } from '@/lib/api';
import type { User, OrderSummary } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Toast from '@/components/Toast';

export default function ProfilePage() {
    const { token, userId, isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [summary, setSummary] = useState<OrderSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Edit state
    const [editMode, setEditMode] = useState(false);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [saving, setSaving] = useState(false);

    // Password change state
    const [passwordMode, setPasswordMode] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || !token) {
            router.push('/auth');
            return;
        }

        Promise.all([
            userApi.getCurrentUserProfile(token),
            orderApi.summary(token).catch(() => null),
        ])
            .then(([userData, summaryData]) => {
                setUser(userData);
                setSummary(summaryData);
                setEditName(userData.name);
                setEditEmail(userData.email);
            })
            .catch((err) => {
                setToast({ type: 'error', message: err.message });
            })
            .finally(() => setLoading(false));
    }, [isAuthenticated, token, router]);

    const handleUpdateProfile = async (e: FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setSaving(true);
        try {
            const updated = await userApi.updateProfile(token, {
                name: editName,
                email: editEmail,
            });
            setUser(updated);
            setEditMode(false);
            setToast({ type: 'success', message: 'Profile updated successfully' });
        } catch (err: any) {
            setToast({ type: 'error', message: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: FormEvent) => {
        e.preventDefault();
        if (!token) return;

        if (newPassword !== confirmPassword) {
            setToast({ type: 'error', message: 'Passwords do not match' });
            return;
        }
        if (newPassword.length < 6) {
            setToast({ type: 'error', message: 'Password must be at least 6 characters' });
            return;
        }

        setChangingPassword(true);
        try {
            await userApi.changePassword(token, currentPassword, newPassword);
            setToast({ type: 'success', message: 'Password changed successfully' });
            setPasswordMode(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setToast({ type: 'error', message: err.message });
        } finally {
            setChangingPassword(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
        if (!token) return;

        try {
            await userApi.deleteProfile(token);
            logout();
            router.push('/auth');
        } catch (err: any) {
            setToast({ type: 'error', message: err.message });
        }
    };

    if (loading) {
        return (
            <div className="loading-center">
                <div className="spinner" />
                <span>Loading profile...</span>
            </div>
        );
    }

    return (
        <div>
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            <div className="page-header fade-in">
                <h1 className="page-title">My Profile</h1>
                <p className="page-subtitle">
                    Manage your account • Powered by Node.js / Express on port 3001
                </p>
            </div>

            {/* Profile Summary */}
            {user && (
                <div className="stats-grid fade-in fade-in-delay-1" style={{ marginBottom: 24 }}>
                    <div className="stat-card">
                        <div className="stat-icon purple" style={{ fontSize: '1.5rem' }}>
                            {user.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="stat-info">
                            <h3>{user.name}</h3>
                            <p>{user.email}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon green">📋</div>
                        <div className="stat-info">
                            <h3>{summary?.total_orders || 0}</h3>
                            <p>Orders placed</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon orange">💰</div>
                        <div className="stat-info">
                            <h3>${summary?.total_spent?.toFixed(2) || '0.00'}</h3>
                            <p>Total spent</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon blue">📅</div>
                        <div className="stat-info">
                            <h3>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</h3>
                            <p>Member since</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="dashboard-grid fade-in fade-in-delay-2">
                {/* Profile Details Card */}
                <div className="card">
                    <div className="card-header">
                        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>👤 Profile Details</h3>
                        {!editMode && (
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(true)} id="edit-profile-btn">
                                ✏️ Edit
                            </button>
                        )}
                    </div>
                    <div className="card-body">
                        {editMode ? (
                            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input
                                        className="form-input"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        className="form-input"
                                        type="email"
                                        value={editEmail}
                                        onChange={(e) => setEditEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn btn-primary" type="submit" disabled={saving}>
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button className="btn btn-ghost" type="button" onClick={() => setEditMode(false)}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : user ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>Full Name</div>
                                    <div style={{ fontWeight: 500 }}>{user.name}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>Email</div>
                                    <div style={{ fontWeight: 500 }}>{user.email}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>Role</div>
                                    <span className="status-badge completed">{user.role || 'user'}</span>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>User ID</div>
                                    <code style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{userId}</code>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Security Card */}
                <div className="card">
                    <div className="card-header">
                        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>🔒 Security</h3>
                    </div>
                    <div className="card-body">
                        {passwordMode ? (
                            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div className="form-group">
                                    <label className="form-label">Current Password</label>
                                    <input
                                        className="form-input"
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">New Password</label>
                                    <input
                                        className="form-input"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Confirm New Password</label>
                                    <input
                                        className="form-input"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn btn-primary" type="submit" disabled={changingPassword}>
                                        {changingPassword ? 'Changing...' : 'Change Password'}
                                    </button>
                                    <button className="btn btn-ghost" type="button" onClick={() => setPasswordMode(false)}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 12 }}>
                                        Update your password to keep your account secure.
                                    </p>
                                    <button className="btn btn-secondary" onClick={() => setPasswordMode(true)} id="change-password-btn">
                                        🔑 Change Password
                                    </button>
                                </div>
                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 8 }}>
                                        Danger Zone
                                    </p>
                                    <button
                                        className="btn btn-error btn-sm"
                                        onClick={handleDeleteAccount}
                                        id="delete-account-btn"
                                    >
                                        🗑 Delete Account
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
