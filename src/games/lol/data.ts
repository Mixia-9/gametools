/**
 * 「重生之我是英雄联盟职业选手」的静态数据。
 *
 * 队伍按赛季录入，一行一支：
 *   队伍ID|队名|赛区|实力基准|上单,打野,中单,ADC,辅助|中文常用名
 * 选手写法：ID，可带后缀
 *   !      非卖品（抽不到，也不能通过加入战队挤掉）
 *   ^+6    实力相对队伍基准的微调
 *   ~mech  打法标签：mech 操作 / lane 对线 / macro 运营 / sense 意识 / mental 心态，不写则按位置取默认
 *   @KR    国籍与所在赛区不同时标注（KR CN EU NA TW SEA BR）
 *
 * 选手的五维属性由「实力 + 位置 + 打法标签 + 名字」确定性地生成，所以同一名选手每次都一样。
 */

export type Region = 'LPL' | 'LCK' | 'EU' | 'NA';
export type Position = 'top' | 'jungle' | 'mid' | 'adc' | 'support';
export type Attr = 'reaction' | 'laning' | 'macro' | 'sense' | 'mental';
export type Tag = 'mech' | 'lane' | 'macro' | 'sense' | 'mental';
export type SeasonId = 'S3' | 'S4' | 'S5';

export const POS_ORDER: Position[] = ['top', 'jungle', 'mid', 'adc', 'support'];

export const ATTRS: { id: Attr; name: string; desc: string }[] = [
  { id: 'reaction', name: '反应', desc: '手速与瞬间判断，决定操作上限' },
  { id: 'laning', name: '对线', desc: '补刀、换血、兵线处理' },
  { id: 'macro', name: '运营', desc: '版本理解、资源置换、节奏把控' },
  { id: 'sense', name: '意识', desc: '地图信息、预判 Gank、视野' },
  { id: 'mental', name: '心态', desc: '抗压、逆风不崩、沟通指挥' },
];

export const POSITIONS: { id: Position; name: string; weights: Record<Attr, number> }[] = [
  { id: 'top', name: '上单', weights: { reaction: 0.2, laning: 0.3, macro: 0.25, sense: 0.15, mental: 0.1 } },
  { id: 'jungle', name: '打野', weights: { reaction: 0.15, laning: 0.05, macro: 0.35, sense: 0.3, mental: 0.15 } },
  { id: 'mid', name: '中单', weights: { reaction: 0.25, laning: 0.3, macro: 0.2, sense: 0.1, mental: 0.15 } },
  { id: 'adc', name: 'ADC', weights: { reaction: 0.35, laning: 0.3, macro: 0.1, sense: 0.1, mental: 0.15 } },
  { id: 'support', name: '辅助', weights: { reaction: 0.15, laning: 0.1, macro: 0.3, sense: 0.3, mental: 0.15 } },
];

export const REGIONS: { id: Region; name: string; league: string; desc: string }[] = [
  { id: 'LPL', name: 'LPL', league: 'LPL', desc: '中国大陆赛区' },
  { id: 'LCK', name: 'LCK', league: 'OGN Champions / LCK', desc: '韩国赛区' },
  { id: 'EU', name: 'EU LCS', league: 'EU LCS', desc: '欧洲赛区' },
  { id: 'NA', name: 'NA LCS', league: 'NA LCS', desc: '北美赛区' },
];

const REGION_OF_NAT: Record<string, string> = { CN: 'LPL', KR: 'LCK', EU: 'EU', NA: 'NA', TW: 'TW', SEA: 'SEA', BR: 'BR' };

/** 词条。start = 开局可选；hidden = 达成条件后解锁 */
export interface Trait {
  id: string;
  name: string;
  desc: string;
  start?: boolean;
  hidden?: boolean;
  bad?: boolean;
}

export const TRAITS: Trait[] = [
  { id: 'reborn', name: '重生者', desc: '你带着未来的记忆。淘汰赛（季后赛、世界赛淘汰赛）胜率 +4%；每个赛季开始时获得 10 点训练点。', start: true },
  { id: 'genius', name: '天赋异禀', desc: '训练点获取 +25%。', start: true },
  { id: 'grinder', name: '排位狂人', desc: '排位上分速度 +40%，排位消耗的体力 −5。', start: true },
  { id: 'clutch', name: '大心脏', desc: '淘汰赛的决胜局，队伍胜率 +12%。', start: true },
  { id: 'iron', name: '铁人', desc: '体力上限 +40，加练几乎不会受伤。', start: true },
  { id: 'rankedking', name: '最强王者', desc: '首次登顶最强王者。之后排位失败掉分减半。', hidden: true },
  { id: 'champion', name: '联赛冠军', desc: '首次夺得联赛冠军。之后比赛获得的训练点 +50%。', hidden: true },
  { id: 'worldchamp', name: '世界冠军', desc: '首次夺得全球总决赛冠军。之后淘汰赛胜率 +3%。', hidden: true },
  { id: 'injury', name: '伤病隐患', desc: '加练受伤留下的隐患：训练点获取 −15%。休赛期结束后移除。', hidden: true, bad: true },
];

/** 各位置的英雄池（S3–S5 年代的常见选择），只用于比赛播报 */
export const CHAMPIONS: Record<Position, string[]> = {
  top: ['贾克斯', '鳄鱼', '龙女', '慎', '蒙多', '兰博', '锐雯', '剑魔', '纳尔', '大树', '艾克', '剑姬', '波比'],
  jungle: ['盲僧', '扎克', '蜘蛛', '皇子', '蔚', '螳螂', '挖掘机', '酒桶', '猪妹', '千珏', '狼人'],
  mid: ['劫', '妖姬', '阿狸', '发条', '辛德拉', '卡萨丁', '泽拉斯', '维克托', '瑞兹', '沙皇', '璐璐', '杰斯', '飞机'],
  adc: ['薇恩', '卢锡安', '金克丝', 'EZ', '女警', '老鼠', '希维尔', '滑板鞋', '德莱文', '小炮', '大嘴'],
  support: ['锤石', '安妮', '索娜', '婕拉', '日女', '布隆', '莫甘娜', '风女', '巴德', '机器人', '牛头', '拉克丝'],
};

export interface ProPlayer {
  id: string;
  pos: Position;
  /** 国籍，用赛区代码表示：LPL（中国）/ LCK（韩国）/ EU / NA / TW / SEA / BR */
  nat: string;
  overall: number;
  attrs: Record<Attr, number>;
  locked: boolean;
  team: string;
  tag: Tag;
}

export interface ProTeam {
  id: string;
  name: string;
  zh: string;
  region: string;
  rating: number;
  roster: Partial<Record<Position, ProPlayer>>;
}

export interface SeasonData {
  id: SeasonId;
  year: number;
  teams: ProTeam[];
  byId: Record<string, ProTeam>;
  /** 按赛季内唯一 ID 查选手 */
  players: Record<string, ProPlayer>;
  /** 四个可选赛区各自的联赛队伍（每队 8 支） */
  leagues: Record<Region, string[]>;
  /** 世界赛：各赛区名额，以及当年的真实分组（队伍 ID） */
  worlds: { slots: Record<string, number>; groups: string[][] };
  /** 段位名称，相邻两档之间等分 0–1000 */
  tiers: string[];
}

export interface RawSeason {
  id: SeasonId;
  year: number;
  /** 四个可选赛区各自的联赛队伍；某个赛区资料没核实时留空，游戏里就不让选 */
  leagues: Record<Region, string[]>;
  /** 只在世界赛出现的队伍（其他赛区，或本赛区没进联赛名单的队伍） */
  extra?: string[];
  worlds: WorldsSpec;
  tiers: string[];
}

/** 世界赛的真实名单。bracket 是八强对阵顺序，用 A1/B2 这类小组名次或 seed:队伍ID 表示 */
export interface WorldsSpec {
  /** 各赛区的参赛名额 */
  slots: Record<string, number>;
  groups: string[][];
  /** 不打小组赛、直接进八强的队伍（S3 的赛制） */
  seeds?: string[];
  bracket: string[];
}

/** 各打法标签对五维的偏移（加完后再整体平移，使加权实力不变） */
const TAG_OFFSET: Record<Tag, Record<Attr, number>> = {
  mech: { reaction: 10, laning: 4, macro: -8, sense: -2, mental: -4 },
  lane: { reaction: 4, laning: 10, macro: -6, sense: -4, mental: -4 },
  macro: { reaction: -8, laning: -3, macro: 10, sense: 5, mental: -4 },
  sense: { reaction: -8, laning: -4, macro: 5, sense: 10, mental: -3 },
  mental: { reaction: -7, laning: -3, macro: 5, sense: -2, mental: 12 },
};

const DEFAULT_TAG: Record<Position, Tag> = {
  top: 'lane',
  jungle: 'macro',
  mid: 'mech',
  adc: 'lane',
  support: 'sense',
};

function hash(s: string): number {
  let h = 2166136261;
  for (const ch of s) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** 由实力、位置、打法生成五维属性；同名选手结果固定 */
export function attrsFor(overall: number, pos: Position, tag: Tag, seed: string): Record<Attr, number> {
  const w = POSITIONS.find((p) => p.id === pos)!.weights;
  const raw = {} as Record<Attr, number>;
  let weighted = 0;
  for (const a of ATTRS) {
    raw[a.id] = overall + TAG_OFFSET[tag][a.id] + ((hash(seed + a.id) % 11) - 5);
    weighted += raw[a.id] * w[a.id];
  }
  const out = {} as Record<Attr, number>;
  for (const a of ATTRS) out[a.id] = Math.round(clamp(raw[a.id] + (overall - weighted), 1, 99));
  return out;
}

/** 解析一行队伍 */
function parseTeam(line: string, seen: Map<string, string>): ProTeam {
  const [id, name, region, ratingStr, players = '', zh = ''] = line.split('|');
  const rating = Number(ratingStr);
  const roster: Partial<Record<Position, ProPlayer>> = {};
  players.split(',').forEach((token, i) => {
    const t = token.trim();
    if (!t) return;
    const pos = POS_ORDER[i];
    const locked = t.startsWith('!');
    const body = locked ? t.slice(1) : t;
    const [rawId, mods = ''] = body.split('^');
    const playerName = body.split(/[~^@]/)[0].trim();
    // 国籍统一存成赛区代码（CN→LPL、KR→LCK……），没标注时默认与所在赛区相同
    const natCode = rawId.includes('@') ? rawId.split('@')[1] : region;
    const nat = REGION_OF_NAT[natCode] ?? natCode;
    const delta = Number((mods.match(/[+-]\d+/) ?? ['0'])[0]);
    const tagMatch = mods.match(/~(mech|lane|macro|sense|mental)/);
    const tag = (tagMatch ? (tagMatch[1] as Tag) : DEFAULT_TAG[pos]);
    const overall = Math.round(clamp(rating + delta, 30, 99));
    // 同一赛季里 ID 重复时加上队伍后缀，保证能唯一引用
    const key = seen.has(playerName) ? `${playerName}@${id}` : playerName;
    seen.set(playerName, id);
    roster[pos] = { id: key, pos, nat, overall, attrs: attrsFor(overall, pos, tag, key), locked, team: id, tag };
  });
  return { id, name, zh, region, rating, roster };
}

export function buildSeason(raw: RawSeason): SeasonData {
  const seen = new Map<string, string>();
  const leagues = {} as Record<Region, string[]>;
  for (const [region, lines] of Object.entries(raw.leagues) as [Region, string[]][]) {
    leagues[region] = lines.map((line) => line.split('|')[0]);
  }
  const teams = [...Object.values(raw.leagues).flat(), ...(raw.extra ?? [])].map((line) => parseTeam(line, seen));
  const byId: Record<string, ProTeam> = {};
  const players: Record<string, ProPlayer> = {};
  for (const team of teams) {
    byId[team.id] = team;
    for (const p of Object.values(team.roster)) if (p) players[p.id] = p;
  }
  return { id: raw.id, year: raw.year, teams, byId, players, leagues, worlds: raw.worlds, tiers: raw.tiers };
}

/** 选手的国籍属于哪个赛区（用于“外援最多两人”） */
export function regionOfNat(nat: string): string {
  return REGION_OF_NAT[nat] ?? nat;
}
