/**
 * 比赛模拟：一场/一个系列赛的胜负，以及自己每一局的数据和播报。
 */
import { CHAMPIONS, type Position } from './data';
import { clamp, gauss, has, overall, ri, rnd, teamRating, type GameLine, type GameState, type Pending, type SeriesResult } from './core';

/** 实力差换算成胜率：差 10 点约 60%，差 20 点约 79%（差距不大时爆冷不少见） */
export const winProb = (ra: number, rb: number) => 1 / (1 + Math.pow(10, -(ra - rb) / 34));

/** 电脑之间打一个系列赛，返回 [a 胜场, b 胜场] */
export function aiSeries(s: GameState, ra: number, rb: number, bo: 1 | 3 | 5): [number, number] {
  const need = (bo + 1) / 2;
  let a = 0;
  let b = 0;
  while (a < need && b < need) {
    if (rnd(s) < winProb(ra, rb)) a++;
    else b++;
  }
  return [a, b];
}

// 每个位置的击杀/死亡/助攻：基础值 + 随表现成长的系数
const KDA: Record<Position, number[]> = {
  top: [2.4, 2.5, 3.6, -1.4, 5.5, 4],
  jungle: [3.2, 3.5, 3.4, -1.4, 7.5, 6],
  mid: [4.2, 4.5, 3.3, -1.4, 6.0, 5],
  adc: [4.6, 5.0, 3.4, -1.4, 5.5, 4.5],
  support: [1.1, 1.2, 3.5, -1.6, 10.5, 9],
};

type Tier = 'hi' | 'mid' | 'lo';
type Lines = Record<Position, Record<'win' | 'lose', Record<Tier, string[]>>>;

/** 每个位置按“赢/输 + 表现好/一般/差”各准备几句播报，{c} 会换成英雄 */
const LINES: Lines = {
  top: {
    win: {
      hi: ['你的{c}在上路完成单杀，随后传送落地，帮队伍拿下大龙。', '团战里你的{c}绕后切进后排，一套技能秒掉对方 C 位。', '整场你都在压制对面上单，补刀领先四十个，装备领先一个大件。'],
      mid: ['你稳稳守住上路，传送支援很及时，没给对面上单任何机会。'],
      lo: ['你被抓了三次，好在队友撑住了后期，你跟着推完了比赛。', '这局你基本隐身，队友四打五把比赛扛了下来。'],
    },
    lose: {
      hi: ['你的{c}单杀了对面两次，可其他路全崩，独木难支。', '你上路打出优势，但队伍在大龙坑送掉了比赛。'],
      mid: ['你中规中矩地打完，但队伍的节奏始终慢一拍。'],
      lo: ['你被对面打野越塔三次，上路直接炸了。', '你一波激进的开团葬送了好局面，队伍再没能翻回来。'],
    },
  },
  jungle: {
    win: {
      hi: ['你前三级就 Gank 成功两次，把三条路都养了起来。', '你的{c}偷掉大龙，随后一波结束比赛。', '你的反野让对面打野整场没有存在感。'],
      mid: ['你按部就班地刷野、控龙，节奏平稳。'],
      lo: ['你前期被反崩了两次，好在线上队友够顶。', '你抢龙失败送出一波，队友还是帮你赢了。'],
    },
    lose: {
      hi: ['你的{c}节奏完美，可队友把优势一个个送了回去。', '你控下三条小龙，队伍却在后期团战一溃千里。'],
      mid: ['你的节奏被对面打野压制，地图上慢了半拍。'],
      lo: ['你被对面打野反爆野区，整场刷不出经济。', '你抢大龙失败，比赛就此结束。'],
    },
  },
  mid: {
    win: {
      hi: ['你的{c}中路单杀，随后游走下路拿下双杀。', '团战你的{c}从侧翼切入，三杀带走比赛。', '你对线压了对面中单三十刀，线权一直在你手里。'],
      mid: ['你对线平稳，支援到位。'],
      lo: ['你中路被压了一整场，好在下路打出巨大优势。', '你送出一血又送了两个，队友还是赢了下来。'],
    },
    lose: {
      hi: ['你的{c}中路打出优势，但其他路全线告急。', '你单杀对面中单两次，可队伍在大龙团全军覆没。'],
      mid: ['你和对面中单互有来回，队伍却找不到节奏。'],
      lo: ['你被对面中单单杀两次，中路直接失守。', '你一波强行开团送掉自己，队伍随之崩盘。'],
    },
  },
  adc: {
    win: {
      hi: ['团战你的{c}走位如舞，收割三杀。', '你对线单杀对面 ADC，下路一塔十分钟就没了。', '你全场零死，输出打满，伤害全队最高。'],
      mid: ['你对线稳住，团战输出到位。'],
      lo: ['你下路被压了二十刀，好在队友撑起了前期。', '团战你第一个被秒，队友还是赢了。'],
    },
    lose: {
      hi: ['你的{c}输出打满，可队伍没人能保护你。', '你拿下四杀，队友却在最后一波溃败。'],
      mid: ['你的发育一般，输出没有打出来。'],
      lo: ['你对线被单杀两次，下路彻底崩盘。', '团战你走位失误被秒，比赛结束。'],
    },
  },
  support: {
    win: {
      hi: ['你的{c}钩中三次关键目标，每一次都打开了局面。', '你的视野布满野区，对面打野无所遁形。', '你的{c}开团控住三人，队友跟上收割。'],
      mid: ['你的视野和游走都中规中矩。'],
      lo: ['你下路被越塔两次，好在队友后期 carry。', '你几波开团送掉了自己，队友还是赢下。'],
    },
    lose: {
      hi: ['你的{c}精准开团三次，可队友没能跟上输出。', '你的视野做得滴水不漏，队伍却一反常态地送。'],
      mid: ['你的游走没有奏效，节奏被对面辅助带走。'],
      lo: ['你被对面抓住失误秒掉两次，下路炸了。', '你一波失误开团葬送了好局面。'],
    },
  },
};

function gameLine(s: GameState, win: boolean, oppRating: number): GameLine {
  const R = overall(s);
  // 本场表现：实力 + 随机波动 + 体力状态
  const perf = R + gauss(s, 0, 6) + (s.stamina - 60) / 15 + gauss(s, 0, 3);
  const t = clamp((perf - 40) / 50, -0.2, 1.1);
  const [k0, k1, d0, d1, a0, a1] = KDA[s.pos];
  const mulK = win ? 1.25 : 0.85;
  const mulD = win ? 0.8 : 1.15;
  const pois = (lambda: number) => Math.max(0, Math.round(lambda * (0.75 + rnd(s) * 0.5) + gauss(s, 0, Math.sqrt(Math.max(0.3, lambda)))));
  const k = pois((k0 + k1 * t) * mulK);
  const d = pois((d0 + d1 * t) * mulD);
  const a = pois((a0 + a1 * t) * mulK);
  // 评分和播报都从实际打出来的数据推出来，所以三者总是一致：
  // 先算“击杀加助攻除以死亡加一”，再和这个位置的平均水平、胜负带来的加成比较
  const ratio = (k + 0.6 * a) / (d + 1);
  const base = (k0 + 0.5 * k1 + 0.6 * (a0 + 0.5 * a1)) / (d0 + 0.5 * d1 + 1);
  const rel = (ratio / base) * (mulD / mulK);
  // 用开方压缩：数据越好分越高，但不会轻易摸到满分
  const score = clamp(5.6 + 3.4 * (Math.sqrt(Math.max(rel, 0.05)) - 1) + (win ? 1.0 : -0.6) + (R - oppRating) * 0.03, 3, 10);
  const tier: Tier = score >= 8 ? 'hi' : score >= 6 ? 'mid' : 'lo';
  const list = LINES[s.pos][win ? 'win' : 'lose'][tier];
  const champs = CHAMPIONS[s.pos];
  const champ = champs[ri(s, 0, champs.length - 1)];
  return {
    win,
    k,
    d,
    a,
    champ,
    score: Math.round(score * 10) / 10,
    mvp: win && score >= 8.6,
    note: list[ri(s, 0, list.length - 1)].replace('{c}', champ),
    dur: ri(s, 28, 52),
  };
}

/** 自己打的系列赛：逐局决定胜负，状态和词条会影响胜率 */
export function playSeries(s: GameState, m: Pending): SeriesResult {
  const need = (m.bo + 1) / 2;
  const selfRating = teamRating(s, s.team.id);
  const oppRating = teamRating(s, m.opp);
  const games: GameLine[] = [];
  let win = 0;
  let lose = 0;
  while (win < need && lose < need) {
    const deciding = m.elim && win === need - 1 && lose === need - 1;
    // 状态：体力越差越不稳；带伤上阵再打折扣
    let p = winProb(selfRating + (s.stamina - 60) / 15 - (s.injury > 0 ? 5 : 0), oppRating);
    if (m.elim) {
      if (has(s, 'reborn')) p += 0.04;
      if (has(s, 'worldchamp')) p += 0.03;
      if (deciding && has(s, 'clutch')) p += 0.12;
    }
    const won = rnd(s) < clamp(p, 0.05, 0.95);
    games.push(gameLine(s, won, oppRating));
    s.stamina = Math.max(0, s.stamina - 6);
    if (won) win++;
    else lose++;
  }
  return { ...m, win, lose, won: win > lose, games, selfRating, oppRating, after: '' };
}
