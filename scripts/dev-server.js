import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8"
};
const port = Number(process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");

createServer(async (req, res) => {
  try {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { Allow: "GET, HEAD" }); res.end(); return;
    }
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const path = resolve(root, "." + (pathname === "/" ? "/index.html" : pathname));
    const segments = pathname.split("/");
    if ((!path.startsWith(root + sep) && path !== root) || segments.some((s) => s.startsWith(".")) || !mime[extname(path)]) {
      res.writeHead(404); res.end("Not found"); return;
    }
    if (!(await stat(path)).isFile()) { res.writeHead(404); res.end("Not found"); return; }
    const content = await readFile(path);
    res.writeHead(200, {
      "Content-Type": mime[extname(path)],
      "Content-Length": content.byteLength,
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Cache-Control": "no-store"
    });
    res.end(req.method === "HEAD" ? undefined : content);
  } catch {
    res.writeHead(404); res.end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  process.stdout.write(`CampusOS development server: http://127.0.0.1:${port}\n`);
});
