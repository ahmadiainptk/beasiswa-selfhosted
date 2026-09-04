// path: src/middleware.ts
import { defineMiddleware } from "astro:middleware";
import { verifyGardaToken } from "./lib/auth";
import { getEnv } from "./lib/env";

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);

  // Self-hosted (Node): inject runtime.env sekali di sini, karena @astrojs/node
  // tidak menyediakan locals.runtime otomatis (itu hanya @astrojs/cloudflare).
  if (!context.locals.runtime?.env) {
    (context.locals as any).runtime = { env: getEnv() };
  }
  const env = context.locals.runtime?.env;

  // Maintenance mode
  if (env?.STATUS_MAINTENANCE === "true") {
    const hostname = url.hostname;
    if (hostname === "beasiswa.iainptk.ac.id") {
      if (url.pathname === "/maintenance") return next();
      return context.redirect("/maintenance", 302);
    }
  }

  const cookieHeader = context.request.headers.get("cookie") || "";

  // --- GARDA SSO: Admin zone ---
  const isAdmin = url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/admin");

  if (isAdmin) {
    // Validate the garda_token cookie ACTUALLY (not just presence), so a stale
    // or expired token is treated as logged-out instead of looping /admin ⇄ /admin/login.
    const gardaAdmin = await verifyGardaToken(cookieHeader, env as any);

    // Login page — only bounce to /admin if there's a VALID token
    if (url.pathname === "/admin/login") {
      if (gardaAdmin) return context.redirect("/admin");
      return next();
    }

    // Other admin pages — require a VALID token
    if (!gardaAdmin) {
      if (url.pathname.startsWith("/api/")) {
        return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), {
          status: 401, headers: { "Content-Type": "application/json" },
        });
      }
      return context.redirect("/admin/login");
    }

    (context.locals as any).gardaCookies = cookieHeader;
    (context.locals as any).admin = gardaAdmin;
    return next();
  }

  // --- Mahasiswa session: redirect /login if already logged in ---
  if (url.pathname === "/login") {
    if (cookieHeader.includes("beasiswa_session=")) {
      return context.redirect("/mahasiswa");
    }
  }

  return next();
});
