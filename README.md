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
- 名单核实情况（2026-11）：LPL 2013–2015、EU LCS 2013 年和 2014 年春季、三届世界赛已核实并录入。**LCK、NA、EU 不模拟联赛**，照当年真实名单参加世界赛，所以 `availableRegions()` 只放开 LPL；以后要放开某个赛区，把它的队伍补进 `seasons.ts` 即可。**已知缺口：2015 年的 LPL 实际有 12 支队伍，这里只录了 8 支**（没有 WE、RNG 等），联赛按 8 队进行。
- 选手实力：名单里 `^=92` 是把这名选手这一年的实力直接写死，跨赛季出现的明星选手都这样逐季写（Uzi 90 → 92 → 93）；其他人 = 队伍实力基准 + 微调 + 按“名字 + 年份”固定的状态起伏（±1–2）。`data.ts` 的 `buildAll` 保证同一个选手在相邻两个赛季的实力一定不同。数值是助手按当年表现估的，不是查来的。
- 名单变化：名单本来就是按赛季录的真实名单。`core.ts` 的 `rosterNews` 汇总本赛季相比上赛季的变化（哪些队加入 / 离开、每支留下来的队谁进谁出、去了哪），赛季开始时写进生涯记录，战队面板里也会标出来。
- 战队面板：从“我的战队”“积分榜”“世界赛”卡片都能打开。本赛区 8 支在前，其他赛区的按赛区排在后面；点一支展开五名选手和实力，▲▼ 是和上赛季比的变化，换了队的注明上赛季在哪，上赛季还在的离队选手列在下面。转会期的“申请加入”也在这里。
- 抽卡面板：抽到的选手都在“替补席”的卡牌墙里（一行 3–6 张，最新抽到的排在最前，只增不清），点一张卡才展开它的详情和“放进首发 / 放走”。当前停在哪个面板记在 `sessionStorage` 里，刷新页面后回到原来的面板（开发时保存文件会让页面自动刷新，没有这一步的话会被踢回主界面）。
- 非卖品：名单里 ID 前加 `!`。抽不到，也不能通过加入战队挤掉那个位置的人。
- 英雄：比赛播报里只出现该赛季之前上线的英雄（`data.ts` 的 `CHAMPION_RELEASE`；S3 是 2012 年底以前的，S4 加上 2013 年的，S5 再加上 2014 年的）。上线年份是按已有知识写的，没有逐个联网核对。
- BP（`match.ts` 的 `makeBp` / `preMatch`）：比赛日一开打前就列出第 1 局的 BP，双方各禁用 3 个、五个位置各选 1 个；BO3 / BO5 后面每一局的 BP 随那一局的结果列出，蓝红方每局轮换。英雄都由系统自动选，玩家目前不能自己点。
- 词条：开局五选一；之后**每加 20 点属性可以三选一**（`engine.ts` 的 `PICK_EVERY`）。四个品质 普通 / 稀有 / 史诗 / 传说，权重 46 / 30 / 18 / 6（`data.ts` 的 `QUALITY_WEIGHT`），连续 5 次没出史诗以上，下一次必出（`EPIC_PITY`）。61 个可选词条都在 `data.ts` 的 `TRAITS`，效果写在每个词条的 `fx` 里，引擎统一汇总读取（`core.ts` 的 `traitFx`），不在各处单独判断。描述里的数值必须和效果一致，规则测试会核对。
- 词条的叠加上限：同类加成叠起来不超过其中最强的那一个单独的效果（上限从词条表里自动算出来，`core.ts` 的 `PICK_CAP`；体力上限最多 +40）；胜率类的加起来最多 +8%（`match.ts` 的 `PICK_WIN_CAP`）。选词条的间隔和这两个上限是调难度的主要旋钮：按 2026-11 的数值，生涯模拟里“会加入真实战队”的打法拿过世界赛冠军的生涯约占 28%（没有选词条时约 13.5%），S4 结束时平均实力约 77.5（原来约 76）。
- 这页 `noindex`、不进站点地图、不输出其他语言的链接（`Base` 的 `singleLocale`）。
- 测试：`npm run test:lol`（数据完整性、非卖品、外援上限、英雄与赛季、赛前 BP、词条、战队与选手、世界赛名单与赛制），`npm run sim:lol [局数]`（几种打法的机器人各跑若干局完整生涯，看成长曲线、冠军率和平均选词条次数）。

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
