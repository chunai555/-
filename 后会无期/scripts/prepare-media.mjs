import { cp } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

await cp(path.join(root, "qq炫舞.mp4"), path.join(root, "public", "media", "qqxuanwu.mp4"), {
  force: true,
});
