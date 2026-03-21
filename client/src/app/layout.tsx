import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import Navbar from '@/components/Navbar';
import CartSidebar from '@/components/CartSidebar';

export const metadata: Metadata = {
  title: 'OrderHub — E-Commerce Platform',
  description: 'Microservices-based e-commerce order and notification platform built with Node.js, Python, Go, and Java.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            <div className="app-container">
              <Navbar />
              <main className="page">
                {children}
              </main>
              <CartSidebar />
            </div>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
