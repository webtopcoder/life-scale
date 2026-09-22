#!/usr/bin/env node
/**
 * Build a pruned Lambda zip staging dir at api/.lambda-package/
 * (Nest dist at root + production node_modules, Prisma CLI / unused compilers removed).
 */
import { execSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiRoot = join(__dirname, "..");
const outDir = join(apiRoot, ".lambda-package");
const MAX_BYTES = 240 * 1024 * 1024; // Lambda unzipped limit is 250MB

const DROP_PACKAGES = [
  "prisma",
  "@prisma/engines",
  "@prisma/studio-core",
  "@prisma/dev",
  "@prisma/config",
  "@prisma/fetch-engine",
  "@prisma/get-platform",
  "@prisma/engines-version",
  "@prisma/query-plan-executor",
  "@prisma/streams-local",
  "typescript",
  // Orphans left from Prisma CLI / Studio (not used by Nest runtime)
  "effect",
  "@electric-sql",
  "elkjs",
  "react",
  "react-dom",
  "scheduler",
  "@visx",
  "@radix-ui",
  "remeda",
  "fast-check",
  "valibot",
  "jiti",
  "mysql2",
];

function run(cmd, cwd = apiRoot) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit" });
}

function dirSizeBytes(dir) {
  let total = 0;
  const walk = (p) => {
    for (const name of readdirSync(p)) {
      const full = join(p, name);
      let st;
      try {
        st = statSync(full);
      } catch {
        // Broken symlink after prune — drop it
        try {
          rmSync(full, { force: true });
        } catch {
          /* ignore */
        }
        continue;
      }
      if (st.isDirectory()) walk(full);
      else total += st.size;
    }
  };
  walk(dir);
  return total;
}

function formatMb(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function rmIfExists(p) {
  if (existsSync(p)) rmSync(p, { recursive: true, force: true });
}

function pruneNonPostgresCompilers(runtimeDir) {
  if (!existsSync(runtimeDir)) return 0;
  let removed = 0;
  for (const name of readdirSync(runtimeDir)) {
    if (!name.includes("query_compiler")) continue;
    if (name.includes("postgresql")) continue;
    rmSync(join(runtimeDir, name), { force: true });
    removed += 1;
  }
  return removed;
}

rmIfExists(outDir);
mkdirSync(outDir, { recursive: true });

run("npx --no-install prisma generate");
run("npm run build");

const distDir = join(apiRoot, "dist");
if (!existsSync(join(distDir, "lambda.js"))) {
  console.error(
    "Missing dist/lambda.js — Nest build did not produce the Lambda handler.",
  );
  process.exit(1);
}

cpSync(distDir, outDir, { recursive: true });
cpSync(join(apiRoot, "package.json"), join(outDir, "package.json"));
cpSync(join(apiRoot, "package-lock.json"), join(outDir, "package-lock.json"));

// Omit peer deps so the `prisma` CLI (peer of @prisma/client) is not installed
run("npm ci --omit=dev --omit=peer --ignore-scripts", outDir);

for (const pkg of DROP_PACKAGES) {
  rmIfExists(join(outDir, "node_modules", ...pkg.split("/")));
}
rmIfExists(join(outDir, "node_modules", "@types"));
rmIfExists(join(outDir, "node_modules", ".bin", "prisma"));
rmIfExists(join(outDir, "node_modules", ".bin", "prisma.cmd"));
rmIfExists(join(outDir, "node_modules", ".bin", "prisma.ps1"));

const compilersRemoved = pruneNonPostgresCompilers(
  join(outDir, "node_modules", "@prisma", "client", "runtime"),
);
console.log(
  `Removed ${compilersRemoved} non-PostgreSQL query compiler assets.`,
);

const size = dirSizeBytes(outDir);
console.log(`Lambda package size: ${formatMb(size)} (${outDir})`);

if (size >= MAX_BYTES) {
  console.error(
    `Package too large (${formatMb(size)}). Must be under ${formatMb(MAX_BYTES)} (Lambda limit 250MB unzipped).`,
  );
  process.exit(1);
}

console.log("Lambda package ready.");
