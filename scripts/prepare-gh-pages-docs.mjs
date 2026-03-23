import { promises as fs } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const outDir = path.join(rootDir, "apps", "web", "out");
const docsDir = path.join(rootDir, "docs");
const repoName = "Stratum";
const basePath = `/${repoName}`;

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

async function main() {
  if (!(await pathExists(outDir))) {
    throw new Error(`Missing export output at: ${outDir}`);
  }

  await fs.rm(docsDir, { recursive: true, force: true });
  await fs.cp(outDir, docsDir, { recursive: true });

  // Remove Next export debug text artifacts that are not needed for GitHub Pages hosting.
  const txtFiles = await collectFiles(docsDir, (filePath) => filePath.endsWith(".txt"));
  await Promise.all(txtFiles.map((filePath) => fs.rm(filePath, { force: true })));

  // Rewrite root-relative URLs (e.g. /image.png) to repository-relative URLs for GitHub Pages.
  const htmlFiles = await collectFiles(docsDir, (filePath) => filePath.endsWith(".html"));
  await Promise.all(
    htmlFiles.map(async (filePath) => {
      const content = await fs.readFile(filePath, "utf8");
      const rewritten = content.replace(
        /(["'])\/(?!Stratum\/|_next\/|\/|#)([^"'<>]*)\1/g,
        (_match, quote, target) => `${quote}${basePath}/${target}${quote}`,
      );

      if (rewritten !== content) {
        await fs.writeFile(filePath, rewritten, "utf8");
      }
    }),
  );

  await fs.writeFile(path.join(docsDir, ".nojekyll"), "", "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
