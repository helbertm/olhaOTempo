import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();
const TARGET_EXTENSIONS = new Set([".js", ".md", ".css", ".html", ".json", ".mjs"]);
const EXCLUDED_DIRECTORIES = new Set([".git", "node_modules"]);
const violations = [];

scan(ROOT);

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(violation);
  }

  process.exit(1);
}

console.log("Formatting guardrails OK.");

function scan(directory) {
  for (const entry of readdirSync(directory)) {
    if (EXCLUDED_DIRECTORIES.has(entry)) {
      continue;
    }

    const absolutePath = join(directory, entry);
    const entryStat = statSync(absolutePath);

    if (entryStat.isDirectory()) {
      scan(absolutePath);
      continue;
    }

    if (!TARGET_EXTENSIONS.has(extname(entry))) {
      continue;
    }

    const contents = readFileSync(absolutePath, "utf8");
    const lines = contents.split("\n");

    lines.forEach((line, index) => {
      if (/\t/.test(line)) {
        violations.push(`${absolutePath}:${index + 1} contains a tab character.`);
      }

      if (/[ \t]+$/.test(line)) {
        violations.push(`${absolutePath}:${index + 1} contains trailing whitespace.`);
      }
    });
  }
}
