#!/usr/bin/env node
/**
 * Generates the demo dataset for the life dashboard.
 *
 * Usage: node scripts/generate-data.mjs
 *
 * Outputs:
 *   data/dashboard.json      canonical JSON, used by scripts and Codex
 *   data/dashboard.data.js   window.LIFE_DATA payload so index.html runs from file://
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = join(ROOT, "data");
const OUT_JSON = join(DATA_DIR, "dashboard.json");
const OUT_JS = join(DATA_DIR, "dashboard.data.js");

const DAY_MS = 86400000;
const END_UTC = Date.UTC(2026, 8, 24);
const DAY_COUNT = 366;
const START_UTC = END_UTC - (DAY_COUNT - 1) * DAY_MS;

const isoOf = (ms) => new Date(ms).toISOString().slice(0, 10);
const dowOf = (ms) => new Date(ms).getUTCDay();
const monthOf = (ms) => new Date(ms).getUTCMonth() + 1;

let seed = 20260924;
function rnd() {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const between = (min, max) => min + rnd() * (max - min);
const int = (min, max) => Math.floor(between(min, max + 1));
const pick = (list) => list[int(0, list.length - 1)];
const maybe = (p) => rnd() < p;
const round = (n, digits = 1) => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};

const BOOKS = [
  { title: "置身事内", author: "兰小欢", totalPages: 336 },
  { title: "人类简史", author: "尤瓦尔·赫拉利", totalPages: 440 },
  { title: "纳瓦尔宝典", author: "埃里克·乔根森", totalPages: 288 },
  { title: "被讨厌的勇气", author: "岸见一郎 / 古贺史健", totalPages: 232 },
  { title: "代码整洁之道", author: "Robert C. Martin", totalPages: 388 },
  { title: "枪炮、病菌与钢铁", author: "贾雷德·戴蒙德", totalPages: 480 },
  { title: "蛤蟆先生去看心理医生", author: "罗伯特·戴博德", totalPages: 208 },
  { title: "我们仨", author: "杨绛", totalPages: 176 },
  { title: "费曼物理学讲义", author: "理查德·费曼", totalPages: 560 },
];

const ROUTES = ["滨江步道", "城市公园环线", "河边慢跑", "体育场", "老城区穿巷", "山地缓坡"];
const EFFORTS = ["轻松", "轻松", "节奏跑", "间歇", "长距离"];

const BRANDS = [
  { name: "自冲", drink: "手冲耶加雪菲", cost: [6, 14] },
  { name: "Manner", drink: "燕麦拿铁", cost: [18, 26] },
  { name: "瑞幸", drink: "生椰拿铁", cost: [14, 22] },
  { name: "Seesaw", drink: "美式", cost: [24, 32] },
  { name: "星巴克", drink: "冷萃", cost: [28, 38] },
  { name: "街角小店", drink: "拿铁", cost: [20, 30] },
];

const EXPENSE_TEMPLATES = {
  餐饮: [
    ["早餐", 6, 18],
    ["午餐", 18, 45],
    ["晚餐", 25, 80],
    ["外卖", 25, 60],
    ["朋友聚餐", 80, 260],
  ],
  交通: [
    ["地铁", 4, 12],
    ["打车", 18, 65],
    ["共享单车", 2, 6],
    ["高铁票", 60, 320],
  ],
  购物: [
    ["日用品", 25, 120],
    ["衣物", 120, 520],
    ["数码配件", 60, 400],
  ],
  居家: [
    ["生鲜采购", 30, 160],
    ["水电燃气", 60, 240],
    ["家政服务", 40, 120],
  ],
  娱乐: [
    ["电影票", 35, 90],
    ["演出门票", 120, 480],
    ["游戏", 30, 200],
  ],
  学习: [
    ["买书", 30, 120],
    ["在线课程", 99, 599],
    ["软件订阅", 15, 68],
  ],
  医疗: [
    ["药品", 20, 120],
    ["体检", 200, 900],
  ],
};

const CATEGORY_WEIGHTS = [
  ["餐饮", 0.42],
  ["交通", 0.16],
  ["居家", 0.13],
  ["购物", 0.12],
  ["学习", 0.07],
  ["娱乐", 0.06],
  ["医疗", 0.04],
];

const JOURNAL_LINES = {
  春: [
    "早上出门风是软的，路上多走了一段。",
    "把手头的事情做完一件才开始下一件，效率明显好。",
    "试着不看手机吃完一顿饭，味道居然记住了。",
    "有点困，但把书读了，心情稳下来。",
  ],
  夏: [
    "太热了，跑步挪到傍晚，风一吹值了。",
    "冰咖啡救了我，下午两小时专注没有断。",
    "晚上整理房间，扔掉一堆不再用的东西。",
    "开会有点多，还是留出了半小时读书。",
  ],
  秋: [
    "天气正好，路边的树开始变色。",
    "今天状态不错，任务清单清掉了大半。",
    "傍晚跑完坐在江边发了会儿呆。",
    "把拖了很久的小事做完了，松一口气。",
  ],
  冬: [
    "冷，但还是出门跑了两公里，回来很暖。",
    "晚上煮了热汤，读书时心里很安静。",
    "白天效率一般，晚上补上了复盘。",
    "写了几行字，脑子里的噪音少了一些。",
  ],
};

const MOOD_TAGS = [
  ["专注", "踏实"],
  ["平静"],
  ["有点累", "完成"],
  ["开心", "松弛"],
  ["忙碌", "推进"],
  ["疲惫"],
  ["满足", "感恩"],
];

function seasonOf(month) {
  if (month >= 3 && month <= 5) return "春";
  if (month >= 6 && month <= 8) return "夏";
  if (month >= 9 && month <= 11) return "秋";
  return "冬";
}

function pickCategory() {
  const r = rnd();
  let acc = 0;
  for (const [name, weight] of CATEGORY_WEIGHTS) {
    acc += weight;
    if (r <= acc) return name;
  }
  return CATEGORY_WEIGHTS[0][0];
}

const reading = BOOKS.map((book, index) => ({
  id: `b${index + 1}`,
  title: book.title,
  author: book.author,
  totalPages: book.totalPages,
  pagesRead: 0,
  status: index === 0 ? "在读" : "想读",
  finishedOn: null,
  sessions: [],
}));

const days = [];
const runs = [];
const expenses = [];
const coffees = [];
const journal = [];
const sleepLog = [];

let bookIndex = 0;
let runStreak = 0;
let expenseId = 0;
let coffeeId = 0;
let runId = 0;

for (let i = 0; i < DAY_COUNT; i += 1) {
  const ms = START_UTC + i * DAY_MS;
  const date = isoOf(ms);
  const dow = dowOf(ms);
  const month = monthOf(ms);
  const season = seasonOf(month);
  const isWeekend = dow === 0 || dow === 6;
  const isRunDay = isWeekend ? maybe(0.62) : [2, 4].includes(dow) && maybe(0.55);
  const travel = maybe(0.03);

  const readingBase = isWeekend ? 42 : 26;
  const readingMinutes = travel
    ? int(0, 20)
    : Math.max(0, Math.round(between(readingBase - 22, readingBase + 26)));
  const pagesToday = Math.round(readingMinutes * between(0.5, 0.85));

  let remainingPages = pagesToday;
  const startedBooks = [];
  while (remainingPages > 0 && bookIndex < reading.length) {
    const book = reading[bookIndex];
    const room = book.totalPages - book.pagesRead;
    const chunk = Math.min(room, remainingPages);
    if (chunk > 0) {
      book.pagesRead += chunk;
      book.status = "在读";
      book.sessions.push({
        date,
        minutes: Math.max(1, Math.round((chunk / Math.max(pagesToday, 1)) * readingMinutes)),
        pages: chunk,
      });
      startedBooks.push(book.title);
      remainingPages -= chunk;
    }
    if (book.pagesRead >= book.totalPages) {
      book.finishedOn = date;
      book.status = "读完";
      bookIndex += 1;
    } else {
      break;
    }
  }

  let runKm = 0;
  let runMinutes = 0;
  let runPace = null;
  if (isRunDay && !travel) {
    const long = isWeekend && maybe(0.45);
    runKm = round(long ? between(9, 15) : between(3.5, 8.5), 1);
    const pace = long ? between(5.5, 6.4) : between(4.9, 6.1);
    runMinutes = Math.round(runKm * pace);
    runPace = round(runMinutes / runKm, 2);
    runStreak += 1;
    runs.push({
      id: `r${++runId}`,
      date,
      km: runKm,
      minutes: runMinutes,
      pace: runPace,
      route: pick(ROUTES),
      effort: long ? "长距离" : pick(EFFORTS),
      heartRate: Math.round(between(138, 166)),
    });
  } else {
    runStreak = 0;
  }

  const expenseCount = travel ? int(3, 5) : maybe(0.28) ? int(2, 4) : int(1, 3);
  for (let e = 0; e < expenseCount; e += 1) {
    const category = travel ? pick(["交通", "餐饮", "购物"]) : pickCategory();
    const template = pick(EXPENSE_TEMPLATES[category]);
    const [note, min, max] = template;
    expenses.push({
      id: `e${++expenseId}`,
      date,
      amount: round(between(min, max), 1),
      category,
      note: travel && category === "交通" ? "出行" : note,
    });
  }

  const cups = travel
    ? maybe(0.5)
      ? 1
      : 0
    : isWeekend
      ? maybe(0.55)
        ? 1
        : 0
      : maybe(0.35)
        ? 2
        : 1;
  if (cups > 0) {
    const brand = pick(BRANDS);
    coffees.push({
      id: `c${++coffeeId}`,
      date,
      cups,
      brand: brand.name,
      drink: brand.drink,
      cost: round(between(brand.cost[0], brand.cost[1]) * cups, 1),
    });
  }

  const sleepHours = round(between(5.9, 8.6), 1);
  sleepLog.push({
    date,
    hours: sleepHours,
    score: Math.max(48, Math.min(96, Math.round(sleepHours * 11 + between(-6, 8)))),
  });

  const mood = Math.max(1, Math.min(5, Math.round(between(2.6, 4.9) + (readingMinutes > 30 ? 0.3 : 0))));
  if (!travel && maybe(0.42)) {
    journal.push({
      date,
      mood,
      tags: pick(MOOD_TAGS),
      text: pick(JOURNAL_LINES[season]),
    });
  }

  days.push({
    date,
    readingMinutes,
    pages: pagesToday,
    books: startedBooks,
    runKm,
    runMinutes,
    coffeeCups: cups,
    sleepHours,
    mood,
  });
}

const data = {
  meta: {
    generatedAt: new Date().toISOString(),
    startDate: isoOf(START_UTC),
    endDate: isoOf(END_UTC),
    days: DAY_COUNT,
    locale: "zh-CN",
    currency: "CNY",
    owner: "我",
    note: "示例数据由 scripts/generate-data.mjs 生成，可以整份替换成你自己的记录。",
  },
  profile: {
    name: "旅行者",
    goals: {
      readingMinutesPerDay: 40,
      runKmPerWeek: 25,
      monthlyBudget: 5200,
      coffeeCupsPerWeek: 7,
      sleepHoursPerNight: 7.5,
    },
  },
  books: reading,
  runs,
  expenses,
  coffees,
  journal,
  sleep: sleepLog,
  days,
};

mkdirSync(DATA_DIR, { recursive: true });
writeFileSync(OUT_JSON, `${JSON.stringify(data, null, 2)}\n`, "utf8");
writeFileSync(OUT_JS, `window.LIFE_DATA = ${JSON.stringify(data)};\n`, "utf8");

const totalSpend = expenses.reduce((sum, item) => sum + item.amount, 0);
const totalKm = runs.reduce((sum, item) => sum + item.km, 0);
const finished = reading.filter((book) => book.status === "读完").length;

console.log(`dashboard.json  ${data.meta.startDate} -> ${data.meta.endDate}`);
console.log(`days            ${days.length}`);
console.log(`runs            ${runs.length} 次 / ${round(totalKm, 1)} km`);
console.log(`expenses        ${expenses.length} 笔 / CNY ${Math.round(totalSpend)}`);
console.log(`coffees         ${coffees.length} 次`);
console.log(`journal         ${journal.length} 条`);
console.log(`books           ${finished} 本读完 / ${reading.length} 本录入`);
