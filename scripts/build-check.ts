import { spawnSync } from "node:child_process";

for (const script of ["scripts/lint.ts", "scripts/typecheck.ts"]) {
  const result = spawnSync(process.execPath, [script], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const result = spawnSync(process.execPath, ["--test", "tests/unit/validation.test.ts", "tests/unit/upload.test.ts", "tests/integration/store.test.ts"], { stdio: "inherit" });
process.exit(result.status ?? 0);
