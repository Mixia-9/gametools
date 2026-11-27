// 「重生之我是英雄联盟职业选手」引擎自动测试：
// 让几种不同打法的机器人各跑若干局完整生涯，检查会不会卡死、报错，以及数值是否合理。
// 用法：node scripts/sim-lol.mjs [每个打法的局数]
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

const runs = Number(process.argv[2] ?? 200);
const root = fileURLToPath(new URL('..', import.meta.url));
const vite = await createServer({ root, configFile: false, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const E = await vite.ssrLoadModule('/src/games/lol/engine.ts');
const D = await vite.ssrLoadModule('/src/games/lol/data.ts');

const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const pct = (n, d) => `${d ? Math.round((n / d) * 100) : 0}%`;

// 几种打法：joiner = 有队要就去；owner = 一直留自己的队抽卡；slacker = 只排位不加点；lazy = 从不抽卡也不换阵容
const STYLES = ['joiner', 'owner', 'slacker', 'lazy'];

function spend(s) {
  // 像正常玩家一样分配：每点训练点能换来最多综合实力的属性，就加哪项
  const w = D.POSITIONS.find((p) => p.id === s.pos).weights;
  for (let guard = 0; guard < 5000; guard++) {
    const value = (a) => w[a] / E.pointCost(s.attrs[a]);
    const target = Object.keys(w).sort((x, y) => value(y) - value(x))[0];
    if (s.attrs[target] >= 96 || !E.addPoint(s, target)) break;
  }
}

function windowMoves(s, style) {
  if (style === 'slacker' || style === 'lazy') return;
  if (style === 'joiner') {
    const best = E
      .cur(s)
      .leagues[s.region].map((id) => ({ id, r: E.teamRating(s, id) }))
      .filter((t) => E.interest(s, t.id).ok)
      .sort((a, b) => b.r - a.r)[0];
    if (best && (s.team.kind === 'own' || E.teamRating(s, best.id) > E.teamRating(s, s.team.id) + 4)) E.joinTeam(s, best.id);
  }
  if (s.team.kind !== 'own') return;
  // 抽卡，然后把每个位置最强的可用选手放进首发
  while (s.funds >= E.DRAW_COST) {
    if (!E.draw(s, 'home', 1).length) break;
  }
  for (const pos of D.POS_ORDER) {
    if (pos === s.pos) continue;
    const cands = s.bench
      .filter((id) => E.findPro(s, id)?.pos === pos)
      .sort((a, b) => E.findPro(s, b).overall - E.findPro(s, a).overall);
    const best = cands[0];
    if (!best) continue;
    const cur = s.team.members[pos] ? E.findPro(s, s.team.members[pos])?.overall ?? 42 : s.team.trainees[pos];
    if (E.findPro(s, best).overall > cur) E.setMember(s, pos, best);
  }
}

function choose(s, style) {
  if (s.stamina < 35) return 'rest';
  if (style === 'slacker') return 'rank';
  if (E.isWindow(s)) return 'scrim';
  if (s.rank < 620 && style !== 'owner') return 'rank';
  if (style === 'owner') return s.funds % 7 === 0 ? 'overtrain' : 'scrim';
  return Math.random() < 0.4 ? 'rank' : 'scrim';
}

function check(s, where) {
  const bad = (m) => {
    throw new Error(`${where}: ${m}`);
  };
  if (!Number.isFinite(s.stamina) || s.stamina < 0 || s.stamina > s.maxStamina) bad(`体力越界 ${s.stamina}`);
  if (!Number.isFinite(s.rank) || s.rank < 0 || s.rank > 1000) bad(`段位分越界 ${s.rank}`);
  for (const a of Object.values(s.attrs)) if (!Number.isFinite(a) || a < 1 || a > 99) bad(`属性越界 ${a}`);
  if (s.cursor > s.plan.length) bad('日程越界');
  if (!Number.isFinite(E.overall(s))) bad('实力不是数字');
  if (s.tp < 0 || s.funds < 0) bad('训练点或资金为负');
  JSON.stringify(s);
}

function play(style, seed) {
  const s = E.createGame({
    name: '测试', region: 'LPL', pos: ['top', 'jungle', 'mid', 'adc', 'support'][seed % 5], trait: ['reborn', 'genius', 'grinder', 'clutch', 'iron'][seed % 5], teamName: '测试队', seed,
  });
  let guard = 0;
  let injuries = 0;
  let draws = 0;
  let picks = 0;
  while (s.screen !== 'careerEnd') {
    if (guard++ > 60000) throw new Error(`${style} #${seed}: 跑不完，卡在 ${s.plan[s.cursor]?.t} ${s.plan[s.cursor]?.phase} pending=${!!s.pending} injury=${s.injury}`);
    if (s.modal) {
      E.closeSeasonStart(s);
      continue;
    }
    if (s.result) {
      E.continueAfterResult(s);
      continue;
    }
    if (s.pending) {
      E.playPending(s);
      continue;
    }
    if (s.injury > 0) {
      injuries++;
      E.restInjury(s);
      continue;
    }
    const before = s.funds;
    windowMoves(s, style);
    if (s.funds < before) draws++;
    if (style !== 'slacker') {
      spend(s);
      // 有选词条的机会就用掉，每次选品质最高的（玩家一般也会这么选）
      picks += E.autoPick(s);
    }
    let a = choose(s, style);
    if (!E.canDo(s, a).ok) a = 'rest';
    if (!E.canDo(s, a).ok) throw new Error(`${style} #${seed}: 卡住了，既不能训练也不能休息`);
    E.act(s, a, 1);
    check(s, `${style} #${seed}`);
  }
  const c = E.careerSummary(s);
  return { ...c, injuries, picks, drewCards: draws > 0, honors: s.honors.map((h) => h.name), team: s.team.kind, rank: s.rank, bySeason: s.history.map((h) => h.overall), worldsBySeason: s.history.map((h) => h.worlds), joinedAt: s.history.findIndex((h) => h.team !== '测试队'), cardCount: s.log.filter((l) => l.kind === 'gacha').length };
}

const report = {};
for (const style of STYLES) {
  const rs = [];
  for (let i = 0; i < runs; i++) rs.push(play(style, i + 1));
  report[style] = {
    局数: rs.length,
    平均最终实力: +avg(rs.map((r) => r.overall)).toFixed(1),
    最高实力: Math.max(...rs.map((r) => r.overall)),
    拿过世界赛冠军: `${rs.filter((r) => r.worldsTitles > 0).length} 局`,
    世界赛冠军总数: rs.reduce((a, r) => a + r.worldsTitles, 0),
    联赛冠军总数: rs.reduce((a, r) => a + r.leagueTitles, 0),
    生涯有冠军的局数: rs.filter((r) => r.titles.length > 0).length,
    受伤局数: rs.filter((r) => r.injuries > 0).length,
    最终在真实战队: `${rs.filter((r) => r.team === 'real').length} 局`,
    S3后实力: +avg(rs.map((r) => r.bySeason[0])).toFixed(1),
    S4后实力: +avg(rs.map((r) => r.bySeason[1])).toFixed(1),
    平均选词条: +avg(rs.map((r) => r.picks)).toFixed(1),
    进过世界赛: `${rs.filter((r) => r.worldsBySeason.some((w) => w !== '未参赛' && w !== '—')).length} 局`,
    八强及以上次数: rs.reduce((a, r) => a + r.worldsBySeason.filter((w) => ['冠军', '亚军', '四强', '八强'].includes(w)).length, 0),
    抽过卡: `${rs.filter((r) => r.drewCards).length} 局`,
  };
}

console.table(report);
await vite.close();
