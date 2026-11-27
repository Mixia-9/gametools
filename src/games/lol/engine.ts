/**
 * 主流程：创建生涯、每天的行动、比赛日的推进、赛季结束与存档。
 * 界面只需要调用这里导出的函数。
 */
import { POS_ORDER, type Attr, type Position, type Region } from './data';
import { carryTeam, DRAW_COST, interest, joinTeam, makeOwnTeam } from './squad';
import { afterFinal, afterSemi, closeKO, ensureSplit, finishGroups, openKO, record, seedPlayoffs, splitOutcome, startWorlds, worldsOutcome } from './competition';
import { playSeries, preMatch } from './match';
import {
  addTrait, buildPlan, canRestInjury, canTrain, clamp, cur, has, leagueIds, log, overall, pointCost, removeTrait, ri, rnd, seasonAt, seasonCount, splitName, stepOf,
  teamLabel, teamName, tierOf,
  type Action, type GameState, type Pending, type SeasonSummary, type SeriesResult, type SplitId,
} from './core';

export * from './core';
export { preMatch };
export { DRAW_COST, interest, joinTeam, makeOwnTeam, draw, setMember, release, poolOf, rarityOf, RARITY, imports } from './squad';
export type { Pool } from './squad';
export { splitOutcome, worldsOutcome } from './competition';

export interface NewGame {
  name: string;
  region: Region;
  pos: Position;
  trait: string;
  teamName: string;
  seed?: number;
}

const SAVE_KEY = 'gametools-lol-save';
const POS_LABEL: Record<Position, string> = { top: '上单', jungle: '打野', mid: '中单', adc: 'ADC', support: '辅助' };

const emptyMembers = (): Record<Position, string | null> => ({ top: null, jungle: null, mid: null, adc: null, support: null });

// ---------- 创建 ----------
export function createGame(o: NewGame): GameState {
  const s = {
    v: 1,
    rng: ((o.seed ?? Math.floor(Math.random() * 0x7fffffff)) >>> 0) || 1,
    screen: 'main',
    name: o.name.trim().slice(0, 12) || '无名选手',
    region: o.region,
    pos: o.pos,
    attrs: { reaction: 32, laning: 32, macro: 32, sense: 32, mental: 32 },
    tp: 0,
    funds: 300,
    pity: 0,
    maxStamina: 100,
    stamina: 100,
    rank: 150,
    traits: o.trait ? [o.trait] : [],
    season: 0,
    age: 17,
    day: 0,
    plan: buildPlan(seasonAt(0).year),
    cursor: 0,
    team: {
      kind: 'own', id: 'own', name: o.teamName.trim().slice(0, 12) || '重生战队',
      members: emptyMembers(), trainees: { top: 42, jungle: 41, mid: 43, adc: 41, support: 40 }, coord: 0,
    },
    bench: [],
    split: { spring: null, summer: null },
    worlds: null,
    pending: null,
    result: null,
    injury: 0,
    modal: null,
    honors: [],
    history: [],
    log: [],
    stats: { games: 0, wins: 0, mvp: 0, series: 0, seriesWins: 0 },
  } as GameState;
  for (const p of POS_ORDER) s.team.trainees[p] = 40 + ri(s, 0, 4);
  if (has(s, 'iron')) s.maxStamina = 140;
  s.stamina = s.maxStamina;
  log(s, `你带着上一世的记忆醒来：${seasonAt(0).year} 年，17 岁，ID「${s.name}」，${POS_LABEL[s.pos]}选手，效力于自己成立的战队「${s.team.name}」。`, 'title');
  seasonStart(s);
  return s;
}

function seasonStart(s: GameState): void {
  if (has(s, 'reborn')) s.tp += 10;
  s.modal = { kind: 'seasonStart' };
  log(s, `${cur(s).id} 赛季（${cur(s).year} 年）开始，你 ${s.age} 岁。`, 'title');
}

export function closeSeasonStart(s: GameState): void {
  if (s.modal?.kind !== 'seasonStart') return;
  s.modal = null;
  enter(s);
}

// ---------- 每天的行动 ----------
export const ACTIONS: { id: Action; name: string; desc: string; cost: number }[] = [
  { id: 'rank', name: '排位', desc: '上分，赚一点资金', cost: 15 },
  { id: 'scrim', name: '训练赛', desc: '训练点更多，和队友磨合', cost: 25 },
  { id: 'overtrain', name: '加练', desc: '训练点最多，但可能受伤', cost: 40 },
  { id: 'rest', name: '休息', desc: '恢复体力', cost: 0 },
];

function costOf(s: GameState, a: Action): number {
  const base = ACTIONS.find((x) => x.id === a)!.cost;
  return a === 'rank' && has(s, 'grinder') ? base - 5 : base;
}

export function canDo(s: GameState, a: Action): { ok: boolean; why: string } {
  if (!canTrain(s)) return { ok: false, why: '今天不能做这个' };
  if (s.stamina < costOf(s, a)) return { ok: false, why: '体力不够，先休息' };
  return { ok: true, why: '' };
}

/** 连续 n 天做同样的行动，遇到比赛日等情况会提前停下。返回实际做了几天 */
export function act(s: GameState, a: Action, times = 1): number {
  let done = 0;
  for (let i = 0; i < times; i++) {
    if (!canDo(s, a).ok) break;
    doOne(s, a);
    done++;
  }
  return done;
}

function doOne(s: GameState, a: Action): void {
  const gain = (has(s, 'genius') ? 1.25 : 1) * (has(s, 'injury') ? 0.85 : 1) * (s.stamina < 30 ? 0.6 : 1);
  if (a === 'rank') {
    s.stamina -= costOf(s, a);
    // 胜率看实力比当前段位的要求高多少
    const p = clamp(0.25 + (overall(s) - (20 + tierOf(s).idx * 14)) / 55, 0.2, 0.95);
    let wins = 0;
    for (let i = 0; i < 6; i++) if (rnd(s) < p) wins++;
    let delta = Math.round((wins * 2 - 6) * 7 * (has(s, 'grinder') ? 1.4 : 1));
    if (delta < 0 && has(s, 'rankedking')) delta = Math.ceil(delta / 2);
    s.rank = clamp(s.rank + delta, 0, 1000);
    s.tp += Math.round(ri(s, 3, 5) * gain);
    s.funds += 4 + wins * 2;
    log(s, `排位 ${wins} 胜 ${6 - wins} 负，段位分 ${delta >= 0 ? '+' : ''}${delta}。`, delta >= 0 ? 'good' : 'bad');
    if (tierOf(s).idx === cur(s).tiers.length - 1 && !has(s, 'rankedking')) addTrait(s, 'rankedking');
  } else if (a === 'scrim') {
    s.stamina -= costOf(s, a);
    s.tp += Math.round(ri(s, 4, 6) * gain);
    s.funds += 6;
    if (s.team.coord < 4 && rnd(s) < 0.5) s.team.coord = Math.min(4, s.team.coord + 0.5);
    const others = leagueIds(s).filter((id) => id !== s.team.id);
    const partner = others.length ? teamName(s, others[ri(s, 0, others.length - 1)]) : '路人群雄';
    log(s, `和 ${partner} 打了一天训练赛，复盘到深夜。`);
  } else if (a === 'overtrain') {
    s.stamina -= costOf(s, a);
    s.tp += Math.round(ri(s, 7, 10) * gain);
    const risk = has(s, 'iron') ? 0.02 : 0.18 + (s.stamina < 20 ? 0.12 : 0);
    if (rnd(s) < risk) {
      s.injury = 8;
      addTrait(s, 'injury');
      log(s, '手腕一阵刺痛——你受伤了，需要静养 8 天。', 'bad');
    } else log(s, '加练到凌晨，收获不小，但身体在报警。');
  } else {
    s.stamina = Math.min(s.maxStamina, s.stamina + 45);
    log(s, '睡到自然醒，去楼下吃了顿好的。');
  }
  advance(s);
}

/** 养伤：一天恢复一点，伤好了才能重新训练 */
export function restInjury(s: GameState): void {
  if (!canRestInjury(s)) return;
  s.injury -= 1;
  s.stamina = Math.min(s.maxStamina, s.stamina + 25);
  log(s, s.injury > 0 ? `养伤，还剩 ${s.injury} 天。` : '伤好了，可以重新训练。');
  advance(s);
}

/** 用训练点给一项属性加 1 点。越高越贵 */
export function addPoint(s: GameState, attr: Attr): boolean {
  const v = s.attrs[attr];
  const cost = pointCost(v);
  if (v >= 99 || s.tp < cost) return false;
  s.tp -= cost;
  s.attrs[attr] = v + 1;
  return true;
}

// ---------- 比赛日 ----------
/** 打今天这场比赛 */
export function playPending(s: GameState): SeriesResult | null {
  if (!s.pending || s.screen !== 'main') return null;
  const m = s.pending;
  // BP 本来在比赛日一开始就做好了；旧存档里的比赛可能还没有
  preMatch(s);
  const r = playSeries(s, m);
  s.pending = null;
  applySeries(s, m, r);
  s.result = r;
  return r;
}

function applySeries(s: GameState, m: Pending, r: SeriesResult): void {
  const mult = (has(s, 'genius') ? 1.25 : 1) * (has(s, 'injury') ? 0.85 : 1) * (has(s, 'champion') ? 1.5 : 1);
  s.tp += Math.round((1 + Math.ceil(r.win / 2)) * mult);
  s.stats.games += r.games.length;
  s.stats.wins += r.win;
  s.stats.series += 1;
  if (r.won) s.stats.seriesWins += 1;
  s.stats.mvp += r.games.filter((g) => g.mvp).length;
  const me = s.team.id;
  if (m.kind === 'league' && m.split) {
    const sp = s.split[m.split]!;
    record(sp.table, me, m.opp, r.win, r.lose);
    sp.played += 1;
    s.funds += r.won ? 40 : 15;
    r.after = `联赛战绩 ${sp.table[me].w} 胜 ${sp.table[me].l} 负`;
  } else if ((m.kind === 'semi' || m.kind === 'final') && m.split) {
    const sp = s.split[m.split]!;
    s.funds += r.won ? 80 : 30;
    r.after = m.kind === 'semi' ? afterSemi(s, sp, m.split, r.won) : afterFinal(s, sp, m.split, r.won);
  } else if (m.kind === 'group') {
    const t = s.worlds!.tables[s.worlds!.userGroup];
    if (r.won) {
      t[me].w++;
      t[m.opp].l++;
    } else {
      t[m.opp].w++;
      t[me].l++;
    }
    s.funds += r.won ? 30 : 8;
    r.after = `小组赛 ${t[me].w} 胜 ${t[me].l} 负`;
  } else {
    s.funds += r.won ? 120 : 40;
    r.after = closeKO(s, r.won, r.games.reduce((sum, g) => sum + g.score, 0) / r.games.length);
  }
  log(s, `${m.label}：${r.won ? '胜' : '负'} ${r.win}-${r.lose} ${teamLabel(s, m.opp)}`, r.won ? 'good' : 'bad');
}

/** 看完比赛结果后继续 */
export function continueAfterResult(s: GameState): void {
  if (!s.result) return;
  const r = s.result;
  s.result = null;
  if (r.kind === 'group') {
    const W = s.worlds!;
    W.queue.shift();
    if (W.queue.length) {
      s.pending = { kind: 'group', split: null, label: `世界赛小组赛 第 ${W.round + 1} 轮`, opp: W.queue[0], bo: 1, elim: false };
      preMatch(s);
      return;
    }
    W.round += 1;
    if (W.round >= W.rounds.length) finishGroups(s);
  }
  advance(s);
}

// ---------- 推进 ----------
function advance(s: GameState): void {
  s.cursor += 1;
  s.day += 1;
  enter(s);
}

/**
 * 走到下一个需要玩家做决定的地方：
 * 训练日（选行动）、比赛日（开打）、赛季开始、生涯结束。
 * 比赛日如果轮不到自己，就就地变成训练日。
 */
function enter(s: GameState): void {
  walkToDecision(s);
  // 比赛日的 BP 在这里就做好：开打之前列出来给玩家看，刷新页面也不会变
  if (s.pending) preMatch(s);
}

function walkToDecision(s: GameState): void {
  for (let guard = 0; guard < 400; guard++) {
    if (s.screen !== 'main' || s.pending || s.result || s.modal) return;
    const step = stepOf(s);
    if (!step) return endSeason(s);
    // 养伤期间不能训练；比赛日照打（带伤上阵）
    if (s.injury > 0 && step.t === 'train') return;
    if (step.t === 'train') return;
    const toTrain = () => {
      step.t = 'train';
    };
    if (step.t === 'match') {
      const stage: SplitId = step.phase === 'spring' ? 'spring' : 'summer';
      const sp = ensureSplit(s, stage);
      if (sp.played < sp.schedule.length) {
        s.pending = { kind: 'league', split: stage, label: `${splitName(stage)}常规赛 第 ${sp.played + 1} 场`, opp: sp.schedule[sp.played], bo: 3, elim: false };
        return;
      }
      toTrain();
    } else if (step.t === 'playoff') {
      const stage: SplitId = step.phase === 'springPo' ? 'spring' : 'summer';
      const sp = s.split[stage]!;
      seedPlayoffs(s, sp, stage);
      const po = sp.playoffs!;
      if (step.n === 0 && po.userIn && !po.semiDone) {
        s.pending = { kind: 'semi', split: stage, label: `${splitName(stage)}季后赛 半决赛`, opp: po.semiOpp!, bo: 5, elim: true };
        return;
      }
      if (step.n === 1 && po.userInFinal && !po.finalDone) {
        s.pending = { kind: 'final', split: stage, label: `${splitName(stage)}季后赛 决赛`, opp: po.otherWinner!, bo: 5, elim: true };
        return;
      }
      toTrain();
    } else if (step.t === 'wg') {
      if (!s.worlds) startWorlds(s);
      const W = s.worlds!;
      if (W.userOut || W.userSeeded || W.round >= W.rounds.length) {
        if (!W.bracket) finishGroups(s);
        toTrain();
      } else {
        if (W.queue.length === 0) W.queue = [...W.rounds[W.round]];
        s.pending = { kind: 'group', split: null, label: `世界赛小组赛 第 ${W.round + 1} 轮`, opp: W.queue[0], bo: 1, elim: false };
        return;
      }
    } else {
      if (!s.worlds) startWorlds(s);
      if (!s.worlds!.userOut) {
        openKO(s, step.n);
        if (s.pending) return;
      }
      toTrain();
    }
  }
}

function endSeason(s: GameState): void {
  s.history.push(seasonSummary(s));
  if (s.season >= seasonCount() - 1) {
    s.screen = 'careerEnd';
    log(s, '三个赛季过去，这段生涯告一段落。', 'title');
    return;
  }
  s.season += 1;
  s.age += 1;
  s.plan = buildPlan(seasonAt(s.season).year);
  s.cursor = 0;
  s.split = { spring: null, summer: null };
  s.worlds = null;
  s.stamina = s.maxStamina;
  s.injury = 0;
  if (has(s, 'injury')) {
    removeTrait(s, 'injury');
    log(s, '休赛期把伤养好了，「伤病隐患」移除。');
  }
  carryTeam(s);
  s.team.coord = Math.max(0, s.team.coord - 2);
  seasonStart(s);
}

export function seasonSummary(s: GameState): SeasonSummary {
  const id = cur(s).id;
  return {
    id,
    year: cur(s).year,
    age: s.age,
    team: s.team.name,
    spring: splitOutcome(s, s.split.spring),
    summer: splitOutcome(s, s.split.summer),
    worlds: worldsOutcome(s),
    honors: s.honors.filter((h) => h.season === id).map((h) => h.name),
    overall: Math.round(overall(s)),
  };
}

/** 生涯结束时的总览 */
export function careerSummary(s: GameState) {
  const titles = s.honors.filter((h) => h.name.includes('冠军'));
  return {
    years: s.history.length,
    age: s.age,
    titles: titles.map((h) => `${h.season} ${h.name}`),
    worldsTitles: titles.filter((h) => h.name.includes('全球总决赛冠军')).length,
    leagueTitles: titles.filter((h) => !h.name.includes('全球总决赛')).length,
    record: `${s.stats.wins} 胜 ${s.stats.games - s.stats.wins} 负`,
    seriesRecord: `${s.stats.seriesWins} 胜 ${s.stats.series - s.stats.seriesWins} 负`,
    mvp: s.stats.mvp,
    overall: Math.round(overall(s)),
    grade: gradeWord(Math.round(overall(s))),
  };
}

function gradeWord(v: number): string {
  return v >= 90 ? 'S+' : v >= 82 ? 'S' : v >= 74 ? 'A' : v >= 66 ? 'B' : v >= 58 ? 'C' : 'D';
}

// ---------- 存档 ----------
export function save(s: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch {
    /* 存不了就算了，游戏照常进行 */
  }
}

export function load(): GameState | null {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null') as GameState | null;
    return s && s.v === 1 && s.season < seasonCount() ? s : null;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* 忽略 */
  }
}
