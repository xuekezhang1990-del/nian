---
name: life-dashboard
description: 把生活记录写进人生仪表盘。当用户说「记一笔」「今天跑了」「记录一下花费」「更新仪表盘」「这周复盘」时使用，负责按数据契约修改 data/dashboard.json、重建内联数据并运行校验。
---

# 人生仪表盘 · 记录与更新

在 `life-dashboard` 仓库里处理生活记录的固定流程。目标是让每次录入都可校验、可回溯，而不是随手改数字。

## 何时使用

- 用户口述一条记录：跑步、花费、咖啡、阅读、复盘。
- 用户要求更新目标值、预算或周计划。
- 用户要求总结某个时间段的阅读、运动、花费或咖啡数据。

## 步骤

1. **确认日期**：没有说明日期时用今天。先确认系统日期，不要猜。
2. **读取现状**：读 `data/dashboard.json` 中相关数组的末尾若干条，了解最近的 id 命名与字段用法。
3. **追加记录**：只在对应数组末尾追加，不要重排、不要改写历史记录。新记录带上 `source: "user"`。
4. **重建内联数据**：运行 `node scripts/build-inline.mjs`。
5. **校验**：运行 `node scripts/validate-data.mjs`，必须看到 `data check: OK`。
6. **汇报**：告诉用户写了几条、日期、金额或里程，以及校验结果。数字用中文口语表达，不要贴整段 JSON。

任何一步失败就停下来修，不要跳到最后一步。

## 字段契约

```json
{ "id": "u-xxxx", "date": "2026-09-24", "source": "user" }
```

| 类型 | 数组 | 必填字段 | 说明 |
| --- | --- | --- | --- |
| 跑步 | `runs` | `date` `km` `minutes` | `pace` = minutes / km，保留两位小数 |
| 花费 | `expenses` | `date` `amount` `category` | `category` 只能是：餐饮、交通、购物、居家、娱乐、学习、医疗 |
| 咖啡 | `coffees` | `date` `cups` `brand` `cost` | `cups` 是本次杯数，不是累计 |
| 阅读 | `books[].sessions` | `date` `minutes` `pages` | 同时把页数累加到 `pagesRead`，超过 `totalPages` 就标记 `status: "读完"` |
| 复盘 | `journal` | `date` `mood` `text` | `tags` 最多 4 个，`mood` 取 1 到 5 |

## 不要做的事

- 不要为了好看改历史数据或删掉「不好看」的记录。
- 不要改 `data/dashboard.data.js`，它是生成物。
- 不要引入 npm 依赖或改造成需要构建的项目。
- 不要跳过 `scripts/validate-data.mjs`。

## 安装到 Codex

把 `skills/life-dashboard` 整个目录复制到 `%USERPROFILE%\.codex\skills\`（macOS 与 Linux 是 `~/.codex/skills/`），新开一个会话即可生效。
