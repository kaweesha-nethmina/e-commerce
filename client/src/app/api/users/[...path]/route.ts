import { NextRequest } from 'next/server';
import { proxyToService, serviceUrl } from '@/lib/proxy';

// Routes:  /api/users/* → USER_SERVICE_URL/users/*
const handler = (req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) =>
  params.then(({ path }) =>
    proxyToService(req, serviceUrl('USER_SERVICE_URL', 3001), `/users/${path.join('/')}`)
  );

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
