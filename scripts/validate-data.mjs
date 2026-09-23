#!/usr/bin/env node
/**
 * Validates data/dashboard.json. Exits non-zero when the dataset breaks the contract
 * described in AGENTS.md. Intended to be run manually or from a Codex hook.
 *
 * Usage: node scripts/validate-data.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_PATH = join(ROOT, "data", "dashboard.json");
const DAY_MS = 86400000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CATEGORIES = ["餐饮", "交通", "购物", "居家", "娱乐", "学习", "医疗"];

const problems = [];
const notes = [];
const fail = (message) => problems.push(message);
const note = (message) => notes.push(message);

let data;
try {
  data = JSON.parse(readFileSync(DATA_PATH, "utf8"));
} catch (error) {
  console.error(`cannot read ${DATA_PATH}`);
  console.error(error.message);
  process.exit(1);
}

const need = (value, message) => {
  if (!value) fail(message);
  return Boolean(value);
};

const isDate = (value) => typeof value === "string" && DATE_RE.test(value);
const inRange = (value, min, max) => typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;

if (need(data.meta, "meta is missing")) {
  need(isDate(data.meta.startDate), "meta.startDate must be YYYY-MM-DD");
  need(isDate(data.meta.endDate), "meta.endDate must be YYYY-MM-DD");
}
if (need(data.profile && data.profile.goals, "profile.goals is missing")) {
  const goals = data.profile.goals;
  note(`goals: reading ${goals.readingMinutesPerDay}min/day, run ${goals.runKmPerWeek}km/week, budget ${goals.monthlyBudget}/month`);
}

for (const key of ["days", "runs", "expenses", "coffees", "journal", "sleep", "books"]) {
  if (!Array.isArray(data[key])) fail(`${key} must be an array`);
}

if (Array.isArray(data.days) && isDate(data.meta?.startDate) && isDate(data.meta?.endDate)) {
  const start = Date.parse(`${data.meta.startDate}T00:00:00Z`);
  const end = Date.parse(`${data.meta.endDate}T00:00:00Z`);
  const expected = Math.round((end - start) / DAY_MS) + 1;
  if (data.days.length !== expected) {
    fail(`days length ${data.days.length} does not match meta range (${expected})`);
  }
  for (let i = 0; i < data.days.length; i += 1) {
    const expectedDate = new Date(start + i * DAY_MS).toISOString().slice(0, 10);
    if (data.days[i].date !== expectedDate) {
      fail(`days[${i}] is ${data.days[i].date}, expected ${expectedDate}`);
      break;
    }
  }
  note(`days: ${data.days.length} continuous records from ${data.meta.startDate} to ${data.meta.endDate}`);
}

for (const day of data.days ?? []) {
  if (!isDate(day.date)) fail(`days entry has bad date: ${day.date}`);
  if (!inRange(day.readingMinutes, 0, 600)) fail(`${day.date} readingMinutes out of range`);
  if (!inRange(day.runKm, 0, 80)) fail(`${day.date} runKm out of range`);
  if (!inRange(day.sleepHours, 3, 14)) fail(`${day.date} sleepHours out of range`);
  if (!inRange(day.mood, 1, 5)) fail(`${day.date} mood out of range`);
}

for (const run of data.runs ?? []) {
  if (!isDate(run.date)) fail(`run ${run.id} has bad date`);
  if (!inRange(run.km, 0.1, 80)) fail(`run ${run.id} km out of range`);
  if (!inRange(run.pace, 2, 12)) fail(`run ${run.id} pace out of range`);
}

for (const item of data.expenses ?? []) {
  if (!isDate(item.date)) fail(`expense ${item.id} has bad date`);
  if (!inRange(item.amount, 0.1, 100000)) fail(`expense ${item.id} amount out of range`);
  if (!CATEGORIES.includes(item.category)) fail(`expense ${item.id} has unknown category ${item.category}`);
}

for (const item of data.coffees ?? []) {
  if (!isDate(item.date)) fail(`coffee ${item.id} has bad date`);
  if (!inRange(item.cups, 1, 5)) fail(`coffee ${item.id} cups out of range`);
  if (!inRange(item.cost, 0, 500)) fail(`coffee ${item.id} cost out of range`);
}

for (const book of data.books ?? []) {
  if (!inRange(book.pagesRead, 0, book.totalPages)) {
    fail(`book ${book.title} pagesRead ${book.pagesRead} exceeds totalPages ${book.totalPages}`);
  }
  if (!Array.isArray(book.sessions)) fail(`book ${book.title} sessions must be an array`);
}

const journalDates = new Set();
for (const entry of data.journal ?? []) {
  if (!isDate(entry.date)) fail(`journal entry has bad date: ${entry.date}`);
  if (journalDates.has(entry.date)) fail(`journal has duplicate date ${entry.date}`);
  journalDates.add(entry.date);
}

if (!problems.length) {
  const totalSpend = (data.expenses ?? []).reduce((sum, item) => sum + item.amount, 0);
  const totalKm = (data.runs ?? []).reduce((sum, item) => sum + item.km, 0);
  const totalReading = (data.days ?? []).reduce((sum, day) => sum + day.readingMinutes, 0);
  const finished = (data.books ?? []).filter((book) => book.status === "读完").length;
  console.log("data check: OK");
  for (const message of notes) console.log(`  - ${message}`);
  console.log(`  - ${(data.runs ?? []).length} runs, ${Math.round(totalKm)} km`);
  console.log(`  - ${(data.expenses ?? []).length} expenses, CNY ${Math.round(totalSpend)}`);
  console.log(`  - ${Math.round(totalReading / 60)} h reading, ${finished} books finished`);
  process.exit(0);
}

console.error(`data check: ${problems.length} problem(s)`);
for (const message of problems) console.error(`  - ${message}`);
process.exit(1);
