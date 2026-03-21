import type { NextConfig } from "next";

/**
 * Next.js configuration.
 *
 * NOTE: We do NOT use `rewrites()` here for proxying backend services.
 *
 * Reason: next.config.ts rewrites are evaluated at BUILD TIME, so
 * `process.env.SERVICE_URL` values set in Azure Container Apps (runtime env
 * vars) would be ignored — the rewrite destinations would always compile to
 * the localhost fallbacks.
 *
 * Instead, we use App Router Route Handlers in src/app/api/**\/route.ts which
 * call `process.env` at REQUEST TIME and correctly pick up runtime env vars.
 */
const nextConfig: NextConfig = {
  output: 'standalone', // Required for Docker/Azure — produces a self-contained build
};

export default nextConfig;
