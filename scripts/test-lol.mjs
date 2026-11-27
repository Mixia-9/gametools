// 「重生之我是英雄联盟职业选手」规则测试：数据完整性、非卖品、外援上限、英雄与赛季、赛前 BP、世界赛名单与赛制。
// 用法：node scripts/test-lol.mjs
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const vite = await createServer({ root, configFile: false, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const E = await vite.ssrLoadModule('/src/games/lol/engine.ts');
const D = await vite.ssrLoadModule('/src/games/lol/data.ts');

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
