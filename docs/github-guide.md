# GitHub 从零上手：把这个项目发布到网上

这份指南是给第一次用 GitHub 的人写的。跟着做一遍，你会得到一个网址，手机在任何网络下都能打开，还能加到主屏当 App。

## 先记住三个词

| 词 | 意思 |
| --- | --- |
| 仓库 Repository | 一个项目文件夹，外加它的全部历史版本 |
| 提交 Commit | 在本地给当前状态拍一张快照，写一句说明 |
| 推送 Push | 把本地的提交上传到 GitHub；反向操作叫拉取 Pull |

GitHub 等于"云端的仓库托管 + 网页界面"。你电脑里的 `life-dashboard` 文件夹已经是一个本地仓库了，只差一个远程仓库。

## 第一步：在网页上建一个空仓库

1. 浏览器打开 github.com，右上角登录。
2. 右上角 `+` 号，选 `New repository`。
3. `Repository name` 填 `life-dashboard`。
4. 选 `Public`。免费账号要公开仓库才能用 Pages 托管，私有仓库的 Pages 需要付费账号。
5. 下面三个初始化选项（Add a README、Add .gitignore、Choose a license）**一个都不要勾**，因为本地已经有内容了。
6. 点 `Create repository`。

建完之后页面上会显示仓库地址，形如：

```
https://github.com/你的用户名/life-dashboard.git
```

这个地址就是"远程仓库地址"，下一步要用。

## 第二步：把本地代码推上去

### 方式 A：让 Codex 帮你推（推荐）

把仓库地址发给 Codex，它会执行两条命令：接上远程仓库、推送。推送时 Git 会弹出浏览器让你登录 GitHub 授权一次，之后就不用重复登录了。

### 方式 B：GitHub Desktop

1. 去 desktop.github.com 下载安装，用你的 GitHub 账号登录。
2. 菜单 `File` → `Add local repository`。
3. 选择 `life-dashboard` 文件夹。
4. 右上角点 `Publish repository`，取消勾选 `Keep this code private`（免费账号要公开才能用 Pages），确认发布。

### 方式 C：网页上传（不装任何东西）

1. 打开你刚建的空仓库页面。
2. 点 `Add file` → `Upload files`。
3. 打开电脑里的 `life-dashboard` 文件夹，全选里面的**内容**拖进网页。注意是进去选里面的文件和文件夹，不要把最外层的 `life-dashboard` 文件夹整个拖进去，否则会多一层目录导致网站打不开。
4. 下面填一句说明，点 `Commit changes`。

用这种方式时，浏览器可能不会上传 `.github` 和 `.nojekyll` 这类点开头的文件，所以 Pages 要用下面第三步里的"分支方式"。

## 第三步：打开 Pages 托管

1. 进入仓库页面，点 `Settings`。
2. 左侧栏找到 `Pages`。
3. `Source` 有两种选法，按你上一步的方式选：
   - 用方式 A 或 B 推送的：选 `GitHub Actions`。项目里已经带了部署工作流，会自动跑。
   - 用方式 C 网页上传的：选 `Deploy from a branch`，分支选 `main`，目录选 `/ (root)`，然后保存。
4. 等一到两分钟，Pages 页面顶部会显示网址：

```
https://你的用户名.github.io/life-dashboard/
```

## 第四步：装到 iPhone

1. 用 **Safari** 打开上面那个网址。
2. 点底部工具栏的分享按钮。
3. 选「添加到主屏幕」，确认。
4. 从主屏图标打开，全屏无地址栏。长按图标还有「记一笔」和「今日复盘」两个快捷入口。

## 第五步：以后每次改完怎么办

改完文件之后，永远只有三个动作：提交、推送、等部署。你可以直接对 Codex 说「提交并推送，说明写 xxx」，也可以自己在 GitHub Desktop 里点 `Commit` 再点 `Push`。

改了 `index.html`、`styles.css`、`js/` 或 `data/` 之后，记得把 `sw.js` 里的 `CACHE_VERSION` 加一，否则手机上还会用旧缓存。

## 常见问题

**推送时要求输入密码？**

GitHub 早就不允许用账号密码推送了。正确做法是在网页上生成一个 Personal Access Token：
`Settings` → `Developer settings` → `Personal access tokens` → `Tokens (classic)` → `Generate new token`，勾选 `repo`，生成后复制那串字符，粘贴到密码位置。这串字符只显示一次，要当场存好。

**登录时提示验证码或者忘记密码？**

先在网页上完成登录和密码重置，再回到推送这一步。

**Actions 页面出现红色叉号？**

多半是 Pages 的 Source 没选成 `GitHub Actions`。改过来，或者把 `.github/workflows/pages.yml` 删掉，改用分支方式部署。

**网站打开了，但手机上还是旧版？**

把 `sw.js` 里的 `CACHE_VERSION` 加一，重新推送；手机上先联网打开一次让缓存更新，还不行就删掉主屏图标重新添加。

**网站打开是空白的？**

多半是上传时多套了一层文件夹。仓库根目录应该直接能看到 `index.html`，而不是先看到一个 `life-dashboard` 文件夹。

## 两件必须记住的事

- 公开仓库里的所有文件都能被任何人看到，包括 `data/dashboard.json`。现在是示例数据无所谓；换成你的真实记录后，要么别提交真实数据，要么改用私有仓库加 Cloudflare Pages 的 Access 做访问控制。
- 永远不要把密码、访问令牌、账单原件、身份证照片这类东西提交到仓库里。
