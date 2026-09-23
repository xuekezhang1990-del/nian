# 人生仪表盘

把阅读、跑步、花费、咖啡和每日复盘放在同一块屏幕上。零依赖、零构建，双击 `index.html` 就能用。

这也是一个练习 Codex 的项目：仓库里有 `AGENTS.md`、可安装的技能、数据校验脚本，以及八个逐级解锁的关卡。

## 马上开始

1. 双击 `index.html`，你会看到一份 366 天的示例数据。
2. 点「记一笔」记录一条真实数据，它保存在浏览器本地。
3. 打开「关卡」页，从第 1 关开始，让 Codex 帮你改数据、加规则、写周报。

## 装到 iPhone

这个项目已经是 PWA，可以像 App 一样装到手机主屏，并且离线可用。需要先把它放到一个 HTTPS 地址上，步骤见 `docs/deploy.md`。

装好之后：

1. 用 Safari 打开那个网址。
2. 点底部的分享按钮，选「添加到主屏幕」。
3. 从主屏图标打开，就是全屏无地址栏的效果。
4. 长按图标还有「记一笔」和「今日复盘」两个快捷入口。

注意：离线缓存需要 http 或 https 环境。直接双击 `index.html` 页面能用，但不会注册 service worker，也就没有离线能力。

## 页面

| 页面 | 内容 |
| --- | --- |
| 今日 | 四个核心指标、全年热力图、今日复盘、支出趋势、分类占比 |
| 阅读 | 月度时长、书架进度、阅读记录 |
| 运动 | 周里程、配速趋势、训练构成、跑步记录 |
| 花费 | 预算使用、分类占比、月度趋势、账单流水 |
| 咖啡 | 杯数、花费、品牌排行、本月咖啡日历 |
| 复盘 | 写今日复盘、关键词统计、按月归档 |
| 关卡 | 八关 Codex 练习，含可复制的提示词 |

## 换成你自己的数据

`data/dashboard.json` 是唯一数据源。最省事的路径：

```powershell
node scripts/build-inline.mjs   # 改完 JSON 后重建页面数据
node scripts/validate-data.mjs  # 校验契约，必须输出 data check: OK
```

只想先改目标值，就改 `profile.goals`：每天读多久、每周跑多少、每月预算多少、每周几杯咖啡。

## 命令

| 命令 | 作用 |
| --- | --- |
| `node scripts/generate-data.mjs` | 重新生成示例数据（会覆盖现有记录） |
| `node scripts/build-inline.mjs` | 用 JSON 重建 `dashboard.data.js` |
| `node scripts/validate-data.mjs` | 校验数据契约 |

没有 npm 依赖，不需要 `npm install`，不需要本地服务器。

## 用 Codex 继续做

- 八关练习说明见 `docs/codex-ladder.md`。
- 录入流程可以装成技能：把 `skills/life-dashboard` 复制到 `%USERPROFILE%\.codex\skills\` 下，然后对 Codex 说「按 life-dashboard 技能记录今天的跑步」。
- 仓库约定写在 `AGENTS.md`，Codex 在这个目录里会自动遵守。

## 技术说明

纯 HTML、CSS 和传统脚本，没有框架和打包步骤。图表是手写 SVG，数据在 `js/data.js` 中合并与派生。页面直接从 `file://` 打开，所以数据用内联脚本而不是 `fetch`。

`manifest.webmanifest` 负责安装信息，`sw.js` 负责离线缓存，`icons/` 里是各个尺寸的图标（源文件是 SVG，PNG 由 Chrome 渲染生成）。

改了 `index.html`、`styles.css`、`js/` 或 `data/` 之后，记得把 `sw.js` 里的 `CACHE_VERSION` 加一，否则手机上还会拿旧版本。
