/**
 * Edge middleware: route auth + rate limiting.
 *
 * Clerk gate is conditional on CLERK_SECRET_KEY presence so the app boots
 * cleanly in sandbox / CI without Clerk provisioning. When the secret is
 * absent, the middleware degrades to a pass-through that still applies
 * rate limiting at the edge.
 *
 * Rate limiter is per-IP, 60 req/min for /api/webhook/*, 100 req/min for
 * the inbox surface. Buckets reset per process (acceptable on Railway's
 * single-worker layout).
 */
import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

import { consume, RATE_LIMITS } from "@/lib/rate-limit";

const PROTECTED = createRouteMatcher([
  "/inbox(.*)",
  "/dashboard(.*)",
  "/settings(.*)",
  "/conversations(.*)",
]);

function rateLimitFor(req: NextRequest): { success: boolean; remaining: number; reset: number } | null {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anon";
  if (req.nextUrl.pathname.startsWith("/api/webhook/")) {
    return consume(`webhook:${ip}`, RATE_LIMITS.webhook);
  }
  if (req.nextUrl.pathname.startsWith("/inbox")) {
    return consume(`inbox:${ip}`, { limit: 100, windowMs: 60_000 });
  }
  return null;
}

function withRateLimitHeaders(res: NextResponse, rl: { remaining: number; reset: number } | null) {
  if (!rl) return res;
  res.headers.set("X-RateLimit-Remaining", String(rl.remaining));
  res.headers.set("X-RateLimit-Reset", String(rl.reset));
  return res;
}

const clerkConfigured = Boolean(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const protectedMiddleware = clerkMiddleware(async (auth, req) => {
  const rl = rateLimitFor(req);
  if (rl && !rl.success) {
    return withRateLimitHeaders(
      NextResponse.json({ error: "rate_limited" }, { status: 429 }),
      rl,
    );
  }
  if (PROTECTED(req)) {
    await auth.protect();
  }
  return withRateLimitHeaders(NextResponse.next(), rl);
});

function passthrough(req: NextRequest) {
  const rl = rateLimitFor(req);
  if (rl && !rl.success) {
    return withRateLimitHeaders(
      NextResponse.json({ error: "rate_limited" }, { status: 429 }),
      rl,
    );
  }
  return withRateLimitHeaders(NextResponse.next(), rl);
}

// Lint rule disallows top-level conditional exports; export a single fn that
// dispatches at request time so the bundle is stable either way.
export default function middleware(req: NextRequest, event: Parameters<typeof protectedMiddleware>[1]) {
  if (clerkConfigured) {
    return protectedMiddleware(req, event);
  }
  return passthrough(req);
}

export const config = {
  matcher: [
    // Skip Next internals and static assets
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|map)).*)",
    // Always run on API
    "/(api|trpc)(.*)",
  ],
};
