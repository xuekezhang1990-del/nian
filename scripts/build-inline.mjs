#!/usr/bin/env node
/**
 * Rebuilds data/dashboard.data.js from data/dashboard.json.
 *
 * The JSON file is the source of truth. The inline script exists only so
 * index.html can run straight from the filesystem without a web server.
 *
 * Usage: node scripts/build-inline.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, "data", "dashboard.json");
const TARGET = join(ROOT, "data", "dashboard.data.js");

let parsed;
try {
  parsed = JSON.parse(readFileSync(SOURCE, "utf8"));
} catch (error) {
  console.error(`cannot read ${SOURCE}`);
  console.error(error.message);
  process.exit(1);
}

writeFileSync(TARGET, `window.LIFE_DATA = ${JSON.stringify(parsed)};\n`, "utf8");

const kb = (JSON.stringify(parsed).length / 1024).toFixed(0);
console.log(`built dashboard.data.js (${kb} KB) from dashboard.json`);
console.log(`range ${parsed.meta.startDate} -> ${parsed.meta.endDate}, ${parsed.days.length} days`);
