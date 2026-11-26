/**
 * 赛事：联赛常规赛与季后赛、世界赛（名额、分组、小组赛、淘汰赛）。
 */
import { addHonor, addTrait, cur, leagueIds, log, splitName, tableOrder, teamLabel, teamName, teamRating, type GameState, type Playoffs, type SplitId, type SplitState } from './core';
import { aiSeries } from './match';

const LETTER = 'ABCD';

/** 把一个系列赛的结果记进积分榜 */
export function record(table: SplitState['table'], a: string, b: string, wa: number, wb: number): void {
  const aw = wa > wb;
  table[a].w += aw ? 1 : 0;
  table[a].l += aw ? 0 : 1;
  table[a].rw += wa;
  table[a].rl += wb;
  table[b].w += aw ? 0 : 1;
  table[b].l += aw ? 1 : 0;
  table[b].rw += wb;
  table[b].rl += wa;
}

/** 电脑打一场 BO5，返回胜者 */
function ko(s: GameState, a: string, b: string, what: string): string {
  const [wa, wb] = aiSeries(s, teamRating(s, a), teamRating(s, b), 5);
  log(s, `${what}：${teamLabel(s, a)} ${wa}-${wb} ${teamLabel(s, b)}`, 'match');
  return wa > wb ? a : b;
}

// ---------- 联赛 ----------
/** 常规赛开始：不涉及自己的对阵由电脑一次打完，自己的每一场在比赛日一场一场打 */
export function ensureSplit(s: GameState, stage: SplitId): SplitState {
  const existing = s.split[stage];
  if (existing) return existing;
  const ids = leagueIds(s);
  const mine = s.team.id;
  const table: SplitState['table'] = {};
  for (const id of ids) table[id] = { w: 0, l: 0, rw: 0, rl: 0 };
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      if (ids[i] === mine || ids[j] === mine) continue;
      const [wa, wb] = aiSeries(s, teamRating(s, ids[i]), teamRating(s, ids[j]), 3);
      record(table, ids[i], ids[j], wa, wb);
    }
  }
  // 自己的赛程强弱交替：最强、最弱、次强、次弱……
  const rest = ids.filter((id) => id !== mine).sort((a, b) => teamRating(s, b) - teamRating(s, a));
  const schedule: string[] = [];
  while (rest.length) {
    schedule.push(rest.shift()!);
    if (rest.length) schedule.push(rest.pop()!);
  }
  const sp: SplitState = { mine, ids, table, schedule, played: 0, playoffs: null };
  s.split[stage] = sp;
  return sp;
}

function finalOf(s: GameState, a: string, b: string, name: string): [string, string] {
  const [wa, wb] = aiSeries(s, teamRating(s, a), teamRating(s, b), 5);
  const win = wa > wb ? a : b;
  log(s, `${name}决赛：${teamLabel(s, a)} ${wa}-${wb} ${teamLabel(s, b)}`, 'title');
  return [win, win === a ? b : a];
}

/** 常规赛结束，排定季后赛：前四名进季后赛，1 打 4、2 打 3 */
export function seedPlayoffs(s: GameState, sp: SplitState, stage: SplitId): void {
  if (sp.playoffs) return;
  const me = sp.mine;
  const seeds = tableOrder(s, sp).slice(0, 4);
  const ui = seeds.indexOf(me);
  const pairs: [string, string][] =
    ui === 1 || ui === 2
      ? [
          [seeds[1], seeds[2]],
          [seeds[0], seeds[3]],
        ]
      : [
          [seeds[0], seeds[3]],
          [seeds[1], seeds[2]],
        ];
  const po: Playoffs = {
    seeds, userIn: ui >= 0, userInFinal: false, semiDone: false, finalDone: false,
    semiOpp: null, otherPair: pairs[1], otherWinner: null, champion: null, runnerUp: null, semis: [],
  };
  sp.playoffs = po;
  const name = splitName(stage);
  log(s, `${name}常规赛结束。季后赛对阵：${teamLabel(s, seeds[0])} 对 ${teamLabel(s, seeds[3])}，${teamLabel(s, seeds[1])} 对 ${teamLabel(s, seeds[2])}。`, 'match');
  po.otherWinner = ko(s, pairs[1][0], pairs[1][1], `${name}半决赛`);
  po.semis.push(po.otherWinner === pairs[1][0] ? pairs[1][1] : pairs[1][0]);
  if (po.userIn) {
    po.semiOpp = pairs[0][0] === me ? pairs[0][1] : pairs[0][0];
    return;
  }
  // 没进季后赛：另一场半决赛和决赛直接模拟
  const w0 = ko(s, pairs[0][0], pairs[0][1], `${name}半决赛`);
  po.semis.push(w0 === pairs[0][0] ? pairs[0][1] : pairs[0][0]);
  po.finalDone = true;
  [po.champion, po.runnerUp] = finalOf(s, w0, po.otherWinner!, name);
}

/** 自己的半决赛打完后结算 */
export function afterSemi(s: GameState, sp: SplitState, stage: SplitId, won: boolean): string {
  const po = sp.playoffs!;
  const name = splitName(stage);
  po.semiDone = true;
  if (won) {
    po.userInFinal = true;
    return '晋级决赛';
  }
  po.semis.push(sp.mine);
  po.finalDone = true;
  [po.champion, po.runnerUp] = finalOf(s, po.otherWinner!, po.semiOpp!, name);
  addHonor(s, `${name}四强`);
  return '止步四强';
}

/** 自己的决赛打完后结算 */
export function afterFinal(s: GameState, sp: SplitState, stage: SplitId, won: boolean): string {
  const po = sp.playoffs!;
  const name = splitName(stage);
  po.finalDone = true;
  po.champion = won ? sp.mine : po.otherWinner!;
  po.runnerUp = won ? po.otherWinner! : sp.mine;
  log(s, `${name}冠军：${teamLabel(s, po.champion)}`, 'title');
  if (won) {
    addHonor(s, `${name}冠军`);
    addTrait(s, 'champion');
    s.funds += 300;
    return `你夺得了${name}冠军`;
  }
  addHonor(s, `${name}亚军`);
  s.funds += 120;
  return '获得亚军';
}

/** 赛区内的最终排名：季后赛名次优先，其余按常规赛 */
export function regionalOrder(s: GameState, sp: SplitState): string[] {
  const po = sp.playoffs;
  const base = tableOrder(s, sp);
  if (!po?.champion) return base;
  const rank = (id: string) => base.indexOf(id);
  const semis = [...po.semis].sort((a, b) => rank(a) - rank(b));
  const top = [po.champion, po.runnerUp!, ...semis];
  return [...top, ...base.filter((id) => !top.includes(id))];
}

/** 这半个赛季自己的名次 */
export function splitOutcome(s: GameState, sp: SplitState | null): string {
  if (!sp) return '—';
  const me = sp.mine;
  const po = sp.playoffs;
  if (po?.champion === me) return '冠军';
  if (po?.runnerUp === me) return '亚军';
  if (po?.semis.includes(me)) return '四强';
  return `第 ${tableOrder(s, sp).indexOf(me) + 1} 名`;
}

// ---------- 世界赛 ----------
/** 小组赛里自己每一轮的两个对手：双循环，每个对手打两次 */
function groupRounds(others: string[]): string[][] {
  if (others.length < 2) return others.length ? [[others[0]], [others[0]]] : [];
  const shift = others.length % 2 === 0 ? 1 : 2;
  const seq = [...others, ...others.map((_, i) => others[(i + shift) % others.length])];
  const rounds: string[][] = [];
  for (let i = 0; i < seq.length; i += 2) rounds.push(seq.slice(i, i + 2));
  return rounds;
}

/**
 * 世界赛开始：以当年的真实参赛名单和分组为准。
 * 自己所在赛区的名额按夏季赛成绩决定；自己的战队如果挤掉了同赛区的一支真实队伍，就坐到它的位置上。
 */
export function startWorlds(s: GameState): void {
  const season = cur(s);
  const spec = season.worlds;
  const me = s.team.id;
  const order = regionalOrder(s, s.split.summer!);
  const slots = spec.slots[s.region] ?? 2;
  const flat = [...spec.groups.flat(), ...(spec.seeds ?? [])];
  const real = new Set(flat);
  const mine = (id: string) => season.byId[id]?.region === s.region;

  const entrants: string[] = [];
  for (const id of order) {
    if (entrants.length >= slots) break;
    if (id === me || real.has(id)) entrants.push(id);
  }
  for (const id of flat.filter(mine).sort((a, b) => season.byId[b].rating - season.byId[a].rating)) {
    if (entrants.length >= slots) break;
    if (!entrants.includes(id)) entrants.push(id);
  }

  const groups = spec.groups.map((g) => g.filter((id) => !mine(id) || entrants.includes(id)));
  const seeds = (spec.seeds ?? []).filter((id) => !mine(id) || entrants.includes(id));
  let seedOf: string | null = null;
  if (entrants.includes(me) && !real.has(me)) {
    const pushed = flat.find((id) => mine(id) && !entrants.includes(id));
    // 被顶替的队伍原来是不是种子队，要按原始名单查（上面已经把它从 seeds 里筛掉了）
    const seedIdx = pushed ? (spec.seeds ?? []).indexOf(pushed) : -1;
    const groupIdx = pushed ? spec.groups.findIndex((g) => g.includes(pushed)) : -1;
    if (seedIdx >= 0) {
      // 顶替的是种子队：坐到它的位置上，直接进八强
      seeds.splice(seedIdx, 0, me);
      seedOf = pushed!;
    } else {
      // 否则坐进被顶替队伍所在的小组；没有可顶替的就进人最少的小组
      const gi = groupIdx >= 0 ? groupIdx : groups.reduce((best, g, i) => (g.length < groups[best].length ? i : best), 0);
      if (groups.length) groups[gi].push(me);
      else seeds.push(me);
    }
  }

  const tables = groups.map((g) => Object.fromEntries(g.map((id) => [id, { w: 0, l: 0 }])));
  groups.forEach((g, gi) => {
    for (let i = 0; i < g.length; i++) {
      for (let j = i + 1; j < g.length; j++) {
        if (g[i] === me || g[j] === me) continue;
        for (let n = 0; n < 2; n++) {
          // 小组赛双循环 BO1
          const aWins = aiSeries(s, teamRating(s, g[i]), teamRating(s, g[j]), 1)[0] === 1;
          tables[gi][aWins ? g[i] : g[j]].w++;
          tables[gi][aWins ? g[j] : g[i]].l++;
        }
      }
    }
  });
  const userGroup = groups.findIndex((g) => g.includes(me));
  const others = userGroup >= 0 ? groups[userGroup].filter((id) => id !== me) : [];
  s.worlds = {
    groups, tables, order: null, userGroup, userSeeded: seeds.includes(me), seeds, seedOf,
    rounds: groupRounds(others), round: 0, queue: [],
    bracket: null, qfWinners: null, sfWinners: null, champion: null, runnerUp: null, userOut: !entrants.includes(me),
    koStage: 0, koPair: -1, koOpp: null, koWinners: null,
  };
  const draw = groups.map((g, i) => `${LETTER[i]} 组 ${g.map((id) => teamName(s, id)).join('、')}`).join('；');
  log(s, `${season.id} 全球总决赛分组：${draw}${seeds.length ? `；直接进八强：${seeds.map((id) => teamName(s, id)).join('、')}` : ''}`, 'match');
  if (!entrants.includes(me)) {
    log(s, '你没有拿到世界赛的门票，只能在训练室里看比赛。', 'bad');
    finishGroups(s);
  } else {
    s.funds += 200;
    log(s, seeds.includes(me) ? '你作为种子队直接晋级世界赛八强。' : '你踏上了世界赛的舞台。', 'title');
  }
}

/** 小组赛结束（或自己不用打小组赛）：排出名次，按当年的对阵顺序定出八强 */
export function finishGroups(s: GameState): void {
  const W = s.worlds!;
  const me = s.team.id;
  const spec = cur(s).worlds;
  W.order = W.groups.map((g, gi) => [...g].sort((a, b) => W.tables[gi][b].w - W.tables[gi][a].w || teamRating(s, b) - teamRating(s, a)));
  W.groups.forEach((_, gi) => {
    const t = W.tables[gi];
    log(s, `世界赛 ${LETTER[gi]} 组：` + W.order![gi].map((id) => `${teamName(s, id)} ${t[id].w} 胜 ${t[id].l} 负`).join('、'), 'match');
  });
  const at = (code: string): string | null => {
    if (code.startsWith('seed:')) {
      const id = code.slice(5);
      // 自己的战队顶替了这支种子队，就坐在它的位置上
      if (id === W.seedOf) return me;
      return W.seeds.includes(id) ? id : null;
    }
    return W.order![LETTER.indexOf(code[0])]?.[Number(code[1]) - 1] ?? null;
  };
  const bracket: (string | null)[] = spec.bracket.map(at);
  // 对阵表里取不到的位置（比如那支队伍这次没来），用没进八强的队伍里成绩最好的补上
  const spare = [...W.order!.flatMap((g) => g.slice(2)), ...W.seeds.filter((id) => !bracket.includes(id))];
  for (let i = 0; i < bracket.length; i++) {
    if (bracket.slice(0, i).includes(bracket[i])) bracket[i] = null;
    if (!bracket[i]) bracket[i] = spare.shift() ?? null;
  }
  W.bracket = bracket.filter((x): x is string => !!x);
  const through = W.bracket.includes(me);
  if (through) {
    setWorldsHonor(s, '全球总决赛八强');
    log(s, W.userSeeded ? '你以种子身份直接进入世界赛八强。' : '小组赛出线，晋级八强！', 'title');
    return;
  }
  if (!W.userOut) log(s, '小组赛没能出线，你的世界赛到此为止。', 'bad');
  W.userOut = true;
  settleKO(s);
}

/** 淘汰赛的一个阶段开始：不涉及自己的对阵先由电脑打完，再给自己排比赛（stage：0 八强、1 半决赛、2 决赛） */
export function openKO(s: GameState, stage: number): void {
  const W = s.worlds!;
  const alive = (stage === 0 ? W.bracket : stage === 1 ? W.qfWinners : W.sfWinners) as string[] | null;
  const me = s.team.id;
  W.koPair = -1;
  if (!alive) return;
  const slot = alive.indexOf(me);
  const pairs: [number, number][] = stage === 2 ? [[0, 1]] : [[0, 1], [2, 3], [4, 5], [6, 7]];
  const pair = pairs.findIndex(([a, b]) => slot === a || slot === b);
  if (pair < 0) return;
  const what = stage === 0 ? '世界赛八强战' : stage === 1 ? '世界赛半决赛' : '世界赛决赛';
  W.koStage = stage;
  W.koPair = pair;
  W.koWinners = pairs.map(([a, b], i) => (i === pair ? null : ko(s, alive[a], alive[b], what)));
  const opp = alive[pairs[pair][0] === slot ? pairs[pair][1] : pairs[pair][0]];
  W.koOpp = opp;
  s.pending = { kind: stage === 0 ? 'qf' : stage === 1 ? 'sf' : 'wfinal', split: null, label: what, opp, bo: 5, elim: true };
}

/** 自己的淘汰赛打完后结算；输了就把剩下的比赛全部模拟完 */
export function closeKO(s: GameState, won: boolean, finalScore: number): string {
  const W = s.worlds!;
  const me = s.team.id;
  const id = cur(s).id;
  const winners = W.koWinners!.slice() as string[];
  const opp = W.koOpp!;
  winners[W.koPair] = won ? me : opp;
  if (W.koStage === 0) {
    W.qfWinners = winners;
    log(s, `世界赛四强：${winners.map((x) => teamName(s, x)).join('、')}`, 'match');
    if (!won) {
      W.userOut = true;
      settleKO(s);
      return '止步八强';
    }
    return '晋级半决赛';
  }
  if (W.koStage === 1) {
    W.sfWinners = winners;
    log(s, `世界赛决赛：${teamName(s, winners[0])} 对 ${teamName(s, winners[1])}`, 'match');
    if (!won) {
      setWorldsHonor(s, '全球总决赛四强');
      W.userOut = true;
      settleKO(s);
      return '止步四强';
    }
    return '晋级决赛';
  }
  W.champion = won ? me : opp;
  W.runnerUp = won ? opp : me;
  log(s, `${id} 全球总决赛冠军：${teamLabel(s, W.champion)}`, 'title');
  if (won) {
    setWorldsHonor(s, '全球总决赛冠军');
    addTrait(s, 'worldchamp');
    if (finalScore >= 8.5) addHonor(s, `${id}全球总决赛 FMVP`);
    s.funds += 500;
    return '你是世界冠军';
  }
  setWorldsHonor(s, '全球总决赛亚军');
  return '获得亚军';
}

/** 把还没打的淘汰赛全部模拟出结果 */
export function settleKO(s: GameState): void {
  const W = s.worlds!;
  if (W.bracket && !W.qfWinners) W.qfWinners = [0, 2, 4, 6].map((i) => ko(s, W.bracket![i], W.bracket![i + 1], '世界赛八强战'));
  if (W.qfWinners && !W.sfWinners) {
    W.sfWinners = [ko(s, W.qfWinners[0], W.qfWinners[1], '世界赛半决赛'), ko(s, W.qfWinners[2], W.qfWinners[3], '世界赛半决赛')];
  }
  if (W.sfWinners && !W.champion) {
    const [wa, wb] = aiSeries(s, teamRating(s, W.sfWinners[0]), teamRating(s, W.sfWinners[1]), 5);
    W.champion = wa > wb ? W.sfWinners[0] : W.sfWinners[1];
    W.runnerUp = W.champion === W.sfWinners[0] ? W.sfWinners[1] : W.sfWinners[0];
    log(s, `${cur(s).id} 全球总决赛冠军：${teamLabel(s, W.champion)}（决赛 ${Math.max(wa, wb)}-${Math.min(wa, wb)} ${teamName(s, W.runnerUp)}）`, 'title');
  }
}

export function worldsOutcome(s: GameState): string {
  const W = s.worlds;
  if (!W) return '—';
  const me = s.team.id;
  if (W.champion === me) return '冠军';
  if (W.runnerUp === me) return '亚军';
  // 打过四分之一决赛的四支队伍就是四强（qfWinners 存的是四分之一决赛的胜者，也就是进了半决赛的队伍）
  if (W.qfWinners?.includes(me)) return '四强';
  if (W.bracket?.includes(me)) return '八强';
  return W.userGroup >= 0 ? '小组赛' : '未参赛';
}

/** 世界赛的名次荣誉只保留最好的那一个：进了四强就不再同时挂着“八强” */
function setWorldsHonor(s: GameState, rank: string): void {
  const id = cur(s).id;
  const ranks = ['全球总决赛八强', '全球总决赛四强', '全球总决赛亚军', '全球总决赛冠军'];
  s.honors = s.honors.filter((h) => !(h.season === id && ranks.some((r) => h.name === id + r)));
  addHonor(s, `${id}${rank}`);
}
