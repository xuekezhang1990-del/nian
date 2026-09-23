/* App shell: navigation, theme, record modal, ladder progress, CSV export. */
window.LD = window.LD || {};

(function () {
  const THEME_KEY = "ld.theme";
  const LEVEL_KEY = "ld.levels.v1";
  const INSTALL_KEY = "ld.installHint.v1";
  const e = LD.charts.esc;
  const fmt = LD.fmt;

  const NAV = [
    { id: "overview", label: "今日", icon: "dashboard" },
    { id: "reading", label: "阅读", icon: "book" },
    { id: "running", label: "运动", icon: "activity" },
    { id: "spending", label: "花费", icon: "wallet" },
    { id: "coffee", label: "咖啡", icon: "coffee" },
    { id: "journal", label: "复盘", icon: "pen" },
    { id: "levels", label: "关卡", icon: "flag" },
  ];

  const state = {
    view: "overview",
    levels: {},
    theme: "light",
    installEvent: null,
    hintVisible: false,
  };

  const els = {
    nav: document.getElementById("nav"),
    view: document.getElementById("view"),
    title: document.getElementById("viewTitle"),
    subtitle: document.getElementById("viewSubtitle"),
    themeBtn: document.getElementById("themeBtn"),
    addBtn: document.getElementById("addBtn"),
    exportBtn: document.getElementById("exportBtn"),
    railNote: document.getElementById("railNote"),
    railButtons: document.getElementById("railButtons"),
    modalRoot: document.getElementById("modalRoot"),
    installRoot: document.getElementById("installRoot"),
    backupInput: document.getElementById("backupInput"),
    toast: document.getElementById("toast"),
  };

  function readJson(key, fallback) {
    try {
      const raw = JSON.parse(localStorage.getItem(key) || "null");
      return raw && typeof raw === "object" ? raw : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      /* ignore storage failures */
    }
  }

  let toastTimer = 0;
  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("is-on");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => els.toast.classList.remove("is-on"), 2200);
  }

  function navCount(id) {
    if (id === "reading") return `${LD.data.yearTotals().booksFinished} 本`;
    if (id === "journal") return `${LD.data.allJournal().length} 条`;
    if (id === "levels") {
      const done = LD.ladderLevels.filter((level) => state.levels[level.id]).length;
      return `${done}/${LD.ladderLevels.length}`;
    }
    return "";
  }

  function renderNav() {
    els.nav.innerHTML = NAV.map((item) => {
      const count = navCount(item.id);
      return `<button class="nav-item ${state.view === item.id ? "is-active" : ""}" data-view="${item.id}" type="button">
        ${LD.icon(item.icon)}
        <span>${e(item.label)}</span>
        ${count ? `<span class="nav-count">${e(count)}</span>` : ""}
      </button>`;
    }).join("");
  }

  function renderRail() {
    const count = LD.data.userCount();
    const base = LD.data.base();
    const headline = count
      ? `已保存 ${count} 条手记，存在这台设备上。`
      : `数据来自 <code>data/dashboard.json</code>（${base.meta.startDate} 至 ${base.meta.endDate}）。`;
    const buttons = [];
    if (state.installEvent || (isIOS() && !isStandalone())) {
      buttons.push(`<button class="ghost-btn" data-action="install" type="button">装到手机</button>`);
    }
    buttons.push(`<button class="ghost-btn" data-action="export-backup" type="button">备份</button>`);
    buttons.push(`<button class="ghost-btn" data-action="import-backup" type="button">导入</button>`);
    if (count) {
      buttons.push(`<button class="ghost-btn" data-action="reset" type="button">清除手记</button>`);
    }
    els.railNote.innerHTML = headline;
    els.railButtons.innerHTML = buttons.join("");
  }

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function isIOS() {
    const ua = window.navigator.userAgent;
    return /iphone|ipad|ipod/i.test(ua) || (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  }

  function installHintCopy() {
    return isIOS()
      ? { title: "装到 iPhone 主屏", body: "在 Safari 里点底部的分享按钮，选「添加到主屏幕」。" }
      : { title: "装到手机主屏", body: "打开浏览器菜单，选「安装应用」或「添加到主屏」。" };
  }

  function renderInstallHint() {
    if (!els.installRoot) return;
    const dismissed = Boolean(readJson(INSTALL_KEY, {}).dismissed);
    const show = state.hintVisible && !isStandalone() && !dismissed;
    const copy = installHintCopy();
    els.installRoot.innerHTML = show
      ? `<div class="install-hint" role="status">
          <p><strong>${e(copy.title)}</strong><br />${e(copy.body)}</p>
          <div class="install-actions">
            <button class="ghost-btn" data-action="dismiss-install" type="button">知道了</button>
          </div>
        </div>`
      : "";
  }

  function showInstallHint() {
    state.hintVisible = true;
    renderRail();
    renderInstallHint();
  }

  function render() {
    const result = LD.views[state.view]({ levels: state.levels });
    els.title.textContent = result.title;
    els.subtitle.textContent = result.subtitle;
    els.view.innerHTML = result.html;
    LD.mountIcons(els.view);
    renderNav();
    renderRail();
    renderInstallHint();
  }

  function go(view, options) {
    if (!LD.views[view]) view = "overview";
    state.view = view;
    if (window.location.hash.replace("#", "") !== view) {
      window.location.hash = view;
    }
    render();
    if (!options || options.focus !== false) {
      els.view.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    }
  }

  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    els.themeBtn.innerHTML = LD.icon(theme === "dark" ? "sun" : "moon");
    writeJson(THEME_KEY, { value: theme });
  }

  function initTheme() {
    const stored = readJson(THEME_KEY, null);
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(stored && stored.value ? stored.value : prefersDark ? "dark" : "light");
  }

  function options(list) {
    return list.map((item) => `<option value="${e(item)}">${e(item)}</option>`).join("");
  }

  function typeFields(type) {
    const today = LD.data.today();
    const dateField = `<label class="field"><span>日期</span><input class="input" type="date" name="date" value="${today}" max="${today}" required /></label>`;
    if (type === "run") {
      return {
        fields: `${dateField}
          <label class="field"><span>里程（公里）</span><input class="input" type="number" name="km" step="0.01" min="0.1" value="5" required /></label>
          <label class="field"><span>用时（分钟）</span><input class="input" type="number" name="minutes" min="1" value="30" required /></label>
          <label class="field"><span>路线</span><input class="input" name="route" placeholder="滨江步道" /></label>
          <label class="field"><span>强度</span><select class="select" name="effort">${options(["轻松", "节奏跑", "间歇", "长距离"])}</select></label>`,
      };
    }
    if (type === "expense") {
      return {
        fields: `${dateField}
          <label class="field"><span>金额（元）</span><input class="input" type="number" name="amount" step="0.01" min="0.1" value="30" required /></label>
          <label class="field"><span>分类</span><select class="select" name="category">${options(["餐饮", "交通", "购物", "居家", "娱乐", "学习", "医疗"])}</select></label>
          <label class="field" style="grid-column:1/-1"><span>备注</span><input class="input" name="note" placeholder="午餐" /></label>`,
      };
    }
    if (type === "coffee") {
      return {
        fields: `${dateField}
          <label class="field"><span>杯数</span><input class="input" type="number" name="cups" min="1" max="5" value="1" required /></label>
          <label class="field"><span>品牌</span><input class="input" name="brand" value="自冲" list="brandOptions" />
            <datalist id="brandOptions">${options(["自冲", "Manner", "瑞幸", "Seesaw", "星巴克", "街角小店"])}</datalist>
          </label>
          <label class="field"><span>饮品</span><input class="input" name="drink" value="拿铁" /></label>
          <label class="field"><span>花费（元）</span><input class="input" type="number" name="cost" step="0.1" min="0" value="22" required /></label>`,
      };
    }
    if (type === "reading") {
      return {
        fields: `${dateField}
          <label class="field"><span>时长（分钟）</span><input class="input" type="number" name="minutes" min="1" value="30" required /></label>
          <label class="field"><span>页数</span><input class="input" type="number" name="pages" min="0" value="18" required /></label>
          <label class="field" style="grid-column:1/-1"><span>书</span>
            <select class="select" name="bookId">
              ${LD.data
                .books()
                .map((book) => `<option value="${e(book.id)}">${e(book.title)}${book.status === "读完" ? "（已读完）" : ""}</option>`)
                .join("")}
            </select>
          </label>`,
      };
    }
    return {
      fields: `${dateField}
        <label class="field"><span>心情</span><select class="select" name="mood">
          <option value="5">很好</option><option value="4">不错</option>
          <option value="3" selected>平静</option><option value="2">有点累</option><option value="1">低落</option>
        </select></label>
        <label class="field"><span>标签</span><input class="input" name="tags" placeholder="专注 完成" /></label>
        <label class="field" style="grid-column:1/-1"><span>今天最值得记的一件事</span>
          <textarea class="textarea" name="text" placeholder="一两句话就够"></textarea>
        </label>`,
    };
  }

  const TYPE_LABELS = [
    ["run", "跑步"],
    ["expense", "花费"],
    ["coffee", "咖啡"],
    ["reading", "阅读"],
    ["journal", "复盘"],
  ];

  function openModal() {
    els.modalRoot.innerHTML = `<div class="modal" id="modal">
      <form class="modal-card" id="addForm" novalidate>
        <div class="modal-head">
          <h2>记一笔</h2>
          <button class="icon-btn" data-action="close-modal" type="button" title="关闭" aria-label="关闭">${LD.icon("x")}</button>
        </div>
        <div class="modal-body">
          <div class="seg" id="typeSeg">
            ${TYPE_LABELS.map(
              ([value, label], index) =>
                `<button class="seg-btn ${index === 0 ? "is-active" : ""}" data-type="${value}" type="button">${e(label)}</button>`
            ).join("")}
          </div>
          <div class="form-grid" id="typeFields">${typeFields("run").fields}</div>
        </div>
        <div class="modal-foot">
          <button class="btn" data-action="close-modal" type="button">取消</button>
          <button class="btn btn-primary" type="submit">保存</button>
        </div>
      </form>
    </div>`;
    const form = document.getElementById("addForm");
    form.dataset.type = "run";
    const first = form.querySelector("input[name=km]");
    if (first) first.focus();
    form.addEventListener("submit", onSubmit);
    form.addEventListener("click", (event) => {
      const button = event.target.closest("[data-type]");
      if (!button) return;
      form.dataset.type = button.getAttribute("data-type");
      document.getElementById("typeFields").innerHTML = typeFields(form.dataset.type).fields;
      form.querySelectorAll(".seg-btn").forEach((node) => node.classList.toggle("is-active", node === button));
    });
  }

  function closeModal() {
    els.modalRoot.innerHTML = "";
  }

  function onSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const type = form.dataset.type;
    const payload = {};
    new FormData(form).forEach((value, key) => {
      payload[key] = value;
    });
    const required = {
      run: ["date", "km", "minutes"],
      expense: ["date", "amount"],
      coffee: ["date", "cups"],
      reading: ["date", "minutes"],
      journal: ["date"],
    }[type];
    const missing = required.filter((key) => !payload[key]);
    if (missing.length) {
      toast("还有必填项没填");
      return;
    }
    LD.data.addRecord(type, payload);
    closeModal();
    render();
    toast("已记下");
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(area);
      ok ? resolve() : reject(new Error("copy failed"));
    });
  }

  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    download(
      new Blob([`\ufeff${LD.data.toCsv()}`], { type: "text/csv;charset=utf-8" }),
      `life-dashboard-${LD.data.today()}.csv`
    );
    toast("已导出 CSV");
  }

  function exportBackup() {
    download(
      new Blob([JSON.stringify(LD.data.backup(), null, 2)], { type: "application/json" }),
      `life-dashboard-backup-${LD.data.today()}.json`
    );
    toast("已导出备份");
  }

  document.addEventListener("click", (event) => {
    const navButton = event.target.closest("[data-view]");
    if (navButton) {
      go(navButton.getAttribute("data-view"));
      return;
    }

    const actionNode = event.target.closest("[data-action]");
    if (!actionNode) return;
    const action = actionNode.getAttribute("data-action");

    if (action === "close-modal") {
      closeModal();
    } else if (action === "install") {
      if (state.installEvent) {
        const installEvent = state.installEvent;
        state.installEvent = null;
        renderRail();
        try {
          const prompted = installEvent.prompt();
          if (prompted && typeof prompted.catch === "function") prompted.catch(showInstallHint);
        } catch (error) {
          showInstallHint();
        }
        if (installEvent.userChoice) installEvent.userChoice.catch(() => {});
        return;
      }
      showInstallHint();
    } else if (action === "dismiss-install") {
      writeJson(INSTALL_KEY, { dismissed: true });
      state.hintVisible = false;
      renderInstallHint();
    } else if (action === "export-backup") {
      exportBackup();
    } else if (action === "import-backup") {
      if (els.backupInput) els.backupInput.click();
    } else if (action === "quick-journal") {
      const input = document.getElementById("quickJournal");
      const text = input && input.value.trim();
      if (!text) {
        toast("写一句再记下");
        return;
      }
      LD.data.addRecord("journal", { date: LD.data.today(), mood: 4, tags: "随手记", text });
      render();
      toast("已记下");
    } else if (action === "save-journal") {
      const text = (document.getElementById("journalText") || {}).value || "";
      const mood = (document.getElementById("journalMood") || {}).value || "3";
      const tags = (document.getElementById("journalTags") || {}).value || "";
      if (!text.trim()) {
        toast("先写一句再保存");
        return;
      }
      LD.data.addRecord("journal", { date: LD.data.today(), mood, tags, text: text.trim() });
      render();
      toast("复盘已保存");
    } else if (action === "copy") {
      const level = LD.ladderLevels.find((item) => item.id === actionNode.getAttribute("data-id"));
      if (!level) return;
      copyText(level.prompt)
        .then(() => toast("提示词已复制，粘贴给 Codex 就行"))
        .catch(() => toast("复制失败，请手动选中文本"));
    } else if (action === "reset") {
      LD.data.resetUser();
      render();
      toast("手记已清除");
    }
  });

  document.addEventListener("change", (event) => {
    const checkbox = event.target.closest('[data-action="level"]');
    if (!checkbox) return;
    state.levels[checkbox.getAttribute("data-id")] = checkbox.checked;
    writeJson(LEVEL_KEY, state.levels);
    render();
    toast(checkbox.checked ? "这一关完成了" : "已取消完成");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && els.modalRoot.innerHTML) closeModal();
  });

  els.modalRoot.addEventListener("click", (event) => {
    if (event.target.id === "modal") closeModal();
  });

  els.themeBtn.addEventListener("click", () => applyTheme(state.theme === "dark" ? "light" : "dark"));
  els.addBtn.addEventListener("click", openModal);
  els.exportBtn.addEventListener("click", exportCsv);

  if (els.backupInput) {
    els.backupInput.addEventListener("change", (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      file
        .text()
        .then((text) => {
          const added = LD.data.restore(JSON.parse(text));
          const total = Object.values(added).reduce((sum, value) => sum + value, 0);
          render();
          toast(total ? `已合并 ${total} 条记录` : "没有新记录需要合并");
        })
        .catch(() => toast("这个备份文件读不了"))
        .then(() => {
          event.target.value = "";
        });
    });
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.installEvent = event;
    renderRail();
  });

  window.addEventListener("appinstalled", () => {
    state.installEvent = null;
    state.hintVisible = false;
    renderInstallHint();
    renderRail();
    toast("已安装到主屏");
  });

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    if (!/^https?:$/.test(window.location.protocol)) return;
    navigator.serviceWorker.register("sw.js").catch(() => {
      /* offline cache is a bonus; the app still works without it */
    });
  }
  window.addEventListener("hashchange", () => {
    const next = window.location.hash.replace("#", "") || "overview";
    if (next !== state.view) go(next, { focus: false });
  });

  function boot() {
    try {
      LD.data.init();
    } catch (error) {
      els.view.innerHTML = `<div class="panel" style="padding:20px">
        <h2 class="display">数据没加载成功</h2>
        <p class="lede">先运行 <code>node scripts/generate-data.mjs</code> 生成数据，再刷新页面。</p>
        <p class="row-meta">${e(error.message)}</p>
      </div>`;
      return;
    }
    state.levels = readJson(LEVEL_KEY, {});
    initTheme();
    LD.mountIcons(document);
    const initial = window.location.hash.replace("#", "") || "overview";
    state.view = LD.views[initial] ? initial : "overview";
    const params = new URLSearchParams(window.location.search);
    const intent = params.get("action");
    if (intent === "journal") state.view = "journal";
    render();
    registerServiceWorker();
    if (intent === "add") window.setTimeout(openModal, 80);
  }

  boot();
})();
