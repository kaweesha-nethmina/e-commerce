import { NextRequest } from 'next/server';
import { proxyToService, serviceUrl } from '@/lib/proxy';

// Routes:  /api/notifications/* → API_GATEWAY_URL/notifications/*
const handler = (req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) =>
  params.then(({ path }) =>
    proxyToService(req, serviceUrl('API_GATEWAY_URL', 80), `/notifications/${(path || []).join('/')}`)
  );

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
