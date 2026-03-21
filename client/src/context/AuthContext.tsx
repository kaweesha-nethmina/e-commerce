'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { userApi, type AuthResponse } from '@/lib/api';

interface AuthContextType {
    token: string | null;
    userId: string | null;
    userName: string | null;
    userEmail: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedUserId = localStorage.getItem('userId');
        const savedName = localStorage.getItem('userName');
        const savedEmail = localStorage.getItem('userEmail');
        if (savedToken && savedUserId) {
            setToken(savedToken);
            setUserId(savedUserId);
            setUserName(savedName);
            setUserEmail(savedEmail);
        }
        setIsLoading(false);
    }, []);

    const saveAuth = useCallback((res: AuthResponse, name?: string, email?: string) => {
        setToken(res.token);
        setUserId(res.userId);
        setUserName(name || null);
        setUserEmail(email || null);
        localStorage.setItem('token', res.token);
        localStorage.setItem('userId', res.userId);
        if (name) localStorage.setItem('userName', name);
        if (email) localStorage.setItem('userEmail', email);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const res = await userApi.login(email, password);
        saveAuth(res, undefined, email);
        // Try to get user name
        try {
            const user = await userApi.getUser(res.userId);
            setUserName(user.name);
            setUserEmail(user.email);
            localStorage.setItem('userName', user.name);
            localStorage.setItem('userEmail', user.email);
        } catch {
            // ignore
        }
    }, [saveAuth]);

    const register = useCallback(async (email: string, password: string, name: string) => {
        const res = await userApi.register(email, password, name);
        saveAuth(res, name, email);
    }, [saveAuth]);

    const logout = useCallback(() => {
        setToken(null);
        setUserId(null);
        setUserName(null);
        setUserEmail(null);
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
    }, []);

    return (
        <AuthContext.Provider
            value={{
                token,
                userId,
                userName,
                userEmail,
                isAuthenticated: !!token,
                isLoading,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
