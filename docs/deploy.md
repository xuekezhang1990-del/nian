# 部署与安装到 iPhone

PWA 需要一个 HTTPS 地址，本地文件和局域网 HTTP 都不行。下面两条路都是免费的，选一条即可。

## 先用本地服务器确认功能

```powershell
cd <life-dashboard 目录>
python -m http.server 8000
```

用电脑浏览器打开 `http://localhost:8000`。localhost 被视为安全上下文，service worker 能正常注册，可以在这里先验证离线缓存和安装提示。

只有 `localhost` 有这个待遇。用 `http://192.168.x.x:8000` 从手机访问是普通网页，能看能用，但装不了 PWA。

## 路线一：GitHub Pages

适合想用 Git 管版本、以后继续改的人。

1. 在 GitHub 新建一个仓库，例如 `life-dashboard`，设为 public 或 private 都可以（private 仓库的 Pages 需要付费账号）。
2. 把 `life-dashboard` 这个目录作为仓库根目录推上去，注意 `.github/workflows/pages.yml` 和 `.nojekyll` 要一起提交。
3. 打开仓库的 Settings，左侧选 Pages，Source 选 GitHub Actions。
4. 推送到 `main` 分支，Actions 会自动部署，完成后 Pages 页面会显示网址，形如 `https://用户名.github.io/life-dashboard/`。

工作流里 `path: .` 假设 `life-dashboard` 就是仓库根目录。如果你的目录结构不同，改这一行。

## 路线二：Vercel

适合想最快拿到网址、不想管 Actions 的人。

1. 把目录推到 GitHub，或者直接用 Vercel CLI。
2. 在 Vercel 里 Import 这个仓库。
3. Framework Preset 选 `Other`，Build Command 留空，Output Directory 留空或填 `.`。
4. 部署完成后会得到形如 `https://life-dashboard-xxx.vercel.app` 的网址。

本质是纯静态托管，不需要构建步骤。

## 装到 iPhone

1. 用 **Safari** 打开上面的网址。Chrome 等第三方浏览器在 iOS 上添加主屏不可靠，用 Safari 最稳。
2. 点底部工具栏的分享按钮。
3. 在列表里选「添加到主屏幕」，可以改名字，确认添加。
4. 从主屏图标打开，全屏无地址栏。
5. 长按图标，能看到「记一笔」和「今日复盘」两个快捷入口。

## 验证离线

1. 联网状态打开一次，等页面完全加载。
2. 打开飞行模式，回到主屏，从图标再打开。
3. 页面正常显示，说明 service worker 生效了。

## 改了代码但手机还是旧版

这是离线缓存最常见的问题。按顺序排查：

1. 确认 `sw.js` 里的 `CACHE_VERSION` 已经加一，例如从 `life-dashboard-v1` 改成 `life-dashboard-v2`。
2. 重新部署，等部署完成。
3. 在手机上打开一次，service worker 会在后台更新并清掉旧缓存。
4. 如果还不行，删掉主屏图标重新添加，或者在 Safari 设置里清除该站点数据。

开发阶段想省事，可以在浏览器开发者工具的 Application 面板里勾选 Bypass for network，或者手动 Unregister service worker。

## 关于数据

- 手机上的记录存在 Safari 的本地存储里，不会自动同步到电脑，也不会同步回仓库。
- 侧栏的「备份」会导出一份 JSON，包含你在设备上记的所有条目；在另一台设备导入就能合并。
- 如果把项目托管在公开仓库，`data/dashboard.json` 是公开的。真实记录建议留在本地，或者把仓库设为私有。
