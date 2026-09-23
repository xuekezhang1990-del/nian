/* Data layer: loads the generated dataset, merges locally saved entries, derives metrics. */
window.LD = window.LD || {};

(function () {
  const DAY_MS = 86400000;
  const USER_KEY = "ld.user.v1";
  const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

  const pad = (n) => String(n).padStart(2, "0");
  const dateOf = (ms) => new Date(ms).toISOString().slice(0, 10);
  const msOf = (date) => Date.parse(`${date}T00:00:00Z`);
  const addDays = (date, n) => dateOf(msOf(date) + n * DAY_MS);
  const weekdayOf = (date) => WEEKDAYS[new Date(msOf(date)).getUTCDay()];
  const round = (n, digits = 1) => {
    const f = 10 ** digits;
    return Math.round((Number(n) || 0) * f) / f;
  };
  const todayLocal = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const byDate = (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

  const emptyUser = () => ({ runs: [], expenses: [], coffees: [], reading: [], journal: [] });

  const state = {
    base: null,
    days: [],
    dayIndex: new Map(),
    runs: [],
    expenses: [],
    coffees: [],
    journal: [],
    sleep: [],
    books: [],
    today: null,
    user: emptyUser(),
  };

  function loadUser() {
    try {
      const raw = JSON.parse(localStorage.getItem(USER_KEY) || "null");
      if (!raw || typeof raw !== "object") return emptyUser();
      const merged = emptyUser();
      Object.keys(merged).forEach((key) => {
        if (Array.isArray(raw[key])) merged[key] = raw[key];
      });
      return merged;
    } catch (error) {
      return emptyUser();
    }
  }

  function saveUser() {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(state.user));
    } catch (error) {
      /* storage can be unavailable in private mode; the session still works in memory */
    }
  }

  function blankDay(date) {
    return {
      date,
      readingMinutes: 0,
      pages: 0,
      books: [],
      runKm: 0,
      runMinutes: 0,
      coffeeCups: 0,
      sleepHours: 0,
      mood: 0,
      spend: 0,
    };
  }

  function build() {
    const base = window.LIFE_DATA;
    if (!base) throw new Error("window.LIFE_DATA is missing. Run scripts/generate-data.mjs first.");

    state.base = base;
    state.user = loadUser();

    const dayMap = new Map();
    (base.days || []).forEach((day) => dayMap.set(day.date, Object.assign({}, day, { spend: 0 })));
    const ensureDay = (date) => {
      if (!dayMap.has(date)) dayMap.set(date, blankDay(date));
      return dayMap.get(date);
    };

    state.books = (base.books || []).map((book) =>
      Object.assign({}, book, { sessions: (book.sessions || []).slice() })
    );

    state.runs = (base.runs || []).concat(state.user.runs || []).sort(byDate);
    state.expenses = (base.expenses || []).concat(state.user.expenses || []).sort(byDate);
    state.coffees = (base.coffees || []).concat(state.user.coffees || []).sort(byDate);
    state.journal = (base.journal || []).concat(state.user.journal || []).sort(byDate);
    state.sleep = (base.sleep || []).slice().sort(byDate);

    state.user.runs.forEach((run) => {
      const day = ensureDay(run.date);
      day.runKm = round(day.runKm + run.km, 1);
      day.runMinutes += run.minutes || 0;
    });

    state.user.coffees.forEach((coffee) => {
      const day = ensureDay(coffee.date);
      day.coffeeCups += coffee.cups || 0;
    });

    state.user.reading.forEach((session) => {
      const day = ensureDay(session.date);
      day.readingMinutes += session.minutes || 0;
      day.pages += session.pages || 0;
      const book = state.books.find((item) => item.id === session.bookId);
      if (!book) return;
      book.pagesRead = Math.min(book.totalPages, book.pagesRead + (session.pages || 0));
      book.sessions.push({ date: session.date, minutes: session.minutes || 0, pages: session.pages || 0 });
      if (book.pagesRead >= book.totalPages) {
        book.status = "读完";
        book.finishedOn = book.finishedOn || session.date;
      } else if (book.status !== "读完") {
        book.status = "在读";
      }
    });

    state.expenses.forEach((item) => {
      const day = ensureDay(item.date);
      day.spend = round((day.spend || 0) + (Number(item.amount) || 0), 1);
    });

    state.days = Array.from(dayMap.values()).sort(byDate);
    state.dayIndex = new Map(state.days.map((day) => [day.date, day]));

    const latest = state.days.length ? state.days[state.days.length - 1].date : base.meta.endDate;
    const upper = latest > base.meta.endDate ? latest : base.meta.endDate;
    const now = todayLocal();
    state.today = now < base.meta.startDate ? base.meta.startDate : now > upper ? upper : now;
  }

  const api = {
    init() {
      build();
      return api;
    },
    rebuild() {
      build();
      return api;
    },
    base() {
      return state.base;
    },
    days() {
      return state.days;
    },
    books() {
      return state.books;
    },
    allJournal() {
      return state.journal;
    },
    today() {
      return state.today;
    },
    addDays,
    weekdayOf,
    dayOn(date) {
      return state.dayIndex.get(date) || blankDay(date);
    },
    dateList(count, end = state.today) {
      const out = [];
      for (let i = count - 1; i >= 0; i -= 1) out.push(addDays(end, -i));
      return out;
    },
    lastDays(count, end = state.today) {
      return api.dateList(count, end).map((date) => api.dayOn(date));
    },
    previousDays(count, end = state.today) {
      return api.lastDays(count, addDays(end, -count));
    },
    range(from, to) {
      return state.days.filter((day) => day.date >= from && day.date <= to);
    },
    expensesBetween(from, to) {
      return state.expenses.filter((item) => item.date >= from && item.date <= to);
    },
    runsBetween(from, to) {
      return state.runs.filter((item) => item.date >= from && item.date <= to);
    },
    coffeesBetween(from, to) {
      return state.coffees.filter((item) => item.date >= from && item.date <= to);
    },
    journalBetween(from, to) {
      return state.journal.filter((item) => item.date >= from && item.date <= to);
    },
    sleepBetween(from, to) {
      return state.sleep.filter((item) => item.date >= from && item.date <= to);
    },
    sum(records, key) {
      return records.reduce((total, item) => total + (Number(item[key]) || 0), 0);
    },
    avg(records, key) {
      if (!records.length) return 0;
      return api.sum(records, key) / records.length;
    },
    monthKey(date) {
      return date.slice(0, 7);
    },
    monthDays(monthKey) {
      const from = `${monthKey}-01`;
      const to = api.monthEnd(monthKey);
      return api.range(from, to);
    },
    monthEnd(monthKey) {
      const [year, month] = monthKey.split("-").map(Number);
      return dateOf(Date.UTC(year, month, 0));
    },
    categoryTotals(expenses) {
      const totals = new Map();
      expenses.forEach((item) => {
        totals.set(item.category, round((totals.get(item.category) || 0) + item.amount, 1));
      });
      const total = Array.from(totals.values()).reduce((sum, value) => sum + value, 0) || 1;
      return Array.from(totals.entries())
        .map(([category, amount]) => ({ category, amount, share: amount / total }))
        .sort((a, b) => b.amount - a.amount);
    },
    coffeeTotals(coffees) {
      const totals = new Map();
      coffees.forEach((item) => {
        const entry = totals.get(item.brand) || { brand: item.brand, cups: 0, cost: 0 };
        entry.cups += item.cups;
        entry.cost += item.cost;
        totals.set(item.brand, entry);
      });
      return Array.from(totals.values()).sort((a, b) => b.cups - a.cups);
    },
    streak(key) {
      let count = 0;
      let cursor = state.today;
      for (let i = 0; i < 400; i += 1) {
        const day = state.dayIndex.get(cursor);
        if (!day || !(Number(day[key]) > 0)) break;
        count += 1;
        cursor = addDays(cursor, -1);
      }
      return count;
    },
    weekdayProfile(count, key) {
      const days = api.lastDays(count);
      const buckets = WEEKDAYS.map((label) => ({ label, total: 0, days: 0 }));
      days.forEach((day) => {
        const index = new Date(msOf(day.date)).getUTCDay();
        buckets[index].total += Number(day[key]) || 0;
        buckets[index].days += 1;
      });
      return buckets.map((bucket) => ({
        label: bucket.label.replace("周", ""),
        value: bucket.days ? bucket.total / bucket.days : 0,
      }));
    },
    monthlyProfile(key, months = 12) {
      const out = [];
      const anchor = state.today.slice(0, 7);
      const [year, month] = anchor.split("-").map(Number);
      for (let i = months - 1; i >= 0; i -= 1) {
        const date = new Date(Date.UTC(year, month - 1 - i, 1));
        const key2 = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
        const days = api.monthDays(key2);
        out.push({
          label: `${date.getUTCMonth() + 1}月`,
          value: api.sum(days, key),
          month: key2,
        });
      }
      return out;
    },
    inProgressBook() {
      return state.books.find((book) => book.status === "在读") || state.books.find((book) => !book.finishedOn) || state.books[0];
    },
    yearTotals() {
      return {
        readingMinutes: api.sum(state.days, "readingMinutes"),
        runKm: api.sum(state.days, "runKm"),
        runCount: state.runs.length,
        spend: api.sum(state.days, "spend"),
        coffeeCups: api.sum(state.days, "coffeeCups"),
        coffeeCost: state.coffees.reduce((sum, item) => sum + item.cost, 0),
        journalCount: state.journal.length,
        booksFinished: state.books.filter((book) => book.status === "读完").length,
        days: state.days.length,
      };
    },
    recentRecords(limit = 8) {
      const rows = [];
      state.runs.forEach((run) =>
        rows.push({ type: "run", date: run.date, title: `${run.km} km · ${run.route}`, meta: `${run.minutes} 分 · ${run.pace} 配速`, amount: `+${run.km} km` })
      );
      state.expenses.forEach((item) =>
        rows.push({ type: "spend", date: item.date, title: item.note, meta: item.category, amount: `-${LD.fmt.money(item.amount)}` })
      );
      state.coffees.forEach((item) =>
        rows.push({ type: "coffee", date: item.date, title: `${item.brand} · ${item.drink}`, meta: `${item.cups} 杯`, amount: LD.fmt.money(item.cost) })
      );
      state.journal.forEach((entry) =>
        rows.push({ type: "journal", date: entry.date, title: entry.text, meta: (entry.tags || []).join(" · "), amount: "" })
      );
      return rows.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, limit);
    },
    addRecord(type, payload) {
      const id = `u-${Date.now().toString(36)}`;
      if (type === "run") {
        const km = Math.max(0.1, Number(payload.km) || 0);
        const minutes = Math.max(1, Math.round(Number(payload.minutes) || km * 6));
        state.user.runs.push({
          id,
          date: payload.date,
          km: round(km, 2),
          minutes,
          pace: round(minutes / km, 2),
          route: payload.route || "随手记录",
          effort: payload.effort || "轻松",
          heartRate: 0,
          source: "user",
        });
      } else if (type === "expense") {
        state.user.expenses.push({
          id,
          date: payload.date,
          amount: Math.max(0.1, round(Number(payload.amount) || 0, 2)),
          category: payload.category || "餐饮",
          note: payload.note || "记一笔",
          source: "user",
        });
      } else if (type === "coffee") {
        state.user.coffees.push({
          id,
          date: payload.date,
          cups: Math.max(1, Math.round(Number(payload.cups) || 1)),
          brand: payload.brand || "自冲",
          drink: payload.drink || "拿铁",
          cost: Math.max(0, round(Number(payload.cost) || 0, 1)),
          source: "user",
        });
      } else if (type === "reading") {
        state.user.reading.push({
          id,
          date: payload.date,
          minutes: Math.max(1, Math.round(Number(payload.minutes) || 0)),
          pages: Math.max(0, Math.round(Number(payload.pages) || 0)),
          bookId: payload.bookId || "",
          source: "user",
        });
      } else if (type === "journal") {
        state.user.journal.push({
          id,
          date: payload.date,
          mood: Math.max(1, Math.min(5, Math.round(Number(payload.mood) || 3))),
          tags: String(payload.tags || "")
            .split(/[,，\s]+/)
            .filter(Boolean)
            .slice(0, 4),
          text: payload.text || "",
          source: "user",
        });
      }
      saveUser();
      build();
    },
    resetUser() {
      state.user = emptyUser();
      saveUser();
      build();
    },
    userCount() {
      return Object.values(state.user).reduce((sum, list) => sum + list.length, 0);
    },
    backup() {
      return {
        app: "life-dashboard",
        version: 1,
        exportedAt: new Date().toISOString(),
        today: state.today,
        user: JSON.parse(JSON.stringify(state.user)),
      };
    },
    restore(payload) {
      if (!payload || payload.app !== "life-dashboard" || !payload.user) {
        throw new Error("not a life-dashboard backup");
      }
      const added = { runs: 0, expenses: 0, coffees: 0, reading: 0, journal: 0 };
      Object.keys(added).forEach((key) => {
        const incoming = Array.isArray(payload.user[key]) ? payload.user[key] : [];
        const existing = new Set((state.user[key] || []).map((item) => item.id));
        incoming.forEach((item) => {
          if (!item || !item.id || existing.has(item.id)) return;
          state.user[key].push(item);
          existing.add(item.id);
          added[key] += 1;
        });
      });
      saveUser();
      build();
      return added;
    },
    toCsv() {
      const lines = ["type,date,label,detail,amount,unit"];
      const escape = (value) => `"${String(value).replace(/"/g, '""')}"`;
      state.runs.forEach((run) =>
        lines.push(["run", run.date, run.route, run.effort, run.km, "km"].map(escape).join(","))
      );
      state.expenses.forEach((item) =>
        lines.push(["expense", item.date, item.category, item.note, item.amount, "CNY"].map(escape).join(","))
      );
      state.coffees.forEach((item) =>
        lines.push(["coffee", item.date, item.brand, item.drink, item.cost, "CNY"].map(escape).join(","))
      );
      state.journal.forEach((item) =>
        lines.push(["journal", item.date, (item.tags || []).join(" "), item.text, "", ""].map(escape).join(","))
      );
      return lines.join("\n");
    },
  };

  LD.fmt = {
    int(value) {
      return Math.round(Number(value) || 0).toLocaleString("zh-CN");
    },
    money(value) {
      return `¥${Math.round(Number(value) || 0).toLocaleString("zh-CN")}`;
    },
    money1(value) {
      const n = Math.round((Number(value) || 0) * 10) / 10;
      return `¥${n.toLocaleString("zh-CN", { minimumFractionDigits: Number.isInteger(n) ? 0 : 1, maximumFractionDigits: 1 })}`;
    },
    decimal(value, digits = 1) {
      return (Math.round((Number(value) || 0) * 10 ** digits) / 10 ** digits).toString();
    },
    hours(minutes) {
      const value = Math.round(((Number(minutes) || 0) / 60) * 10) / 10;
      return `${value} 小时`;
    },
    duration(minutes) {
      const total = Math.round(Number(minutes) || 0);
      if (total < 60) return `${total} 分`;
      const hours = Math.floor(total / 60);
      const rest = total % 60;
      return rest ? `${hours} 小时 ${rest} 分` : `${hours} 小时`;
    },
    pct(value) {
      return `${Math.round(Number(value) || 0)}%`;
    },
    delta(value) {
      const n = Math.round(Number(value) || 0);
      return `${n > 0 ? "+" : ""}${n}%`;
    },
    dateShort(date) {
      return `${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日`;
    },
    dateFull(date) {
      return `${date.slice(0, 4)}年${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日`;
    },
    weekday: weekdayOf,
  };

  LD.data = api;
})();
