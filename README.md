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
  components/         # ToolCard / CategoryCard / LanguageSwitcher / Comments / FocusBadge / GameFilter
    pages/            # 共享页面组件（接收 locale）
    games/            # 自制小游戏（StackGame.astro：纯 canvas，无引擎）
  games/stackLogic.ts    # 叠塔小游戏的核心计算（对齐 / 切掉 / 完美）
  scripts/toolFilter.ts  # “只看专为游戏”筛选开关：切换状态与样式，并同步到地址栏（?games=1）
  layouts/Base.astro  # 页头页脚 + SEO(hreflang/canonical) + 主题 + 语言切换
  pages/
    index|category|tool|submit|about|play   # 英文路由（无前缀，默认语言）
    [locale]/...                             # zh-CN / zh-TW / ja 路由（自动生成）
```

### 多语言（i18n）

- 四语：`/`（英文默认）、`/zh-CN/`、`/zh-TW/`、`/ja/`
- 改 UI 文案 → `src/i18n/ui.ts`；改分类翻译 → `src/i18n/categories.ts`
- 工具一句话简介目前各语言均为英文（品牌名+行业术语），后续可在 tools.json 加 `oneLiner_zh` 等字段扩展
- SEO 自动输出 canonical + 5 个 hreflang；页头切换器保留当前页面路径
- 评论（Giscus）界面语言自动跟随页面语言

### 自制小游戏（/play）

- **Stack Break**：一键叠塔。点击 / 按空格放下方块，对得越准留下的越多；连续 3 次完美对齐后方块会变大；没搭上即结束。
- 纯 HTML canvas 手写，不用引擎、不加载任何资源文件；音效用振荡器现场合成，左上角可关。
- 入口：页头导航“玩一把”+ 首页底部的卡片。最高分存在浏览器本地（`gametools-stack-best`）。
- 游戏页与“找工具”无关：加了 `noindex`，也不放进站点地图（`astro.config.mjs` 里的 sitemap `filter`）。
- 调参都在 `src/components/games/StackGame.astro` 顶部（移动幅度 `AMP`、速度、画面位置）和 `src/games/stackLogic.ts`（完美对齐的容差）。
- 开发环境下页面里有 `window.__stack`（`get()` 读状态、`tick(秒)` 手动推进时间并重画），方便在浏览器里调试；正式构建会剔除。

### 重生之我是英雄联盟职业选手（/zh-CN/lol）

文字生涯模拟，只有简体中文。从 S3 打到 S5：每天排位 / 训练赛 / 加练 / 休息，训练点自己加到反应、对线、运营、意识、心态上；赛季初可以加入一支真实战队，或者留在自己的战队里抽卡换人；世界赛按当年的真实名单和分组进行。

- 代码：`src/games/lol/`（`seasons.ts` 是名单数据，`data.ts` 是数据格式和属性生成，其余是引擎），界面在 `src/components/games/LolProGame.astro`。
- 名单核实情况（2026-11）：LPL 2013–2015、EU LCS 2013 年和 2014 年春季、三届世界赛已核实并录入。**LCK、NA、EU 不模拟联赛**，照当年真实名单参加世界赛，所以 `availableRegions()` 只放开 LPL；以后要放开某个赛区，把它的队伍补进 `seasons.ts` 即可。
- 非卖品：名单里 ID 前加 `!`。抽不到，也不能通过加入战队挤掉那个位置的人。
- 英雄：比赛播报里只出现该赛季之前上线的英雄（`data.ts` 的 `CHAMPION_RELEASE`；S3 是 2012 年底以前的，S4 加上 2013 年的，S5 再加上 2014 年的）。上线年份是按已有知识写的，没有逐个联网核对。
- 这页 `noindex`、不进站点地图、不输出其他语言的链接（`Base` 的 `singleLocale`）。
- 测试：`npm run test:lol`（数据完整性、非卖品、外援上限、英雄与赛季、世界赛名单与赛制），`npm run sim:lol [局数]`（几种打法的机器人各跑若干局完整生涯，看成长曲线和冠军率）。

## 如何新增一个工具

往 `src/data/tools.json` 追加一行（slug 由 name 自动生成）：

```json
{ "name": "Example Tool", "url": "https://example.com", "repo": "https://github.com/org/repo",
  "focus": "general", "category": "textures", "categories": ["textures", "concept-art"],
  "capabilities": ["PBR texture generation"],
  "pricing": "freemium", "engines": ["unity"], "tested": false,
  "oneLiner": "One sentence about what it does." }
```

- `focus`（必填）：`"game"` = 专为游戏设计，`"general"` = 通用工具。卡片和详情页会显示对应标签；分类页里专为游戏的工具排在前面，并可“只看专为游戏”。判断标准是产品本身是否为游戏开发做的，而不是游戏开发者是否在用。
- `categories` 可选：工具跨多个分类时列出全部归属（要包含主分类 `category`）。
- `capabilities` 可选：能力清单，详情页逐条显示，也会进入站内搜索。
- `repo` 可选（开源工具填 GitHub 地址，卡片和详情页会显示 GitHub 入口）。

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
