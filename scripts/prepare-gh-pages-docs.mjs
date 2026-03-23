import { promises as fs } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const outDir = path.join(rootDir, "apps", "web", "out");
const docsDir = path.join(rootDir, "docs");

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function collectFiles(dir, matcher, acc = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(fullPath, matcher, acc);
    } else if (matcher(fullPath)) {
      acc.push(fullPath);
    }
  }
  return acc;
}

function relativePrefixForFile(filePath) {
  const relativeDir = path.relative(docsDir, path.dirname(filePath));
  if (!relativeDir) return "./";
  const depth = relativeDir.split(path.sep).filter(Boolean).length;
  return "../".repeat(depth);
}

function rewriteRootAbsolutePaths(html, prefix) {
  let next = html;

  // Standard HTML attributes.
  next = next.replace(/="\//g, `="${prefix}`);
  next = next.replace(/='\//g, `='${prefix}`);

  // Escaped quotes inside inline scripts (RSC payloads and route manifests).
  next = next.replace(/\\"\/(?!\/)/g, `\\"${prefix}`);
  next = next.replace(/\\'\/(?!\/)/g, `\\'${prefix}`);

  // Inline CSS URLs if present.
  next = next.replace(/url\(\//g, `url(${prefix}`);

  return next;
}

async function main() {
  if (!(await pathExists(outDir))) {
    throw new Error(`Missing export output at: ${outDir}`);
  }

  await fs.rm(docsDir, { recursive: true, force: true });
  await fs.cp(outDir, docsDir, { recursive: true });

  const htmlFiles = await collectFiles(docsDir, (filePath) => filePath.endsWith(".html"));
  for (const filePath of htmlFiles) {
    const prefix = relativePrefixForFile(filePath);
    const original = await fs.readFile(filePath, "utf8");
    const rewritten = rewriteRootAbsolutePaths(original, prefix);
    await fs.writeFile(filePath, rewritten, "utf8");
  }

  // Remove Next export debug text artifacts that are not needed for GitHub Pages hosting.
  const txtFiles = await collectFiles(docsDir, (filePath) => filePath.endsWith(".txt"));
  await Promise.all(txtFiles.map((filePath) => fs.rm(filePath, { force: true })));

  await fs.writeFile(path.join(docsDir, ".nojekyll"), "", "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
