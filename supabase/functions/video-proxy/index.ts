import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const isAllowedHost = (hostname: string) => {
  return hostname.endsWith(".b-cdn.net") || hostname === "iframe.mediadelivery.net";
};

const toProxyUrl = (origin: string, absoluteUrl: string) =>
  `${origin}/video-proxy?url=${encodeURIComponent(absoluteUrl)}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestUrl = new URL(req.url);
    const rawTarget = requestUrl.searchParams.get("url");

    if (!rawTarget) {
      return new Response("Missing url query parameter", { status: 400, headers: corsHeaders });
    }

    let target: URL;
    try {
      target = new URL(rawTarget);
    } catch {
      return new Response("Invalid url", { status: 400, headers: corsHeaders });
    }

    if (target.protocol !== "https:" || !isAllowedHost(target.hostname)) {
      return new Response("Blocked host", { status: 403, headers: corsHeaders });
    }

    const upstream = await fetch(target.toString(), {
      method: "GET",
      headers: {
        "user-agent": "Mozilla/5.0",
        "accept": "*/*",
      },
      redirect: "follow",
    });

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";

    if (!upstream.ok) {
      const text = await upstream.text();
      return new Response(text || `Upstream error ${upstream.status}`, {
        status: upstream.status,
        headers: {
          ...corsHeaders,
          "content-type": contentType,
        },
      });
    }

    const isPlaylist =
      target.pathname.endsWith(".m3u8") ||
      contentType.includes("application/vnd.apple.mpegurl") ||
      contentType.includes("application/x-mpegURL") ||
      contentType.includes("application/x-mpegurl");

    if (isPlaylist) {
      const playlistText = await upstream.text();
      const proxyOrigin = `${requestUrl.origin}/functions/v1`;

      const rewritten = playlistText
        .split("\n")
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) {
            if (trimmed.startsWith("#EXT-X-KEY") && trimmed.includes("URI=\"")) {
              return trimmed.replace(/URI="([^"]+)"/, (_m, uri) => {
                const absolute = new URL(uri, target.toString()).toString();
                return `URI="${toProxyUrl(proxyOrigin, absolute)}"`;
              });
            }
            return line;
          }

          const absolute = new URL(trimmed, target.toString()).toString();
          return toProxyUrl(proxyOrigin, absolute);
        })
        .join("\n");

      return new Response(rewritten, {
        status: 200,
        headers: {
          ...corsHeaders,
          "content-type": "application/vnd.apple.mpegurl",
          "cache-control": "no-store",
        },
      });
    }

    const bytes = await upstream.arrayBuffer();
    return new Response(bytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "content-type": contentType,
        "cache-control": "public, max-age=60",
      },
    });
  } catch (error) {
    return new Response(`Proxy error: ${error instanceof Error ? error.message : String(error)}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});
