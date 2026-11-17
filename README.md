# GameTools (gametools.info) — AI 游戏开发工具目录站

>TAAFT 剧本 × 游戏行业。任务式分类 + 实测徽章 + 引擎标签，主打"中立、亲测、不卖排名"。
>正式域名：https://gametools.info（已写入 astro.config.mjs `site`，构建自动生成 sitemap）

## 本地开发

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # 构建到 dist/
npm run preview    # 本地预览构建结果
```

## 目录结构

```
src/
  data/
    categories.json   # 14 个任务分类（slug/label/zh/emoji/blurb/searchRoot）
    tools.json        # 工具库（name/url/category/pricing/engines/tested/oneLiner）
  components/         # ToolCard / CategoryCard
  layouts/Base.astro  # 页头页脚 + SEO meta
  pages/
    index.astro               # 首页：搜索 + 分类 + 全部工具
    category/[slug].astro     # 分类页（SEO 着陆页）
    tool/[slug].astro         # 工具详情页（挂 affiliate 的位置）
    submit.astro              # 提交页（待接 Tally）
    about.astro
```

## 如何新增一个工具

往 `src/data/tools.json` 追加一行（slug 由 name 自动生成）：

```json
{ "name": "Example Tool", "url": "https://example.com", "repo": "https://github.com/org/repo",
  "category": "textures", "pricing": "freemium", "engines": ["unity"], "tested": false,
  "oneLiner": "One sentence about what it does." }
```

`repo` 可选（开源工具填 GitHub 地址，卡片和详情页会显示 GitHub 入口）。

实测过的工具把 `tested` 改为 `true`（卡片会从 ⏳ 变 ✅），并可加主编评分：

```json
"tested": true, "rating": 4.5, "verdict": "一句话点评：管线整合顺，拓扑一般。"
```

详情页会显示 "Curator's take" 星级块（无评分则不显示）。

## 开启评论（Giscus，基于 GitHub Discussions）

1. GitHub 建公开仓库并推代码
2. 仓库 Settings → General → Features → 勾选 Discussions
3. 安装 https://github.com/apps/giscus 到该仓库
4. 打开 https://giscus.app ，填仓库名，选 `Announcements` 分类
5. 把页面生成的 `repo` / `repoId` / `category` / `categoryId` 四个值
   填进 `src/components/Comments.astro` 顶部的 `GISCUS` 配置

评论主题会跟随站点的明暗切换自动同步。

## 上线前 TODO

- [x] 定正式站名：GameTools（gametools.info）
- [x] `astro.config.mjs` 已配置 `site` + sitemap
- [x] robots.txt 已就位
- [ ] 注册域名 gametools.info（Cloudflare/Porkbun，~$3/年），DNS 指向 Vercel
- [ ] `submit.astro` 里替换为 Tally 表单 embed（免费）
- [ ] 工具详情页 CTA 换成 affiliate 链接（各工具的 PartnerStack/自荐计划）
- [ ] 接入 Plausible 或 GA4 统计（Vercel 上加 script 标签即可）
- [ ] 激活 Giscus 评论（见下方步骤）

## 部署（Vercel，免费）

1. `git init` + push 到 GitHub
2. Vercel → Import Project → 框架自动识别 Astro → Deploy
3. Settings → Domains → 绑定你的域名

之后每次 `git push` 自动部署，无服务器、无备案、零成本。
