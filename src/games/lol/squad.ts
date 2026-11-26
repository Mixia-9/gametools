/**
 * 战队：赛季初加入一支真实战队，或者留在自己的战队里抽卡换人。
 */
import { POS_ORDER, regionOfNat, type Position, type ProPlayer } from './data';
import { cur, findPro, isWindow, log, overall, posName, ri, rnd, teamLabel, teamRating, type GameState, type TeamState } from './core';

export type Pool = 'home' | 'away';

/** 一张卡的价值：抽卡的花费 */
export const DRAW_COST = 60;

/** 稀有度：0 路人 … 4 传奇，按实力划分 */
export const RARITY = [
  { name: '路人', min: 0 },
  { name: '主力', min: 60 },
  { name: '核心', min: 72 },
  { name: '巨星', min: 82 },
  { name: '传奇', min: 90 },
];

export const rarityOf = (value: number) => RARITY.reduce((r, x, i) => (value >= x.min ? i : r), 0);

/** 各稀有度的出货权重（百分比） */
const RARITY_WEIGHT = [28, 32, 22, 13, 5];
/** 保底：连续这么多抽没出核心以上，下一抽必出 */
const PITY = 10;

export function interest(s: GameState, teamId: string): { ok: boolean; why: string } {
  const team = cur(s).byId[teamId];
  if (!team) return { ok: false, why: '这支队今年不在联赛里' };
  if (!isWindow(s)) return { ok: false, why: '只能在转会期换队' };
  const lock = team.roster[s.pos];
  if (lock?.locked) return { ok: false, why: `${lock.id} 是非卖品，这支队不招${posName(s.pos)}` };
  const need = Math.round(teamRating(s, teamId) - 15);
  if (overall(s) < need) return { ok: false, why: `需要综合实力达到 ${need}` };
  if (s.rank < 250) return { ok: false, why: '段位至少要到铂金' };
  return { ok: true, why: '' };
}

function emptyTeam(s: GameState, name: string): TeamState {
  const members = { top: null, jungle: null, mid: null, adc: null, support: null } as Record<Position, string | null>;
  const trainees = { top: 42, jungle: 41, mid: 43, adc: 41, support: 40 } as Record<Position, number>;
  return { kind: 'own', id: 'own', name, members, trainees, coord: 0 };
}

function initTrainees(s: GameState, team: TeamState) {
  for (const p of POS_ORDER) team.trainees[p] = 40 + ri(s, 0, 4);
}

/** 加入一支真实战队，顶替自己位置上的那名选手 */
export function joinTeam(s: GameState, teamId: string): boolean {
  if (!interest(s, teamId).ok) return false;
  const old = s.team.name;
  s.bench = [];
  const team = cur(s).byId[teamId];
  const trainees = s.team.trainees;
  s.team = { kind: 'real', id: teamId, name: team.name, members: emptyTeam(s, '').members, trainees, coord: 1 };
  log(s, `你离开 ${old}，加入 ${teamLabel(s, teamId)}，担任${posName(s.pos)}。`, 'title');
  return true;
}

/** 成立（或改名）自己的战队。离开真实战队时，原来抽到的选手全部回到各自的队伍 */
export function makeOwnTeam(s: GameState, name: string): boolean {
  const trimmed = name.trim().slice(0, 12);
  if (!isWindow(s) || !trimmed) return false;
  if (s.team.kind === 'own') {
    s.team.name = trimmed;
    return true;
  }
  const old = s.team.name;
  const team = emptyTeam(s, trimmed);
  initTrainees(s, team);
  s.team = team;
  s.bench = [];
  log(s, `你离开 ${old}，成立了自己的战队「${trimmed}」。`, 'title');
  return true;
}

/** 新赛季队伍的去向：真实战队还在联赛里就留队，否则回到自己的战队 */
export function carryTeam(s: GameState): void {
  const season = cur(s);
  if (s.team.kind === 'real') {
    if (season.leagues[s.region].includes(s.team.id)) {
      s.team.name = season.byId[s.team.id].name;
      return;
    }
    const old = s.team.name;
    const team = emptyTeam(s, `${s.name}战队`);
    initTrainees(s, team);
    s.team = team;
    s.bench = [];
    log(s, `${old} 今年不在联赛里了，你成立了自己的战队「${team.name}」。`, 'bad');
    return;
  }
  for (const p of POS_ORDER) {
    const id = s.team.members[p];
    if (id && !findPro(s, id)) {
      s.team.members[p] = null;
      log(s, `${id} 合约到期，离开了你的战队。`, 'bad');
    }
  }
  const left = s.bench.filter((id) => !findPro(s, id));
  for (const id of left) log(s, `${id} 合约到期离队。`);
  s.bench = s.bench.filter((id) => findPro(s, id));
}

/** 卡池：今年所有能抽的选手（非卖品抽不到，已经在自己队里的也不重复出现） */
export function poolOf(s: GameState, pool: Pool): ProPlayer[] {
  const home = (p: ProPlayer) => cur(s).byId[p.team]?.region === s.region;
  return cur(s).teams
    .flatMap((t) => Object.values(t.roster))
    .filter((p): p is ProPlayer => !!p && !p.locked && !owned(s, p.id) && (pool === 'home' ? home(p) : !home(p)));
}

const owned = (s: GameState, id: string) => s.bench.includes(id) || POS_ORDER.some((p) => s.team.members[p] === id);

/** 抽卡：先定稀有度，再在这个稀有度里随机一名选手。抽到的人离开原来的队伍 */
export function draw(s: GameState, pool: Pool, n = 1): ProPlayer[] {
  if (s.team.kind !== 'own' || !isWindow(s) || s.funds < DRAW_COST * n) return [];
  s.funds -= DRAW_COST * n;
  const got: ProPlayer[] = [];
  for (let i = 0; i < n; i++) {
    const all = poolOf(s, pool);
    if (!all.length) break;
    let roll = rnd(s) * 100;
    let tier = 0;
    for (let k = RARITY_WEIGHT.length - 1; k >= 0; k--) {
      if (roll < RARITY_WEIGHT[k]) {
        tier = k;
        break;
      }
      roll -= RARITY_WEIGHT[k];
    }
    // 保底
    s.pity = tier >= 2 ? 0 : s.pity + 1;
    if (s.pity >= PITY) {
      tier = Math.max(tier, 2);
      s.pity = 0;
    }
    // 这个稀有度没人就往下降一档
    let cand: ProPlayer[] = [];
    for (let k = tier; k >= 0 && !cand.length; k--) cand = all.filter((p) => rarityOf(p.overall) === k);
    if (!cand.length) cand = all;
    const p = cand[Math.floor(rnd(s) * cand.length)];
    got.push(p);
    s.bench.push(p.id);
    const from = cur(s).byId[p.team];
    log(s, `抽到【${RARITY[rarityOf(p.overall)].name}】${from ? `${from.name} 的 ` : ''}${p.id}（${posName(p.pos)}，实力 ${p.overall}）。`, 'gacha');
  }
  return got;
}

/** 自己战队阵容里的外援人数 */
export function imports(s: GameState): number {
  return POS_ORDER.filter((p) => s.team.members[p]).filter((p) => regionOfNat(findPro(s, s.team.members[p]!)!.nat) !== s.region).length;
}

/** 把替补席上的选手放进首发，或者换回青训 */
export function setMember(s: GameState, pos: Position, playerId: string | null): { ok: boolean; why: string } {
  if (s.team.kind !== 'own' || !isWindow(s)) return { ok: false, why: '只能在转会期调整阵容' };
  if (playerId === null) {
    if (s.team.members[pos]) {
      s.bench.push(s.team.members[pos]!);
      s.team.members[pos] = null;
    }
    return { ok: true, why: '' };
  }
  const pro = findPro(s, playerId);
  if (!pro || pro.pos !== pos || !s.bench.includes(playerId)) return { ok: false, why: '这名选手不在这个位置上' };
  const others = POS_ORDER.filter((p) => p !== pos && s.team.members[p]);
  const importsAfter = others.filter((p) => regionOfNat(findPro(s, s.team.members[p]!)!.nat) !== s.region).length + (regionOfNat(pro.nat) !== s.region ? 1 : 0);
  if (importsAfter > 2) return { ok: false, why: '首发里外援最多两人' };
  if (s.team.members[pos]) s.bench.push(s.team.members[pos]!);
  s.team.members[pos] = playerId;
  s.bench = s.bench.filter((id) => id !== playerId);
  return { ok: true, why: '' };
}

/** 放走替补席上的一名选手，他回到原来的队伍 */
export function release(s: GameState, playerId: string): boolean {
  if (s.team.kind !== 'own' || !isWindow(s) || !s.bench.includes(playerId)) return false;
  s.bench = s.bench.filter((id) => id !== playerId);
  log(s, `你放走了 ${playerId}。`);
  return true;
}
