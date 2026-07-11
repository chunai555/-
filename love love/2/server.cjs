const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 5173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
};

function sendFile(req, res, file, stat) {
  const type = types[path.extname(file).toLowerCase()] || "application/octet-stream";
  const range = req.headers.range;

  if (!range) {
    res.writeHead(200, {
      "Content-Type": type,
      "Content-Length": stat.size,
      "Accept-Ranges": "bytes",
    });
    fs.createReadStream(file).pipe(res);
    return;
  }

  const match = range.match(/bytes=(\d*)-(\d*)/);
  if (!match) {
    res.writeHead(416, { "Content-Range": `bytes */${stat.size}` });
    res.end();
    return;
  }

  const start = match[1] ? Number(match[1]) : 0;
  const end = match[2] ? Number(match[2]) : stat.size - 1;

  if (start >= stat.size || end >= stat.size || start > end) {
    res.writeHead(416, { "Content-Range": `bytes */${stat.size}` });
    res.end();
    return;
  }

  res.writeHead(206, {
    "Content-Type": type,
    "Content-Length": end - start + 1,
    "Content-Range": `bytes ${start}-${end}/${stat.size}`,
    "Accept-Ranges": "bytes",
  });
  fs.createReadStream(file, { start, end }).pipe(res);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
  const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const file = path.normalize(path.join(root, pathname));

  if (!file.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    sendFile(req, res, file, stat);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Love Love site: http://127.0.0.1:${port}`);
});
