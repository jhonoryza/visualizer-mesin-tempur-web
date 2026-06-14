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
    const b64 = toBase64(bytes);
    manifest[key] = `BIN:${b64}`;
  } else {
    manifest[key] = await Deno.readTextFile(f);
  }
}

// Write manifest as a separate JSON file to avoid template literal issues
await Deno.writeTextFile("dist/_manifest.json", JSON.stringify(manifest));

// Read it back as raw bytes and encode to base64
// Chunked base64 to avoid call stack overflow on large files
function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

const manifestBytes = await Deno.readFile("dist/_manifest.json");
const manifestB64 = toBase64(manifestBytes);

const server = `// Auto-generated deploy bundle — do not edit.
const MANIFEST_JSON = atob("${manifestB64}");
const MANIFEST: Record<string, string> = JSON.parse(MANIFEST_JSON);

const MIME: Record<string, string> = {
  ".html":"text/html; charset=utf-8",
  ".js":"application/javascript; charset=utf-8",
  ".mjs":"application/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8",
  ".json":"application/json; charset=utf-8",
  ".png":"image/png",
  ".jpg":"image/jpeg",
  ".jpeg":"image/jpeg",
  ".gif":"image/gif",
  ".svg":"image/svg+xml",
  ".ico":"image/x-icon",
  ".woff":"font/woff",
  ".woff2":"font/woff2",
  ".ttf":"font/ttf",
  ".webm":"video/webm",
  ".mp4":"video/mp4",
  ".webp":"image/webp",
  ".mp3":"audio/mpeg",
  ".wav":"audio/wav",
  ".ogg":"audio/ogg",
  ".m4a":"audio/mp4",
  ".flac":"audio/flac",
  ".aac":"audio/aac",
};

function getMime(path: string): string {
  const idx = path.lastIndexOf(".");
  if (idx < 0) return "application/octet-stream";
  const ext = path.slice(idx);
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
    const url = new URL(req.url);
    let pathname = url.pathname;

    // Remove trailing slash
    if (pathname.endsWith("/") && pathname.length > 1) {
      pathname = pathname.slice(0, -1);
    }

    // Try exact match
    const file = resolveFile(pathname);
    if (file) {
      return new Response(file, {
        headers: {
          "content-type": getMime(pathname),
          "cache-control": pathname.includes("/assets/")
            ? "public, max-age=31536000, immutable"
            : "no-cache",
        },
      });
    }

    // SPA fallback — serve index.html for non-file routes
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

// Cleanup
await Deno.remove("dist/_manifest.json");

const size = (new TextEncoder().encode(server).length / 1024).toFixed(0);
console.log(`✓ deploy.ts generated (${size} KB)`);
console.log(`  Files inlined: ${Object.keys(manifest).length}`);
Object.keys(manifest).forEach(k => console.log(`    ${k}`));
