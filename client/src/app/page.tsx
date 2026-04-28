'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { orderApi, productApi, userApi, notificationApi, paymentApi } from '@/lib/api';
import type { Order, Product, OrderSummary } from '@/lib/api';
import Link from 'next/link';

interface ServiceHealth {
  name: string;
  status: 'online' | 'offline' | 'checking';
  port: string;
  tech: string;
}
//com
export default function DashboardPage() {
  const { isAuthenticated, token } = useAuth();
  const [services, setServices] = useState<ServiceHealth[]>([
    { name: 'User Service', status: 'checking', port: '3001', tech: 'Node.js' },
    { name: 'Product Catalog', status: 'checking', port: '3002', tech: 'Python' },
    { name: 'Order Service', status: 'checking', port: '3003', tech: 'Go' },
    { name: 'Notification', status: 'checking', port: '3004', tech: 'Java' },
    { name: 'Payment Service', status: 'checking', port: '3005', tech: 'Node.js' },
  ]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<OrderSummary | null>(null);

  useEffect(() => {
    // Check health for all services
    const checks = [
      { idx: 0, fn: userApi.health },
      { idx: 1, fn: productApi.health },
      { idx: 2, fn: orderApi.health },
      { idx: 3, fn: notificationApi.health },
      { idx: 4, fn: paymentApi.health },
    ];

    checks.forEach(({ idx, fn }) => {
      fn()
        .then(() => {
          setServices((prev) =>
            prev.map((s, i) => (i === idx ? { ...s, status: 'online' as const } : s))
          );
        })
        .catch(() => {
          setServices((prev) =>
            prev.map((s, i) => (i === idx ? { ...s, status: 'offline' as const } : s))
          );
        });
    });

    // Load data
    productApi.list().then(setProducts).catch(() => { });
    // Only fetch orders when authenticated — backend filters by X-User-ID
    if (isAuthenticated && token) {
      orderApi.list(token).then(setOrders).catch(() => { });
      orderApi.summary(token).then(setSummary).catch(() => { });
    }
  }, [isAuthenticated, token]);

  const totalProductValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

  return (
    <div>
      <div className="page-header fade-in">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Monitor your microservices and platform activity
        </p>
      </div>

      {/* Service Health */}
      <div className="health-grid fade-in fade-in-delay-1">
        {services.map((svc) => (
          <div className="health-card" key={svc.name}>
            <div className={`health-dot ${svc.status}`} />
            <div className="health-info">
              <h4>{svc.name}</h4>
              <p>
                :{svc.port} • {svc.tech}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="stats-grid fade-in fade-in-delay-2">
        <div className="stat-card">
          <div className="stat-icon purple">📦</div>
          <div className="stat-info">
            <h3>{products.length}</h3>
            <p>Products available</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">📋</div>
          <div className="stat-info">
            <h3>{orders.length}</h3>
            <p>Your orders</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">💰</div>
          <div className="stat-info">
            <h3>${summary ? summary.total_spent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</h3>
            <p>Total spent</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">🔗</div>
          <div className="stat-info">
            <h3>{services.filter((s) => s.status === 'online').length}/5</h3>
            <p>Services online</p>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="dashboard-grid fade-in fade-in-delay-3">
        {/* Recent Orders */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Recent Orders</h3>
            <Link href="/orders" className="btn btn-ghost btn-sm">
              View all →
            </Link>
          </div>
          <div className="card-body">
            {orders.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <div className="empty-state-icon">📋</div>
                <h3>No orders yet</h3>
                <p>Place your first order from the Products page</p>
              </div>
            ) : (
              <div className="orders-table-wrapper">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Status</th>
                      <th>Items</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id}>
                        <td>
                          <span className="order-id">
                            {order.id.slice(0, 8)}...
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${order.status}`}>
                            <span className="status-dot" />
                            {order.status}
                          </span>
                        </td>
                        <td>{order.items.length} item(s)</td>
                        <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                          ${order.total_price?.toFixed(2) || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Service Interactions Info */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Microservices Interaction Map</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div className="notification-card" style={{ alignItems: 'flex-start' }}>
                <div className="notification-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                  👤
                </div>
                <div className="notification-content">
                  <h4 style={{ marginBottom: 4 }}>1. User Service</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
                    <strong>Publishes</strong> user registration events via RabbitMQ (to Notification Service).<br/>
                    <strong>Consumed by</strong> Order & Notification services via HTTP for details & validation.
                  </p>
                </div>
              </div>

              <div className="notification-card" style={{ alignItems: 'flex-start' }}>
                <div className="notification-icon" style={{ background: 'rgba(251, 146, 60, 0.15)', color: '#fb923c' }}>
                  📦
                </div>
                <div className="notification-content">
                  <h4 style={{ marginBottom: 4 }}>2. Product Catalog</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
                    <strong>Consumes</strong> order events from RabbitMQ (from Order Service) to deduct stock.<br/>
                    <strong>Consumed by</strong> Order Service via HTTP for stock checking and product details.
                  </p>
                </div>
              </div>

              <div className="notification-card" style={{ alignItems: 'flex-start' }}>
                <div className="notification-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
                  🛒
                </div>
                <div className="notification-content">
                  <h4 style={{ marginBottom: 4 }}>3. Order Service</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
                    <strong>Calls</strong> User Service (HTTP) & Product Service (HTTP) during checkout.<br/>
                    <strong>Publishes</strong> order status events via RabbitMQ (to Product & Notification).
                  </p>
                </div>
              </div>

              <div className="notification-card" style={{ alignItems: 'flex-start' }}>
                <div className="notification-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
                  🔔
                </div>
                <div className="notification-content">
                  <h4 style={{ marginBottom: 4 }}>4. Notification Service</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
                    <strong>Consumes</strong> events via RabbitMQ from both User & Order services.<br/>
                    <strong>Calls</strong> User Service via HTTP to enrich notifications with user profiles.
                  </p>
                </div>
              </div>

              <div className="notification-card" style={{ alignItems: 'flex-start' }}>
                <div className="notification-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
                  💳
                </div>
                <div className="notification-content">
                  <h4 style={{ marginBottom: 4 }}>5. Payment Service</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
                    <strong>Consumes</strong> order events from RabbitMQ to process payments.<br/>
                    <strong>Calls</strong> Order Service via HTTP to finalize order statuses continuously.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="card fade-in fade-in-delay-4" style={{ marginTop: 24, textAlign: 'center' }}>
          <div className="card-body" style={{ padding: '40px 24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>
              Get Started
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20, maxWidth: 400, margin: '0 auto 20px' }}>
              Sign in or create an account to browse products and place orders through our microservices platform.
            </p>
            <Link href="/auth" className="btn btn-primary btn-lg">
              Create Account →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
