import { cp, mkdir } from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";

const root = process.cwd();

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
