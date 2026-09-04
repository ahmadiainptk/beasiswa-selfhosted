// path: src/pages/api/img/[id].ts
import type { APIRoute } from "astro";
import { getAccessToken } from "../../../lib/drive";

export const GET: APIRoute = async ({ params, request, locals }) => {
    const fileId = params.id;
    if (!fileId) return new Response("File ID missing", { status: 400 });

    try {
        const env = (locals as any).runtime?.env;
        const ctx = (locals as any).runtime?.ctx;

        // 1. Cek Cache Edge Cloudflare
        const cache = typeof caches !== "undefined" ? caches.default : null;
        const cacheKey = new Request(request.url, { method: "GET" });

        if (cache) {
            const cachedResponse = await cache.match(cacheKey);
            if (cachedResponse) {
                const hitResponse = new Response(cachedResponse.body, cachedResponse);
                hitResponse.headers.set("X-Edge-Cache", "HIT");
                return hitResponse;
            }
        }

        // 2. Get token & fetch from Google Drive
        const token = await getAccessToken(env);
        const googleRes = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!googleRes.ok) {
            return new Response("Gagal mengambil gambar dari Google", { status: googleRes.status });
        }

        // 3. Response with aggressive cache
        const newHeaders = new Headers(googleRes.headers);
        newHeaders.set("Cache-Control", "public, max-age=31536000, s-maxage=31536000, immutable");
        newHeaders.set("Content-Type", googleRes.headers.get("Content-Type") || "image/jpeg");
        newHeaders.delete("Set-Cookie");
        newHeaders.delete("Content-Disposition");
        newHeaders.set("X-Edge-Cache", "MISS");

        const response = new Response(googleRes.body, {
            status: 200,
            headers: newHeaders
        });

        // 4. Save to Edge Cache asynchronously
        if (cache && response.status === 200) {
            if (ctx && ctx.waitUntil) {
                ctx.waitUntil(cache.put(cacheKey, response.clone()));
            } else {
                await cache.put(cacheKey, response.clone());
            }
        }

        return response;

    } catch (e: any) {
        console.error("Image Proxy Error:", e);
        return new Response("Internal Server Error", { status: 500 });
    }
};
