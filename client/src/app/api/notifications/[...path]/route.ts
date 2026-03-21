import { NextRequest } from 'next/server';
import { proxyToService, serviceUrl } from '@/lib/proxy';

// Routes:  /api/notifications/* → NOTIFICATION_SERVICE_URL/notifications/*
const handler = (req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) =>
  params.then(({ path }) =>
    proxyToService(req, serviceUrl('NOTIFICATION_SERVICE_URL', 3004), `/notifications/${path.join('/')}`)
  );

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
