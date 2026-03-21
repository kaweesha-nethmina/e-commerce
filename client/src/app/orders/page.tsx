'use client';

import { useEffect, useState } from 'react';
import { orderApi } from '@/lib/api';
import type { Order, OrderSummary } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Toast from '@/components/Toast';
import { paymentApi } from '@/lib/api';

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [summary, setSummary] = useState<OrderSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
    const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const { token, userId, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            setError('Please log in to view your orders');
            setLoading(false);
            return;
        }

        Promise.all([
            orderApi.list(token || ''),
            orderApi.summary(token || '').catch(() => null),
        ])
            .then(([ordersData, summaryData]) => {
                setOrders(ordersData);
                setSummary(summaryData);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [token, isAuthenticated]);

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    const handleCancelOrder = async (orderId: string) => {
        if (!confirm('Are you sure you want to cancel this order?')) return;
        
        try {
            await orderApi.cancel(orderId, token || '');
            setToast({ type: 'success', message: 'Order cancelled successfully' });
            // Refresh orders
            const updatedOrders = await orderApi.list(token || '');
            setOrders(updatedOrders);
            const updatedSummary = await orderApi.summary(token || '').catch(() => null);
            setSummary(updatedSummary);
        } catch (err: any) {
            setToast({ type: 'error', message: err.message || 'Failed to cancel order' });
        }
    };

    const handleDeleteOrder = async (orderId: string) => {
        if (!confirm('Permanently delete this order? This cannot be undone.')) return;
        setDeletingOrderId(orderId);
        try {
            await orderApi.delete(orderId, token || '');
            setToast({ type: 'success', message: 'Order deleted successfully' });
            // Remove from local state instantly
            setOrders((prev) => prev.filter((o) => o.id !== orderId));
            // Refresh summary
            const updatedSummary = await orderApi.summary(token || '').catch(() => null);
            setSummary(updatedSummary);
        } catch (err: any) {
            setToast({ type: 'error', message: err.message || 'Failed to delete order' });
        } finally {
            setDeletingOrderId(null);
        }
    };

    const handleOpenPaymentModal = (order: Order) => {
        setSelectedOrderForPayment(order);
    };

    const confirmPayment = async () => {
        if (!selectedOrderForPayment) return;
        setIsProcessingPayment(true);
        try {
            const order = selectedOrderForPayment;
            const amount = order.total_price || order.items.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
            
            // Simulating real payment gateway delay
            await new Promise(res => setTimeout(res, 2000));
            
            await paymentApi.processManualPayment(order.id, userId || '', amount);
            setToast({ type: 'success', message: 'Payment processed successfully!' });
            
            setSelectedOrderForPayment(null);
            
            // Navigate to notifications page directly
            setTimeout(() => {
                router.push('/notifications');
            }, 1000);
            
        } catch (err: any) {
            setToast({ type: 'error', message: err.message || 'Failed to process payment' });
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'created': return 'info';
            case 'paid': return 'success';
            case 'processing': return 'warning';
            case 'shipped': return 'primary';
            case 'completed': return 'success';
            case 'cancelled': return 'error';
            default: return 'secondary';
        }
    };

    if (loading) {
        return (
            <div className="loading-center">
                <div className="spinner" />
                <span>Loading orders from Order Service...</span>
            </div>
        );
    }

    return (
        <div>
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            <div className="page-header fade-in">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 className="page-title">My Orders</h1>
                        <p className="page-subtitle">
                            Your orders • Powered by Go / Gin on port 3003
                        </p>
                    </div>
                    <Link href="/products" className="btn btn-primary">
                        + New Order
                    </Link>
                </div>
            </div>

            {/* Order Summary Stats */}
            {summary && !error && (
                <div className="stats-grid fade-in fade-in-delay-1" style={{ marginBottom: 24 }}>
                    <div className="stat-card">
                        <div className="stat-icon purple">📋</div>
                        <div className="stat-info">
                            <h3>{summary.total_orders}</h3>
                            <p>Total orders</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon green">💰</div>
                        <div className="stat-info">
                            <h3>${summary.total_spent.toFixed(2)}</h3>
                            <p>Total spent</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon orange">📊</div>
                        <div className="stat-info">
                            <h3>${summary.average_order_value.toFixed(2)}</h3>
                            <p>Avg. order value</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon blue">✅</div>
                        <div className="stat-info">
                            <h3>{summary.status_breakdown['created'] || 0}</h3>
                            <p>Active orders</p>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="alert alert-error">
                    ❌ Failed to load orders: {error}
                </div>
            )}

            {!error && orders.length === 0 ? (
                <div className="card fade-in fade-in-delay-1">
                    <div className="card-body">
                        <div className="empty-state">
                            <div className="empty-state-icon">📋</div>
                            <h3>No orders found</h3>
                            <p>
                                Place your first order by browsing products and adding them to your cart.
                            </p>
                            <Link href="/products" className="btn btn-primary" style={{ marginTop: 16 }}>
                                Browse Products
                            </Link>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card fade-in fade-in-delay-2">
                    <div className="card-body" style={{ padding: 0 }}>
                        <div className="orders-table-wrapper">
                            <table className="orders-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Status</th>
                                        <th>Items</th>
                                        <th>Total</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr key={order.id}>
                                            <td>
                                                <span className="order-id" title={order.id}>
                                                    {order.id.slice(0, 8)}...{order.id.slice(-4)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${getStatusColor(order.status)}`}>
                                                    <span className="status-dot" />
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                    {order.items.map((item, i) => (
                                                        <span key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                            {item.name || 'Product'} × {item.quantity}
                                                            {item.price ? ` ($${item.price.toFixed(2)})` : ''}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                                                    ${order.total_price?.toFixed(2) || '—'}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    {formatDate(order.created_at)}
                                                </span>
                                            </td>
                                            <td style={{ display: 'flex', gap: '8px' }}>
                                                {order.status === 'created' && (
                                                    <button
                                                        className="btn btn-sm btn-success"
                                                        onClick={() => handleOpenPaymentModal(order)}
                                                    >
                                                        Pay Now
                                                    </button>
                                                )}
                                                {order.status !== 'cancelled' && order.status !== 'completed' && order.status !== 'shipped' && order.status !== 'paid' && (
                                                    <button
                                                        className="btn btn-sm btn-error"
                                                        onClick={() => handleCancelOrder(order.id)}
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                                {(order.status === 'cancelled' || order.status === 'completed') && (
                                                    <button
                                                        className="btn btn-sm"
                                                        style={{
                                                            background: 'rgba(239,68,68,0.12)',
                                                            color: '#f87171',
                                                            border: '1px solid rgba(239,68,68,0.3)',
                                                            opacity: deletingOrderId === order.id ? 0.6 : 1,
                                                            cursor: deletingOrderId === order.id ? 'not-allowed' : 'pointer',
                                                        }}
                                                        onClick={() => handleDeleteOrder(order.id)}
                                                        disabled={deletingOrderId === order.id}
                                                        title="Permanently delete this order"
                                                    >
                                                        {deletingOrderId === order.id ? '...' : '🗑️ Delete'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Integration Info */}
            <div className="card fade-in fade-in-delay-3" style={{ marginTop: 24 }}>
                <div className="card-header">
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>🔗 Integration Flow</h3>
                </div>
                <div className="card-body">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                        <div className="notification-card" style={{ flex: '1 1 240px', marginBottom: 0 }}>
                            <div className="notification-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>1️⃣</div>
                            <div className="notification-content">
                                <h4>Validate User</h4>
                                <p>JWT validated via User Service (HTTP)</p>
                            </div>
                        </div>
                        <div className="notification-card" style={{ flex: '1 1 240px', marginBottom: 0 }}>
                            <div className="notification-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>2️⃣</div>
                            <div className="notification-content">
                                <h4>Check Stock & Price</h4>
                                <p>Stock validated & prices fetched via Product Catalog (HTTP)</p>
                            </div>
                        </div>
                        <div className="notification-card" style={{ flex: '1 1 240px', marginBottom: 0 }}>
                            <div className="notification-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>3️⃣</div>
                            <div className="notification-content">
                                <h4>Publish Event</h4>
                                <p>OrderCreated → RabbitMQ (AMQP)</p>
                            </div>
                        </div>
                        <div className="notification-card" style={{ flex: '1 1 240px', marginBottom: 0 }}>
                            <div className="notification-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>4️⃣</div>
                            <div className="notification-content">
                                <h4>Notify & Deduct</h4>
                                <p>Notification + stock deduction via consumers</p>
                            </div>
                        </div>
                        <div className="notification-card" style={{ flex: '1 1 240px', marginBottom: 0 }}>
                            <div className="notification-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>5️⃣</div>
                            <div className="notification-content">
                                <h4>Process Payment</h4>
                                <p>Manual processing publishes PaymentCompleted → RabbitMQ</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Payment Modal */}
            {selectedOrderForPayment && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div className="card fade-in" style={{ width: '100%', maxWidth: '400px', margin: '20px', padding: '24px', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Secure Checkout</h2>
                            <button 
                                onClick={() => !isProcessingPayment && setSelectedOrderForPayment(null)}
                                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0, lineHeight: 1 }}
                                disabled={isProcessingPayment}
                            >
                                &times;
                            </button>
                        </div>
                        
                        <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Order ID</span>
                                <span style={{ fontWeight: 500 }}>{selectedOrderForPayment.id.slice(0, 8)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 600 }}>
                                <span>Total Amount</span>
                                <span style={{ color: 'var(--accent-primary)' }}>${(selectedOrderForPayment.total_price || 0).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Cardholder Name</label>
                            <input type="text" className="form-control" placeholder="John Doe" defaultValue={userId ? "Test User" : ""} disabled={isProcessingPayment} style={{ width: '100%' }} />
                        </div>
                        
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Card Number</label>
                            <input type="text" className="form-control" placeholder="•••• •••• •••• 4242" defaultValue="4242 4242 4242 4242" disabled={isProcessingPayment} style={{ width: '100%' }} />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Expiry Date</label>
                                <input type="text" className="form-control" placeholder="MM/YY" defaultValue="12/25" disabled={isProcessingPayment} style={{ width: '100%' }} />
                            </div>
                            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>CVC</label>
                                <input type="text" className="form-control" placeholder="123" defaultValue="123" disabled={isProcessingPayment} style={{ width: '100%' }} />
                            </div>
                        </div>

                        <button 
                            className="btn btn-primary" 
                            style={{ width: '100%', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '1.05rem' }}
                            onClick={confirmPayment}
                            disabled={isProcessingPayment}
                        >
                            {isProcessingPayment ? (
                                <>
                                    <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                                    Processing Payment...
                                </>
                            ) : (
                                <>
                                    <span>🔒</span> Pay ${(selectedOrderForPayment.total_price || 0).toFixed(2)}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
