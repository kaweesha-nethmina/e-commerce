import { NextRequest, NextResponse } from 'next/server';
import { proxyToService, serviceUrl } from '@/lib/proxy';

/**
 * Health check routes — all proxied through the API Gateway.
 * Route: /api/health/[service]
 *   user         → API_GATEWAY_URL/health/user
 *   product      → API_GATEWAY_URL/health/product
 *   order        → API_GATEWAY_URL/health/order
 *   notification → API_GATEWAY_URL/health/notification
 *   payment      → API_GATEWAY_URL/health/payment
 *   gateway      → API_GATEWAY_URL/health/gateway
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ service: string }> }
): Promise<NextResponse> {
  const { service } = await params;
  const gateway = serviceUrl('API_GATEWAY_URL', 80);

  switch (service) {
    case 'user':
      return proxyToService(req, gateway, '/health/user');
    case 'product':
      return proxyToService(req, gateway, '/health/product');
    case 'order':
      return proxyToService(req, gateway, '/health/order');
    case 'notification':
      return proxyToService(req, gateway, '/health/notification');
    case 'payment':
      return proxyToService(req, gateway, '/health/payment');
    case 'gateway':
      return proxyToService(req, gateway, '/health/gateway');
    default:
      return NextResponse.json({ error: `Unknown service: ${service}` }, { status: 404 });
  }
}
