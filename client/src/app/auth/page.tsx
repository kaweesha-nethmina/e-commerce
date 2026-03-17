'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
    const [tab, setTab] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, register } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (tab === 'login') {
                await login(email, password);
            } else {
                if (!name.trim()) {
                    setError('Name is required');
                    setIsLoading(false);
                    return;
                }
                await register(email, password, name);
            }
            router.push('/products');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card fade-in">
                <div className="auth-header">
                    <div className="auth-logo">🛒</div>
                    <h1>{tab === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
                    <p>
                        {tab === 'login'
                            ? 'Sign in to access your dashboard'
                            : 'Join OrderHub to start shopping'}
                    </p>
                </div>

                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
                        onClick={() => { setTab('login'); setError(''); }}
                        id="login-tab"
                    >
                        Sign In
                    </button>
                    <button
                        className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
                        onClick={() => { setTab('register'); setError(''); }}
                        id="register-tab"
                    >
                        Register
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="auth-body">
                        {error && (
                            <div className="alert alert-error">
                                ❌ {error}
                            </div>
                        )}

                        {tab === 'register' && (
                            <div className="form-group">
                                <label className="form-label" htmlFor="name-input">Full Name</label>
                                <input
                                    id="name-input"
                                    className="form-input"
                                    type="text"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    autoComplete="name"
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label" htmlFor="email-input">Email Address</label>
                            <input
                                id="email-input"
                                className="form-input"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="password-input">Password</label>
                            <input
                                id="password-input"
                                className="form-input"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                            />
                        </div>

                        <button
                            className="btn btn-primary btn-lg"
                            style={{ width: '100%', marginTop: 8 }}
                            disabled={isLoading}
                            type="submit"
                            id="auth-submit-btn"
                        >
                            {isLoading
                                ? 'Please wait...'
                                : tab === 'login'
                                    ? 'Sign In'
                                    : 'Create Account'}
                        </button>
                    </div>
                </form>

                <div className="auth-footer">
                    {tab === 'login' ? (
                        <span>
                            Don&apos;t have an account?{' '}
                            <a href="#" onClick={(e) => { e.preventDefault(); setTab('register'); setError(''); }}>
                                Register
                            </a>
                        </span>
                    ) : (
                        <span>
                            Already have an account?{' '}
                            <a href="#" onClick={(e) => { e.preventDefault(); setTab('login'); setError(''); }}>
                                Sign In
                            </a>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
