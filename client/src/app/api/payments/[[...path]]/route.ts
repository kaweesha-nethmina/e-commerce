import { NextRequest } from 'next/server';
import { proxyToService, serviceUrl } from '@/lib/proxy';

// Routes:  /api/payments/* → API_GATEWAY_URL/payments/*
const handler = (req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) =>
  params.then(({ path }) =>
    proxyToService(req, serviceUrl('API_GATEWAY_URL', 80), `/payments/${(path || []).join('/')}`)
  );

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
