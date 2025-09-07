#!/usr/bin/env node
// Minimal initializer that copies ./template into a target directory.
// Usage: init-starter [project-name]
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = path.join(__dirname, "template");
const arg = process.argv[2];
const dest = path.resolve(process.cwd(), arg || ".");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyDir(srcDir, destDir) {
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      ensureDir(destPath);
      copyDir(srcPath, destPath);
    } else {
      if (fs.existsSync(destPath)) {
        console.error(`✖ File already exists, refusing to overwrite: ${path.relative(process.cwd(), destPath)}`);
        process.exitCode = 1;
        process.exit();
      }
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

ensureDir(dest);
copyDir(src, dest);

const rel = path.relative(process.cwd(), dest) || ".";
console.log(`✅ Project initialized in ${rel}`);
console.log(`
Next steps:
  1) cd ${rel}
  2) Open index.html in your browser (no build needed), or start a static server.
`);
