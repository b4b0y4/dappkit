#!/usr/bin/env node
// Minimal initializer that copies ./template into a target directory.
// Usage: init-starter [project-name]
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const src = path.join(path.dirname(fileURLToPath(import.meta.url)), "template");
const dest = path.resolve(process.cwd(), process.argv[2] || ".");

function copyDir(srcDir, destDir) {
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDir(srcPath, destPath);
    } else {
      if (fs.existsSync(destPath)) {
        console.error(
          `✖ File already exists, refusing to overwrite: ${path.relative(process.cwd(), destPath)}`,
        );
        process.exitCode = 1;
        process.exit();
      }
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

fs.mkdirSync(dest, { recursive: true });
copyDir(src, dest);

try {
  execSync("git init", { cwd: dest, stdio: "pipe" });
  console.log("✅ Initialized git repository");
} catch (e) {
  console.error("✖ Could not initialize git repository");
  console.error(e);
}

const rel = path.relative(process.cwd(), dest) || ".";
console.log(`✅ Project initialized in ${rel}`);
console.log(`
Next steps:
  1) cd ${rel}
  2) Start a local development server. For example:
     npx serve
     or
     python3 -m http.server
  3) Open the provided URL in your browser.
`);
