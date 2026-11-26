import type { RawSeason } from './data';

/**
 * 按赛季录入的真实名单。写法见 data.ts 顶部的说明。
 *
 * 来源（2026-11 核实）：
 * - LPL 2013 春季 – 2015 夏季：Leaguepedia（lol.fandom.com）各赛段页面
 * - EU LCS 2013 春季、夏季，2014 春季：同上
 * - 2013 / 2014 / 2015 全球总决赛：英文维基百科各届页面 + Leaguepedia 队伍阵容页，并与 gol.gg 的逐场记录核对
 *
 * 还没核实、所以留空的：LCK 和 NA LCS 的联赛名单、EU LCS 2014 夏季及 2015 年。
 * 这些赛区在世界赛上的队伍已核实，放在各赛季的 extra 里。
 * 队伍的“实力基准”是按当年成绩给的估计值，不是查来的数据。
 */
export const RAW_SEASONS: RawSeason[] = [
  {
    id: 'S3',
    year: 2013,
    leagues: {
      LPL: [
        'omg|Oh My God|LPL|82|!Gogoing^+3~lane,Lovelin~macro,Cool^+2~mech,San^+1~lane,bigpomelo^-2|OMG',
        'royal|Royal Club|LPL|85|Godlike^+1~lane,Lucky^-3,Wh1t3zZ^-1~mech,Uzi^+5~lane,Tabe^+1~sense|皇族',
        'pe|Positive Energy|LPL|76|Aluka^-1~lane,Jing^+1~macro,JoJo^+1~mech,NaMei^+3~lane,Sicca^+1~sense|PE',
        'we|Team WE|LPL|72|CaoMei^+1~lane,Mann^-1~macro,!Misaya^+3~mech,Weixiao^+3~lane,Fzzf^+3~sense|WE',
        'ig|Invictus Gaming|LPL|74|!PDD^+2~lane,illuSioN,Zz1tai^+2~mech,Kid^+1~lane,XiaoXiao^+2~mental|IG',
        'lmq|LMQ|LPL|68|Dreams,Wayoff^+1~macro,Snowy,F1sh,Dragon|LMQ',
        'yg|Young Glory|LPL|64|otto,Syz,YanSir,Dragon,lovecryboy|YG',
        'ephk|EP.HK|LPL|62|DomhoXz,BuPingS,SuperCatt,kane4357,LaoPi|EP.HK',
      ],
      LCK: [],
      EU: [
        'fnc|Fnatic|EU|82|sOAZ^+1~lane,Cyanide~macro,!xPeke^+4~mech,Puszu^-1~lane,YellOwStaR^+2~sense|FNC',
        'gmb|Gambit Gaming|EU|80|Darien^-2~lane,Diamondprox^+4~macro,Alex Ich^+3~mech,Genja,Edward^-1~sense|GMB',
        'ld|Lemondogs|EU|74|Zorozero^-1,dexter^+1~macro,Nukeduck^+2~mech,Tabzz^+1~lane,mithy^+1~sense|柠檬狗',
        'eg|Evil Geniuses|EU|70|Wickd^+1~lane,Snoopeh^-1~macro,!Froggen^+3~mech,yellowpete,Krepo^+1~sense|EG',
        'sk|SK Gaming|EU|70|Kev1n,hyrqBot,ocelote^+1~mental,CandyPanda^+1~lane,Nyph|SK',
        'cw|Copenhagen Wolves|EU|68|NeeGodbro,Svenskeren^+1~macro,Bjergsen^+5~mech,TheTess^-1~lane,Deficio^+1~sense|CW',
        'aaa|against All authority|EU|64|fredy122,ViRtU4l,ShLaYa,Nono,Karalius|aAa',
        'giants|Giants Gaming|EU|64|Samux,Morden,Exter,Jimbz,Babeta|GIANTS',
      ],
      NA: [],
    },
    extra: [
      'skt|SK Telecom T1 K|LCK|93|Impact,bengi^-4~macro,!Faker^+6~mech,Piglet^+2~lane,PoohManDu^-3~sense|SKT',
      'njs|NaJin Black Sword|LCK|82|Expession^-1,watch^+1~macro,Nagne^-2,PraY^+2~lane,Cain~sense|Najin 黑剑',
      'sso|Samsung Ozone|LCK|80|Looper^+1~lane,DanDy^+3~macro,Dade^+3~mech,Imp^+3~lane,Mata^+6~sense|三星 Ozone',
      'tsm|Team SoloMid|NA|76|Dyrus^+1~lane,TheOddOne,!Reginald^~mental,WildTurtle^+1~lane,Xpecial^+2~sense|TSM',
      'c9|Cloud9|NA|78|Balls,Meteos^+1~macro,!Hai^+2~mental,Sneaky^+2~lane,LemonNation^-1|C9',
      'vulcun|Team Vulcun|NA|72|Sycho Sid^-1,Xmithie^+2~macro,mancloud,Zuna^-1~lane,BloodWater^+1~sense|Vulcun',
      'gabears|Gamania Bears|TW|70|Steak,Winds^+1~macro,Maple^+3~mech,NL^+1~lane,SwordArt^+2~lane|台北熊',
      'mineski|Mineski|SEA|58|Snoy,Kaigu,Yume,Exo,Tgee|Mineski',
      'ggu|GamingGear.eu|WC|55|Nbs,Alunir,Mazzerin,DeadlyBrother,Inspirro|GG.eu',
    ],
    worlds: {
      slots: { LPL: 2, LCK: 3, EU: 3, NA: 3, TW: 1, SEA: 1, WC: 1 },
      groups: [
        ['omg', 'skt', 'ld', 'tsm', 'ggu'],
        ['fnc', 'gmb', 'sso', 'vulcun', 'mineski'],
      ],
      seeds: ['royal', 'c9', 'njs', 'gabears'],
      bracket: ['A1', 'seed:gabears', 'seed:njs', 'B2', 'seed:royal', 'A2', 'B1', 'seed:c9'],
    },
    tiers: ['黄金', '铂金', '钻石', '王者'],
  },
  {
    id: 'S4',
    year: 2014,
    leagues: {
      LPL: [
        'edg|EDward Gaming|LPL|86|Koro1^+1~lane,!Clearlove^+4~macro,U^+2~mech,NaMei^+2~lane,Fzzf^+2~sense|EDG',
        'royal|Star Horn Royal Club|LPL|87|Cola,inSec^+4~mech,corn,Uzi^+4~lane,Zero^+2~sense|皇族',
        'omg|Oh My God|LPL|85|!Gogoing^+1~lane,Loveling~macro,Cool^+3~mech,San^+1~lane,Cloud^+1~sense|OMG',
        'lgd|LGD Gaming|LPL|76|17^-1,Quan,We1less^+3~mech,XQ^+1~lane,Pyl^+2~sense|LGD',
        'we|Team WE|LPL|72|CaoMei^-1~lane,Sin@KR,Ninja@KR^+1~mech,Weixiao^+1~lane,Conan|WE',
        'ig|Invictus Gaming|LPL|74|Yongsoo@KR,illuSioN,Zz1tai^+2~mech,Kid,Kitties|IG',
        'yg|Young Glory|LPL|64|熊孩子,音符,稳健棍,真龙,言Sir|YG',
        'wea|WE Academy|LPL|64|xr,Soist,Mickey@KR,S1mLz^+1~lane,YuZhe|WE 青训',
      ],
      LCK: [],
      EU: [
        'alliance|Alliance|EU|80|Wickd^+1~lane,Shook^+1~macro,!Froggen^+4~mech,Tabzz^+3~lane,Nyph^+1~sense|ALL',
        'fnc|Fnatic|EU|80|sOAZ^+1~lane,Cyanide~macro,!xPeke^+4~mech,Rekkles^+4~lane,YellOwStaR^+2~sense|FNC',
        'roccat|Team ROCCAT|EU|74|Xaxus,Jankos^+3~macro,Overpow^+2~mech,Celaver^+1~lane,VandeR^+2~sense|ROCCAT',
        'gmb|Gambit Gaming|EU|74|Darien^-2~lane,Diamondprox^+4~macro,Alex Ich^+2~mech,Genja,Edward^-1~sense|GMB',
        'cw|Copenhagen Wolves|EU|72|YoungBuck,Amazing^+2~macro,cowTard,FORG1VEN^+4~lane,Unlimited|CW',
        'sk|SK Gaming|EU|72|fredy122,Svenskeren^+2~macro,Jesiz^+1~mech,CandyPanda^+1~lane,nRated|SK',
        'shc|SUPA HOT CREW|EU|72|Mimer,Impaler^+1~macro,Moopz^+1,MrRalleZ^+2~lane,Migxa^+1~sense|SHC',
        'millenium|Millenium|EU|70|kev1n,Araneae~macro,Kerp^+1,Creaton^+2~lane,Jree^+1~sense|MIL',
      ],
      NA: [],
    },
    extra: [
      'ssw|Samsung Galaxy White|LCK|95|Looper^+2~lane,Dandy^+4~macro,PawN^+4~mech,Imp^+4~lane,Mata^+7~sense|三星白',
      'ssb|Samsung Galaxy Blue|LCK|88|Acorn^+2~lane,Spirit^+3~macro,Dade^+5~mech,Deft^+5~lane,Heart^+1~sense|三星蓝',
      'nws|NaJin White Shield|LCK|80|Save,Watch^+1~macro,Ggoong^+2~mech,Zefa^+1~lane,GorillA^+4~sense|Najin 白盾',
      'tsm|Team SoloMid|NA|80|Dyrus^+1~lane,Amazing^+2~macro,!Bjergsen^+5~mech,WildTurtle^+1~lane,Lustboy^+2~sense|TSM',
      'c9|Cloud9|NA|80|Balls,Meteos^+1~macro,!Hai^+2~mental,Sneaky^+3~lane,LemonNation|C9',
      'lmq|LMQ|NA|74|ackerman@TW,NoName@TW,XiaoWeiXiao@TW^+4~mech,Vasilii@TW^+3~lane,Mor@TW|LMQ',
      'ahq|ahq e-Sports Club|TW|68|Prydz,NAZ,westdoor^+2~mech,GarnetDevil,GreenTea^+1~sense|ahq',
      'tpa|Taipei Assassins|TW|70|Achie,Winds^+1~macro,Morning,BeBe^+2~lane,Jay^+1~sense|TPA',
      'kabum|KaBuM! e-Sports|BR|58|LEP,Danagorn,TinOwns,Minerva,dans|KaBuM',
      'dp|Dark Passage|WC|62|fabFabulous,Crystal^+1~macro,Naru,HolyPhoenix^+1~lane,Touch|DP',
    ],
    worlds: {
      slots: { LPL: 3, LCK: 3, EU: 3, NA: 3, TW: 2, BR: 1, WC: 1 },
      groups: [
        ['ssw', 'edg', 'ahq', 'dp'],
        ['royal', 'tsm', 'sk', 'tpa'],
        ['ssb', 'omg', 'lmq', 'fnc'],
        ['nws', 'c9', 'alliance', 'kabum'],
      ],
      bracket: ['A1', 'B2', 'B1', 'A2', 'C1', 'D2', 'C2', 'D1'],
    },
    tiers: ['黄金', '铂金', '钻石', '大师', '王者'],
  },
  {
    id: 'S5',
    year: 2015,
    leagues: {
      LPL: [
        'edg|EDward Gaming|LPL|88|Koro1^+1~lane,!Clearlove^+4~macro,PawN@KR^+4~mech,Deft@KR^+4~lane,Meiko^+5~sense|EDG',
        'lgd|LGD Gaming|LPL|84|Acorn@KR^+1~lane,TBQ,GODV^+4~mech,Imp@KR^+4~lane,Pyl^+2~sense|LGD',
        'qg|Qiao Gu|LPL|80|V,Swift@KR^+2~macro,Doinb@KR^+3~mental,TnT^+1~lane,TcT^+2~sense|QG',
        'ig|Invictus Gaming|LPL|78|Zz1tai,Kakao@KR^+2~macro,Rookie@KR^+4~mech,Kid,Kitties|IG',
        'snake|Snake Esports|LPL|76|Flandre^+4~lane,Beast@KR,U^+1~mech,Martin^+1~lane,Ella@KR^+2~sense|Snake',
        'vg|Vici Gaming|LPL|76|Dandy@KR^+3~macro,World6,Peng^+1~mech,Xuan^+1~lane,Mata@KR^+7~sense|VG',
        'omg|Oh My God|LPL|70|Gogoing^-1~lane,Lovelin^+1~macro,Cool^+2~mech,Uzi^+4~lane,San|OMG',
        'm3|Masters 3|LPL|70|Looper@KR^+2~lane,Condi,Dade@KR^+3~mech,S1mLz^+1~lane,Lovecd|M3',
      ],
      LCK: [],
      EU: [],
      NA: [],
    },
    extra: [
      'skt|SK Telecom T1|LCK|95|MaRin^+5~lane,Bengi^-2~macro,!Faker^+3~mech,Bang^+3~lane,Wolf^+2~sense|SKT',
      'koo|KOO Tigers|LCK|88|Smeb^+4~lane,Hojin^-1~macro,Kuro^+1~mech,PraY^+2~lane,GorillA^+4~sense|KOO',
      'kt|KT Rolster|LCK|82|Ssumday^+4~lane,Score^+1,Nagne^-1,Arrow^+1~lane,Piccaboo^+1~sense|KT',
      'fnc|Fnatic|EU|86|!Huni^+4~lane,Reignover^+4~macro,Febiven^+3~mech,Rekkles^+3~lane,YellOwStaR^+3~sense|FNC',
      'h2k|H2k-Gaming|EU|78|Odoamne^+1~lane,loulex^+1~macro,Ryu^+2~mech,Hjarnan,kaSing^+2~sense|H2K',
      'og|Origen|EU|82|Soaz^+2~lane,Amazing^+2~macro,!xPeke^+3~mech,Niels^+3~lane,Mithy^+3~sense|OG',
      'clg|Counter Logic Gaming|NA|78|ZionSpartan^+3~lane,Xmithie^+2~macro,Pobelter^+1,!Doublelift^+5~lane,aphromoo^+4~sense|CLG',
      'tsm|Team SoloMid|NA|76|Dyrus,Santorin,!Bjergsen^+5~mech,WildTurtle^+1~lane,Lustboy^+2~sense|TSM',
      'c9|Cloud9|NA|76|Balls^-1,!Hai^+2~mental,Incarnati0n^+4~mech,Sneaky^+3~lane,LemonNation^-1|C9',
      'fw|Flash Wolves|TW|78|Steak^+1~mental,Karsa^+3~macro,Maple^+4~mech,NL^+1~lane,SwordArt^+3~lane|闪电狼',
      'ahq|ahq e-Sports Club|TW|78|Ziv^+1~lane,Mountain^+2~macro,Westdoor^+3~mech,AN^+2~lane,Albis^+2~sense|ahq',
      'pain|paiN Gaming|BR|62|Mylon,SirT,Kami^+2~mech,brTT^+2~lane,Dioud^+1~sense|paiN',
      'bkk|Bangkok Titans|SEA|55|WarL0cK,007x,G4^+1~mech,Lloyd,Moss|BKK',
    ],
    worlds: {
      slots: { LPL: 3, LCK: 3, EU: 3, NA: 3, TW: 2, BR: 1, SEA: 1 },
      groups: [
        ['fw', 'koo', 'clg', 'pain'],
        ['fnc', 'ahq', 'c9', 'ig'],
        ['skt', 'edg', 'h2k', 'bkk'],
        ['kt', 'og', 'lgd', 'tsm'],
      ],
      bracket: ['D1', 'A2', 'C1', 'B2', 'B1', 'C2', 'A1', 'D2'],
    },
    tiers: ['黄金', '铂金', '钻石', '大师', '王者'],
  },
];
