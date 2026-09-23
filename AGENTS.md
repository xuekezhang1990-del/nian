# AGENTS.md — 人生仪表盘

这是一个零依赖的静态个人仪表盘。它同时被当作练习 Codex 的场地：数据、界面、技能、关卡都在这一个仓库里。

## 运行方式

- 直接双击 `index.html` 即可使用，不需要安装依赖、不需要构建、不需要本地服务器。
- 页面读取 `data/dashboard.data.js`（内联数据），而 `data/dashboard.json` 是唯一数据源。
- 改动 JSON 之后必须重建内联数据，否则页面不会变。
- 在线访问时 `sw.js` 会接管离线缓存。`file://` 下不会注册 service worker，页面功能不受影响。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `node scripts/validate-data.mjs` | 校验数据契约。失败时返回非 0，改完数据必须跑 |
| `node scripts/build-inline.mjs` | 用 `dashboard.json` 重建 `dashboard.data.js` |
| `node scripts/generate-data.mjs` | 重新生成整份示例数据，会覆盖 `data/` 下的记录 |

## 数据契约

- 顶层字段：`meta`、`profile`、`books`、`runs`、`expenses`、`coffees`、`journal`、`sleep`、`days`。
- 所有日期都是 `YYYY-MM-DD` 字符串。
- 金额单位为人民币元，保留一位小数即可。
- `days` 必须从 `meta.startDate` 到 `meta.endDate` 连续，每天一条，缺失日期由校验脚本报错。
- 追加记录只允许在数组末尾 push，不要重排、不要改写历史记录。
- 手动添加的记录带 `source: "user"` 字段，方便和生成数据区分。

## 代码约定

- 不使用框架、打包器或 npm 依赖。页面必须能直接从 `file://` 打开。
- `js/` 下是传统脚本（不是 ES module），统一挂到全局 `window.LD`。
- 视图函数返回 HTML 字符串，图表函数返回 SVG 字符串，保持纯函数风格。
- UI 文案用中文，代码注释用英文。
- 颜色、字体、间距一律使用 `styles.css` 顶部的 CSS 变量。
- 卡片使用 `.panel`，圆角不超过 8px，不要卡片里再套卡片。

## 改完必须验证

1. 运行 `node scripts/validate-data.mjs`，必须输出 `data check: OK`。
2. 改了 JSON 就运行 `node scripts/build-inline.mjs`。
3. 用浏览器打开 `index.html`，确认控制台没有报错。
4. 桌面宽度（1200px 以上）和手机宽度（390px）都不能出现整页横向滚动条或文字被截断。
5. 改了 `index.html`、`styles.css`、`js/` 或 `data/` 之后，把 `sw.js` 里的 `CACHE_VERSION` 加一。
6. 涉及离线或安装的改动，要在 `http://localhost` 下验证 service worker 能注册并且离线可打开。

## PWA 约定

- `sw.js` 的 `SHELL` 列表必须与实际加载的文件保持一致，新增文件要加进去。
- 每次发布都递增 `CACHE_VERSION`，否则已安装的设备会一直用旧缓存。
- 只缓存同源 GET 请求，不要缓存跨域资源。
- `index.html` 里必须保留 `manifest.webmanifest`、`apple-touch-icon` 和 `viewport-fit=cover`，否则 iPhone 上是小屏网页效果而不是全屏应用。
- 手机布局要给安全区留位置，使用 `env(safe-area-inset-*)`。

## 目录结构

```
index.html                 入口，按顺序加载下面的脚本
styles.css                 设计变量与全部样式
js/icons.js                内联图标
js/data.js                 数据加载、合并本地手记、派生指标
js/charts.js               SVG 图表构造器
js/views.js                七个页面 + 关卡内容
js/app.js                  导航、主题、录入弹窗、安装提示、备份与导出
data/dashboard.json        唯一数据源
data/dashboard.data.js     由 JSON 生成的内联数据，供 file:// 直接打开
scripts/generate-data.mjs  生成示例数据
scripts/build-inline.mjs   重建内联数据
scripts/validate-data.mjs  数据契约校验
manifest.webmanifest       PWA 安装信息
sw.js                      离线缓存
icons/                     图标，SVG 为源文件，PNG 为生成物
docs/deploy.md             部署到 GitHub Pages 或 Vercel
docs/codex-ladder.md       八关练习说明
docs/github-guide.md       给第一次用 GitHub 的人看的完整步骤
skills/life-dashboard/     可安装到 Codex 的录入技能
```

## 注意

- 页面上的「记一笔」只写入浏览器 localStorage，不会改仓库里的 JSON。想让记录进仓库，走 `skills/life-dashboard/SKILL.md` 里的流程。
- 不要把 `data/dashboard.json` 缩成一行，它需要保持可读、可人工编辑、可 diff。
