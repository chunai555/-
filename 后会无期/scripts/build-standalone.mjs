import { cp, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";

const root = process.cwd();
const dist = path.join(root, "dist");

await mkdir(path.join(root, "media"), { recursive: true });
await cp(path.join(root, "public", "media"), path.join(root, "media"), {
  recursive: true,
  force: true,
});
await cp(path.join(root, "qq炫舞.mp4"), path.join(root, "media", "qqxuanwu.mp4"), {
  force: true,
});

await build({
  entryPoints: [path.join(root, "src", "main.ts")],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2022",
  outfile: path.join(root, "app.js"),
  sourcemap: false,
  minify: false,
});

await cp(path.join(root, "app.js"), path.join(dist, "app.js"), {
  force: true,
});
await cp(path.join(root, "app.css"), path.join(dist, "app.css"), {
  force: true,
});
await cp(path.join(root, "media"), path.join(dist, "media"), {
  recursive: true,
  force: true,
});

await writeFile(
  path.join(dist, "index.html"),
  `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="《后会无期》青春致敬音乐站：QQ、农场、飞车、炫舞与一场回忆谢幕。" />
    <title>后会无期 · 致敬青春</title>
    <link rel="stylesheet" href="./app.css" />
  </head>
  <body>
    <div id="app"></div>
    <script src="./app.js"></script>
  </body>
</html>
`,
  "utf8",
);
