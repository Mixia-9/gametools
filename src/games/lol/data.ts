/**
 * 「重生之我是英雄联盟职业选手」的静态数据。
 *
 * 队伍按赛季录入，一行一支：
 *   队伍ID|队名|赛区|实力基准|上单,打野,中单,ADC,辅助|中文常用名
 * 选手写法：ID，可带后缀
 *   !      非卖品（抽不到，也不能通过加入战队挤掉）
 *   ^+6    实力相对队伍基准的微调；^=92 是直接写这名选手这一年的实力（明星选手用，逐季写）
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

/** 词条品质：数字越大越难遇到，效果也越强 */
export type Quality = 0 | 1 | 2 | 3;

export const QUALITY: { name: string }[] = [{ name: '普通' }, { name: '稀有' }, { name: '史诗' }, { name: '传说' }];

/** 摇词条时各品质的权重（百分比） */
export const QUALITY_WEIGHT = [46, 30, 18, 6];

/**
 * 词条的效果。引擎把身上所有词条的效果汇总起来再统一读取（core.ts 的 traitFx），不在各处单独判断某个词条。
 * 胜率类都是加法，0.02 = +2%；注释写“乘”的是乘法，0.1 = +10%，−0.5 = 减半。
 */
export interface TraitFx {
  // ---- 乘法，1 = 不变 ----
  /** 所有训练点的获取 */
  tp?: number;
  /** 比赛拿到的训练点 */
  matchTp?: number;
  /** 加点的花费（负数 = 便宜，−0.15 = 便宜 15%） */
  cost?: number;
  /** 排位上分（只算加分） */
  rank?: number;
  /** 排位失败掉分 */
  rankLoss?: number;
  /** 休息恢复的体力 */
  recover?: number;
  /** 加练受伤的概率 */
  injury?: number;
  /** 资金收入 */
  funds?: number;
  /** 队伍磨合度的增长概率 */
  coord?: number;
  // ---- 加法 ----
  /** 选到时立刻拿到的训练点 / 资金 */
  tpNow?: number;
  fundsNow?: number;
  /** 每个赛季开始时拿到的训练点 */
  seasonTp?: number;
  /** 休息时也拿到的训练点 */
  restTp?: number;
  /** 排位 / 训练赛和加练 消耗的体力 */
  rankStamina?: number;
  trainStamina?: number;
  /** 体力上限 */
  stamina?: number;
  /** 受伤后休战的天数减少 */
  heal?: number;
  /** 体力低于 30 时训练基本不打折 */
  grit?: boolean;
  /** 抽卡时【核心】以上的出货权重 */
  luck?: number;
  /** 战队对你有意向的实力门槛降低 */
  interest?: number;
  /** 自己战队首发的外援上限 */
  imports?: number;
  /** 自己所在队伍的实力 */
  lead?: number;
  // ---- 胜率（加法） ----
  /** 联赛常规赛 */
  league?: number;
  /** 淘汰赛：季后赛、世界赛淘汰赛 */
  elim?: number;
  /** 世界赛：小组赛和淘汰赛 */
  worlds?: number;
  /** 系列赛决胜局 */
  decider?: number;
  /** 系列赛第一局 */
  firstGame?: number;
  /** 单场决胜的比赛 */
  bo1?: number;
  /** 系列赛第 3 局起 */
  late?: number;
  /** 系列赛里比分领先 / 落后时 */
  ahead?: number;
  behind?: number;
  /** 对手实力比自己队伍高时 */
  underdog?: number;
  /** 自己在蓝色方 / 红色方时 */
  blue?: number;
  red?: number;
}

/**
 * 词条。start = 开局可选；pick = 加点时可以选到（品质见 quality）；hidden = 达成条件后自动获得。
 * 描述里的数值必须和 fx 一致，规则测试会核对。
 */
export interface Trait {
  id: string;
  name: string;
  desc: string;
  fx?: TraitFx;
  start?: boolean;
  pick?: boolean;
  quality?: Quality;
  /** 只对这几个位置开放 */
  pos?: Position[];
  hidden?: boolean;
  bad?: boolean;
}

type Row = [id: string, name: string, desc: string, fx: TraitFx, pos?: Position[]];

/** 某个品质的一批可选词条 */
const pickable = (quality: Quality, rows: Row[]): Trait[] => rows.map(([id, name, desc, fx, pos]) => ({ id, name, desc, fx, quality, pick: true, pos }));

const ELIM = '淘汰赛（季后赛、世界赛淘汰赛）';

export const TRAITS: Trait[] = [
  // ---- 开局词条：只能在开局选 ----
  { id: 'reborn', name: '重生者', desc: `你带着未来的记忆。${ELIM}胜率 +4%；每个赛季开始时获得 10 点训练点。`, fx: { elim: 0.04, seasonTp: 10 }, start: true },
  { id: 'genius', name: '天赋异禀', desc: '训练点获取 +25%。', fx: { tp: 0.25, matchTp: 0.25 }, start: true },
  { id: 'grinder', name: '排位狂人', desc: '排位上分速度 +40%，排位消耗的体力 −5。', fx: { rank: 0.4, rankStamina: -5 }, start: true },
  { id: 'clutch', name: '大心脏', desc: '淘汰赛的决胜局，队伍胜率 +12%。', fx: { decider: 0.12 }, start: true },
  { id: 'iron', name: '铁人', desc: '体力上限 +40，加练受伤的概率 −90%。', fx: { stamina: 40, injury: -0.9 }, start: true },

  // ---- 加点时选到的词条，按品质分四档 ----
  ...pickable(0, [
    ['warmup', '热身习惯', '休息恢复的体力 +15%。', { recover: 0.15 }],
    ['notebook', '复盘笔记', '训练点获取 +5%。', { tp: 0.05, matchTp: 0.05 }],
    ['duoqueue', '固定排位搭子', '排位上分速度 +10%。', { rank: 0.1 }],
    ['thrifty', '省吃俭用', '资金收入 +10%。', { funds: 0.1 }],
    ['homework', '带着问题休息', '休息时也获得 2 点训练点。', { restTp: 2 }],
    ['lightpack', '轻装上阵', '体力上限 +6。', { stamina: 6 }],
    ['easygoing', '好相处', '队伍磨合度的增长 +20%。', { coord: 0.2 }],
    ['bluemain', '蓝方熟练', '自己在蓝色方时，胜率 +2%。', { blue: 0.02 }],
    ['redmain', '红方也不怵', '自己在红色方时，胜率 +2%。', { red: 0.02 }],
    ['opener', '开门红', '系列赛第一局，胜率 +2%。', { firstGame: 0.02 }],
    ['bo1player', 'BO1 选手', '单场决胜的比赛，胜率 +3%。', { bo1: 0.03 }],
    ['regular', '常规赛很稳', '联赛常规赛的胜率 +2%。', { league: 0.02 }],
    ['stretching', '拉伸狂魔', '加练受伤的概率 −25%。', { injury: -0.25 }],
    ['earlybird', '作息规律', '训练赛、加练消耗的体力 −2。', { trainStamina: -2 }],
    ['streamer', '直播整活', '排位上分速度 +5%，资金收入 +5%。', { rank: 0.05, funds: 0.05 }],
    ['bargain', '会挑外设', '加点的花费便宜 8%。', { cost: -0.08 }],
    ['vod', '爱看录像', '世界赛的胜率 +2%。', { worlds: 0.02 }],
    ['composed', '大场面不紧张', `${ELIM}的胜率 +1%。`, { elim: 0.01 }],
  ]),
  ...pickable(1, [
    ['conditioning', '体能特训', '体力上限 +15。', { stamina: 15 }],
    ['coach', '请了私教', '训练点获取 +10%。', { tp: 0.1, matchTp: 0.1 }],
    ['duoace', '双排上分', '排位上分速度 +20%。', { rank: 0.2 }],
    ['sponsor', '赞助商', '资金收入 +20%。', { funds: 0.2 }],
    ['physio', '私人理疗师', '休息恢复的体力 +30%，加练受伤的概率 −30%。', { recover: 0.3, injury: -0.3 }],
    ['giantkiller', '以下克上', '对手实力比自己队伍高时，胜率 +4%。', { underdog: 0.04 }],
    ['comeback', '知耻后勇', '系列赛里比分落后时，胜率 +4%。', { behind: 0.04 }],
    ['momentum', '乘胜追击', '系列赛里比分领先时，胜率 +3%。', { ahead: 0.03 }],
    ['veteran', '老将的经验', '系列赛第 3 局起，胜率 +3%。', { late: 0.03 }],
    ['iglcalls', '场上指挥', '自己所在队伍的实力 +1。', { lead: 1 }],
    ['connections', '人脉广', '战队对你有意向的实力门槛 −4。', { interest: 4 }],
    ['biggame', '关键先生', `${ELIM}的胜率 +3%。`, { elim: 0.03 }],
    ['quickstudy', '举一反三', '加点的花费便宜 12%。', { cost: -0.12 }],
    ['fastheal', '恢复得快', '受伤后休战的天数 −3。', { heal: 3 }],
    ['splitpush', '单带一路', '联赛常规赛的胜率 +3%。', { league: 0.03 }, ['top']],
    ['tempo', '节奏大师', `队伍磨合度的增长 +50%，${ELIM}的胜率 +2%。`, { coord: 0.5, elim: 0.02 }, ['jungle']],
    ['roamer', '支援型中单', '系列赛第一局，胜率 +4%。', { firstGame: 0.04 }, ['mid']],
    ['hypercarry', '后期大核', '系列赛第 3 局起，胜率 +5%。', { late: 0.05 }, ['adc']],
    ['vision', '视野大师', '对手实力比自己队伍高时，胜率 +5%。', { underdog: 0.05 }, ['support']],
  ]),
  ...pickable(2, [
    ['system', '科学的训练法', '训练点获取 +15%。', { tp: 0.15, matchTp: 0.15 }],
    ['ironwill', '铁血意志', '体力上限 +25；体力低于 30 时，训练收益基本不受影响。', { stamina: 25, grit: true }],
    ['bigstage', '大赛型选手', `${ELIM}的胜率 +4%，决胜局的胜率 +4%。`, { elim: 0.04, decider: 0.04 }],
    ['bornforworlds', '为世界赛而生', '世界赛的胜率 +5%。', { worlds: 0.05 }],
    ['patchmaster', '版本大师', '联赛常规赛的胜率 +4%，系列赛第 3 局起的胜率 +3%。', { league: 0.04, late: 0.03 }],
    ['patron', '金主爸爸', '资金收入 +40%。', { funds: 0.4 }],
    ['luckycharm', '欧皇附体', '抽卡时【核心】以上选手的出货权重 +40%。', { luck: 0.4 }],
    ['efficient', '高效学习', '加点的花费便宜 20%。', { cost: -0.2 }],
    ['perpetual', '永动机', '体力上限 +20，休息恢复的体力 +40%。', { stamina: 20, recover: 0.4 }],
    ['icecold', '冷静得可怕', '对手实力比自己队伍高时，胜率 +5%；系列赛里比分落后时，胜率 +5%。', { underdog: 0.05, behind: 0.05 }],
    ['meltingpot', '国际纵队', '自己战队首发的外援上限 +1。', { imports: 1 }],
    ['rankdemon', '排位之神', '排位上分速度 +35%，排位失败掉分 −20%。', { rank: 0.35, rankLoss: 0.2 }],
    ['epiphany', '顿悟', '选到时立刻获得 30 点训练点。', { tpNow: 30 }],
    ['teambrain', '团队大脑', '自己所在队伍的实力 +2。', { lead: 2 }],
  ]),
  ...pickable(3, [
    ['chosen', '天选之子', '训练点获取 +25%。', { tp: 0.25, matchTp: 0.25 }],
    ['immortal', '不坏之身', '加练受伤的概率 −80%，体力上限 +30。', { injury: -0.8, stamina: 30 }],
    ['closer', '决赛终结者', `${ELIM}的胜率 +5%，决胜局的胜率 +8%。`, { elim: 0.05, decider: 0.08 }],
    ['worldclass', '世界级选手', '世界赛的胜率 +8%；对手实力比自己队伍高时，胜率 +4%。', { worlds: 0.08, underdog: 0.04 }],
    ['goldhand', '点石成金', '加点的花费便宜 30%。', { cost: -0.3 }],
    ['windfall', '天降横财', '选到时立刻获得 200 资金，资金收入 +60%。', { fundsNow: 200, funds: 0.6 }],
    ['memories', '记忆碎片', '选到时和每个赛季开始时，各获得 20 点训练点。', { tpNow: 20, seasonTp: 20 }],
    ['unshakable', '不动如山', '系列赛里比分落后时，胜率 +8%；决胜局的胜率 +6%。', { behind: 0.08, decider: 0.06 }],
    ['allround', '全能战士', '自己所在队伍的实力 +3，队伍磨合度的增长 +100%。', { lead: 3, coord: 1 }],
    ['destined', '命运之子', '抽卡时【核心】以上选手的出货权重 +100%。', { luck: 1 }],
  ]),

  // ---- 达成条件后自动获得 ----
  { id: 'rankedking', name: '最强王者', desc: '首次登顶最强王者。之后排位失败掉分 −50%。', fx: { rankLoss: 0.5 }, hidden: true },
  { id: 'champion', name: '联赛冠军', desc: '首次夺得联赛冠军。之后比赛获得的训练点 +50%。', fx: { matchTp: 0.5 }, hidden: true },
  { id: 'worldchamp', name: '世界冠军', desc: '首次夺得全球总决赛冠军。之后淘汰赛胜率 +3%。', fx: { elim: 0.03 }, hidden: true },
  { id: 'injury', name: '伤病隐患', desc: '加练受伤留下的隐患：训练点获取 −15%。休赛期结束后移除。', fx: { tp: -0.15, matchTp: -0.15 }, hidden: true, bad: true },
];

/**
 * 各位置的常见英雄（中文名）和上线年份，只用于比赛播报。
 * 规则：某个赛季只用“当前赛季之前”上线的英雄，比如 2013 年的 S3 只能用 2012 年底以前上线的。
 * 上线年份是按已有知识写的，没有逐个联网核对。
 */
const CHAMPION_RELEASE: Record<Position, [string, number][]> = {
  top: [
    ['贾克斯', 2011], ['鳄鱼', 2011], ['龙女', 2011], ['慎', 2010], ['蒙多', 2009], ['兰博', 2011], ['锐雯', 2011],
    ['刀妹', 2010], ['凯南', 2010], ['皇子', 2011], ['杰斯', 2012], ['大树', 2010], ['狮子狗', 2012], ['悟空', 2011],
    ['船长', 2009], ['奥拉夫', 2010], ['剑姬', 2012],
    ['剑魔', 2013],
    ['纳尔', 2014],
  ],
  jungle: [
    ['盲僧', 2011], ['蜘蛛', 2012], ['皇子', 2011], ['蔚', 2012], ['螳螂', 2012], ['酒桶', 2010], ['猪妹', 2012],
    ['狼人', 2009], ['努努', 2009], ['龙女', 2011], ['梦魇', 2011], ['寡妇', 2009], ['人马', 2012], ['斯卡纳', 2011],
    ['龙龟', 2009], ['狮子狗', 2012],
    ['扎克', 2013],
    ['雷克塞', 2014],
  ],
  mid: [
    ['劫', 2012], ['妖姬', 2010], ['阿狸', 2011], ['发条', 2011], ['辛德拉', 2012], ['卡萨丁', 2009], ['泽拉斯', 2011],
    ['维克托', 2011], ['瑞兹', 2009], ['璐璐', 2012], ['杰斯', 2012], ['飞机', 2009], ['鱼人', 2011], ['卡牌', 2009],
    ['皎月', 2012], ['酒桶', 2010], ['蛇女', 2010],
    ['亚索', 2013], ['冰女', 2013],
    ['沙皇', 2014],
  ],
  adc: [
    ['薇恩', 2011], ['EZ', 2010], ['女警', 2011], ['老鼠', 2009], ['德莱文', 2012], ['小炮', 2009], ['大嘴', 2009],
    ['男枪', 2011], ['韦鲁斯', 2012], ['希维尔', 2009], ['飞机', 2009],
    ['奎因', 2013], ['卢锡安', 2013], ['金克丝', 2013],
    ['滑板鞋', 2014],
  ],
  support: [
    ['锤石', 2013], ['安妮', 2009], ['索娜', 2010], ['婕拉', 2012], ['日女', 2011], ['莫甘娜', 2009], ['风女', 2009],
    ['机器人', 2009], ['牛头', 2009], ['拉克丝', 2010], ['娜美', 2012], ['努努', 2009], ['璐璐', 2012], ['索拉卡', 2009],
    ['卡尔玛', 2011],
    ['布隆', 2014],
  ],
};

/** 某一年的某个位置能用的英雄：只取这一年之前上线的 */
export function championsFor(year: number, pos: Position): string[] {
  return CHAMPION_RELEASE[pos].filter(([, release]) => release < year).map(([name]) => name);
}

export interface ProPlayer {
  id: string;
  /** 不区分大小写的 ID，用来跨赛季认同一个人 */
  uid: string;
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
  /** 按不区分大小写的 ID 查选手，跨赛季认人用 */
  byUid: Record<string, ProPlayer>;
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

/**
 * 没有单独写实力（^=NN）的选手，每个赛季按“名字 + 年份”固定地起伏 1–2 分。
 * 这样队伍实力基准没变的选手，新一季的实力也不会和上一季一模一样。
 */
export function formOf(seed: string, year: number): number {
  const r = hash(`${seed.toLowerCase()}|${year}`) % 100;
  return r < 12 ? -2 : r < 50 ? -1 : r < 88 ? 1 : 2;
}

/** 解析一行队伍 */
function parseTeam(line: string, seen: Map<string, string>, year: number): ProTeam {
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
    // ^=92 是直接写死的实力；否则 = 队伍实力基准 + 微调 + 这一季的状态起伏
    const fixed = mods.match(/=(\d+)/);
    const delta = Number((mods.match(/[+-]\d+/) ?? ['0'])[0]);
    const tagMatch = mods.match(/~(mech|lane|macro|sense|mental)/);
    const tag = (tagMatch ? (tagMatch[1] as Tag) : DEFAULT_TAG[pos]);
    // 同一赛季里 ID 重复时加上队伍后缀，保证能唯一引用
    const key = seen.has(playerName) ? `${playerName}@${id}` : playerName;
    seen.set(playerName, id);
    const overall = Math.round(clamp(fixed ? Number(fixed[1]) : rating + delta + formOf(key, year), 30, 99));
    const uid = key.toLowerCase();
    roster[pos] = { id: key, uid, pos, nat, overall, attrs: attrsFor(overall, pos, tag, key), locked, team: id, tag };
  });
  return { id, name, zh, region, rating, roster };
}

export function buildSeason(raw: RawSeason): SeasonData {
  const seen = new Map<string, string>();
  const leagues = {} as Record<Region, string[]>;
  for (const [region, lines] of Object.entries(raw.leagues) as [Region, string[]][]) {
    leagues[region] = lines.map((line) => line.split('|')[0]);
  }
  const teams = [...Object.values(raw.leagues).flat(), ...(raw.extra ?? [])].map((line) => parseTeam(line, seen, raw.year));
  const byId: Record<string, ProTeam> = {};
  const players: Record<string, ProPlayer> = {};
  const byUid: Record<string, ProPlayer> = {};
  for (const team of teams) {
    byId[team.id] = team;
    for (const p of Object.values(team.roster)) {
      if (!p) continue;
      players[p.id] = p;
      byUid[p.uid] = p;
    }
  }
  return { id: raw.id, year: raw.year, teams, byId, players, byUid, leagues, worlds: raw.worlds, tiers: raw.tiers };
}

/**
 * 把所有赛季建好，再保证“同一个选手在相邻两个赛季的实力一定不一样”：
 * 名单里逐季写死了实力的本来就不一样；其余的万一撞上了，就按名字固定地挪开 1 分。
 */
export function buildAll(raws: RawSeason[]): SeasonData[] {
  const seasons = raws.map(buildSeason);
  for (let i = 1; i < seasons.length; i++) {
    for (const p of Object.values(seasons[i].players)) {
      const before = seasons[i - 1].byUid[p.uid];
      if (!before || before.overall !== p.overall) continue;
      p.overall = clamp(p.overall + (hash(`${p.uid}|${p.team}`) % 2 ? 1 : -1), 30, 99);
      p.attrs = attrsFor(p.overall, p.pos, p.tag, p.id);
    }
  }
  return seasons;
}

/** 选手的国籍属于哪个赛区（用于“外援最多两人”） */
export function regionOfNat(nat: string): string {
  return REGION_OF_NAT[nat] ?? nat;
}
