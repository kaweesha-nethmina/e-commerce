'use client';

import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { orderApi } from '@/lib/api';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Toast from './Toast';

const productEmojis: Record<string, string> = {
    widgets: '⚙️',
    gadgets: '📱',
};

export default function CartSidebar() {
    const { items, isOpen, closeCart, removeItem, updateQuantity, clearCart, totalPrice } = useCart();
    const { token, isAuthenticated } = useAuth();
    const [isOrdering, setIsOrdering] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const router = useRouter();

    // Reset state when cart is closed
    const handleCloseCart = () => {
        closeCart();
    };

    const handlePlaceOrder = async () => {
        if (!isAuthenticated || !token) {
            setToast({ type: 'error', message: 'Please login to place an order.' });
            return;
        }

        if (items.length === 0) return;

        setIsOrdering(true);
        try {
            const orderItems = items.map((i) => ({
                product_id: i.product.id,
                quantity: i.quantity,
            }));
            await orderApi.create(orderItems, token || '');
            setToast({ type: 'success', message: 'Order placed successfully! 🎉' });
            clearCart();
            setTimeout(() => {
                closeCart();
                router.push('/orders');
            }, 1000);
        } catch (err) {
            setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to place order' });
        } finally {
            setIsOrdering(false);
        }
    };

    return (
        <>
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
            <div className={`cart-overlay ${isOpen ? 'open' : ''}`} onClick={handleCloseCart}>
                <div className="cart-sidebar" onClick={(e) => e.stopPropagation()}>
                    <div className="cart-header">
                        <h2>🛒 Shopping Cart</h2>
                        <button className="btn btn-ghost btn-sm" onClick={handleCloseCart}>
                            ✕
                        </button>
                    </div>

                    <div className="cart-items">
                                {items.length === 0 ? (
                                    <div className="cart-empty">
                                        <div className="cart-empty-icon">🛒</div>
                                        <p>Your cart is empty</p>
                                    </div>
                                ) : (
                                    items.map((item) => (
                                        <div className="cart-item" key={item.product.id}>
                                            <div className="cart-item-icon">
                                                {productEmojis[item.product.category] || '📦'}
                                            </div>
                                            <div className="cart-item-info">
                                                <div className="cart-item-name">{item.product.name}</div>
                                                <div className="cart-item-meta">
                                                    <div className="quantity-control" style={{ marginTop: 6 }}>
                                                        <button
                                                            className="quantity-btn"
                                                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                        >
                                                            −
                                                        </button>
                                                        <div className="quantity-value">{item.quantity}</div>
                                                        <button
                                                            className="quantity-btn"
                                                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="cart-item-price">
                                                ${(item.product.price * item.quantity).toFixed(2)}
                                            </div>
                                            <button
                                                className="cart-item-remove"
                                                onClick={() => removeItem(item.product.id)}
                                                title="Remove"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {items.length > 0 && (
                                <div className="cart-footer">
                                    <div className="cart-total">
                                        <span>Total</span>
                                        <span>${totalPrice.toFixed(2)}</span>
                                    </div>
                                    <button
                                        className="btn btn-primary btn-lg"
                                        style={{ width: '100%' }}
                                        onClick={handlePlaceOrder}
                                        disabled={isOrdering}
                                    >
                                        {isOrdering ? 'Placing Order...' : 'Place Order'}
                                    </button>
                                </div>
                            )}
                </div>
            </div>
        </>
    );
}
