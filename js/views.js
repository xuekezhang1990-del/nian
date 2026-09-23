/* View layer: every screen returns { title, subtitle, html }. */
window.LD = window.LD || {};

(function () {
  const e = LD.charts.esc;
  const fmt = LD.fmt;
  const charts = LD.charts;

  const LADDER = [
    {
      id: "data",
      title: "让仪表盘说你的语言",
      goal: "把目标值改成你的真实生活：每天读多久、每周跑多少、每月能花多少。",
      learn: "仓库约定 / AGENTS.md",
      prompt:
        "打开 data/dashboard.json，把 profile.goals 改成我的真实目标：每天阅读 30 分钟、每周跑步 20 公里、每月预算 6000 元、每周咖啡不超过 8 杯。改完运行 node scripts/validate-data.mjs，并告诉我哪些指标会因此变化。",
    },
    {
      id: "skill",
      title: "把随手记变成固定流程",
      goal: "让 Codex 按 skills/life-dashboard/SKILL.md 的步骤，帮你录入一条真实记录。",
      learn: "Skill 与可复用流程",
      prompt:
        "读 skills/life-dashboard/SKILL.md，然后按里面的流程帮我录入今天的记录：跑步 5 公里 32 分钟，午餐花费 38 元，咖啡 1 杯手冲。录完运行 node scripts/validate-data.mjs 并汇报结果。",
    },
    {
      id: "test",
      title: "给数据加一条底线",
      goal: "给校验脚本增加一条新规则，先让它失败，再让它通过。",
      learn: "测试与验收",
      prompt:
        "给 scripts/validate-data.mjs 增加一条规则：任何一次咖啡消费的 cost 不能超过 80 元。先故意在 data/dashboard.json 里造一条超标数据让我看到校验失败，再删掉它并确认校验通过。",
    },
    {
      id: "subagent",
      title: "开两个子代理写周报",
      goal: "一个子代理负责算数据，另一个负责写文字，最后合并成一份周报。",
      learn: "子代理分工与结果合并",
      prompt:
        "用两个子代理并行处理：一个读 data/dashboard.json 统计我上周的阅读、跑步、支出和咖啡数据；另一个根据统计结果写一份不超过 300 字的中文周报。最后把两者的结果合并，附上关键数字。",
    },
    {
      id: "automation",
      title: "每天自动播报",
      goal: "建一个每天 21:30 的自动化，读取当天记录并写一句总结。",
      learn: "自动化与通知策略",
      prompt:
        "创建一个每天 21:30 运行的自动化：读取 data/dashboard.json 里今天的记录，生成一句不超过 60 字的今日总结，追加到我的复盘里。只有生成失败或数据缺失时才通知我。",
    },
    {
      id: "mcp",
      title: "接一个真实数据源",
      goal: "把手工录入的某一类数据换成真实来源，比如日历、账单导出或运动 App 记录。",
      learn: "MCP / 连接器与私有数据边界",
      prompt:
        "我有一份支付宝账单导出的 CSV。先告诉我应该放在哪个目录、需要哪些字段，再帮我写一个导入脚本合并进 data/dashboard.json，名字冲突时不要覆盖原始数据，并保证 node scripts/validate-data.mjs 仍然通过。",
    },
    {
      id: "hook",
      title: "守住数据底线",
      goal: "配一个 hook，只要 data/ 目录被改动就自动跑校验。",
      learn: "Hook 与机械约束",
      prompt:
        "在 .codex/config.toml 里配一个 hook：只要 data/ 目录下的文件被修改，就自动运行 node scripts/validate-data.mjs。配好之后故意改坏一条数据，验证 hook 能拦住我。",
    },
    {
      id: "pwa",
      title: "装进手机主屏",
      goal: "把仪表盘部署到 HTTPS，用 Safari 添加到主屏，断开网络也能打开。",
      learn: "Manifest、Service Worker 与部署",
      prompt:
        "把这个项目部署到一个 HTTPS 地址（GitHub Pages 或 Vercel），部署完告诉我用 iPhone Safari 添加到主屏的步骤。然后教我验证离线可用：手机先联网打开一次，再开飞行模式打开，确认还能看到页面。如果我改了代码但手机上还是旧版，告诉我该怎么升 sw.js 里的缓存版本号。",
    },
  ];

  function viewHead(kicker, title, lede) {
    return `<header class="view-head reveal" style="--i:0">
      <p class="kicker">${e(kicker)}</p>
      <h2 class="display">${e(title)}</h2>
      <p class="lede">${lede}</p>
    </header>`;
  }

  function panel(config) {
    const note = config.note ? `<span class="panel-note">${e(config.note)}</span>` : "";
    const foot = config.foot ? `<div class="panel-foot">${config.foot}</div>` : "";
    return `<section class="panel reveal" style="--i:${config.i || 0}">
      <header class="panel-head">
        <h3 class="panel-title">${e(config.title)}</h3>
        ${note}
      </header>
      <div class="panel-body${config.tight ? " tight" : ""}">${config.body}</div>
      ${foot}
    </section>`;
  }

  function kpi(config) {
    const delta =
      config.delta === null || config.delta === undefined
        ? ""
        : `<span class="delta ${config.deltaGood ? "is-good" : "is-bad"}">${e(config.delta)}</span>`;
    return `<article class="kpi reveal" style="--accent:${config.color};--i:${config.i || 0}">
      <div class="kpi-top">
        <span class="kpi-label">${e(config.label)}</span>
        <span class="kpi-icon">${LD.icon(config.icon)}</span>
      </div>
      <div class="kpi-value">${config.value}${config.unit ? `<span class="kpi-unit">${e(config.unit)}</span>` : ""}</div>
      <div class="kpi-foot">${delta}<span>${e(config.note || "")}</span></div>
      <div class="kpi-spark">${config.spark || ""}</div>
    </article>`;
  }

  function progressBar(ratio, color) {
    const pct = Math.max(0, Math.min(100, ratio * 100));
    return `<div class="progress"><div class="progress-fill" style="width:${pct.toFixed(1)}%;background:${color || "var(--accent)"}"></div></div>`;
  }

  function deltaOf(current, previous) {
    if (!previous) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  function seriesFor(key, count) {
    return LD.data.lastDays(count).map((day) => ({
      date: day.date,
      label: fmt.dateShort(day.date),
      value: Number(day[key]) || 0,
    }));
  }

  function weekBuckets(key, count) {
    const today = LD.data.today();
    const dow = (new Date(Date.parse(`${today}T00:00:00Z`)).getUTCDay() + 6) % 7;
    const thisMonday = LD.data.addDays(today, -dow);
    const out = [];
    for (let i = count - 1; i >= 0; i -= 1) {
      const start = LD.data.addDays(thisMonday, -7 * i);
      const end = LD.data.addDays(start, 6);
      const days = LD.data.range(start, end);
      out.push({
        label: fmt.dateShort(start),
        value: LD.data.sum(days, key),
        start,
        end,
      });
    }
    return out;
  }

  function recordRow(row) {
    const dotClass =
      row.type === "run" ? "dot-run" : row.type === "spend" ? "dot-spend" : row.type === "coffee" ? "dot-coffee" : "dot-read";
    const amount = row.amount
      ? `<span class="row-amount ${row.type === "spend" ? "is-negative" : ""}">${e(row.amount)}</span>`
      : "";
    return `<div class="row">
      <span class="dot ${dotClass}"></span>
      <div class="row-main">
        <div class="row-title">${e(row.title)}</div>
        <div class="row-meta">${e(fmt.dateShort(row.date))} · ${e(row.meta || "")}</div>
      </div>
      ${amount}
    </div>`;
  }

  function recentRows(limit) {
    const rows = LD.data.recentRecords(limit);
    if (!rows.length) return `<p class="empty">还没有记录</p>`;
    return `<div class="list">${rows.map(recordRow).join("")}</div>`;
  }

  function overview(ctx) {
    const data = LD.data;
    const today = data.today();
    const base = data.base();
    const week = data.lastDays(7);
    const prevWeek = data.previousDays(7);
    const goals = base.profile.goals;

    const readingWeek = data.sum(week, "readingMinutes");
    const readingPrev = data.sum(prevWeek, "readingMinutes");
    const runWeek = data.sum(week, "runKm");
    const runPrev = data.sum(prevWeek, "runKm");
    const spendWeek = data.sum(week, "spend");
    const spendPrev = data.sum(prevWeek, "spend");
    const coffeeWeek = data.sum(week, "coffeeCups");
    const coffeePrev = data.sum(prevWeek, "coffeeCups");

    const totals = data.yearTotals();
    const activeDays = data.base().days.filter((day) => day.readingMinutes + day.runMinutes + day.coffeeCups > 0).length;

    const heat = base.days.map((day) => ({
      date: day.date,
      value: day.readingMinutes + day.runMinutes + day.coffeeCups * 20,
      label: `${day.readingMinutes} 分钟阅读 · ${day.runKm ? `${day.runKm} km 跑步` : "没跑步"} · ${day.coffeeCups} 杯咖啡`,
    }));

    const monthKey = data.monthKey(today);
    const monthExpenses = data.expensesBetween(`${monthKey}-01`, today);
    const categoryTotals = data.categoryTotals(monthExpenses);
    const monthSpend = data.sum(data.monthDays(monthKey), "spend");

    const book = data.inProgressBook();
    const bookProgress = book ? book.pagesRead / book.totalPages : 0;
    const recentJournal = data.allJournal().slice(-3).reverse();

    const html = [
      viewHead(
        `${fmt.dateFull(today)} · ${fmt.weekday(today)}`,
        "今天的账本",
        `近 7 天读了 <b>${fmt.decimal(readingWeek / 60, 1)} 小时</b>，跑了 <b>${fmt.decimal(runWeek, 1)} 公里</b>，花了 <b>${fmt.money(spendWeek)}</b>，咖啡 <b>${coffeeWeek} 杯</b>。目标：每天 ${goals.readingMinutesPerDay} 分钟，每周 ${goals.runKmPerWeek} 公里。`
      ),
      `<div class="kpis">
        ${kpi({
          label: "阅读",
          icon: "book",
          color: "var(--read)",
          value: fmt.decimal(readingWeek / 60, 1),
          unit: "小时 / 7天",
          delta: fmt.delta(deltaOf(readingWeek, readingPrev)),
          deltaGood: readingWeek >= readingPrev,
          note: `日均 ${Math.round(readingWeek / 7)} 分钟`,
          spark: charts.sparkline(data.lastDays(14).map((day) => day.readingMinutes), { color: "var(--read)" }),
          i: 1,
        })}
        ${kpi({
          label: "运动",
          icon: "activity",
          color: "var(--run)",
          value: fmt.decimal(runWeek, 1),
          unit: "km / 7天",
          delta: fmt.delta(deltaOf(runWeek, runPrev)),
          deltaGood: runWeek >= runPrev,
          note: `目标 ${goals.runKmPerWeek} km`,
          spark: charts.sparkline(data.lastDays(14).map((day) => day.runKm), { color: "var(--run)" }),
          i: 2,
        })}
        ${kpi({
          label: "花费",
          icon: "wallet",
          color: "var(--spend)",
          value: fmt.money(spendWeek).replace("¥", ""),
          unit: "CNY / 7天",
          delta: fmt.delta(deltaOf(spendWeek, spendPrev)),
          deltaGood: spendWeek <= spendPrev,
          note: `本月 ${fmt.money(monthSpend)}`,
          spark: charts.sparkline(data.lastDays(14).map((day) => day.spend), { color: "var(--spend)" }),
          i: 3,
        })}
        ${kpi({
          label: "咖啡",
          icon: "coffee",
          color: "var(--coffee)",
          value: coffeeWeek,
          unit: "杯 / 7天",
          delta: fmt.delta(deltaOf(coffeeWeek, coffeePrev)),
          deltaGood: coffeeWeek <= coffeePrev,
          note: `年度 ${totals.coffeeCups} 杯`,
          spark: charts.sparkline(data.lastDays(14).map((day) => day.coffeeCups), { color: "var(--coffee)" }),
          i: 4,
        })}
      </div>`,
      `<div class="grid split-wide">
        ${panel({
          title: "这一年",
          note: `${base.meta.startDate} 起 · ${data.days().length} 天`,
          i: 5,
          body: `<div class="heatmap-wrap">${charts.heatmap(heat, { title: "全年记录热力图" })}</div>
            <div class="hm-legend"><span>少</span>
              <span class="hm-swatch hm-l0"></span><span class="hm-swatch hm-l1"></span><span class="hm-swatch hm-l2"></span><span class="hm-swatch hm-l3"></span><span class="hm-swatch hm-l4"></span>
              <span>多</span>
              <span style="margin-left:auto">${activeDays} 天有记录</span>
            </div>`,
        })}
        ${panel({
          title: "今日复盘",
          note: `${fmt.dateShort(today)}`,
          i: 6,
          body: `<div class="quick-add">
              <input class="input" id="quickJournal" placeholder="今天最值得记的一件事…" aria-label="今日复盘" />
              <button class="btn btn-primary" data-action="quick-journal" type="button">记下</button>
            </div>
            <div class="journal-list">
              ${
                recentJournal.length
                  ? recentJournal
                      .map(
                        (entry) => `<div class="journal-item">
                          <div class="journal-date">${e(fmt.dateShort(entry.date))} ${"●".repeat(entry.mood || 3)}</div>
                          <p class="journal-text">${e(entry.text)}</p>
                          <div class="tag-row">${(entry.tags || []).map((tag) => `<span class="tag">${e(tag)}</span>`).join("")}</div>
                        </div>`
                      )
                      .join("")
                  : `<p class="empty">还没有复盘</p>`
              }
            </div>`,
        })}
      </div>`,
      `<div class="grid split-wide">
        ${panel({
          title: "近 30 天支出",
          note: `合计 ${fmt.money(data.sum(data.lastDays(30), "spend"))}`,
          i: 7,
          body: charts.area(seriesFor("spend", 30), {
            color: "var(--spend)",
            format: (value) => fmt.money(value).replace("¥", ""),
            title: "近 30 天支出趋势",
          }),
        })}
        ${panel({
          title: "本月分类",
          note: monthKey,
          i: 8,
          body: `<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
              ${charts.donut(
                categoryTotals.map((item, index) => ({
                  label: item.category,
                  value: item.amount,
                  color: charts.color(index),
                })),
                { centerValue: fmt.money(monthSpend).replace("¥", ""), centerLabel: "本月支出", format: (value) => fmt.money(value) }
              )}
              <div class="list" style="flex:1;min-width:150px">
                ${
                  categoryTotals.length
                    ? categoryTotals
                        .slice(0, 5)
                        .map(
                          (item, index) => `<div class="row">
                            <span class="dot" style="background:${charts.color(index)}"></span>
                            <div class="row-main">
                              <div class="row-title">${e(item.category)}</div>
                              <div class="row-meta">${fmt.pct(item.share * 100)}</div>
                            </div>
                            <span class="row-amount">${fmt.money(item.amount)}</span>
                          </div>`
                        )
                        .join("")
                    : `<p class="empty">本月还没有支出</p>`
                }
              </div>
            </div>`,
        })}
      </div>`,
      `<div class="grid cols-3">
        ${panel({
          title: "本周运动",
          note: `${fmt.decimal(runWeek, 1)} km`,
          i: 9,
          body: charts.bars(
            data.lastDays(7).map((day) => ({ label: fmt.weekday(day.date).replace("周", ""), value: day.runKm })),
            { color: "var(--run)", goal: goals.runKmPerWeek / 7, format: (value) => fmt.decimal(value, 1) }
          ),
        })}
        ${panel({
          title: "正在读",
          note: book ? `${fmt.pct(bookProgress * 100)}` : "",
          i: 10,
          body: book
            ? `<div class="book">
                <div class="book-head">
                  <span class="book-title">${e(book.title)}</span>
                  <span class="book-meta">${book.pagesRead} / ${book.totalPages} 页</span>
                </div>
                <div class="book-meta">${e(book.author)}</div>
                ${progressBar(bookProgress, "var(--read)")}
              </div>
              <div class="book">
                <div class="book-head">
                  <span class="book-meta">年度已读完 ${totals.booksFinished} 本</span>
                  <span class="book-meta">累计 ${Math.round(totals.readingMinutes / 60)} 小时</span>
                </div>
                ${progressBar(Math.min(1, totals.booksFinished / 12), "var(--read)")}
                <div class="book-meta">年度目标 12 本</div>
              </div>`
            : `<p class="empty">书架是空的</p>`,
        })}
        ${panel({
          title: "最近记录",
          note: "全部来源",
          i: 11,
          body: recentRows(6),
        })}
      </div>`,
    ].join("");

    return { title: "今日", subtitle: `${fmt.dateFull(today)} ${fmt.weekday(today)}`, html };
  }

  function reading(ctx) {
    const data = LD.data;
    const today = data.today();
    const monthKey = data.monthKey(today);
    const monthDays = data.monthDays(monthKey);
    const last30 = data.lastDays(30);
    const books = data.books();
    const finished = books.filter((book) => book.status === "读完").length;
    const streak = data.streak("readingMinutes");
    const sessions = books
      .flatMap((book) => book.sessions.map((session) => Object.assign({ book: book.title }, session)))
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 10);

    const html = [
      viewHead("阅读", "书是慢慢读完的", `今年累计 <b>${Math.round(data.yearTotals().readingMinutes / 60)} 小时</b>，读完 <b>${finished} 本</b>，当前连续阅读 <b>${streak} 天</b>。`),
      `<div class="kpis">
        ${kpi({
          label: "本月阅读",
          icon: "book",
          color: "var(--read)",
          value: fmt.decimal(data.sum(monthDays, "readingMinutes") / 60, 1),
          unit: "小时",
          delta: null,
          note: `${monthKey}`,
          spark: charts.sparkline(monthDays.map((day) => day.readingMinutes), { color: "var(--read)" }),
          i: 1,
        })}
        ${kpi({
          label: "日均",
          icon: "trending",
          color: "var(--read)",
          value: Math.round(data.sum(last30, "readingMinutes") / 30),
          unit: "分钟 / 30天",
          delta: null,
          note: `目标 ${data.base().profile.goals.readingMinutesPerDay} 分钟`,
          spark: charts.sparkline(last30.map((day) => day.readingMinutes), { color: "var(--read)" }),
          i: 2,
        })}
        ${kpi({
          label: "读完",
          icon: "check",
          color: "var(--read)",
          value: finished,
          unit: "本",
          delta: null,
          note: `书架共 ${books.length} 本`,
          spark: charts.sparkline(
            data.monthlyProfile("readingMinutes", 12).map((item) => item.value),
            { color: "var(--read)" }
          ),
          i: 3,
        })}
        ${kpi({
          label: "连续阅读",
          icon: "flame",
          color: "var(--read)",
          value: streak,
          unit: "天",
          delta: null,
          note: `累计 ${data.yearTotals().readingMinutes} 分钟`,
          spark: charts.sparkline(data.lastDays(21).map((day) => day.readingMinutes), { color: "var(--read)" }),
          i: 4,
        })}
      </div>`,
      `<div class="grid split-wide">
        ${panel({
          title: "近 12 个月阅读时长",
          note: "小时",
          i: 5,
          body: charts.bars(
            data.monthlyProfile("readingMinutes", 12).map((item) => ({ label: item.label, value: item.value / 60 })),
            {
              color: "var(--read)",
              format: (value) => fmt.decimal(value, 0),
              title: "近 12 个月阅读时长",
            }
          ),
        })}
        ${panel({
          title: "近 30 天",
          note: `日均 ${Math.round(data.sum(last30, "readingMinutes") / 30)} 分钟`,
          i: 6,
          body: charts.area(seriesFor("readingMinutes", 30), {
            color: "var(--read)",
            format: (value) => fmt.decimal(value, 0),
            unit: " 分",
            title: "近 30 天阅读分钟",
          }),
        })}
      </div>`,
      `<div class="grid split-even">
        ${panel({
          title: "书架",
          note: `${finished} / ${books.length} 本读完`,
          i: 7,
          body: books
            .map((book) => {
              const ratio = book.pagesRead / book.totalPages;
              const statusTag = book.status === "读完" ? `<span class="tag">读完 ${e(book.finishedOn || "")}</span>` : `<span class="tag">${e(book.status)}</span>`;
              return `<div class="book">
                <div class="book-head">
                  <span class="book-title">${e(book.title)}</span>
                  <span class="book-meta">${book.pagesRead} / ${book.totalPages} 页</span>
                </div>
                <div class="book-head">
                  <span class="book-meta">${e(book.author)}</span>
                  ${statusTag}
                </div>
                ${progressBar(ratio, "var(--read)")}
              </div>`;
            })
            .join(""),
        })}
        ${panel({
          title: "最近阅读记录",
          note: "按时间倒序",
          i: 8,
          body: sessions.length
            ? `<div class="list">${sessions
                .map(
                  (session) => `<div class="row">
                    <span class="dot dot-read"></span>
                    <div class="row-main">
                      <div class="row-title">${e(session.book)}</div>
                      <div class="row-meta">${e(fmt.dateShort(session.date))} · ${session.pages} 页 · ${session.minutes} 分钟</div>
                    </div>
                    <span class="row-amount">${Math.round(session.minutes)} 分</span>
                  </div>`
                )
                .join("")}</div>`
            : `<p class="empty">还没有阅读记录</p>`,
        })}
      </div>`,
    ].join("");

    return { title: "阅读", subtitle: "书籍、时长与进度", html };
  }

  function running(ctx) {
    const data = LD.data;
    const today = data.today();
    const week = weekBuckets("runKm", 12);
    const last30 = data.lastDays(30);
    const runs30 = data.runsBetween(data.addDays(today, -29), today);
    const paceRuns = data
      .runsBetween(data.addDays(today, -59), today)
      .map((run) => ({ date: run.date, label: fmt.dateShort(run.date), value: run.pace }));
    const totals = data.yearTotals();
    const avgPace = runs30.length ? data.sum(runs30, "minutes") / data.sum(runs30, "km") : 0;
    const effortTotals = new Map();
    runs30.forEach((run) => effortTotals.set(run.effort, (effortTotals.get(run.effort) || 0) + run.km));
    const recent = data.runsBetween(data.addDays(today, -45), today).slice(-10).reverse();

    const html = [
      viewHead("运动", "把公里数留给风景", `今年跑了 <b>${fmt.decimal(totals.runKm, 1)} 公里</b>，共 <b>${totals.runCount} 次</b>，近 30 天平均配速 <b>${fmt.decimal(avgPace, 2)}</b>。`),
      `<div class="kpis">
        ${kpi({
          label: "近 7 天",
          icon: "activity",
          color: "var(--run)",
          value: fmt.decimal(data.sum(data.lastDays(7), "runKm"), 1),
          unit: "km",
          delta: fmt.delta(deltaOf(data.sum(data.lastDays(7), "runKm"), data.sum(data.previousDays(7), "runKm"))),
          deltaGood: data.sum(data.lastDays(7), "runKm") >= data.sum(data.previousDays(7), "runKm"),
          note: `目标 ${data.base().profile.goals.runKmPerWeek} km`,
          spark: charts.sparkline(data.lastDays(14).map((day) => day.runKm), { color: "var(--run)" }),
          i: 1,
        })}
        ${kpi({
          label: "本月",
          icon: "calendar",
          color: "var(--run)",
          value: fmt.decimal(data.sum(data.monthDays(data.monthKey(today)), "runKm"), 1),
          unit: "km",
          delta: null,
          note: `${runs30.length} 次 / 30天`,
          spark: charts.sparkline(last30.map((day) => day.runKm), { color: "var(--run)" }),
          i: 2,
        })}
        ${kpi({
          label: "平均配速",
          icon: "trending",
          color: "var(--run)",
          value: fmt.decimal(avgPace, 2),
          unit: "分 / km",
          delta: null,
          note: `最长 ${fmt.decimal(Math.max(...data.runsBetween(data.addDays(today, -89), today).map((run) => run.km), 0), 1)} km`,
          spark: charts.sparkline(paceRuns.map((run) => run.value), { color: "var(--run)" }),
          i: 3,
        })}
        ${kpi({
          label: "累计",
          icon: "flame",
          color: "var(--run)",
          value: fmt.decimal(totals.runKm, 0),
          unit: "km / 一年",
          delta: null,
          note: `${Math.round(totals.runKm / 1000 * 10) / 10} 个马拉松`,
          spark: charts.sparkline(data.monthlyProfile("runKm", 12).map((item) => item.value), { color: "var(--run)" }),
          i: 4,
        })}
      </div>`,
      `<div class="grid split-wide">
        ${panel({
          title: "近 12 周里程",
          note: "km / 周",
          i: 5,
          body: charts.bars(week, {
            color: "var(--run)",
            goal: data.base().profile.goals.runKmPerWeek,
            format: (value) => fmt.decimal(value, 0),
            unit: " km",
            title: "近 12 周跑步里程",
          }),
        })}
        ${panel({
          title: "配速趋势",
          note: "近 60 天 · 越低越快",
          i: 6,
          body: charts.area(paceRuns, {
            color: "var(--run)",
            format: (value) => fmt.decimal(value, 1),
            unit: " 分/km",
            title: "配速趋势",
            fill: true,
          }),
        })}
      </div>`,
      `<div class="grid split-even">
        ${panel({
          title: "训练构成",
          note: "近 30 天里程",
          i: 7,
          body: charts.bars(
            Array.from(effortTotals.entries()).map(([label, value]) => ({ label, value })),
            { color: "var(--run)", format: (value) => fmt.decimal(value, 0), unit: " km", title: "训练类型分布" }
          ),
          foot: `<span>轻松跑占比 ${fmt.pct(((effortTotals.get("轻松") || 0) / Math.max(1, data.sum(runs30, "km"))) * 100)}</span><span>共 ${runs30.length} 次</span>`,
        })}
        ${panel({
          title: "最近跑步",
          note: `${recent.length} 条`,
          i: 8,
          body: recent.length
            ? `<div class="list">${recent
                .map(
                  (run) => `<div class="row">
                    <span class="dot dot-run"></span>
                    <div class="row-main">
                      <div class="row-title">${e(run.route)}</div>
                      <div class="row-meta">${e(fmt.dateShort(run.date))} · ${run.minutes} 分钟 · ${run.pace} 配速 · ${e(run.effort)}</div>
                    </div>
                    <span class="row-amount">${fmt.decimal(run.km, 2)} km</span>
                  </div>`
                )
                .join("")}</div>`
            : `<p class="empty">还没有跑步记录</p>`,
        })}
      </div>`,
    ].join("");

    return { title: "运动", subtitle: "里程、配速与训练节奏", html };
  }

  function spending(ctx) {
    const data = LD.data;
    const today = data.today();
    const monthKey = data.monthKey(today);
    const monthExpenses = data.expensesBetween(`${monthKey}-01`, today);
    const monthSpend = data.sum(data.monthDays(monthKey), "spend");
    const budget = data.base().profile.goals.monthlyBudget;
    const last30 = data.lastDays(30);
    const largest = monthExpenses.slice().sort((a, b) => b.amount - a.amount)[0];
    const categoryTotals = data.categoryTotals(monthExpenses);
    const months = data.monthlyProfile("spend", 12);
    const recent = monthExpenses.slice(-10).reverse();

    const html = [
      viewHead("花费", "钱去哪儿了", `本月花了 <b>${fmt.money(monthSpend)}</b>，预算 <b>${fmt.money(budget)}</b>，已用 <b>${fmt.pct((monthSpend / budget) * 100)}</b>。`),
      `<div class="kpis">
        ${kpi({
          label: "本月支出",
          icon: "wallet",
          color: "var(--spend)",
          value: fmt.money(monthSpend).replace("¥", ""),
          unit: "CNY",
          delta: fmt.delta(deltaOf(monthSpend, data.sum(data.previousDays(30), "spend"))),
          deltaGood: monthSpend <= data.sum(data.previousDays(30), "spend"),
          note: `预算 ${fmt.money(budget)}`,
          spark: charts.sparkline(last30.map((day) => day.spend), { color: "var(--spend)" }),
          i: 1,
        })}
        ${kpi({
          label: "日均",
          icon: "trending",
          color: "var(--spend)",
          value: fmt.money(data.sum(last30, "spend") / 30).replace("¥", ""),
          unit: "CNY / 30天",
          delta: null,
          note: `本月 ${monthExpenses.length} 笔`,
          spark: charts.sparkline(last30.map((day) => day.spend), { color: "var(--spend)" }),
          i: 2,
        })}
        ${kpi({
          label: "最大单笔",
          icon: "flame",
          color: "var(--spend)",
          value: largest ? fmt.money(largest.amount).replace("¥", "") : "0",
          unit: "CNY",
          delta: null,
          note: largest ? `${largest.category} · ${largest.note}` : "本月还没有支出",
          spark: charts.sparkline(months.map((item) => item.value), { color: "var(--spend)" }),
          i: 3,
        })}
        ${kpi({
          label: "预算余额",
          icon: "check",
          color: "var(--spend)",
          value: fmt.money(Math.max(0, budget - monthSpend)).replace("¥", ""),
          unit: "CNY",
          delta: null,
          note: monthSpend > budget ? "已经超支" : `已用 ${fmt.pct((monthSpend / budget) * 100)}`,
          spark: charts.sparkline(data.monthlyProfile("spend", 12).map((item) => item.value), { color: "var(--spend)" }),
          i: 4,
        })}
      </div>`,
      `<div class="grid split-wide">
        ${panel({
          title: "近 12 个月支出",
          note: `月预算 ${fmt.money(budget)}`,
          i: 5,
          body: charts.bars(months, {
            color: "var(--spend)",
            goal: budget,
            format: (value) => fmt.decimal(value / 1000, 1),
            unit: "k",
            title: "近 12 个月支出",
          }),
        })}
        ${panel({
          title: "本月分类",
          note: `${monthExpenses.length} 笔`,
          i: 6,
          body: `<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
              ${charts.donut(
                categoryTotals.map((item, index) => ({ label: item.category, value: item.amount, color: charts.color(index) })),
                { centerValue: fmt.pct((monthSpend / budget) * 100), centerLabel: "预算使用", format: (value) => fmt.money(value) }
              )}
              <div class="list" style="flex:1;min-width:150px">
                ${categoryTotals
                  .map(
                    (item, index) => `<div class="row">
                      <span class="dot" style="background:${charts.color(index)}"></span>
                      <div class="row-main">
                        <div class="row-title">${e(item.category)}</div>
                        <div class="row-meta">${fmt.pct(item.share * 100)}</div>
                      </div>
                      <span class="row-amount is-negative">${fmt.money(item.amount)}</span>
                    </div>`
                  )
                  .join("")}
              </div>
            </div>`,
        })}
      </div>`,
      `<div class="grid split-wide">
        ${panel({
          title: "近 30 天日支出",
          note: `合计 ${fmt.money(data.sum(last30, "spend"))}`,
          i: 7,
          body: charts.area(seriesFor("spend", 30), {
            color: "var(--spend)",
            format: (value) => fmt.decimal(value, 0),
            title: "近 30 天日支出",
          }),
        })}
        ${panel({
          title: "本月账单",
          note: "最近 10 笔",
          i: 8,
          body: recent.length
            ? `<div class="list">${recent
                .map(
                  (item) => `<div class="row">
                    <span class="dot dot-spend"></span>
                    <div class="row-main">
                      <div class="row-title">${e(item.note)}</div>
                      <div class="row-meta">${e(fmt.dateShort(item.date))} · ${e(item.category)}${item.source === "user" ? " · 手记" : ""}</div>
                    </div>
                    <span class="row-amount is-negative">-${fmt.money(item.amount)}</span>
                  </div>`
                )
                .join("")}</div>`
            : `<p class="empty">本月还没有账单</p>`,
        })}
      </div>`,
    ].join("");

    return { title: "花费", subtitle: "预算、分类与账单", html };
  }

  function coffee(ctx) {
    const data = LD.data;
    const today = data.today();
    const monthKey = data.monthKey(today);
    const monthCoffees = data.coffeesBetween(`${monthKey}-01`, today);
    const monthCups = data.sum(data.monthDays(monthKey), "coffeeCups");
    const monthCost = monthCoffees.reduce((sum, item) => sum + item.cost, 0);
    const weekCups = data.sum(data.lastDays(7), "coffeeCups");
    const brands = data.coffeeTotals(data.coffeesBetween(data.addDays(today, -89), today));
    const recent = data.coffeesBetween(data.addDays(today, -30), today).slice(-9).reverse();
    const monthDays = data.monthDays(monthKey);
    const firstDow = (new Date(Date.parse(`${monthKey}-01T00:00:00Z`)).getUTCDay() + 6) % 7;

    const html = [
      viewHead("咖啡", "一杯的账也要算", `近 7 天 <b>${weekCups} 杯</b>，本月 <b>${monthCups} 杯</b>，花掉 <b>${fmt.money(monthCost)}</b>。`),
      `<div class="kpis">
        ${kpi({
          label: "近 7 天",
          icon: "coffee",
          color: "var(--coffee)",
          value: weekCups,
          unit: "杯",
          delta: fmt.delta(deltaOf(weekCups, data.sum(data.previousDays(7), "coffeeCups"))),
          deltaGood: weekCups <= data.sum(data.previousDays(7), "coffeeCups"),
          note: `目标 ${data.base().profile.goals.coffeeCupsPerWeek} 杯`,
          spark: charts.sparkline(data.lastDays(14).map((day) => day.coffeeCups), { color: "var(--coffee)" }),
          i: 1,
        })}
        ${kpi({
          label: "本月杯数",
          icon: "calendar",
          color: "var(--coffee)",
          value: monthCups,
          unit: "杯",
          delta: null,
          note: `日均 ${fmt.decimal(monthCups / Math.max(1, monthDays.length), 1)} 杯`,
          spark: charts.sparkline(monthDays.map((day) => day.coffeeCups), { color: "var(--coffee)" }),
          i: 2,
        })}
        ${kpi({
          label: "本月花费",
          icon: "wallet",
          color: "var(--coffee)",
          value: fmt.money(monthCost).replace("¥", ""),
          unit: "CNY",
          delta: null,
          note: `单杯约 ${fmt.money(monthCost / Math.max(1, monthCups))}`,
          spark: charts.sparkline(data.monthlyProfile("coffeeCups", 12).map((item) => item.value), { color: "var(--coffee)" }),
          i: 3,
        })}
        ${kpi({
          label: "年度咖啡",
          icon: "flame",
          color: "var(--coffee)",
          value: data.yearTotals().coffeeCups,
          unit: "杯",
          delta: null,
          note: `共 ${fmt.money(data.yearTotals().coffeeCost)}`,
          spark: charts.sparkline(data.monthlyProfile("coffeeCups", 12).map((item) => item.value), { color: "var(--coffee)" }),
          i: 4,
        })}
      </div>`,
      `<div class="grid split-wide">
        ${panel({
          title: "近 12 周杯数",
          note: "杯 / 周",
          i: 5,
          body: charts.bars(weekBuckets("coffeeCups", 12), {
            color: "var(--coffee)",
            goal: data.base().profile.goals.coffeeCupsPerWeek,
            format: (value) => fmt.decimal(value, 0),
            unit: " 杯",
            title: "近 12 周咖啡杯数",
          }),
        })}
        ${panel({
          title: "品牌排行",
          note: "近 90 天",
          i: 6,
          body: `<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
              ${charts.donut(
                brands.slice(0, 5).map((item, index) => ({ label: item.brand, value: item.cups, color: charts.color(index) })),
                { centerValue: `${brands.reduce((sum, item) => sum + item.cups, 0)}`, centerLabel: "90 天杯数", format: (value) => `${value} 杯` }
              )}
              <div class="list" style="flex:1;min-width:160px">
                ${brands
                  .slice(0, 5)
                  .map(
                    (item, index) => `<div class="row">
                      <span class="dot" style="background:${charts.color(index)}"></span>
                      <div class="row-main">
                        <div class="row-title">${e(item.brand)}</div>
                        <div class="row-meta">${fmt.money(item.cost)}</div>
                      </div>
                      <span class="row-amount">${item.cups} 杯</span>
                    </div>`
                  )
                  .join("")}
              </div>
            </div>`,
        })}
      </div>`,
      `<div class="grid split-wide">
        ${panel({
          title: "本月咖啡日历",
          note: monthKey,
          i: 7,
          body: `<div class="tag-row" style="gap:6px;margin-bottom:8px">
              ${["一", "二", "三", "四", "五", "六", "日"].map((label) => `<span class="tag" style="width:34px;justify-content:center">${label}</span>`).join("")}
            </div>
            <div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px">
              ${Array.from({ length: firstDow }).map(() => `<span></span>`).join("")}
              ${monthDays
                .map((day) => {
                  const level = Math.min(2, day.coffeeCups);
                  return `<div title="${e(day.date)} · ${day.coffeeCups} 杯"
                    style="aspect-ratio:1;display:grid;place-items:center;border:1px solid var(--line);border-radius:6px;font-family:var(--font-mono);font-size:11px;background:${
                      level === 2 ? "var(--coffee)" : level === 1 ? "color-mix(in srgb, var(--coffee) 28%, var(--surface))" : "var(--surface-2)"
                    };color:${level === 2 ? "#fff" : "var(--ink-2)"}">
                    ${Number(day.date.slice(8, 10))}
                  </div>`;
                })
                .join("")}
            </div>`,
        })}
        ${panel({
          title: "最近喝的",
          note: "近 30 天",
          i: 8,
          body: recent.length
            ? `<div class="list">${recent
                .map(
                  (item) => `<div class="row">
                    <span class="dot dot-coffee"></span>
                    <div class="row-main">
                      <div class="row-title">${e(item.brand)} · ${e(item.drink)}</div>
                      <div class="row-meta">${e(fmt.dateShort(item.date))} · ${item.cups} 杯</div>
                    </div>
                    <span class="row-amount">${fmt.money(item.cost)}</span>
                  </div>`
                )
                .join("")}</div>`
            : `<p class="empty">最近没喝咖啡</p>`,
        })}
      </div>`,
    ].join("");

    return { title: "咖啡", subtitle: "杯数、花费与品牌", html };
  }

  function journal(ctx) {
    const data = LD.data;
    const today = data.today();
    const allEntries = data.allJournal();
    const entries = allEntries.slice().reverse().slice(0, 40);
    const streak = data.streak("readingMinutes");
    const monthEntries = data.journalBetween(`${data.monthKey(today)}-01`, today);
    const tagCounts = new Map();
    allEntries.forEach((entry) =>
      (entry.tags || []).forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1))
    );
    const topTags = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);

    const grouped = [];
    entries.forEach((entry) => {
      const month = entry.date.slice(0, 7);
      if (!grouped.length || grouped[grouped.length - 1].month !== month) grouped.push({ month, items: [] });
      grouped[grouped.length - 1].items.push(entry);
    });

    const html = [
      viewHead("复盘", "把日子写短一点", `一共写下 <b>${allEntries.length} 条</b>复盘，本月 <b>${monthEntries.length} 条</b>，阅读连续 <b>${streak} 天</b>。`),
      `<div class="grid split-wide">
        ${panel({
          title: "写下今天",
          note: fmt.dateFull(today),
          i: 1,
          body: `<div class="form-grid" style="margin-bottom:12px">
              <label class="field"><span>心情</span>
                <select class="select" id="journalMood">
                  <option value="5">很好</option>
                  <option value="4">不错</option>
                  <option value="3" selected>平静</option>
                  <option value="2">有点累</option>
                  <option value="1">低落</option>
                </select>
              </label>
              <label class="field"><span>标签（用空格分隔）</span>
                <input class="input" id="journalTags" placeholder="专注 完成" />
              </label>
            </div>
            <label class="field" style="margin-bottom:12px"><span>今天最值得记的一件事</span>
              <textarea class="textarea" id="journalText" placeholder="不用写长，一两句话就够。"></textarea>
            </label>
            <button class="btn btn-primary" data-action="save-journal" type="button">保存复盘</button>`,
        })}
        ${panel({
          title: "关键词",
          note: "出现在你的复盘里",
          i: 2,
          body: topTags.length
            ? `<div class="tag-row">${topTags
                .map(([tag, count]) => `<span class="tag">${e(tag)} · ${count}</span>`)
                .join("")}</div>
              <div class="list" style="margin-top:14px">
                ${topTags
                  .slice(0, 4)
                  .map(
                    ([tag, count]) => `<div class="row">
                      <span class="dot"></span>
                      <div class="row-main"><div class="row-title">${e(tag)}</div></div>
                      <span class="row-amount">${count} 次</span>
                    </div>`
                  )
                  .join("")}
              </div>`
            : `<p class="empty">还没有标签</p>`,
        })}
      </div>`,
      grouped
        .map((group) =>
          panel({
            title: `${group.month.slice(0, 4)} 年 ${Number(group.month.slice(5, 7))} 月`,
            note: `${group.items.length} 条`,
            i: 3,
            body: `<div class="journal-list">${group.items
              .map(
                (entry) => `<div class="journal-item">
                  <div class="journal-date">${e(fmt.dateFull(entry.date))} ${fmt.weekday(entry.date)} · ${"●".repeat(entry.mood || 3)}</div>
                  <p class="journal-text">${e(entry.text)}</p>
                  <div class="tag-row">${(entry.tags || []).map((tag) => `<span class="tag">${e(tag)}</span>`).join("")}</div>
                </div>`
              )
              .join("")}</div>`,
          })
        )
        .join(""),
      allEntries.length > entries.length
        ? `<p class="panel-note" style="padding:2px 4px 8px">只显示最近 ${entries.length} 条，共 ${allEntries.length} 条。</p>`
        : "",
    ].join("");

    return { title: "复盘", subtitle: "每天一句话", html };
  }

  function levels(ctx) {
    const state = ctx.levels || {};
    const completed = LADDER.filter((level) => state[level.id]).length;
    const next = LADDER.find((level) => !state[level.id]);

    const html = [
      viewHead("关卡", "用这个项目把 Codex 练熟", `依次完成下面 ${LADDER.length} 关，每一关都对应 Codex 的一个真实能力。当前进度 <b>${completed} / ${LADDER.length}</b>。`),
      `<div class="ladder-head reveal" style="--i:1">
        <div class="ladder-progress">
          <div class="ladder-label"><span>进度</span><span>${completed} / ${LADDER.length}</span></div>
          ${progressBar(completed / LADDER.length)}
        </div>
        <div class="panel-note">${next ? `下一关：${e(next.title)}` : "全部通关，去改真实数据吧"}</div>
      </div>`,
      ...LADDER.map((level, index) => {
        const isDone = Boolean(state[level.id]);
        const isNext = next && next.id === level.id;
        return `<article class="level reveal ${isDone ? "is-done" : ""} ${isNext ? "is-next" : ""}" style="--i:${index + 2}">
          <div class="level-num">${isDone ? LD.icon("check") : index + 1}</div>
          <div>
            <div class="level-head">
              <span class="level-title">第 ${index + 1} 关 · ${e(level.title)}</span>
              <label class="check">
                <input type="checkbox" data-action="level" data-id="${e(level.id)}" ${isDone ? "checked" : ""} />
                已完成
              </label>
            </div>
            <p class="level-goal">${e(level.goal)}</p>
            <p class="level-learn">学到：${e(level.learn)}</p>
            <div class="level-prompt">
              <code>${e(level.prompt)}</code>
              <button class="copy-btn" data-action="copy" data-id="${e(level.id)}" type="button">复制</button>
            </div>
          </div>
        </article>`;
      }),
    ].join("");

    return { title: "关卡", subtitle: `${LADDER.length} 个 Codex 练习，从仓库约定到部署`, html };
  }

  LD.ladderLevels = LADDER;
  LD.views = { overview, reading, running, spending, coffee, journal, levels };
})();
