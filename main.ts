const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".webm": "video/webm",
  ".mp4": "video/mp4",
  ".webp": "image/webp",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
};

async function serveFromDist(pathname: string): Promise<Response | null> {
  const file = await Deno.readFile(new URL(`./dist${pathname}`, import.meta.url)).catch(() => null);
  if (!file) return null;
  const ext = pathname.slice(pathname.lastIndexOf("."));
  return new Response(file, {
    headers: {
      "content-type": MIME[ext] ?? "application/octet-stream",
      "cache-control": pathname.includes("/assets/")
        ? "public, max-age=31536000, immutable"
        : "no-cache",
    },
  });
}

const port = Number(Deno.env.get("PORT")) || 8000;

Deno.serve({ port }, async (req): Promise<Response> => {
  const { pathname } = new URL(req.url);

  const res = await serveFromDist(pathname);
  if (res) return res;

  // SPA fallback
  const index = await serveFromDist("/index.html");
  if (index) return index;

  return new Response("Not Found", { status: 404 });
});

console.log(`🚀 MESIN TEMPUR running at http://localhost:${port}`);
