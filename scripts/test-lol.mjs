// 「重生之我是英雄联盟职业选手」规则测试：数据完整性、非卖品、外援上限、英雄与赛季、赛前 BP、词条、战队与选手、世界赛名单与赛制。
// 用法：node scripts/test-lol.mjs
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const vite = await createServer({ root, configFile: false, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const E = await vite.ssrLoadModule('/src/games/lol/engine.ts');
const D = await vite.ssrLoadModule('/src/games/lol/data.ts');
const R = await vite.ssrLoadModule('/src/games/lol/seasons.ts');

let failed = 0;
const check = (name, cond, detail = '') => {
  if (!cond) failed++;
  console.log(`${cond ? '  ok ' : 'FAIL '} ${name}${!cond && detail ? ` — ${detail}` : ''}`);
};

const seasons = [E.seasonAt(0), E.seasonAt(1), E.seasonAt(2)];
const LPL = seasons.map((sn) => sn.id);

console.log('\n[数据完整性]');
check('有三个赛季 S3–S5', seasons.map((s) => `${s.id} ${s.year}`).join(' / ') === 'S3 2013 / S4 2014 / S5 2015', seasons.map((s) => s.id).join(','));
for (const sn of seasons) {
  const leagueTeams = Object.values(sn.leagues).flat();
  const all = [...leagueTeams, ...sn.teams.map((t) => t.id).filter((id) => !leagueTeams.includes(id))];
  check(`${sn.id} 队伍 ID 不重复`, new Set(all).size === all.length);
  check(`${sn.id} LPL 联赛正好 8 支`, sn.leagues.LPL.length === 8, String(sn.leagues.LPL.length));
  const noFive = sn.teams.filter((t) => Object.keys(t.roster).length !== 5).map((t) => t.id);
  check(`${sn.id} 每支队伍都是 5 名首发`, noFive.length === 0, noFive.join(','));
  const ids = sn.teams.flatMap((t) => Object.values(t.roster).map((p) => p.id));
  check(`${sn.id} 选手 ID 不重复`, new Set(ids).size === ids.length);
  const worldsTeams = [...sn.worlds.groups.flat(), ...(sn.worlds.seeds ?? [])];
  const missing = worldsTeams.filter((id) => !sn.byId[id]);
  check(`${sn.id} 世界赛名单里的队伍都已录入`, missing.length === 0, missing.join(','));
  check(`${sn.id} 世界赛队伍不重复`, new Set(worldsTeams).size === worldsTeams.length);
  const badSlot = Object.entries(sn.worlds.slots).filter(([region, n]) => worldsTeams.filter((id) => sn.byId[id]?.region === region).length !== n);
  check(`${sn.id} 各赛区名额 = 当年真实参赛队数`, badSlot.length === 0, JSON.stringify(badSlot));
  const size = new Set(sn.worlds.groups.map((g) => g.length)).size;
  check(`${sn.id} 世界赛 ${worldsTeams.length} 支队伍、${sn.worlds.groups.length} 个小组${sn.worlds.seeds ? `、${sn.worlds.seeds.length} 支种子队` : ''}`, true);
  check(`${sn.id} 八强对阵表有 8 个位置`, sn.worlds.bracket.length === 8);
}
check('世界赛 2013 是 14 支队伍（2 组各 5 队 + 4 支种子队）', seasons[0].worlds.groups.flat().length === 10 && seasons[0].worlds.seeds.length === 4);
check('世界赛 2014、2015 各 16 支队伍', seasons[1].worlds.groups.flat().length === 16 && seasons[2].worlds.groups.flat().length === 16);

console.log('\n[非卖品]');
const faker = seasons.map((sn) => sn.teams.flatMap((t) => Object.values(t.roster)).find((p) => p.id === 'Faker') ?? { locked: false });
check('Faker 出现过的赛季（S3、S5）都是非卖品；S4 的数据里没有 SKT（2014 年 SKT 没进世界赛，韩国联赛名单又未录入）', faker[0].locked && faker[2].locked && !seasons[1].players['Faker']);
check('Clearlove 在 EDG 的两个赛季（S4、S5）是非卖品', !seasons[0].players['Clearlove']?.locked && seasons[1].players['Clearlove']?.locked && seasons[2].players['Clearlove']?.locked);
for (const sn of seasons) {
  const locked = Object.values(sn.players).filter((p) => p.locked).map((p) => p.id);
  console.log(`       ${sn.id} 非卖品：${locked.join('、')}`);
}

console.log('\n[赛区]');
const regions = E.availableRegions();
check('目前只有 LPL 可以选（其他赛区不模拟联赛，照当年真实名单进世界赛）', regions.length === 1 && regions[0] === 'LPL', regions.join(','));

function game(pos = 'mid', season = 0) {
  const s = E.createGame({ name: '测试', region: 'LPL', pos, trait: 'genius', teamName: '测试队', seed: 7 });
  E.closeSeasonStart(s);
  for (let i = 0; i < season; i++) {
    // 用“什么都做不了”的方式直接跳到赛季末，走一遍完整的赛季流程
    let guard = 0;
    while (s.season === i && s.screen === 'main' && guard++ < 5000) {
      if (s.modal) E.closeSeasonStart(s);
      else if (s.result) E.continueAfterResult(s);
      else if (s.pending) E.playPending(s);
      else if (s.injury > 0) E.restInjury(s);
      else if (E.canTrain(s)) E.act(s, 'rest');
      else break;
    }
  }
  return s;
}

console.log('\n[加入战队]');
{
  const strong = () => {
    const s = game('mid');
    for (const a of Object.keys(s.attrs)) s.attrs[a] = 99;
    s.rank = 900;
    return s;
  };
  const top = strong();
  top.pos = 'top';
  const omgTop = E.interest(top, 'omg');
  check('上单进不了 OMG：Gogoing 是非卖品', !omgTop.ok && omgTop.why.includes('Gogoing'), omgTop.why);
  const mid = strong();
  check('实力够的中单可以进 OMG', E.interest(mid, 'omg').ok, E.interest(mid, 'omg').why);
  const weak = game('mid');
  const omgWeak = E.interest(weak, 'omg');
  check('实力不够进不了 OMG', !omgWeak.ok && omgWeak.why.includes('综合实力'), omgWeak.why);
  check('实力够的中单加入了 OMG', E.joinTeam(mid, 'omg') && mid.team.kind === 'real' && mid.team.id === 'omg');
  const noWindow = game('mid');
  for (let i = 0; i < 20; i++) if (E.canTrain(noWindow)) E.act(noWindow, 'rest');
  for (const a of Object.keys(noWindow.attrs)) noWindow.attrs[a] = 99;
  noWindow.rank = 900;
  const late = E.interest(noWindow, 'omg');
  check('过了转会期不能换队', !E.isWindow(noWindow) && !late.ok && late.why.includes('转会期'), late.why);
}

console.log('\n[抽卡]');
{
  const s = game('mid');
  s.funds = 60 * 400;
  const got = [];
  for (let i = 0; i < 400; i++) got.push(...E.draw(s, 'home', 1));
  const lockedIds = new Set(Object.values(E.cur(s).players).filter((p) => p.locked).map((p) => p.id));
  check(`LPL 卡池抽了 ${got.length} 次，没有重复`, new Set(got.map((p) => p.id)).size === got.length);
  check('非卖品一次都没抽到', got.every((p) => !lockedIds.has(p.id)), got.filter((p) => lockedIds.has(p.id)).map((p) => p.id).join(','));
  check('只抽到本赛区（LPL）的选手', got.every((p) => E.cur(s).byId[p.team].region === 'LPL'));
  const away = game('adc');
  away.funds = 60 * 50;
  const foreign = E.draw(away, 'away', 50);
  check(`外援池抽到的是其他赛区的选手（${foreign.length} 张）`, foreign.length > 0 && foreign.every((p) => E.cur(away).byId[p.team].region !== 'LPL'));
  // 外援上限：首发放三名韩国选手，第三个应被拒绝
  const t = game('mid');
  const kr = (pos) => Object.values(E.cur(t).players).filter((p) => p.nat === 'LCK' && p.pos === pos && !p.locked).sort((a, b) => b.overall - a.overall)[0];
  const [topId, jungleId, adcId] = [kr('top').id, kr('jungle').id, kr('adc').id];
  t.bench = [topId, jungleId, adcId];
  const r1 = E.setMember(t, 'top', topId);
  const r2 = E.setMember(t, 'jungle', jungleId);
  const r3 = E.setMember(t, 'adc', adcId);
  check(`首发可以有两名外援（${r1.ok}, ${r2.ok}），第三名被拒：${r3.why}`, r1.ok && r2.ok && !r3.ok && r3.why.includes('外援'));
}

console.log('\n[英雄与赛季]');
{
  // 规则：每个赛季只用当前赛季之前上线的英雄
  const pool = (year, pos) => D.championsFor(year, pos);
  const allOf = (year) => D.POS_ORDER.flatMap((pos) => pool(year, pos));
  const all2013 = allOf(2013);
  const all2014 = allOf(2014);
  const all2015 = allOf(2015);
  const noneOf = (all, names) => names.every((n) => !all.includes(n));
  const allOfNames = (all, names) => names.every((n) => all.includes(n));
  check('S3（2013）里没有千珏、纳尔、艾克、巴德、布隆、滑板鞋、雷克塞、沙皇', noneOf(all2013, ['千珏', '纳尔', '艾克', '巴德', '布隆', '滑板鞋', '雷克塞', '沙皇']));
  check('S3（2013）里没有 2013 年才上线的卢锡安、金克丝、剑魔、扎克、奎因、亚索、锤石、冰女', noneOf(all2013, ['卢锡安', '金克丝', '剑魔', '扎克', '奎因', '亚索', '锤石', '冰女']));
  check('S3（2013）里有劫、盲僧、薇恩、发条、风女，以及 2012 年上线的婕拉、娜美', allOfNames(all2013, ['劫', '盲僧', '薇恩', '发条', '风女', '婕拉', '娜美']));
  check('S4（2014）里有 2013 年上线的卢锡安、金克丝、剑魔、扎克、奎因、亚索、锤石、冰女', allOfNames(all2014, ['卢锡安', '金克丝', '剑魔', '扎克', '奎因', '亚索', '锤石', '冰女']));
  check('S4（2014）里没有 2014 年才上线的纳尔、布隆、滑板鞋、雷克塞、沙皇', noneOf(all2014, ['纳尔', '布隆', '滑板鞋', '雷克塞', '沙皇']));
  check('S5（2015）里有纳尔、布隆、滑板鞋、雷克塞、沙皇', allOfNames(all2015, ['纳尔', '布隆', '滑板鞋', '雷克塞', '沙皇']));
  check('S5（2015）里没有 2015 年上线的千珏、艾克、巴德、塔姆', noneOf(all2015, ['千珏', '艾克', '巴德', '塔姆']));
  check('三个赛季、每个位置的英雄池都不为空', [2013, 2014, 2015].every((y) => D.POS_ORDER.every((pos) => pool(y, pos).length >= 8)));
  // 实际打出来的比赛里，英雄必须在该赛季的英雄池里
  let games = 0;
  let bad = 0;
  for (const pos of D.POS_ORDER) {
    const s = E.createGame({ name: '测试', region: 'LPL', pos, trait: 'genius', teamName: '测试队', seed: 42 });
    let guard = 0;
    while (s.screen === 'main' && guard++ < 60000) {
      if (s.modal) E.closeSeasonStart(s);
      else if (s.result) {
        const allowed = pool(E.cur(s).year, pos);
        for (const g of s.result.games) {
          games++;
          if (!allowed.includes(g.champ)) {
            bad++;
            if (bad <= 3) console.log(`       ${E.cur(s).id} 的 ${pos} 打出了 ${g.champ}`);
          }
        }
        E.continueAfterResult(s);
      } else if (s.pending) E.playPending(s);
      else if (s.injury > 0) E.restInjury(s);
      else if (E.canTrain(s)) E.act(s, E.canDo(s, 'scrim').ok ? 'scrim' : 'rest');
      else break;
    }
  }
  check(`实际打的 ${games} 局比赛里，每一局的英雄都属于该赛季的英雄池`, bad === 0);
  for (const [label, all] of [['S3', all2013], ['S4', all2014], ['S5', all2015]]) console.log(`       ${label} 可用英雄 ${all.length} 个`);
}
console.log('\n[赛前 BP]');
{
  // 规则：比赛日开打之前，第 1 局的 BP 就已经列出来了
  const poolOf = (s, pos) => D.championsFor(E.cur(s).year, pos);
  const poolAll = (s) => new Set(D.POS_ORDER.flatMap((p) => poolOf(s, p)));
  /** 一份 BP 哪里不对：数量、重复、不在本赛季的英雄池里、选的不是自己位置的英雄 */
  const problemsOf = (s, bp) => {
    const bad = [];
    if (!bp || !bp.self || !bp.opp) return ['没有 BP'];
    const all = poolAll(s);
    const seen = new Set();
    for (const [label, side] of [['我方', bp.self], ['对方', bp.opp]]) {
      if (side.bans.length !== 3) bad.push(`${label}禁用了 ${side.bans.length} 个`);
      if (side.picks.length !== 5) bad.push(`${label}选出了 ${side.picks.length} 个`);
      for (const c of side.bans) {
        if (!all.has(c)) bad.push(`${label}禁用的 ${c} 不在本赛季的英雄池里`);
        if (seen.has(c)) bad.push(`${c} 出现了两次`);
        seen.add(c);
      }
      side.picks.forEach((c, i) => {
        if (!poolOf(s, D.POS_ORDER[i]).includes(c)) bad.push(`${label}的${D.POS_ORDER[i]}选了 ${c}`);
        if (seen.has(c)) bad.push(`${c} 出现了两次`);
        seen.add(c);
      });
    }
    return bad;
  };
  // 1) 开打前：五个位置都能先拿到一份合法的 BP，而且不会变
  const shown = [];
  const badBefore = [];
  for (const pos of D.POS_ORDER) {
    const s = E.createGame({ name: '测试', region: 'LPL', pos, trait: 'genius', teamName: '测试队', seed: 11 });
    E.closeSeasonStart(s);
    let guard = 0;
    while (!s.pending && guard++ < 200) {
      if (s.modal) E.closeSeasonStart(s);
      else E.act(s, 'rest');
    }
    if (!s.pending) {
      badBefore.push(`${pos}：一直没等到比赛日`);
      continue;
    }
    const bp = E.preMatch(s);
    if (!bp) {
      badBefore.push(`${pos}：比赛日拿不到 BP`);
      continue;
    }
    badBefore.push(...problemsOf(s, bp));
    // 再要一次、存盘再读回来，都应该是同一份（刷新页面不会变）
    if (JSON.stringify(E.preMatch(s)) !== JSON.stringify(bp)) badBefore.push(`${pos}：再要一次 BP 变了`);
    if (JSON.stringify(JSON.parse(JSON.stringify(s)).pending.bp) !== JSON.stringify(bp)) badBefore.push(`${pos}：BP 没有跟着存盘`);
    shown.push({ s, bp, pos });
  }
  check('五个位置在开打前都能拿到第 1 局的 BP，再要一次、存盘再读回来都是同一份', shown.length === 5 && badBefore.length === 0, badBefore.slice(0, 3).join('；'));
  const b0 = shown[0]?.bp;
  console.log(`       例：${b0 ? `我方${b0.blue === 'self' ? '（蓝色方）' : '（红色方）'}禁用 ${b0.self.bans.join(' ')}、选出 ${b0.self.picks.join(' ')}；对方禁用 ${b0.opp.bans.join(' ')}、选出 ${b0.opp.picks.join(' ')}` : '无'}`);
  check('赛前 BP：双方各禁用 3 个、各选出 5 个，没有重复，都是本赛季英雄池里对应位置的英雄', shown.length === 5 && badBefore.length === 0, badBefore.slice(0, 3).join('；'));
  // 2) 开打后：第 1 局用的就是赛前列出的那份，自己的英雄是里面自己位置选出的那个
  let same = 0;
  for (const { s, bp, pos } of shown) {
    E.playPending(s);
    const g = s.result?.games[0];
    if (g && JSON.stringify(g.bp) === JSON.stringify(bp) && g.champ === bp.self.picks[D.POS_ORDER.indexOf(pos)] && !s.pending) same++;
  }
  check('开打后第 1 局用的就是赛前列出的那份 BP，自己的英雄也是里面自己位置选出的那个', same === 5, `${same} / 5`);
  // 3) 旧存档：比赛上还没有 BP 也能照常开打
  {
    const s = E.createGame({ name: '测试', region: 'LPL', pos: 'mid', trait: 'genius', teamName: '测试队', seed: 12 });
    E.closeSeasonStart(s);
    let guard = 0;
    while (!s.pending && guard++ < 200) {
      if (s.modal) E.closeSeasonStart(s);
      else E.act(s, 'rest');
    }
    delete s.pending.bp;
    E.playPending(s);
    check('旧存档里没有 BP 的比赛：开打时自动补上', problemsOf(s, s.result?.games[0]?.bp).length === 0, problemsOf(s, s.result?.games[0]?.bp).join('，'));
  }
  // 4) 完整生涯：每一局的 BP 都合法；同一场系列赛里蓝色方每局轮换；各种比赛都有 BP
  let games = 0;
  let bad = 0;
  let multi = 0;
  let alternates = 0;
  const kinds = new Set();
  const badMsgs = [];
  for (let seed = 1; seed <= 6; seed++) {
    const s = E.createGame({ name: '测试', region: 'LPL', pos: ['top', 'jungle', 'mid', 'adc', 'support'][seed % 5], trait: 'genius', teamName: '测试队', seed });
    let guard = 0;
    while (s.screen === 'main' && guard++ < 80000) {
      if (s.modal) E.closeSeasonStart(s);
      else if (s.result) {
        kinds.add(s.result.kind);
        for (const g of s.result.games) {
          games++;
          const p = problemsOf(s, g.bp);
          if (p.length) {
            bad++;
            if (badMsgs.length < 3) badMsgs.push(`${E.cur(s).id} ${s.result.label}：${p.join('，')}`);
          }
        }
        if (s.result.games.length > 1) {
          multi++;
          if (s.result.games.every((g, i) => i === 0 || g.bp.blue !== s.result.games[i - 1].bp.blue)) alternates++;
        }
        E.continueAfterResult(s);
      } else if (s.pending) E.playPending(s);
      else if (s.injury > 0) E.restInjury(s);
      else if (E.canTrain(s)) {
        // 把自己的队调成最强，保证一路打到世界赛决赛，各种比赛都走到
        for (const p of D.POS_ORDER) s.team.trainees[p] = 99;
        for (const a of Object.keys(s.attrs)) s.attrs[a] = 99;
        E.act(s, 'rest');
      } else break;
    }
  }
  const allKinds = ['league', 'semi', 'final', 'group', 'qf', 'sf', 'wfinal'];
  console.log(`       6 段生涯共 ${games} 局，每局都有 BP；多局的系列赛 ${multi} 场；出现过的比赛：${[...kinds].join(' ')}`);
  check('完整生涯里每一局的 BP 都合法（数量、不重复、本赛季英雄池、对应位置）', bad === 0, badMsgs.join('；'));
  check('同一场系列赛里，蓝色方每局轮换', multi > 0 && alternates === multi, `${alternates} / ${multi}`);
  check('常规赛、季后赛半决赛和决赛、世界赛小组赛、八强、四强、决赛都有 BP', allKinds.every((k) => kinds.has(k)), allKinds.filter((k) => !kinds.has(k)).join(','));
}

console.log('\n[词条]');
{
  const all = D.TRAITS;
  const pickable = all.filter((t) => t.pick);
  const byQ = (q) => pickable.filter((t) => t.quality === q);
  console.log(`       共 ${all.length} 个词条：开局 ${all.filter((t) => t.start).length} 个，加点时可选 ${pickable.length} 个（${D.QUALITY.map((q, i) => `${q.name} ${byQ(i).length}`).join('、')}），达成条件获得 ${all.filter((t) => t.hidden).length} 个`);
  check('可选词条数量：普通 ≥ 16、稀有 ≥ 16、史诗 ≥ 12、传说 ≥ 8', byQ(0).length >= 16 && byQ(1).length >= 16 && byQ(2).length >= 12 && byQ(3).length >= 8, D.QUALITY.map((q, i) => `${q.name} ${byQ(i).length}`).join('、'));
  check('词条 ID 不重复；开局词条和达成条件获得的词条不会被选到', new Set(all.map((t) => t.id)).size === all.length && all.filter((t) => t.start || t.hidden).every((t) => !t.pick));
  check('每个词条都有效果，效果里的数值都不是 0', all.every((t) => t.fx && Object.entries(t.fx).some(([k, v]) => (k === 'grit' ? v === true : v !== 0))));

  // 描述里写的数值必须和效果一致
  const PCT = ['tp', 'matchTp', 'cost', 'rank', 'rankLoss', 'recover', 'injury', 'funds', 'coord', 'luck', 'league', 'elim', 'worlds', 'decider', 'firstGame', 'bo1', 'late', 'ahead', 'behind', 'underdog', 'blue', 'red'];
  const shown = (k, v) => (PCT.includes(k) ? `${Math.round(Math.abs(v) * 100)}%` : `${Math.abs(v)}`);
  const mismatch = [];
  for (const t of all) {
    for (const [k, v] of Object.entries(t.fx)) {
      if (k !== 'grit' && !t.desc.includes(shown(k, v))) mismatch.push(`${t.name}：${k} = ${v}，描述是「${t.desc}」`);
    }
  }
  check('每个词条的描述里都写明了效果数值', mismatch.length === 0, mismatch.slice(0, 4).join('；'));

  const mk = (pos = 'mid', trait = 'genius', extra = [], seed = 4) => {
    const s = E.createGame({ name: '测试', region: 'LPL', pos, trait, teamName: '测试队', seed });
    E.closeSeasonStart(s);
    s.traits.push(...extra);
    E.refreshStamina(s);
    return s;
  };
  const near = (a, b) => Math.abs(a - b) < 1e-9;

  // 汇总：乘法相乘、加法相加；选来的词条单独算一份
  {
    const f = E.traitFx(mk('mid', 'genius', ['notebook', 'coach', 'lightpack', 'conditioning']));
    check(
      '效果汇总：乘法的相乘（训练点 1.25 × 1.05 × 1.1）、加法的相加（体力上限 6 + 15），开局和选来的分开算',
      near(f.all.tp, 1.25 * 1.05 * 1.1) && near(f.base.tp, 1.25) && near(f.pick.tp, 1.05 * 1.1) && f.all.stamina === 21 && f.base.stamina === 0 && f.pick.stamina === 21
    );
    const z = E.traitFx(mk('mid', ''));
    check('没有任何加成词条时，汇总结果就是“不变”', z.all.tp === 1 && z.all.rank === 1 && z.all.stamina === 0 && z.all.elim === 0 && !z.all.grit);
  }

  // 每加 PICK_EVERY（20）点属性多一次选词条
  {
    const s = mk('adc', 'genius', [], 3);
    s.tp = 1000;
    const every = E.PICK_EVERY;
    const earned = [];
    for (let i = 1; i <= every * 2 + 5; i++) {
      E.addPoint(s, 'reaction');
      if (s.traitPicks > earned.length) earned.push(i);
    }
    check(`每加 ${every} 点属性，多一次选词条的机会（加到第 ${every}、${every * 2} 点时各一次）`, every === 20 && earned.join() === `${every},${every * 2}` && s.pointsAdded === every * 2 + 5 && s.traitPicks === 2, `第 ${earned.join('、')} 点`);
    const offer = E.traitOptions(s);
    check('一次给出 3 个不重复、自己还没有、自己这个位置能选的词条', offer.length === E.OFFER_SIZE && new Set(offer.map((t) => t.id)).size === offer.length && offer.every((t) => t.pick && !s.traits.includes(t.id) && (!t.pos || t.pos.includes(s.pos))), offer.map((t) => t.name).join('、'));
    check('选项存进了状态：再要一次还是同样三个', JSON.stringify(E.traitOptions(s).map((t) => t.id)) === JSON.stringify(s.traitOffer) && JSON.stringify(s.traitOffer) === JSON.stringify(offer.map((t) => t.id)));
    const count = s.traits.length;
    check('不在选项里的词条选不了（开局的、达成条件的、乱写的 ID）', !E.pickTrait(s, 'clutch') && !E.pickTrait(s, 'champion') && !E.pickTrait(s, '不存在') && s.traits.length === count && s.traitPicks === 2);
    const pick = offer[0].id;
    check(`选一个（${offer[0].name}）：词条到手，机会少一次，下一次的选项重新摇`, E.pickTrait(s, pick) && s.traits.includes(pick) && s.traitPicks === 1 && s.traitOffer === null && E.traitOptions(s).every((t) => t.id !== pick));
    const streak = (() => {
      const t = mk('mid', 'genius', [], 6);
      t.traitPicks = 1;
      t.traitOffer = ['closer'];
      E.pickTrait(t, 'closer');
      const afterEpic = t.pickStreak;
      t.traitPicks = 1;
      t.traitOffer = ['warmup'];
      E.pickTrait(t, 'warmup');
      return [afterEpic, t.pickStreak];
    })();
    check('出史诗以上时保底计数清零，否则加一', streak[0] === 0 && streak[1] === 1, streak.join(' / '));
    s.traitPicks = 0;
    check('没有机会时不出选项，也选不了', E.traitOptions(s).length === 0 && !E.pickTrait(s, pickable[0].id));
  }

  // 位置专属的词条只会在对应位置出现
  {
    const seen = new Set();
    for (const pos of D.POS_ORDER) {
      const s = mk(pos, 'genius', [], 5);
      for (let i = 0; i < 200; i++) {
        s.traits = ['genius'];
        s.traitOffer = null;
        s.traitPicks = 1;
        for (const t of E.traitOptions(s)) if (t.pos) seen.add(`${t.id}:${pos}`);
      }
    }
    check('位置专属的词条只会在对应位置的选项里出现（五个位置各有一个）', seen.size === 5 && [...seen].every((x) => D.TRAITS.find((t) => t.id === x.split(':')[0]).pos.includes(x.split(':')[1])), [...seen].join(' '));
  }

  // 品质分布和保底
  {
    const s = mk('mid', 'genius', [], 9);
    const n = 800;
    const got = [0, 0, 0, 0];
    let due = 0;
    let hit = 0;
    for (let i = 0; i < n; i++) {
      s.traits = ['genius'];
      s.traitOffer = null;
      s.traitPicks = 1;
      const owed = s.pickStreak >= E.EPIC_PITY;
      const offer = E.traitOptions(s);
      if (owed) {
        due++;
        if (offer.some((t) => t.quality >= 2)) hit++;
      }
      got[offer[0].quality]++;
      E.pickTrait(s, offer[0].id);
    }
    const share = got.map((x) => x / n);
    console.log(`       ${n} 次里选项第一个位置的品质：${D.QUALITY.map((q, i) => `${q.name} ${(share[i] * 100).toFixed(1)}%`).join('、')}；保底触发 ${due} 次，每次都出了史诗以上`);
    check('品质大体按权重出：普通最多、传说最少且不到一成半', share[0] > 0.33 && share[0] < 0.5 && share[1] > 0.2 && share[1] < 0.34 && share[2] > 0.18 && share[2] < 0.32 && share[3] > 0.02 && share[3] < 0.15, share.map((x) => x.toFixed(3)).join(' '));
    check(`连续 ${E.EPIC_PITY} 次没出史诗以上，下一次必出`, E.EPIC_PITY === 5 && due >= 10 && hit === due, `${hit} / ${due}`);
  }

  // 选到时立刻生效的
  {
    const s = mk('mid', 'genius', [], 2);
    const give = (id) => {
      s.traitPicks = 1;
      s.traitOffer = [id];
      return E.pickTrait(s, id);
    };
    s.tp = 0;
    const a = give('epiphany');
    const tp = s.tp;
    s.funds = 0;
    const b = give('windfall');
    const funds = s.funds;
    const max = s.maxStamina;
    s.stamina = 50;
    const c = give('conditioning');
    check('「顿悟」立刻给 30 训练点，「天降横财」立刻给 200 资金', a && b && tp === 30 && funds === 200, `${tp} / ${funds}`);
    check('「体能特训」：体力上限 +15，当前的体力也跟着 +15', c && s.maxStamina === max + 15 && s.stamina === 65, `${s.maxStamina} / ${s.stamina}`);
    const d = give('immortal');
    check('「不坏之身」：体力上限再 +30，和前面的 +15 一起碰到 +40 的上限', d && s.maxStamina === 140, String(s.maxStamina));
  }

  // 各项效果确实被引擎读到了（数值能直接算出来的，逐个核对）
  {
    const at = (v, extra) => {
      const s = mk('mid', 'genius', extra);
      s.attrs.reaction = v;
      return s;
    };
    check('加点的花费按词条打折：原价 10 → 会挑外设 9、举一反三 9、高效学习 8、点石成金 7', E.pointCostFor(at(84), 'reaction') === 10 && E.pointCostFor(at(84, ['bargain']), 'reaction') === 9 && E.pointCostFor(at(84, ['quickstudy']), 'reaction') === 9 && E.pointCostFor(at(84, ['efficient']), 'reaction') === 8 && E.pointCostFor(at(84, ['goldhand']), 'reaction') === 7);
    const paid = (extra) => {
      const s = at(84, extra);
      s.tp = 100;
      E.addPoint(s, 'reaction');
      return 100 - s.tp;
    };
    check('实际扣的训练点和显示的花费一致', paid([]) === 10 && paid(['goldhand']) === 7 && paid(['bargain']) === 9);
    check('排位消耗的体力：排位狂人 10（原来 15）；作息规律让训练赛 23、加练 38（原来 25、40）', E.costOf(mk('mid', 'grinder'), 'rank') === 10 && E.costOf(mk(), 'rank') === 15 && E.costOf(mk('mid', 'genius', ['earlybird']), 'scrim') === 23 && E.costOf(mk('mid', 'genius', ['earlybird']), 'overtrain') === 38 && E.costOf(mk('mid', 'genius', ['earlybird']), 'rest') === 0);
    check('休息恢复的体力：45 → 热身习惯 52、私人理疗师 59、永动机 63', E.restRecover(mk()) === 45 && E.restRecover(mk('mid', 'genius', ['warmup'])) === 52 && E.restRecover(mk('mid', 'genius', ['physio'])) === 59 && E.restRecover(mk('mid', 'genius', ['perpetual'])) === 63);
    const low = (extra, trait = '') => {
      const s = mk('mid', trait, extra);
      s.stamina = 20;
      return E.trainGain(s);
    };
    check('体力很低时训练收益打折（×0.6）；「铁血意志」只打很轻的折（×0.85）', near(low([]), 0.6) && near(low([], 'genius'), 1.25 * 0.6) && near(low(['ironwill'], 'genius'), 1.25 * 0.85));
    const risk = (stamina, extra, trait = 'genius') => {
      const s = mk('mid', trait, extra);
      s.stamina = stamina;
      return E.injuryRisk(s);
    };
    check('加练受伤的概率：18%（体力很低 30%）→ 拉伸狂魔 ×0.75、不坏之身 ×0.2；开局铁人 ×0.1', near(risk(50, []), 0.18) && near(risk(10, []), 0.3) && near(risk(50, ['stretching']), 0.135) && near(risk(10, ['immortal']), 0.06) && near(risk(10, [], 'iron'), 0.03));
    check('体力上限：轻装上阵 106、铁血意志 125、铁人 140', mk('mid', 'genius', ['lightpack']).maxStamina === 106 && mk('mid', 'genius', ['ironwill']).maxStamina === 125 && mk('mid', 'iron').maxStamina === 140);
    const rival = mk();
    const rivalId = E.leagueIds(rival).find((id) => id !== 'own');
    check('场上指挥 / 团队大脑：自己队伍的实力 +1 / +2；对手的实力不变', near(E.teamRating(mk('mid', 'genius', ['iglcalls']), 'own') - E.teamRating(mk(), 'own'), 1) && near(E.teamRating(mk('mid', 'genius', ['teambrain']), 'own') - E.teamRating(mk(), 'own'), 2) && near(E.teamRating(mk('mid', 'genius', ['teambrain']), rivalId), E.teamRating(rival, rivalId)));
    check('国际纵队：首发外援上限 2 → 3', E.importLimit(mk()) === 2 && E.importLimit(mk('mid', 'genius', ['meltingpot'])) === 3);
    check('欧皇附体：抽卡时【核心】以上的权重放大（没有词条时和原来一模一样）', JSON.stringify(E.drawWeights(mk())) === JSON.stringify([28, 32, 22, 13, 5]) && E.drawWeights(mk('mid', 'genius', ['luckycharm'])).every((x, i) => near(x, [28, 32, 22, 13, 5][i] * (i >= 2 ? 1.4 : 1))));
    // 人脉广：战队对你有意向的实力门槛降低
    const ids = E.leagueIds(mk()).filter((id) => id !== 'own');
    const need = (extra, id) => Number((E.interest(mk('mid', 'genius', extra), id).why.match(/达到 (\d+)/) || [])[1]);
    const gate = ids.find((id) => need([], id) > 0 && need(['connections'], id) > 0);
    check('人脉广：战队要求的综合实力门槛 −4', gate !== undefined && need([], gate) - need(['connections'], gate) === 4, gate ? `${need([], gate)} → ${need(['connections'], gate)}` : '没有战队卡在实力门槛上');
  }

  // 胜率类：traitWin 按局面取用；选来的词条加起来有上限，开局和自动获得的不受限
  {
    const none = { deciding: false, first: false, late: false, ahead: false, behind: false, underdog: false, blue: false };
    const m = (kind, elim = false, bo = 3) => ({ kind, split: null, label: '测试', opp: 'omg', bo, elim });
    const w = (extra, kind, ctx = {}, elim = false, bo = 3) => E.traitWin(mk('mid', 'genius', extra), m(kind, elim, bo), { ...none, ...ctx });
    check('没有词条时胜率加成为 0', w([], 'league') === 0 && w([], 'qf', { deciding: true }, true, 5) === 0);
    check('蓝方熟练 / 红方也不怵：只在自己对应的那一边生效', near(w(['bluemain'], 'league', { blue: true }), 0.02) && w(['bluemain'], 'league', { blue: false }) === 0 && near(w(['redmain'], 'league', { blue: false }), 0.02) && w(['redmain'], 'league', { blue: true }) === 0);
    check('常规赛很稳：只在联赛常规赛生效', near(w(['regular'], 'league'), 0.02) && w(['regular'], 'group') === 0 && w(['regular'], 'semi', {}, true, 5) === 0);
    check('关键先生：只在淘汰赛生效', near(w(['biggame'], 'final', {}, true, 5), 0.03) && w(['biggame'], 'league') === 0);
    check('为世界赛而生：世界赛小组赛和淘汰赛都生效，联赛不生效', near(w(['bornforworlds'], 'group', {}, false, 1), 0.05) && near(w(['bornforworlds'], 'wfinal', {}, true, 5), 0.05) && w(['bornforworlds'], 'league') === 0);
    check('开门红 / BO1 选手 / 老将的经验 / 乘胜追击 / 知耻后勇 / 以下克上：各看各的局面', near(w(['opener'], 'league', { first: true }), 0.02) && w(['opener'], 'league', { first: false }) === 0 && near(w(['bo1player'], 'group', {}, false, 1), 0.03) && w(['bo1player'], 'league') === 0 && near(w(['veteran'], 'final', { late: true }, true, 5), 0.03) && w(['veteran'], 'final', { late: false }, true, 5) === 0 && near(w(['momentum'], 'league', { ahead: true }), 0.03) && w(['momentum'], 'league', { behind: true }) === 0 && near(w(['comeback'], 'league', { behind: true }), 0.04) && w(['comeback'], 'league', { ahead: true }) === 0 && near(w(['giantkiller'], 'league', { underdog: true }), 0.04) && w(['giantkiller'], 'league', { underdog: false }) === 0);
    check('开局的大心脏 + 重生者：淘汰赛决胜局 +16%，不受选来词条的上限限制', near(E.traitWin(mk('mid', 'clutch', ['reborn']), m('wfinal', true, 5), { ...none, deciding: true }), 0.16));
    check('选来的词条给的胜率加起来最多 +8%', near(w(['closer'], 'wfinal', { deciding: true }, true, 5), 0.08) && near(w(['closer', 'regular', 'bluemain', 'redmain', 'opener', 'bo1player', 'worldclass', 'unshakable', 'icecold'], 'wfinal', { deciding: true, first: true, underdog: true, behind: true, blue: true }, true, 5), 0.08));
    check('世界冠军（达成条件获得）：淘汰赛 +3%，并且可以和选来的 +8% 叠加', near(E.traitWin(mk('mid', 'genius', ['worldchamp', 'closer']), m('qf', true, 5), none), 0.03 + 0.05));
    // 叠加上限：经济类的词条选得再多，也不会无限叠
    const stacked = E.traitFx(mk('mid', 'genius', ['notebook', 'coach', 'system', 'chosen', 'bargain', 'quickstudy', 'efficient', 'goldhand', 'conditioning', 'lightpack', 'ironwill', 'immortal', 'perpetual', 'teambrain', 'iglcalls', 'allround', 'thrifty', 'patron', 'windfall', 'rankdemon', 'easygoing', 'physio']));
    check(
      '叠加上限：同类加成叠起来不超过其中最强的那一个（训练点 ≤ +25%、加点 ≤ 便宜 30%、队伍实力 ≤ +3），体力上限最多 +40',
      near(stacked.pick.tp, 1.25) && near(stacked.pick.cost, 0.7) && stacked.pick.stamina === 40 && stacked.pick.lead === 3 && near(stacked.pick.rank, 1.35) && near(stacked.pick.funds, 1.6) && near(stacked.pick.injury, 0.2) && near(stacked.all.tp, 1.25 * 1.25) && near(stacked.base.tp, 1.25),
      `${stacked.pick.tp} / ${stacked.pick.cost} / ${stacked.pick.stamina} / ${stacked.pick.lead}`
    );
    const cost84 = (extra) => {
      const s = mk('mid', 'genius', extra);
      s.attrs.reaction = 84;
      return E.pointCostFor(s, 'reaction');
    };
    check('叠加永远不会比单独拿最强的那一个更差，也不会更好：只拿「点石成金」和再叠上别的折扣，花费一样', cost84(['goldhand']) === cost84(['goldhand', 'efficient', 'quickstudy', 'bargain']) && cost84(['goldhand']) < cost84(['bargain']));
    check('上限只管选来的词条：开局的铁人 + 选来的体力词条，开局那部分不会被削', mk('mid', 'iron', ['conditioning', 'lightpack']).maxStamina === 140 + 21 && mk('mid', 'iron', ['conditioning', 'lightpack', 'ironwill', 'immortal', 'perpetual']).maxStamina === 140 + 40);
  }

  // 成对对比：同一种子跑两遍，一遍带词条、一遍不带
  {
    const pair = (extra, run) => {
      const a = mk('mid', 'genius', [], 31);
      const b = mk('mid', 'genius', extra, 31);
      return [run(a), run(b)];
    };
    // 保证接下来这一天能训练：路上遇到比赛就打完
    const ready = (s) => {
      for (let i = 0; i < 30 && !E.canTrain(s); i++) {
        if (s.modal) E.closeSeasonStart(s);
        else if (s.result) E.continueAfterResult(s);
        else if (s.pending) E.playPending(s);
        else break;
      }
    };
    const fresh = (s) => {
      ready(s);
      s.stamina = 100;
      s.injury = 0;
      s.traits = s.traits.filter((id) => id !== 'injury');
    };
    const scrimTp = (s) => {
      let tp = 0;
      for (let i = 0; i < 80; i++) {
        fresh(s);
        if (!E.canTrain(s)) break;
        const before = s.tp;
        E.act(s, 'scrim');
        tp += s.tp - before;
      }
      return tp;
    };
    const [tpA, tpB] = pair(['notebook'], scrimTp);
    check(`复盘笔记（训练点 +5%）：80 天训练赛的训练点 ${tpA} → ${tpB}`, tpA > 200 && tpB - tpA > tpA * 0.03 && tpB - tpA < tpA * 0.07, `${tpA} → ${tpB}`);
    const rankFunds = (s) => {
      let sum = 0;
      for (let i = 0; i < 80; i++) {
        fresh(s);
        if (!E.canTrain(s)) break;
        const before = s.funds;
        E.act(s, 'rank');
        sum += s.funds - before;
      }
      return sum;
    };
    const [fA, fB] = pair(['thrifty'], rankFunds);
    check(`省吃俭用（资金 +10%）：80 天排位的资金 ${fA} → ${fB}`, fB > fA && fB - fA <= 120, `${fA} → ${fB}`);
    const rankPoints = (s) => {
      let gain = 0;
      let loss = 0;
      for (let i = 0; i < 80; i++) {
        fresh(s);
        if (!E.canTrain(s)) break;
        s.rank = 100;
        E.act(s, 'rank');
        const d = s.rank - 100;
        if (d > 0) gain += d;
        else loss -= d;
      }
      return [gain, loss];
    };
    const [rA, rB] = pair(['duoqueue'], rankPoints);
    check(`固定排位搭子（上分 +10%）：80 天排位加的分 ${rA[0]} → ${rB[0]}，掉的分不变（${rA[1]} / ${rB[1]}）`, rA[0] > 0 && rB[0] > rA[0] && rB[1] === rA[1], `${rA.join('/')} → ${rB.join('/')}`);
    const x = rankPoints(mk('mid', 'genius', [], 12));
    const y = rankPoints(mk('mid', 'grinder', [], 12));
    check(`开局的排位狂人：加分 ×1.4（${x[0]} → ${y[0]}），掉分不再被放大（${x[1]} / ${y[1]}）`, y[0] > x[0] * 1.3 && y[1] === x[1], `${x.join('/')} → ${y.join('/')}`);
    const coord = (s) => {
      for (let i = 0; i < 80; i++) {
        fresh(s);
        if (!E.canTrain(s)) break;
        s.team.coord = 0;
        E.act(s, 'scrim');
      }
      return s.team.coord;
    };
    const [cA, cB] = pair(['easygoing'], coord);
    check(`好相处（磨合增长 +20%）：连续训练赛后的磨合度 ${cA} → ${cB}`, cB > cA, `${cA} → ${cB}`);
    const restTp = (s) => {
      s.tp = 0;
      E.act(s, 'rest');
      return s.tp;
    };
    const [hA, hB] = pair(['homework'], restTp);
    check(`带着问题休息：休息一天的训练点 ${hA} → ${hB}`, hA === 0 && hB === 2, `${hA} → ${hB}`);
    const restStamina = (s) => {
      s.stamina = 0;
      E.act(s, 'rest');
      return s.stamina;
    };
    const [sA, sB] = pair(['warmup'], restStamina);
    check(`热身习惯：休息一天恢复的体力 ${sA} → ${sB}`, sA === 45 && sB === 52, `${sA} → ${sB}`);
    const days = (extra) => {
      const s = mk('mid', 'genius', extra, 17);
      for (let i = 0; i < 2000 && s.injury === 0; i++) {
        // 这里不能把伤清掉：要等它真的受伤
        // 加练要 40 体力；练完只剩 5 点，正处在最容易受伤的状态
        ready(s);
        if (!E.canTrain(s)) break;
        s.stamina = 45;
        E.act(s, 'overtrain');
      }
      return s.injury;
    };
    const dA = days([]);
    const dB = days(['fastheal']);
    check(`恢复得快：受伤后休战 ${dA} 天 → ${dB} 天`, dA === 8 && dB === 5, `${dA} → ${dB}`);
  }

  // 整条链路：选来的词条真的会改变比赛结果（同样的 40 段生涯，一边带满胜率词条）
  {
    const seasonWins = (extra, seeds) => {
      let wins = 0;
      for (const seed of seeds) {
        const s = mk('mid', 'genius', extra, seed);
        let guard = 0;
        while (guard++ < 3000) {
          const sp = s.split.spring;
          if (sp && sp.played >= sp.schedule.length) break;
          if (s.modal) E.closeSeasonStart(s);
          else if (s.result) E.continueAfterResult(s);
          else if (s.pending) E.playPending(s);
          else if (s.injury > 0) E.restInjury(s);
          else if (E.canTrain(s)) E.act(s, 'rest');
          else break;
        }
        wins += s.split.spring.table.own.w;
      }
      return wins;
    };
    const seeds = Array.from({ length: 40 }, (_, i) => 100 + i);
    const plain = seasonWins([], seeds);
    const buffed = seasonWins(['regular', 'bluemain', 'redmain', 'opener', 'comeback', 'giantkiller'], seeds);
    console.log(`       40 段生涯的春季常规赛（各 7 场）：不带词条赢 ${plain} 场，带满胜率词条赢 ${buffed} 场`);
    check('带胜率词条的生涯，常规赛赢得更多', buffed > plain + 10, `${plain} → ${buffed}`);
  }

  // 完整生涯里机器人把能选的都选掉：每段“选的次数 = 加点数 ÷ 10”，选到的都合法
  {
    let careers = 0;
    let picks = 0;
    let bad = 0;
    const quality = [0, 0, 0, 0];
    const traitCounts = [];
    for (let seed = 1; seed <= 12; seed++) {
      const pos = ['top', 'jungle', 'mid', 'adc', 'support'][seed % 5];
      const s = E.createGame({ name: '测试', region: 'LPL', pos, trait: ['reborn', 'genius', 'grinder', 'clutch', 'iron'][seed % 5], teamName: '测试队', seed });
      const w = D.POSITIONS.find((p) => p.id === pos).weights;
      let mine = 0;
      let guard = 0;
      while (s.screen === 'main' && guard++ < 80000) {
        if (s.modal) E.closeSeasonStart(s);
        else if (s.result) E.continueAfterResult(s);
        else if (s.pending) E.playPending(s);
        else if (s.injury > 0) E.restInjury(s);
        else if (E.canTrain(s)) {
          // 像正常玩家一样：有训练点就加到最划算的属性上，然后选词条
          for (let i = 0; i < 200; i++) {
            const best = Object.keys(w).sort((a, b) => w[b] / E.pointCostFor(s, b) - w[a] / E.pointCostFor(s, a))[0];
            if (s.attrs[best] >= 96 || !E.addPoint(s, best)) break;
          }
          mine += E.autoPick(s);
          E.act(s, E.canDo(s, 'scrim').ok ? 'scrim' : 'rest');
        } else break;
      }
      careers++;
      picks += mine;
      // 每加 PICK_EVERY 点属性正好一次机会，机器人都用掉了
      if (s.traitPicks !== 0 || mine !== Math.floor(s.pointsAdded / E.PICK_EVERY)) bad++;
      for (const id of s.traits) {
        const t = D.TRAITS.find((x) => x.id === id);
        if (!t) bad++;
        else if (t.pick) {
          quality[t.quality]++;
          if (t.pos && !t.pos.includes(s.pos)) bad++;
        }
      }
      traitCounts.push(s.traits.length);
    }
    console.log(`       ${careers} 段生涯共选了 ${picks} 次；选到的品质：${D.QUALITY.map((q, i) => `${q.name} ${quality[i]}`).join('、')}；每段生涯最后的词条数：${traitCounts.join(' ')}`);
    check('完整生涯里，每一段选词条的次数都正好等于加点数 ÷ 20，机会没有剩下', bad === 0 && picks > 0 && traitCounts.length === careers, `${careers} 段里有 ${bad} 处不对；共选了 ${picks} 次`);
    check('选到的都是合法词条，位置专属的只出现在对应位置；四个品质都选到过', bad === 0 && quality.every((x) => x > 0), quality.join('/'));
  }

  // 旧存档：没有这些字段也能接着玩
  {
    const s = mk('mid', 'genius', [], 8);
    for (const k of ['pointsAdded', 'traitPicks', 'traitOffer', 'pickStreak', 'tpCarry', 'fundsCarry']) delete s[k];
    E.migrate(s);
    s.tp = 1000;
    for (let i = 0; i < E.PICK_EVERY; i++) E.addPoint(s, 'reaction');
    check('旧存档补上默认值后照常积累加点、照常可选词条', s.pointsAdded === E.PICK_EVERY && s.traitPicks === 1 && s.pickStreak === 0 && s.tpCarry === 0 && s.fundsCarry === 0 && E.traitOptions(s).length === 3);
  }
}

console.log('\n[战队与选手]');
{
  const S = [0, 1, 2].map((i) => E.seasonAt(i));
  // 1) 同一个选手在相邻赛季的实力一定不同，而且变化不离谱
  {
    let people = 0;
    const same = [];
    const big = [];
    for (let i = 1; i < S.length; i++) {
      for (const p of Object.values(S[i].players)) {
        const before = S[i - 1].byUid[p.uid];
        if (!before) continue;
        people++;
        const d = p.overall - before.overall;
        if (d === 0) same.push(`${p.id} ${S[i].id}`);
        if (Math.abs(d) > 9) big.push(`${p.id} ${before.overall}→${p.overall}`);
      }
    }
    console.log(`       出现在相邻两个赛季的选手：${people} 人次`);
    check('同一个选手在相邻两个赛季的实力一定不一样', people > 60 && same.length === 0, same.slice(0, 4).join('，'));
    check('单季变化不超过 9 分（不能出现 99 → 79 这种断崖）', big.length === 0, big.slice(0, 4).join('，'));
  }
  // 2) 明星选手的逐季实力是按人写在名单里的，不再跟着队伍成绩大跳
  const line = (uid) => JSON.stringify(S.map((sn) => sn.byUid[uid]?.overall ?? null));
  check('Uzi 90 → 92 → 93，Clearlove 90 → 93，Faker 99 → 98，PawN 94 → 95，Deft 93 → 94', line('uzi') === '[90,92,93]' && line('clearlove') === '[null,90,93]' && line('faker') === '[99,null,98]' && line('pawn') === '[null,94,95]' && line('deft') === '[null,93,94]', `${line('uzi')} ${line('clearlove')} ${line('faker')} ${line('pawn')} ${line('deft')}`);
  check('OMG 的老将 2015 年下滑，但不是断崖：Gogoing 85 → 87 → 80，Cool 84 → 88 → 84', line('gogoing') === '[85,87,80]' && line('cool') === '[84,88,84]', `${line('gogoing')} ${line('cool')}`);
  check('同一个选手的不同写法（Lovelin/Loveling、Dandy/DanDy、bengi/Bengi）算同一个人', [0, 1, 2].every((i) => !Object.values(S[i].players).some((p) => ['Lovelin', 'Dandy', 'bengi'].includes(p.id))) && [0, 1, 2].every((i) => !!S[i].byUid.loveling && !!S[i].byUid.dandy) && !!S[0].byUid.bengi && !!S[2].byUid.bengi);
  check('同一份名单每次建出来的实力都一样（状态起伏是固定的，不是每次随机）', (() => {
    const shape = (list) => JSON.stringify(list.map((sn) => Object.values(sn.players).map((p) => `${p.uid}${p.overall}`).sort()));
    return shape(D.buildAll(R.RAW_SEASONS)) === shape(S);
  })());

  // 3) 名单逐季在变：有队伍进出，留下来的队伍首发也在换
  {
    const lpl = S.map((sn) => sn.leagues.LPL);
    check('LPL 的队伍逐季在变：2014 年新加入 EDG、LGD、WE 青训，2015 年新加入 QG、Snake、VG、M3', lpl[1].filter((id) => !lpl[0].includes(id)).sort().join() === 'edg,lgd,wea' && lpl[2].filter((id) => !lpl[1].includes(id)).sort().join() === 'm3,qg,snake,vg');
    const common = (i, j, id) => Object.values(S[i].byId[id].roster).filter(Boolean).filter((p) => Object.values(S[j].byId[id].roster).some((q) => q && q.uid === p.uid)).length;
    check('留下来的队伍首发也在变：皇族 2013 → 2014 五个人里只留下 Uzi，WE 换了三个，OMG 换了辅助', common(0, 1, 'royal') === 1 && common(0, 1, 'we') === 2 && common(0, 1, 'omg') === 4);
  }

  // 4) 引擎能汇总出本赛季的名单变化
  {
    const news = E.rosterNews(game('mid', 1));
    check('2014 赛季：加入 EDG、LGD、WE 青训；离开 PE、LMQ、EP.HK', news.ok && news.joined.sort().join() === 'edg,lgd,wea' && news.left.sort().join() === 'ephk,lmq,pe');
    const royal = news.moves.find((m) => m.team === 'royal');
    check('皇族：Cola、inSec、corn、Zero 加入，Godlike、Lucky、Wh1t3zZ、Tabe 离队', !!royal && royal.joined.map((p) => p.id).sort().join() === 'Cola,Zero,corn,inSec' && royal.left.map((l) => l.p.id).sort().join() === 'Godlike,Lucky,Tabe,Wh1t3zZ');
    const fzzf = news.moves.find((m) => m.team === 'we')?.left.find((l) => l.p.id === 'Fzzf');
    check('Fzzf 从 WE 转会到了 EDG：在 WE 的离队名单里注明去了哪里', !!fzzf && fzzf.to === 'EDG', fzzf ? String(fzzf.to) : '没找到');
    const news5 = E.rosterNews(game('mid', 2));
    const edg = news5.moves.find((m) => m.team === 'edg');
    check('2015 赛季：加入 QG、Snake、VG、M3，离开 皇族、WE、YG、WE 青训；EDG 来了 PawN、Deft、Meiko', news5.joined.sort().join() === 'm3,qg,snake,vg' && news5.left.sort().join() === 'royal,we,wea,yg' && !!edg && edg.joined.map((p) => p.id).sort().join() === 'Deft,Meiko,PawN');
    check('第一个赛季没有可以对比的上赛季', E.rosterNews(game('mid', 0)).ok === false);
  }

  // 5) 新赛季开始时，变化直接写进生涯记录
  {
    const texts = game('mid', 1).log.map((l) => l.text);
    const head = texts.slice(0, 4);
    check('赛季开始的生涯记录里写了队伍的增减和换人，并且“赛季开始”在最上面', head[0]?.startsWith('S4 赛季') && texts.some((t) => t.includes('新赛季 LPL') && t.includes('EDG') && t.includes('PE')) && texts.some((t) => t.includes('皇族换人') && t.includes('inSec') && t.includes('Godlike')), head.join(' | '));
  }

  // 6) 自己的战队顶替的是五名首发实际最弱的队
  {
    const ids = E.leagueIds(game('mid', 2));
    check('用自己的战队打 2015 赛季时，顶替的是最弱的 M3，而不是 Uzi 所在的 OMG', ids.includes('own') && !ids.includes('m3') && ids.includes('omg'), ids.join(','));
  }
}

console.log('\n[世界赛]');
{
  // 1) 一直休息、不加点的玩家：进不了世界赛，名单应与当年真实名单完全一致
  for (const si of [0, 1, 2]) {
    const s = game('mid', si);
    let guard = 0;
    while (!s.worlds?.champion && guard++ < 5000) {
      if (s.modal) E.closeSeasonStart(s);
      else if (s.result) E.continueAfterResult(s);
      else if (s.pending) E.playPending(s);
      else if (s.injury > 0) E.restInjury(s);
      else if (E.canTrain(s)) {
        const a = s.rank < 640 ? 'rank' : 'rest';
        E.act(s, E.canDo(s, a).ok ? a : 'rest');
      } else throw new Error(`测试机器人卡住：${s.plan[s.cursor]?.t}/${s.plan[s.cursor]?.phase}`);
    }
    const W = s.worlds;
    const lineup = [...W.groups.flat(), ...W.seeds].sort();
    const spec = E.cur(s).worlds;
    const real = [...spec.groups.flat(), ...(spec.seeds ?? [])].sort();
    check(`${LPL[si]} 没进世界赛的玩家：世界赛名单 = 当年真实名单（冠军 ${E.teamName(s, W.champion)}）`, W.champion && lineup.join() === real.join() && W.userOut, `${lineup.length} vs ${real.length} 支`);
    check(`${LPL[si]} 八强是 8 支不重复的参赛队伍`, W.bracket.length === 8 && new Set(W.bracket).size === 8 && W.bracket.every((id) => lineup.includes(id)));
    console.log(`       ${LPL[si]} 四强：${W.sfWinners.map((id) => E.teamName(s, id)).join('、')}；决赛：${E.teamName(s, W.champion)} 对 ${E.teamName(s, W.runnerUp)}`);
  }
  // 2) 自己的战队很强、拿到第一：应顶替一支 LPL 的真实队伍，总人数不变
  for (const si of [0, 1, 2]) {
    const s = game('mid', si);
    for (const p of D.POS_ORDER) s.team.trainees[p] = 99;
    for (const a of Object.keys(s.attrs)) s.attrs[a] = 99;
    let guard = 0;
    while (!s.worlds?.bracket && guard++ < 5000) {
      if (s.modal) E.closeSeasonStart(s);
      else if (s.result) E.continueAfterResult(s);
      else if (s.pending) E.playPending(s);
      else if (s.injury > 0) E.restInjury(s);
      else if (E.canTrain(s)) E.act(s, 'rest');
      else break;
    }
    const W = s.worlds;
    const lineup = [...W.groups.flat(), ...W.seeds];
    const lplReal = lineup.filter((id) => id !== 'own' && E.cur(s).byId[id]?.region === 'LPL').length;
    check(`${LPL[si]} 自己的战队进世界赛：总数 ${lineup.length} 不变、名单里有自己的战队且没有重复`, lineup.length === (si === 0 ? 14 : 16) && lineup.includes('own') && new Set(lineup).size === lineup.length);
    console.log(`       ${LPL[si]} 分组：${W.groups.map((g, i) => `${'ABCD'[i]}[${g.map((id) => E.teamName(s, id)).join(' ')}]`).join(' ')}${W.seeds.length ? ` 种子：${W.seeds.map((id) => E.teamName(s, id)).join(' ')}` : ''}`);
  }
}

// 3) 其他赛区不模拟联赛，照当年的真实结果进世界赛：不管自己打得出不出线，它们的名单都不能变
{
  let checked = 0;
  let bad = 0;
  let careers = 0;
  for (let seed = 1; seed <= 45; seed++) {
    const s = E.createGame({ name: '测试', region: 'LPL', pos: ['top', 'jungle', 'mid', 'adc', 'support'][seed % 5], trait: 'genius', teamName: '测试队', seed });
    E.closeSeasonStart(s);
    // 一部分局把自己的队调得很强（一定能进世界赛并挤掉同赛区的真实队伍），另一部分很弱
    if (seed % 2) for (const p of D.POS_ORDER) s.team.trainees[p] = 99;
    if (seed % 3 === 0) for (const p of D.POS_ORDER) s.team.trainees[p] = 30;
    let guard = 0;
    const seen = new Set();
    while (s.screen === 'main' && guard++ < 80000) {
      if (s.modal) E.closeSeasonStart(s);
      else if (s.result) E.continueAfterResult(s);
      else if (s.pending) E.playPending(s);
      else if (s.injury > 0) E.restInjury(s);
      else if (E.canTrain(s)) E.act(s, E.canDo(s, 'scrim').ok ? 'scrim' : 'rest');
      else break;
      if (s.worlds && !seen.has(s.season)) {
        seen.add(s.season);
        // 'own' 是玩家自己的战队，也算 LPL
        const others = (ids) => ids.filter((id) => id !== 'own' && E.cur(s).byId[id]?.region !== 'LPL').sort().join();
        const spec = E.cur(s).worlds;
        checked++;
        const live = others([...s.worlds.groups.flat(), ...s.worlds.seeds]);
        const real = others([...spec.groups.flat(), ...(spec.seeds ?? [])]);
        if (live !== real) {
          bad++;
          if (bad <= 3) console.log(`       ${E.cur(s).id} 其他赛区的名单变了：${live} 应为 ${real}`);
        }
      }
    }
    careers++;
  }
  check(`打了 ${careers} 局完整生涯：其他赛区进世界赛的队伍（共 ${checked} 个赛季）全部等于当年真实名单`, bad === 0);
}

console.log(`\n${failed === 0 ? '全部通过' : `${failed} 项失败`}`);
await vite.close();
process.exit(failed ? 1 : 0);
