'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
    type: 'success' | 'error';
    message: string;
    onClose: () => void;
    duration?: number;
}

export default function Toast({ type, message, onClose, duration = 4000 }: ToastProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 300);
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!visible) return null;

    return (
        <div className="toast-container">
            <div className={`toast toast-${type}`}>
                {type === 'success' ? '✅' : '❌'} {message}
            </div>
        </div>
    );
}
