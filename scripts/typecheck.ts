import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const files = walk(".").filter((file) => file.endsWith(".ts"));
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout);
    process.exit(result.status ?? 1);
  }
}
console.log(`type syntax check passed (${files.length} files)`);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    if ([".git", "node_modules", "data", "logs"].includes(name)) return [];
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}
