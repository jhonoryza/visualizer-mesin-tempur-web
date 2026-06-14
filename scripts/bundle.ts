// Simple deploy bundle: reads dist/ and inlines everything into a single server.ts
const DIST = "./dist";

async function walk(dir: string): Promise<string[]> {
  const entries: string[] = [];
  for await (const d of Deno.readDir(dir)) {
    const p = `${dir}/${d.name}`;
    if (d.isDirectory) entries.push(...await walk(p));
    else entries.push(p);
  }
  return entries;
}

const files = await walk(DIST);
const manifest: Record<string, string> = {};

for (const f of files) {
  const key = f.slice(DIST.length);
  const ext = key.split(".").pop() ?? "";
  const isBinary = !["html", "js", "css", "json", "svg", "txt", "xml", "map"].includes(ext);

  if (isBinary) {
    const bytes = await Deno.readFile(f);
    const b64 = btoa(String.fromCharCode(...bytes));
    manifest[key] = `BIN:${b64}`;
  } else {
    manifest[key] = await Deno.readTextFile(f);
  }
}

const manifestJSON = JSON.stringify(manifest);

const server = `// Auto-generated — do not edit. Run: deno task bundle
const MANIFEST = ${manifestJSON};

const MIME: Record<string, string> = {
  ".html":"text/html; charset=utf-8",".js":"application/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",
  ".png":"image/png",".jpg":"image/jpeg",".svg":"image/svg+xml",
  ".ico":"image/x-icon",".woff2":"font/woff2",".webm":"video/webm",
  ".mp4":"video/mp4",".webp":"image/webp",
};

function getMime(path: string): string {
  const ext = path.slice(path.lastIndexOf("."));
  return MIME[ext] ?? "application/octet-stream";
}

function resolveFile(path: string): Uint8Array | null {
  const raw = MANIFEST[path];
  if (!raw) return null;
  if (raw.startsWith("BIN:")) {
    const b64 = raw.slice(4);
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  return new TextEncoder().encode(raw);
}

export default {
  async fetch(req: Request): Promise<Response> {
    const { pathname } = new URL(req.url);

    // Try exact match
    const exact = resolveFile(pathname);
    if (exact) {
      return new Response(exact, {
        headers: {
          "content-type": getMime(pathname),
          "cache-control": pathname.includes("/assets/")
            ? "public, max-age=31536000, immutable" : "no-cache",
        },
      });
    }

    // SPA fallback
    const index = resolveFile("/index.html");
    if (index) {
      return new Response(index, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
};
`;

await Deno.writeTextFile("deploy.ts", server);
const size = (new TextEncoder().encode(server).length / 1024).toFixed(0);
console.log(`✓ deploy.ts generated (${size} KB)`);
console.log(`  Files inlined: ${files.length}`);
