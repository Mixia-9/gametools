/**
 * 主流程：创建生涯、每天的行动、比赛日的推进、赛季结束与存档。
 * 界面只需要调用这里导出的函数。
 */
import { POS_ORDER, QUALITY_WEIGHT, REGIONS, TRAITS, type Attr, type Position, type Region, type Trait } from './data';
import { carryTeam, DRAW_COST, importLimit, interest, joinTeam, makeOwnTeam } from './squad';
import { afterFinal, afterSemi, closeKO, ensureSplit, finishGroups, openKO, record, seedPlayoffs, splitOutcome, startWorlds, worldsOutcome } from './competition';
import { PICK_WIN_CAP, playSeries, preMatch, traitWin } from './match';
import {
  accrue, addTrait, buildPlan, canRestInjury, canTrain, clamp, cur, fx, has, leagueIds, log, overall, pointCost, refreshStamina, removeTrait, ri, rnd, rosterNews, seasonAt, seasonBefore,
  seasonCount, splitName, stepOf, teamLabel, teamName, tierOf, traitInfo,
  type Action, type GameState, type Pending, type SeasonSummary, type SeriesResult, type SplitId,
} from './core';

export * from './core';
export { preMatch, traitWin, PICK_WIN_CAP };
export { DRAW_COST, importLimit, interest, joinTeam, makeOwnTeam, draw, setMember, release, poolOf, rarityOf, drawWeights, RARITY, imports } from './squad';
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
    pointsAdded: 0,
    traitPicks: 0,
    traitOffer: null,
    pickStreak: 0,
    tpCarry: 0,
    fundsCarry: 0,
  } as GameState;
  for (const p of POS_ORDER) s.team.trainees[p] = 40 + ri(s, 0, 4);
  refreshStamina(s);
  s.stamina = s.maxStamina;
  log(s, `你带着上一世的记忆醒来：${seasonAt(0).year} 年，17 岁，ID「${s.name}」，${POS_LABEL[s.pos]}选手，效力于自己成立的战队「${s.team.name}」。`, 'title');
  seasonStart(s);
  return s;
}

function seasonStart(s: GameState): void {
  const gift = fx(s).seasonTp;
  if (gift > 0) s.tp += gift;
  s.modal = { kind: 'seasonStart' };
  const lines: string[] = [`${cur(s).id} 赛季（${cur(s).year} 年）开始，你 ${s.age} 岁。`];
  // 新赛季名单有什么变化，直接写进生涯记录，玩家不用自己去比对
  const news = rosterNews(s);
  if (news.ok) {
    const nameOf = (id: string) => cur(s).byId[id]?.zh || cur(s).byId[id]?.name || seasonBefore(s)?.byId[id]?.zh || seasonBefore(s)?.byId[id]?.name || id;
    const region = REGIONS.find((r) => r.id === s.region)!.name;
    if (news.joined.length || news.left.length) {
      lines.push(`新赛季 ${region}：${news.joined.length ? `加入 ${news.joined.map(nameOf).join('、')}` : '没有新队伍'}；${news.left.length ? `离开 ${news.left.map(nameOf).join('、')}` : '没有队伍离开'}。`);
    }
    for (const m of news.moves) {
      if (m.joined.length + m.left.length < 3) continue;
      const part = [m.joined.length ? `${m.joined.map((p) => p.id).join('、')}加入` : '', m.left.length ? `${m.left.map((l) => l.p.id + (l.to ? `（去了 ${l.to}）` : '')).join('、')}离队` : ''].filter(Boolean);
      lines.push(`${nameOf(m.team)}换人：${part.join('；')}。`);
    }
  }
  // 生涯记录是新的在上面，所以倒着写，读起来才是“赛季开始 → 名单变化”
  for (const text of lines.reverse()) log(s, text, 'title');
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

/** 一个行动今天要花多少体力：词条可以减免 */
export function costOf(s: GameState, a: Action): number {
  const f = fx(s);
  const base = ACTIONS.find((x) => x.id === a)!.cost;
  return Math.max(0, base + (a === 'rank' ? f.rankStamina : a === 'rest' ? 0 : f.trainStamina));
}

export function canDo(s: GameState, a: Action): { ok: boolean; why: string } {
  if (!canTrain(s)) return { ok: false, why: '今天不能做这个' };
  if (s.stamina < costOf(s, a)) return { ok: false, why: '体力不够，先休息' };
  return { ok: true, why: '' };
}

/** 训练收益的倍率：词条的加成 × 体力很低时的折扣（“铁血意志”让折扣轻一些） */
export function trainGain(s: GameState): number {
  const f = fx(s);
  return f.tp * (s.stamina < 30 ? (f.grit ? 0.85 : 0.6) : 1);
}

/** 现在加练受伤的概率：基础 18%，体力很低时更高；词条可以把它压低 */
export function injuryRisk(s: GameState): number {
  return (0.18 + (s.stamina < 20 ? 0.12 : 0)) * fx(s).injury;
}

/** 休息一天恢复多少体力 */
export const restRecover = (s: GameState) => Math.round(45 * fx(s).recover);

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
  const f = fx(s);
  if (a === 'rank') {
    s.stamina -= costOf(s, a);
    // 胜率看实力比当前段位的要求高多少
    const p = clamp(0.25 + (overall(s) - (20 + tierOf(s).idx * 14)) / 55, 0.2, 0.95);
    let wins = 0;
    for (let i = 0; i < 6; i++) if (rnd(s) < p) wins++;
    // 上分的倍率只作用在加分上，掉分的减免只作用在掉分上
    let delta = (wins * 2 - 6) * 7;
    if (delta > 0) delta = Math.round(delta * f.rank);
    else if (delta < 0 && f.rankLoss < 1) delta = Math.ceil(delta * f.rankLoss);
    s.rank = clamp(s.rank + delta, 0, 1000);
    accrue(s, 'tp', ri(s, 3, 5) * trainGain(s));
    accrue(s, 'funds', (4 + wins * 2) * f.funds);
    log(s, `排位 ${wins} 胜 ${6 - wins} 负，段位分 ${delta >= 0 ? '+' : ''}${delta}。`, delta >= 0 ? 'good' : 'bad');
    if (tierOf(s).idx === cur(s).tiers.length - 1 && !has(s, 'rankedking')) addTrait(s, 'rankedking');
  } else if (a === 'scrim') {
    s.stamina -= costOf(s, a);
    accrue(s, 'tp', ri(s, 4, 6) * trainGain(s));
    accrue(s, 'funds', 6 * f.funds);
    if (s.team.coord < 4 && rnd(s) < Math.min(1, 0.5 * f.coord)) s.team.coord = Math.min(4, s.team.coord + 0.5);
    const others = leagueIds(s).filter((id) => id !== s.team.id);
    const partner = others.length ? teamName(s, others[ri(s, 0, others.length - 1)]) : '路人群雄';
    log(s, `和 ${partner} 打了一天训练赛，复盘到深夜。`);
  } else if (a === 'overtrain') {
    s.stamina -= costOf(s, a);
    accrue(s, 'tp', ri(s, 7, 10) * trainGain(s));
    if (rnd(s) < injuryRisk(s)) {
      s.injury = Math.max(2, 8 - f.heal);
      addTrait(s, 'injury');
      log(s, `手腕一阵刺痛——你受伤了，需要静养 ${s.injury} 天。`, 'bad');
    } else log(s, '加练到凌晨，收获不小，但身体在报警。');
  } else {
    s.stamina = Math.min(s.maxStamina, s.stamina + restRecover(s));
    if (f.restTp) s.tp += f.restTp;
    log(s, f.restTp ? `睡到自然醒，去楼下吃了顿好的。躺着也想通了几件事（训练点 +${f.restTp}）。` : '睡到自然醒，去楼下吃了顿好的。');
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

/** 给一项属性加 1 点现在要花多少训练点：越高越贵，词条可以让它便宜 */
export function pointCostFor(s: GameState, attr: Attr): number {
  return Math.max(1, Math.round(pointCost(s.attrs[attr]) * fx(s).cost));
}

/** 用训练点给一项属性加 1 点。每加满 PICK_EVERY 点，多一次选词条的机会 */
export function addPoint(s: GameState, attr: Attr): boolean {
  const v = s.attrs[attr];
  const cost = pointCostFor(s, attr);
  if (v >= 99 || s.tp < cost) return false;
  s.tp -= cost;
  s.attrs[attr] = v + 1;
  s.pointsAdded += 1;
  if (s.pointsAdded % PICK_EVERY === 0) {
    s.traitPicks += 1;
    log(s, '你对这个版本又多了一分理解——可以选一个新词条了。', 'title');
  }
  return true;
}

// ---------- 选词条 ----------
/** 每加这么多点属性，多一次选词条的机会 */
export const PICK_EVERY = 20;
/** 一次给出几个选项 */
export const OFFER_SIZE = 3;
/** 连续这么多次没出史诗以上，下一次必出 */
export const EPIC_PITY = 5;

/** 现在能选的几个词条。还没摇过就先摇出来并存进状态，刷新页面也不会变 */
export function traitOptions(s: GameState): Trait[] {
  if (s.traitPicks <= 0) return [];
  if (!s.traitOffer) s.traitOffer = rollOffer(s);
  return s.traitOffer.map((id) => traitInfo(id)).filter((t): t is Trait => !!t && !has(s, t.id));
}

/** 摇一组选项：每个选项先定品质，再在这个品质里随机；这个品质没有可选的就往下降 */
function rollOffer(s: GameState): string[] {
  const offer: string[] = [];
  const usable = (q: number) => TRAITS.filter((t) => t.pick && t.quality === q && !has(s, t.id) && !offer.includes(t.id) && (!t.pos || t.pos.includes(s.pos)));
  // 保底只保证其中一张是史诗以上
  let pity = s.pickStreak >= EPIC_PITY;
  for (let slot = 0; slot < OFFER_SIZE; slot++) {
    let q = 0;
    if (pity) q = rnd(s) < 0.2 ? 3 : 2;
    else {
      let roll = rnd(s) * 100;
      for (let k = QUALITY_WEIGHT.length - 1; k >= 0; k--) {
        if (roll < QUALITY_WEIGHT[k]) {
          q = k;
          break;
        }
        roll -= QUALITY_WEIGHT[k];
      }
    }
    pity = false;
    let cand = usable(q);
    for (let k = q - 1; k >= 0 && !cand.length; k--) cand = usable(k);
    if (!cand.length) break;
    offer.push(cand[ri(s, 0, cand.length - 1)].id);
  }
  return offer;
}

/** 选走一个词条。只能选当前选项里的，已经有的不能重复选 */
export function pickTrait(s: GameState, id: string): boolean {
  const t = traitOptions(s).find((x) => x.id === id);
  if (!t) return false;
  addTrait(s, id);
  if (t.fx?.tpNow) s.tp += t.fx.tpNow;
  if (t.fx?.fundsNow) s.funds += t.fx.fundsNow;
  refreshStamina(s);
  s.traitPicks = Math.max(0, s.traitPicks - 1);
  s.traitOffer = null;
  s.pickStreak = (t.quality ?? 0) >= 2 ? 0 : s.pickStreak + 1;
  return true;
}

/** 给测试和模拟用的机器人：把能选的都选掉，每次选品质最高的那个。返回选了几个 */
export function autoPick(s: GameState): number {
  let n = 0;
  while (s.traitPicks > 0 && n < 200) {
    const offer = traitOptions(s);
    if (!offer.length) {
      // 已经没有可选的词条了
      s.traitPicks = 0;
      s.traitOffer = null;
      break;
    }
    const best = [...offer].sort((a, b) => (b.quality ?? 0) - (a.quality ?? 0))[0];
    if (!pickTrait(s, best.id)) break;
    n++;
  }
  return n;
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
  const f = fx(s);
  accrue(s, 'tp', (1 + Math.ceil(r.win / 2)) * f.matchTp);
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
    accrue(s, 'funds', (r.won ? 40 : 15) * f.funds);
    r.after = `联赛战绩 ${sp.table[me].w} 胜 ${sp.table[me].l} 负`;
  } else if ((m.kind === 'semi' || m.kind === 'final') && m.split) {
    const sp = s.split[m.split]!;
    accrue(s, 'funds', (r.won ? 80 : 30) * f.funds);
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
    accrue(s, 'funds', (r.won ? 30 : 8) * f.funds);
    r.after = `小组赛 ${t[me].w} 胜 ${t[me].l} 负`;
  } else {
    accrue(s, 'funds', (r.won ? 120 : 40) * f.funds);
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

/** 旧存档补上后来才加的字段 */
export function migrate(s: GameState): GameState {
  s.pointsAdded ??= 0;
  s.traitPicks ??= 0;
  s.traitOffer ??= null;
  s.pickStreak ??= 0;
  s.tpCarry ??= 0;
  s.fundsCarry ??= 0;
  return s;
}

export function load(): GameState | null {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null') as GameState | null;
    return s && s.v === 1 && s.season < seasonCount() ? migrate(s) : null;
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
