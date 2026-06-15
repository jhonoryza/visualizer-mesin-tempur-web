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

const ROOT = new URL("./dist/", import.meta.url);

export default {
  async fetch(req: Request): Promise<Response> {
    const { pathname } = new URL(req.url);
    const file = await Deno.readFile(new URL(`.${pathname}`, ROOT)).catch(() => null);

    if (file) {
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

    // SPA fallback
    const index = await Deno.readFile(new URL("./index.html", ROOT)).catch(() => null);
    if (index) {
      return new Response(index, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
};
