// 「重生之我是英雄联盟职业选手」规则测试：数据完整性、非卖品、外援上限、世界赛名单与赛制。
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
check('目前只有 LPL 可以选（其他赛区联赛名单没核实）', regions.length === 1 && regions[0] === 'LPL', regions.join(','));

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
