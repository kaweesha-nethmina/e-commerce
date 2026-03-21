import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/users/:path*',
        destination: `${process.env.USER_SERVICE_URL || 'http://localhost:3001'}/users/:path*`,
      },
      {
        source: '/api/auth/:path*',
        destination: `${process.env.USER_SERVICE_URL || 'http://localhost:3001'}/auth/:path*`,
      },
      {
        source: '/api/products/:path*',
        destination: `${process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002'}/products/:path*`,
      },
      {
        source: '/api/orders/:path*',
        destination: `${process.env.ORDER_SERVICE_URL || 'http://localhost:3003'}/orders/:path*`,
      },
      {
        source: '/api/health/user',
        destination: `${process.env.USER_SERVICE_URL || 'http://localhost:3001'}/health`,
      },
      {
        source: '/api/health/product',
        destination: `${process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002'}/health`,
      },
      {
        source: '/api/health/order',
        destination: `${process.env.ORDER_SERVICE_URL || 'http://localhost:3003'}/health`,
      },
      {
        source: '/api/health/notification',
        destination: `${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004'}/health`,
      },
      {
        source: '/api/notifications/:path*',
        destination: `${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004'}/notifications/:path*`,
      },
      {
        source: '/api/health/payment',
        destination: `${process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005'}/health`,
      },
      {
        source: '/api/payments/:path*',
        destination: `${process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005'}/payments/:path*`,
      },
    ];
  },
};

export default nextConfig;
