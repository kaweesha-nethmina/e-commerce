/**
 * Shared proxy utility for Next.js App Router Route Handlers.
 *
 * Why this exists:
 *   next.config.ts `rewrites()` are evaluated at BUILD TIME, so
 *   `process.env.SERVICE_URL` values set in Azure Container Apps
 *   (runtime env vars) are IGNORED — rewrites always fall back to localhost.
 *
 *   Route Handlers (this file) run at REQUEST TIME and read process.env
 *   fresh on every request, so Azure env vars work correctly.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy a Next.js App Router request to an upstream service.
 *
 * @param req        The incoming NextRequest
 * @param upstreamBase  e.g. "http://user-service"  (no trailing slash)
 * @param upstreamPath  e.g. "/users/abc"           (with leading slash)
 */
export async function proxyToService(
  req: NextRequest,
  upstreamBase: string,
  upstreamPath: string
): Promise<NextResponse> {
  // Preserve query string
  const search = req.nextUrl.search ?? '';
  const target = `${upstreamBase}${upstreamPath}${search}`;

  // Forward safe headers; drop hop-by-hop and host header
  const forwarded = new Headers();
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (
      lower === 'host' ||
      lower === 'connection' ||
      lower === 'transfer-encoding' ||
      lower === 'keep-alive' ||
      lower === 'upgrade' ||
      lower === 'proxy-authorization'
    ) {
      return;
    }
    forwarded.set(key, value);
  });

  // Build fetch options — body only for methods that allow it
  const hasBody = !['GET', 'HEAD', 'DELETE'].includes(req.method.toUpperCase());
  const fetchOptions: RequestInit & { duplex?: string } = {
    method: req.method,
    headers: forwarded,
    ...(hasBody && {
      body: req.body,
      duplex: 'half', // required for streaming request body in Node 18+
    }),
  };

  try {
    const upstream = await fetch(target, fetchOptions as RequestInit);

    // Forward response headers (drop hop-by-hop)
    const resHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower === 'connection' || lower === 'transfer-encoding') return;
      resHeaders.set(key, value);
    });

    return new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: resHeaders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown proxy error';
    console.error(`[proxy] Failed to reach ${target}:`, message);
    return NextResponse.json(
      { error: `Service unavailable: ${message}` },
      { status: 503 }
    );
  }
}

/** Helper: read a required service URL from env with a localhost fallback */
export function serviceUrl(envVar: string, fallbackPort: number): string {
  return process.env[envVar] || `http://localhost:${fallbackPort}`;
}
