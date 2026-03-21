import { NextRequest } from 'next/server';
import { proxyToService, serviceUrl } from '@/lib/proxy';

// Routes:  /api/products/* → PRODUCT_SERVICE_URL/products/*
const handler = (req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) =>
  params.then(({ path }) =>
    proxyToService(req, serviceUrl('PRODUCT_SERVICE_URL', 3002), `/products/${path.join('/')}`)
  );

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
