import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const routes = {
  "/": "index.html",
  "/index.html": "index.html",
  "/health": "health/index.html",
  "/health/index.html": "health/index.html",
  "/nutrition": "nutrition/index.html",
  "/nutrition/index.html": "nutrition/index.html",
  "/training": "training/index.html",
  "/training/index.html": "training/index.html",
  "/coach": "coach/index.html",
  "/coach/index.html": "coach/index.html",
  "/privacy": "privacy.html",
  "/privacy.html": "privacy.html",
  "/terms": "terms.html",
  "/terms.html": "terms.html",
  "/impressum": "impressum.html",
  "/impressum.html": "impressum.html",
};

const pages = Object.fromEntries(
  Object.entries(routes).map(([route, file]) => [
    route,
    fs.readFileSync(path.join(root, file), "utf8"),
  ]),
);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const assetsRoot = path.join(root, "assets");
const assets = Object.fromEntries(
  fs.readdirSync(assetsRoot, { recursive: true })
    .filter((relativePath) => fs.statSync(path.join(assetsRoot, relativePath)).isFile())
    .map((relativePath) => {
      const extension = path.extname(relativePath).toLowerCase();
      const absolutePath = path.join(assetsRoot, relativePath);
      const isText = extension === ".css" || extension === ".js" || extension === ".svg";
      return [
        `/assets/${relativePath.split(path.sep).join("/")}`,
        {
          body: fs.readFileSync(absolutePath, isText ? "utf8" : undefined).toString(isText ? "utf8" : "base64"),
          encoding: isText ? "utf8" : "base64",
          type: mimeTypes[extension] || "application/octet-stream",
        },
      ];
    }),
);

const worker = `const pages = ${JSON.stringify(pages)};
const assets = ${JSON.stringify(assets)};
const binaryCache = new Map();

function decodeBase64Asset(pathname, value) {
  if (binaryCache.has(pathname)) return binaryCache.get(pathname);
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  binaryCache.set(pathname, bytes);
  return bytes;
}

function serveAsset(request, pathname, asset) {
  const headers = {
    "content-type": asset.type,
    "cache-control": "public, max-age=31536000, immutable",
    "x-content-type-options": "nosniff",
  };

  if (asset.encoding === "utf8") {
    return new Response(asset.body, { headers });
  }

  const bytes = decodeBase64Asset(pathname, asset.body);
  const range = request.headers.get("range");
  headers["accept-ranges"] = "bytes";

  if (range) {
    const match = /^bytes=(\\d*)-(\\d*)$/.exec(range);
    if (match) {
      const start = match[1] ? Number(match[1]) : 0;
      const end = match[2] ? Math.min(Number(match[2]), bytes.length - 1) : bytes.length - 1;
      if (start <= end && start < bytes.length) {
        headers["content-range"] = \`bytes \${start}-\${end}/\${bytes.length}\`;
        headers["content-length"] = String(end - start + 1);
        return new Response(bytes.slice(start, end + 1), { status: 206, headers });
      }
    }
    headers["content-range"] = \`bytes */\${bytes.length}\`;
    return new Response(null, { status: 416, headers });
  }

  headers["content-length"] = String(bytes.length);
  return new Response(bytes, { headers });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const route = url.pathname.length > 1 && url.pathname.endsWith("/")
      ? url.pathname.slice(0, -1)
      : url.pathname;
    const asset = assets[url.pathname];
    if (asset) {
      return serveAsset(request, url.pathname, asset);
    }
    const html = pages[route];
    if (!html) {
      return new Response("Not found", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300",
        "x-content-type-options": "nosniff",
        "referrer-policy": "strict-origin-when-cross-origin",
      },
    });
  },
};
`;

fs.mkdirSync(path.join(root, "dist", "server"), { recursive: true });
fs.writeFileSync(path.join(root, "dist", "server", "index.js"), worker);
fs.rmSync(path.join(root, "dist", "static"), { recursive: true, force: true });
console.log(`Built Lihas Sites worker with ${Object.keys(pages).length} routes and ${Object.keys(assets).length} embedded assets.`);
