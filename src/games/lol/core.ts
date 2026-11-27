/**
 * 「重生之我是英雄联盟职业选手」——基础部分：类型、赛程日历、随机数、各种查询。
 * 状态是纯 JSON，可以直接存进 localStorage，也方便用脚本跑测试。
 */
import { POSITIONS, POS_ORDER, QUALITY, REGIONS, TRAITS, buildSeason, type Attr, type Position, type ProPlayer, type Region, type SeasonData, type Trait } from './data';
import { RAW_SEASONS } from './seasons';

export type Screen = 'create' | 'main' | 'careerEnd';
export type Action = 'rank' | 'scrim' | 'overtrain' | 'rest';
export type PhaseId = 'pre' | 'spring' | 'springPo' | 'mid' | 'summer' | 'summerPo' | 'worlds' | 'off';
export type SplitId = 'spring' | 'summer';
export type MatchKind = 'league' | 'semi' | 'final' | 'group' | 'qf' | 'sf' | 'wfinal';

/** 赛程里的一天。比赛日如果轮不到自己（比如没进世界赛），会就地变成训练日 */
export interface Step {
  t: 'train' | 'match' | 'playoff' | 'wg' | 'wko';
  phase: PhaseId;
  /** 训练日：是否处在转会期（可以换队、抽卡、调整阵容） */
  window: boolean;
  n: number;
  date: string;
}

export interface LogEntry {
  date: string;
  text: string;
  kind: 'info' | 'good' | 'bad' | 'match' | 'title' | 'gacha';
}

export interface Honor {
  season: string;
  name: string;
}

export interface Stats {
  games: number;
  wins: number;
  mvp: number;
  series: number;
  seriesWins: number;
}

/** 自己的战队：members 是四个队友（职业选手 ID），null 表示还是青训 */
export interface TeamState {
  kind: 'own' | 'real';
  id: string;
  name: string;
  members: Record<Position, string | null>;
  trainees: Record<Position, number>;
  /** 磨合度，打训练赛积累，给队伍实力加分（最多 4） */
  coord: number;
}

/** 一局比赛里一边的 BP：禁用 3 个，选出 5 个（按 上单/打野/中单/ADC/辅助 的顺序） */
export interface BpSide {
  bans: string[];
  picks: string[];
}

/** 一局比赛的 BP */
export interface Bp {
  /** 蓝色方是哪一边；一场系列赛里每局轮换 */
  blue: 'self' | 'opp';
  self: BpSide;
  opp: BpSide;
}

export interface GameLine {
  win: boolean;
  k: number;
  d: number;
  a: number;
  champ: string;
  score: number;
  mvp: boolean;
  note: string;
  dur: number;
  bp: Bp;
}

export interface Pending {
  kind: MatchKind;
  split: SplitId | null;
  label: string;
  opp: string;
  bo: 1 | 3 | 5;
  /** 淘汰赛：输了就出局 */
  elim: boolean;
  /** 第 1 局的 BP：开打之前就列出来。旧存档里的比赛可能还没有 */
  bp?: Bp;
}

export interface SeriesResult extends Pending {
  win: number;
  lose: number;
  won: boolean;
  games: GameLine[];
  selfRating: number;
  oppRating: number;
  after: string;
}

export interface Playoffs {
  seeds: string[];
  userIn: boolean;
  userInFinal: boolean;
  semiDone: boolean;
  finalDone: boolean;
  semiOpp: string | null;
  otherPair: [string, string];
  otherWinner: string | null;
  champion: string | null;
  runnerUp: string | null;
  /** 两支半决赛失利的队伍 */
  semis: string[];
}

export interface SplitState {
  /** 这半个赛季自己效力的队伍 */
  mine: string;
  ids: string[];
  table: Record<string, { w: number; l: number; rw: number; rl: number }>;
  schedule: string[];
  played: number;
  playoffs: Playoffs | null;
}

export interface WorldsState {
  groups: string[][];
  tables: Record<string, { w: number; l: number }>[][];
  order: string[][] | null;
  /** 自己所在的小组序号，-1 = 没打小组赛（没进世界赛，或者直接进八强） */
  userGroup: number;
  /** 自己是不打小组赛、直接进八强的种子队 */
  userSeeded: boolean;
  /** 不打小组赛、直接进八强的队伍 */
  seeds: string[];
  /** 自己的战队顶替了哪支种子队 */
  seedOf: string | null;
  rounds: string[][];
  round: number;
  queue: string[];
  bracket: string[] | null;
  qfWinners: string[] | null;
  sfWinners: string[] | null;
  champion: string | null;
  runnerUp: string | null;
  /** 自己已经出局，剩下的比赛全部由电脑模拟 */
  userOut: boolean;
  /** 淘汰赛里自己正在打的那一场 */
  koStage: number;
  koPair: number;
  koOpp: string | null;
  koWinners: (string | null)[] | null;
}

export interface SeasonSummary {
  id: string;
  year: number;
  age: number;
  team: string;
  spring: string;
  summer: string;
  worlds: string;
  honors: string[];
  overall: number;
}

export interface GameState {
  v: 1;
  rng: number;
  screen: Screen;
  name: string;
  region: Region;
  pos: Position;
  attrs: Record<Attr, number>;
  /** 训练点，用来给五维加点 */
  tp: number;
  /** 资金，用来抽卡 */
  funds: number;
  /** 抽卡保底：连续多少抽没出核心以上 */
  pity: number;
  stamina: number;
  maxStamina: number;
  /** 段位分 0–1000 */
  rank: number;
  traits: string[];
  season: number;
  age: number;
  day: number;
  plan: Step[];
  cursor: number;
  team: TeamState;
  bench: string[];
  split: { spring: SplitState | null; summer: SplitState | null };
  worlds: WorldsState | null;
  pending: Pending | null;
  result: SeriesResult | null;
  /** 因伤休战的天数 */
  injury: number;
  modal: { kind: 'seasonStart' } | null;
  honors: Honor[];
  history: SeasonSummary[];
  log: LogEntry[];
  stats: Stats;
  /** 一共加了多少点属性。每加满 PICK_EVERY 点，多一次选词条的机会 */
  pointsAdded: number;
  /** 还没用的选词条次数 */
  traitPicks: number;
  /** 这一次选词条给出的选项（词条 ID）；还没摇过就是 null */
  traitOffer: string[] | null;
  /** 连续多少次选词条没出史诗以上（保底用） */
  pickStreak: number;
  /** 训练点、资金收益的小数部分记在这里，下次接着算，+5% 这种小加成不会被取整吃掉 */
  tpCarry: number;
  fundsCarry: number;
}

const PHASES: Record<PhaseId, { name: string; start: [number, number]; end: [number, number] }> = {
  pre: { name: '春季赛备战期', start: [1, 1], end: [1, 24] },
  spring: { name: '春季常规赛', start: [1, 25], end: [3, 20] },
  springPo: { name: '春季季后赛', start: [3, 22], end: [4, 15] },
  mid: { name: '季中转会期', start: [4, 20], end: [5, 30] },
  summer: { name: '夏季常规赛', start: [6, 1], end: [8, 2] },
  summerPo: { name: '夏季季后赛', start: [8, 5], end: [8, 30] },
  worlds: { name: '全球总决赛', start: [9, 15], end: [10, 25] },
  off: { name: '休赛期', start: [11, 1], end: [12, 15] },
};

const SPLIT_NAME: Record<SplitId, string> = { spring: '春季赛', summer: '夏季赛' };
const MDAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

let SEASONS: SeasonData[] = RAW_SEASONS.map(buildSeason);

/** 测试或以后扩充赛季时替换数据 */
export function setSeasons(list: SeasonData[]) {
  SEASONS = list;
}

// ---------- 随机数（状态里带种子，整局可以复现） ----------
export function rnd(s: GameState): number {
  s.rng = (s.rng + 0x6d2b79f5) | 0;
  let t = s.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export const ri = (s: GameState, a: number, b: number) => a + Math.floor(rnd(s) * (b - a + 1));
export const gauss = (s: GameState, mu: number, sd: number) => mu + sd * Math.sqrt(-2 * Math.log(1 - rnd(s))) * Math.cos(2 * Math.PI * rnd(s));
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// ---------- 赛程 ----------
const toDoy = ([m, d]: [number, number]) => MDAYS.slice(0, m - 1).reduce((a, b) => a + b, 0) + d - 1;

/** 把一个阶段的天数均匀铺在真实的日期区间里（世界赛在九月、十月） */
function dateIn(year: number, a: [number, number], b: [number, number], t: number): string {
  const doy = Math.round(toDoy(a) + (toDoy(b) - toDoy(a)) * t);
  let m = 0;
  let rest = doy;
  while (rest >= MDAYS[m]) {
    rest -= MDAYS[m];
    m++;
  }
  return `${m + 1}月${rest + 1}日`;
}

export function buildPlan(year: number): Step[] {
  const steps: Omit<Step, 'date'>[] = [];
  const train = (phase: PhaseId, window = false) => steps.push({ t: 'train', phase, window, n: 0 });
  for (let i = 0; i < 14; i++) train('pre', true);
  for (const [stage, po] of [['spring', 'springPo'], ['summer', 'summerPo']] as const) {
    for (let r = 0; r < 7; r++) {
      train(stage);
      steps.push({ t: 'match', phase: stage, window: false, n: r });
    }
    train(po);
    steps.push({ t: 'playoff', phase: po, window: false, n: 0 });
    train(po);
    steps.push({ t: 'playoff', phase: po, window: false, n: 1 });
    if (stage === 'spring') for (let i = 0; i < 12; i++) train('mid', true);
  }
  // 小组赛最多留 5 轮（小组 6 队、双循环）；用不到的轮次会变成训练日
  for (let r = 0; r < 5; r++) {
    train('worlds');
    steps.push({ t: 'wg', phase: 'worlds', window: false, n: r });
  }
  for (let i = 0; i < 3; i++) {
    train('worlds');
    steps.push({ t: 'wko', phase: 'worlds', window: false, n: i });
  }
  for (let i = 0; i < 12; i++) train('off', true);

  // 日期：每个阶段内部按连续的日期走，阶段之间自然留空（世界赛落在九月、十月）
  const seen: Record<string, number> = {};
  return steps.map((st) => {
    const i = seen[st.phase] ?? 0;
    seen[st.phase] = i + 1;
    const { start, end } = PHASES[st.phase];
    const span = toDoy(end) - toDoy(start);
    return { ...st, date: dateIn(year, start, end, span === 0 ? 0 : Math.min(1, i / span)) };
  });
}

// ---------- 查询 ----------
export const cur = (s: GameState): SeasonData => SEASONS[s.season];
export const seasonAt = (i: number): SeasonData => SEASONS[i];
export const seasonCount = () => SEASONS.length;

/** 每个赛季都有联赛名单的赛区才允许选择；资料没核实完的赛区会被排除 */
export function availableRegions(): Region[] {
  return REGIONS.map((r) => r.id).filter((id) => SEASONS.every((sn) => sn.leagues[id].length >= 4));
}
export const posName = (p: Position) => POSITIONS.find((x) => x.id === p)!.name;

export function overallOf(attrs: Record<Attr, number>, pos: Position): number {
  const w = POSITIONS.find((p) => p.id === pos)!.weights;
  return (Object.keys(w) as Attr[]).reduce((sum, a) => sum + attrs[a] * w[a], 0);
}

export const overall = (s: GameState) => overallOf(s.attrs, s.pos);

export function gradeOf(v: number): string {
  return v >= 90 ? 'S+' : v >= 82 ? 'S' : v >= 74 ? 'A' : v >= 66 ? 'B' : v >= 58 ? 'C' : 'D';
}

export function tierOf(s: GameState, score = s.rank) {
  const tiers = cur(s).tiers;
  const span = 1000 / tiers.length;
  const idx = Math.min(tiers.length - 1, Math.floor(score / span));
  return { name: tiers[idx], idx, min: idx * span, max: (idx + 1) * span, span };
}

/** 加一点属性要花多少训练点：中段便宜，越接近顶级越贵，三个赛季的积累基本到不了封顶 */
export const pointCost = (v: number) => (v < 45 ? 1 : v < 56 ? 2 : v < 66 ? 3 : v < 74 ? 5 : v < 82 ? 7 : v < 88 ? 10 : v < 93 ? 14 : 20);

export const stepOf = (s: GameState): Step | null => s.plan[s.cursor] ?? null;
export const today = (s: GameState) => s.plan[s.cursor]?.date ?? s.plan[s.plan.length - 1].date;
export const phaseName = (s: GameState) => (stepOf(s) ? PHASES[stepOf(s)!.phase].name : '赛季结束');
export const splitName = (id: SplitId) => SPLIT_NAME[id];

/** 现在轮到玩家做决定（不是比赛待打、不是结算画面、没有弹窗） */
export const idle = (s: GameState) => s.screen === 'main' && !s.pending && !s.result && !s.modal;

/** 现在能不能做当天的训练（比赛日、养伤日不行） */
export const canTrain = (s: GameState) => idle(s) && s.injury === 0 && stepOf(s)?.t === 'train';

/** 现在是不是养伤日 */
export const canRestInjury = (s: GameState) => idle(s) && s.injury > 0 && stepOf(s)?.t === 'train';

/** 现在是不是转会期 */
export const isWindow = (s: GameState) => canTrain(s) && !!stepOf(s)!.window;

export const has = (s: GameState, trait: string) => s.traits.includes(trait);

const TRAIT_BY_ID = new Map(TRAITS.map((t) => [t.id, t] as const));
export const traitInfo = (id: string): Trait | undefined => TRAIT_BY_ID.get(id);

/** 一堆词条汇总之后的效果。乘法项 1 = 不变，加法项 0 = 不变 */
export interface Fx {
  // 乘法
  tp: number;
  matchTp: number;
  cost: number;
  rank: number;
  rankLoss: number;
  recover: number;
  injury: number;
  funds: number;
  coord: number;
  // 加法
  tpNow: number;
  fundsNow: number;
  seasonTp: number;
  restTp: number;
  rankStamina: number;
  trainStamina: number;
  stamina: number;
  heal: number;
  luck: number;
  interest: number;
  imports: number;
  lead: number;
  league: number;
  elim: number;
  worlds: number;
  decider: number;
  firstGame: number;
  bo1: number;
  late: number;
  ahead: number;
  behind: number;
  underdog: number;
  blue: number;
  red: number;
  grit: boolean;
}

const ZERO_FX: Fx = {
  tp: 1, matchTp: 1, cost: 1, rank: 1, rankLoss: 1, recover: 1, injury: 1, funds: 1, coord: 1,
  tpNow: 0, fundsNow: 0, seasonTp: 0, restTp: 0, rankStamina: 0, trainStamina: 0, stamina: 0, heal: 0,
  luck: 0, interest: 0, imports: 0, lead: 0,
  league: 0, elim: 0, worlds: 0, decider: 0, firstGame: 0, bo1: 0, late: 0, ahead: 0, behind: 0, underdog: 0, blue: 0, red: 0,
  grit: false,
};
/** 乘法类的效果项：同类的几个词条相乘；其余都是相加 */
const MULTI_FX: readonly string[] = ['tp', 'matchTp', 'cost', 'rank', 'rankLoss', 'recover', 'injury', 'funds', 'coord'];

type FxBag = Record<string, number | boolean>;

/**
 * 汇总身上的词条：all = 全部；pick = 只算加点时选来的（它们给的胜率有上限，见 match.ts）；base = 开局和自动获得的
 */
export function traitFx(s: GameState): { base: Fx; pick: Fx; all: Fx } {
  const base: FxBag = { ...ZERO_FX };
  const pick: FxBag = { ...ZERO_FX };
  for (const id of s.traits) {
    const t = TRAIT_BY_ID.get(id);
    if (!t?.fx) continue;
    const into = t.pick ? pick : base;
    for (const [k, v] of Object.entries(t.fx)) {
      if (k === 'grit') into.grit = true;
      else into[k] = MULTI_FX.includes(k) ? (into[k] as number) * (1 + (v as number)) : (into[k] as number) + (v as number);
    }
  }
  capPick(pick);
  const all: FxBag = { grit: base.grit || pick.grit };
  for (const k of Object.keys(ZERO_FX)) {
    if (k !== 'grit') all[k] = MULTI_FX.includes(k) ? (base[k] as number) * (pick[k] as number) : (base[k] as number) + (pick[k] as number);
  }
  return { base: base as Fx, pick: pick as Fx, all: all as Fx };
}

/** 这些项是“越大越好”，取上限；其余（cost、rankLoss、injury）是“越小越好”，取下限 */
const HIGHER_IS_BETTER = new Set(['tp', 'matchTp', 'rank', 'recover', 'funds', 'coord', 'stamina', 'lead']);

/**
 * 选来的词条的叠加上限：一个生涯能选十几次，不封顶的话经济类词条会把实力抬得太高。
 * 规则是“同类加成叠起来，不超过其中最强的那一个单独的效果”，上限直接从词条表里算出来，
 * 所以每个词条描述里写的数值都是真的。体力上限和队伍实力是相加的，单独定。
 * 只限制选来的这一部分，开局和自动获得的词条不受影响。
 */
function pickCaps(): Record<string, number> {
  const cap: Record<string, number> = { stamina: 40, lead: 0 };
  for (const t of TRAITS) {
    if (!t.pick || !t.fx) continue;
    cap.lead = Math.max(cap.lead, t.fx.lead ?? 0);
    for (const [k, v] of Object.entries(t.fx)) {
      if (k === 'grit' || !MULTI_FX.includes(k)) continue;
      const single = 1 + (v as number);
      if (cap[k] === undefined) cap[k] = single;
      else cap[k] = HIGHER_IS_BETTER.has(k) ? Math.max(cap[k], single) : Math.min(cap[k], single);
    }
  }
  return cap;
}
export const PICK_CAP = pickCaps();

function capPick(pick: FxBag): void {
  for (const [k, limit] of Object.entries(PICK_CAP)) {
    const v = pick[k] as number;
    pick[k] = HIGHER_IS_BETTER.has(k) ? Math.min(v, limit) : Math.max(v, limit);
  }
}

/** 全部词条汇总后的效果 */
export const fx = (s: GameState): Fx => traitFx(s).all;

/** 把一笔带小数的收益记到整数账上：整数部分马上加，小数部分留着下次接着算 */
export function accrue(s: GameState, key: 'tp' | 'funds', amount: number): void {
  const carry = key === 'tp' ? 'tpCarry' : 'fundsCarry';
  const x = (s[carry] || 0) + amount;
  const whole = Math.floor(x);
  s[carry] = x - whole;
  s[key] += whole;
}

/** 体力上限 = 100 + 词条加的。上限变高时，当前的体力也跟着涨 */
export function refreshStamina(s: GameState): void {
  const max = 100 + fx(s).stamina;
  if (max > s.maxStamina) s.stamina += max - s.maxStamina;
  s.maxStamina = max;
  s.stamina = Math.min(s.stamina, max);
}

export function addTrait(s: GameState, id: string) {
  if (has(s, id)) return;
  s.traits.push(id);
  const info = traitInfo(id);
  const text = info?.pick && info.quality != null ? `获得【${QUALITY[info.quality].name}】词条「${info.name}」：${info.desc}` : `获得词条「${info?.name ?? id}」：${info?.desc ?? ''}`;
  log(s, text, info?.bad ? 'bad' : 'title');
}

export function removeTrait(s: GameState, id: string) {
  s.traits = s.traits.filter((t) => t !== id);
}

export function addHonor(s: GameState, name: string) {
  s.honors.push({ season: cur(s).id, name });
  log(s, `荣誉：${cur(s).id} ${name}`, 'title');
}

export function log(s: GameState, text: string, kind: LogEntry['kind'] = 'info') {
  s.log.unshift({ date: today(s), text, kind });
  if (s.log.length > 80) s.log.length = 80;
}

export const findPro = (s: GameState, id: string): ProPlayer | undefined => cur(s).players[id];

export const isOwned = (s: GameState, playerId: string) =>
  s.team.kind === 'own' && (s.bench.includes(playerId) || POS_ORDER.some((p) => s.team.members[p] === playerId));

export function memberOverall(s: GameState, pos: Position): number {
  const id = s.team.members[pos];
  return id ? (findPro(s, id)?.overall ?? 42) : s.team.trainees[pos];
}

/** 队伍实力：五名首发实力的平均；自己的位置换成自己 */
export function teamRating(s: GameState, id: string): number {
  // 「场上指挥」这类词条只加在自己效力的队伍上
  const lead = id === 'own' || (s.team.kind === 'real' && s.team.id === id) ? fx(s).lead : 0;
  if (id === 'own') {
    const vals = POS_ORDER.map((p) => (p === s.pos ? overall(s) : memberOverall(s, p)));
    return vals.reduce((a, b) => a + b, 0) / vals.length + s.team.coord + lead;
  }
  const team = cur(s).byId[id];
  if (!team) return 50;
  let sum = 0;
  for (const p of POS_ORDER) {
    if (p === s.pos && s.team.kind === 'real' && s.team.id === id) sum += overall(s);
    else {
      const pro = team.roster[p];
      // 被自己挖走的选手，原队伍由实力更弱的替补顶替
      sum += pro ? (isOwned(s, pro.id) ? Math.max(42, pro.overall - 14) : pro.overall) : team.rating;
    }
  }
  return sum / POS_ORDER.length + lead;
}

export const teamName = (s: GameState, id: string) => (id === 'own' ? s.team.name : (cur(s).byId[id]?.name ?? id));

/** 队伍显示名：英文名 + 中文常用名 */
export function teamLabel(s: GameState, id: string): string {
  if (id === 'own') return s.team.name;
  const t = cur(s).byId[id];
  return t ? (t.zh ? `${t.name}（${t.zh}）` : t.name) : id;
}

/** 本赛区今年参加联赛的 8 支队伍。自己的战队顶替其中实力最弱的一支 */
export function leagueIds(s: GameState): string[] {
  const ids = [...cur(s).leagues[s.region]];
  if (s.team.kind === 'own') {
    let worst = 0;
    ids.forEach((id, i) => {
      if (cur(s).byId[id] && cur(s).byId[id].rating < cur(s).byId[ids[worst]].rating) worst = i;
    });
    ids[worst] = 'own';
  }
  return ids;
}

/** 联赛积分榜：按胜场，再按实力 */
export function tableOrder(s: GameState, sp: SplitState): string[] {
  return [...sp.ids].sort((a, b) => sp.table[b].w - sp.table[a].w || teamRating(s, b) - teamRating(s, a));
}
