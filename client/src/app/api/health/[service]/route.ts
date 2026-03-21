import { NextRequest, NextResponse } from 'next/server';
import { proxyToService, serviceUrl } from '@/lib/proxy';

/**
 * Health check routes — each maps to the /health endpoint of the correct service.
 * Route: /api/health/[service]
 *   user         → USER_SERVICE_URL/health
 *   product      → PRODUCT_SERVICE_URL/health
 *   order        → ORDER_SERVICE_URL/health
 *   notification → NOTIFICATION_SERVICE_URL/health
 *   payment      → PAYMENT_SERVICE_URL/health
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ service: string }> }
): Promise<NextResponse> {
  const { service } = await params;

  switch (service) {
    case 'user':
      return proxyToService(req, serviceUrl('USER_SERVICE_URL', 3001), '/health');
    case 'product':
      return proxyToService(req, serviceUrl('PRODUCT_SERVICE_URL', 3002), '/health');
    case 'order':
      return proxyToService(req, serviceUrl('ORDER_SERVICE_URL', 3003), '/health');
    case 'notification':
      return proxyToService(req, serviceUrl('NOTIFICATION_SERVICE_URL', 3004), '/health');
    case 'payment':
      return proxyToService(req, serviceUrl('PAYMENT_SERVICE_URL', 3005), '/health');
    default:
      return NextResponse.json({ error: `Unknown service: ${service}` }, { status: 404 });
  }
}
