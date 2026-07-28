import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const files = walk(".").filter((file) => /\.(ts|js|css|md)$/.test(file));
const failures: string[] = [];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  if (/\b:\s*any\b/.test(text) && file.endsWith(".ts")) failures.push(`${file}: TypeScript any is not allowed`);
  if (/[ \t]+$/m.test(text)) failures.push(`${file}: trailing whitespace`);
}
if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`lint passed (${files.length} files)`);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    if ([".git", "node_modules", "data", "logs"].includes(name)) return [];
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}
