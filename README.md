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
    categories.json   # 15 个任务分类（slug/label/zh/emoji/blurb/searchRoot）
    tools.json        # 工具库（name/url/category/pricing/engines/tested/oneLiner）
  i18n/
    ui.ts             # 四语 UI 文案字典 + localePath/t() 工具函数
    categories.ts     # 分类的中/繁/日翻译
    paths.ts          # 静态路径生成（含多语言展开）
  components/         # ToolCard / CategoryCard / LanguageSwitcher / Comments
    pages/            # 5 个共享页面组件（接收 locale）
  layouts/Base.astro  # 页头页脚 + SEO(hreflang/canonical) + 主题 + 语言切换
  pages/
    index|category|tool|submit|about   # 英文路由（无前缀，默认语言）
    [locale]/...                        # zh-CN / zh-TW / ja 路由（自动生成）
```

### 多语言（i18n）

- 四语：`/`（英文默认）、`/zh-CN/`、`/zh-TW/`、`/ja/`
- 改 UI 文案 → `src/i18n/ui.ts`；改分类翻译 → `src/i18n/categories.ts`
- 工具一句话简介目前各语言均为英文（品牌名+行业术语），后续可在 tools.json 加 `oneLiner_zh` 等字段扩展
- SEO 自动输出 canonical + 5 个 hreflang；页头切换器保留当前页面路径
- 评论（Giscus）界面语言自动跟随页面语言

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
