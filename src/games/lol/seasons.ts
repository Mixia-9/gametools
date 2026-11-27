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
 * 选手实力：跨赛季出现的明星选手用 ^=NN 逐季写死（同样是估的）；其余 = 基准 + 微调 + 每季固定的状态起伏。
 * 已知缺口：2015 年的 LPL 实际有 12 支队伍，这里只录了 8 支（没有 WE、RNG 等）。
 */
export const RAW_SEASONS: RawSeason[] = [
  {
    id: 'S3',
    year: 2013,
    leagues: {
      LPL: [
        'omg|Oh My God|LPL|82|!Gogoing^=85~lane,Loveling^=82~macro,Cool^=84~mech,San^=83~lane,bigpomelo^-2|OMG',
        'royal|Royal Club|LPL|85|Godlike^+1~lane,Lucky^-3,Wh1t3zZ^-1~mech,Uzi^=90~lane,Tabe^+1~sense|皇族',
        'pe|Positive Energy|LPL|76|Aluka^-1~lane,Jing^+1~macro,JoJo^+1~mech,NaMei^=86~lane,Sicca^+1~sense|PE',
        'we|Team WE|LPL|72|CaoMei^=74~lane,Mann^-1~macro,!Misaya^+3~mech,Weixiao^=78~lane,Fzzf^=82~sense|WE',
        'ig|Invictus Gaming|LPL|74|!PDD^+2~lane,illuSioN,Zz1tai^=77~mech,Kid^=76~lane,XiaoXiao^+2~mental|IG',
        'lmq|LMQ|LPL|68|Dreams,Wayoff^+1~macro,Snowy,F1sh,Dragon|LMQ',
        'yg|Young Glory|LPL|64|otto,Syz,YanSir,Dragon,lovecryboy|YG',
        'ephk|EP.HK|LPL|62|DomhoXz,BuPingS,SuperCatt,kane4357,LaoPi|EP.HK',
      ],
      LCK: [],
      EU: [
        'fnc|Fnatic|EU|82|sOAZ^+1~lane,Cyanide~macro,!xPeke^+4~mech,Puszu^-1~lane,YellOwStaR^=84~sense|FNC',
        'gmb|Gambit Gaming|EU|80|Darien^=78~lane,Diamondprox^=84~macro,Alex Ich^=83~mech,Genja^=80,Edward^=79~sense|GMB',
        'ld|Lemondogs|EU|74|Zorozero^-1,dexter^+1~macro,Nukeduck^+2~mech,Tabzz^=80~lane,Mithy^=80~sense|柠檬狗',
        'eg|Evil Geniuses|EU|70|Wickd^=78~lane,Snoopeh^-1~macro,!Froggen^=84~mech,yellowpete,Krepo^+1~sense|EG',
        'sk|SK Gaming|EU|70|Kev1n^=72,hyrqBot,ocelote^+1~mental,CandyPanda^=73~lane,Nyph^=78|SK',
        'cw|Copenhagen Wolves|EU|68|NeeGodbro,Svenskeren^+1~macro,Bjergsen^=80~mech,TheTess^-1~lane,Deficio^+1~sense|CW',
        'aaa|against All authority|EU|64|fredy122^=70,ViRtU4l,ShLaYa,Nono,Karalius|aAa',
        'giants|Giants Gaming|EU|64|Samux,Morden,Exter,Jimbz,Babeta|GIANTS',
      ],
      NA: [],
    },
    extra: [
      'skt|SK Telecom T1 K|LCK|93|Impact,Bengi^=91~macro,!Faker^=99~mech,Piglet^+2~lane,PoohManDu^-3~sense|SKT',
      'njs|NaJin Black Sword|LCK|82|Expession^-1,Watch^=83~macro,Nagne^-2,PraY^=84~lane,Cain~sense|Najin 黑剑',
      'sso|Samsung Ozone|LCK|80|Looper^=84~lane,DanDy^=87~macro,Dade^=87~mech,Imp^=86~lane,Mata^=88~sense|三星 Ozone',
      'tsm|Team SoloMid|NA|76|Dyrus^=78~lane,TheOddOne,!Reginald^~mental,WildTurtle^=78~lane,Xpecial^+2~sense|TSM',
      'c9|Cloud9|NA|78|Balls^=78,Meteos^=80~macro,!Hai^=81~mental,Sneaky^=81~lane,LemonNation^=77|C9',
      'vulcun|Team Vulcun|NA|72|Sycho Sid^-1,Xmithie^=76~macro,mancloud,Zuna^-1~lane,BloodWater^+1~sense|Vulcun',
      'gabears|Gamania Bears|TW|70|Steak^=72,Winds^+1~macro,Maple^=76~mech,NL^=73~lane,SwordArt^=74~lane|台北熊',
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
        'edg|EDward Gaming|LPL|86|Koro1^=88~lane,!Clearlove^=90~macro,U^=88~mech,NaMei^=88~lane,Fzzf^=87~sense|EDG',
        'royal|Star Horn Royal Club|LPL|87|Cola,inSec^+4~mech,corn,Uzi^=92~lane,Zero^+2~sense|皇族',
        'omg|Oh My God|LPL|85|!Gogoing^=87~lane,Loveling^=85~macro,Cool^=88~mech,San^=86~lane,Cloud^+1~sense|OMG',
        'lgd|LGD Gaming|LPL|76|17^-1,Quan,We1less^+3~mech,XQ^+1~lane,Pyl^=80~sense|LGD',
        'we|Team WE|LPL|72|CaoMei^=73~lane,Sin@KR,Ninja@KR^+1~mech,Weixiao^=77~lane,Conan|WE',
        'ig|Invictus Gaming|LPL|74|Yongsoo@KR,illuSioN,Zz1tai^=79~mech,Kid^=75,Kitties^=76|IG',
        'yg|Young Glory|LPL|64|熊孩子,音符,稳健棍,真龙,言Sir|YG',
        'wea|WE Academy|LPL|64|xr,Soist,Mickey@KR,S1mLz^=68~lane,YuZhe|WE 青训',
      ],
      LCK: [],
      EU: [
        'alliance|Alliance|EU|80|Wickd^=82~lane,Shook^+1~macro,!Froggen^=86~mech,Tabzz^=84~lane,Nyph^=82~sense|ALL',
        'fnc|Fnatic|EU|80|sOAZ^+1~lane,Cyanide~macro,!xPeke^+4~mech,Rekkles^=86~lane,YellOwStaR^=83~sense|FNC',
        'roccat|Team ROCCAT|EU|74|Xaxus,Jankos^+3~macro,Overpow^+2~mech,Celaver^+1~lane,VandeR^+2~sense|ROCCAT',
        'gmb|Gambit Gaming|EU|74|Darien^=76~lane,Diamondprox^=82~macro,Alex Ich^=81~mech,Genja^=77,Edward^=76~sense|GMB',
        'cw|Copenhagen Wolves|EU|72|YoungBuck,Amazing^=78~macro,cowTard,FORG1VEN^+4~lane,Unlimited|CW',
        'sk|SK Gaming|EU|72|fredy122^=74,Svenskeren^+2~macro,Jesiz^+1~mech,CandyPanda^=75~lane,nRated|SK',
        'shc|SUPA HOT CREW|EU|72|Mimer,Impaler^+1~macro,Moopz^+1,MrRalleZ^+2~lane,Migxa^+1~sense|SHC',
        'millenium|Millenium|EU|70|Kev1n^=74,Araneae~macro,Kerp^+1,Creaton^+2~lane,Jree^+1~sense|MIL',
      ],
      NA: [],
    },
    extra: [
      'ssw|Samsung Galaxy White|LCK|95|Looper^=92~lane,DanDy^=95~macro,PawN^=94~mech,Imp^=94~lane,Mata^=96~sense|三星白',
      'ssb|Samsung Galaxy Blue|LCK|88|Acorn^=91~lane,Spirit^=92~macro,Dade^=94~mech,Deft^=93~lane,Heart^=90~sense|三星蓝',
      'nws|NaJin White Shield|LCK|80|Save,Watch^=82~macro,Ggoong^+2~mech,Zefa^+1~lane,GorillA^=87~sense|Najin 白盾',
      'tsm|Team SoloMid|NA|80|Dyrus^=82~lane,Amazing^=80~macro,!Bjergsen^=85~mech,WildTurtle^=82~lane,Lustboy^=83~sense|TSM',
      'c9|Cloud9|NA|80|Balls^=81,Meteos^=82~macro,!Hai^=84~mental,Sneaky^=85~lane,LemonNation^=81|C9',
      'lmq|LMQ|NA|74|ackerman@TW,NoName@TW,XiaoWeiXiao@TW^+4~mech,Vasilii@TW^+3~lane,Mor@TW|LMQ',
      'ahq|ahq e-Sports Club|TW|68|Prydz,NAZ,Westdoor^=74~mech,GarnetDevil,GreenTea^+1~sense|ahq',
      'tpa|Taipei Assassins|TW|70|Achie,Winds^=73~macro,Morning,BeBe^+2~lane,Jay^+1~sense|TPA',
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
        'edg|EDward Gaming|LPL|88|Koro1^=90~lane,!Clearlove^=93~macro,PawN@KR^=95~mech,Deft@KR^=94~lane,Meiko^=94~sense|EDG',
        'lgd|LGD Gaming|LPL|84|Acorn@KR^=88~lane,TBQ^=85,GODV^=90~mech,Imp@KR^=91~lane,Pyl^=86~sense|LGD',
        'qg|Qiao Gu|LPL|80|V^=82,Swift@KR^=85~macro,Doinb@KR^=86~mental,TnT^=83~lane,TcT^=84~sense|QG',
        'ig|Invictus Gaming|LPL|78|Zz1tai^=82,Kakao@KR^=84~macro,Rookie@KR^=86~mech,Kid^=80,Kitties^=78|IG',
        'snake|Snake Esports|LPL|76|Flandre^=82~lane,Beast@KR,U^=85~mech,Martin^+1~lane,Ella@KR^+2~sense|Snake',
        'vg|Vici Gaming|LPL|76|DanDy@KR^=90~macro,World6,Peng^+1~mech,Xuan^+1~lane,Mata@KR^=90~sense|VG',
        'omg|Oh My God|LPL|70|Gogoing^=80~lane,Loveling^=81~macro,Cool^=84~mech,Uzi^=93~lane,San^=82|OMG',
        'm3|Masters 3|LPL|70|Looper@KR^=85~lane,Condi,Dade@KR^=85~mech,S1mLz^=73~lane,Lovecd|M3',
      ],
      LCK: [],
      EU: [],
      NA: [],
    },
    extra: [
      'skt|SK Telecom T1|LCK|95|MaRin^=99~lane,Bengi^=93~macro,!Faker^=98~mech,Bang^=98~lane,Wolf^=97~sense|SKT',
      'koo|KOO Tigers|LCK|88|Smeb^=92~lane,Hojin^=86~macro,Kuro^=89~mech,PraY^=90~lane,GorillA^=91~sense|KOO',
      'kt|KT Rolster|LCK|82|Ssumday^=88~lane,Score^=84,Nagne^=81,Arrow^=83~lane,Piccaboo^+1~sense|KT',
      'fnc|Fnatic|EU|86|!Huni^=90~lane,Reignover^=90~macro,Febiven^=89~mech,Rekkles^=89~lane,YellOwStaR^=89~sense|FNC',
      'h2k|H2k-Gaming|EU|78|Odoamne^+1~lane,loulex^+1~macro,Ryu^+2~mech,Hjarnan,kaSing^+2~sense|H2K',
      'og|Origen|EU|82|sOAZ^=84~lane,Amazing^=83~macro,!xPeke^=85~mech,Niels^+3~lane,Mithy^=85~sense|OG',
      'clg|Counter Logic Gaming|NA|78|ZionSpartan^+3~lane,Xmithie^=82~macro,Pobelter^+1,!Doublelift^+5~lane,aphromoo^+4~sense|CLG',
      'tsm|Team SoloMid|NA|76|Dyrus^=80,Santorin,!Bjergsen^=86~mech,WildTurtle^=81~lane,Lustboy^=82~sense|TSM',
      'c9|Cloud9|NA|76|Balls^=78,!Hai^=82~mental,Incarnati0n^+4~mech,Sneaky^=84~lane,LemonNation^=80|C9',
      'fw|Flash Wolves|TW|78|Steak^=78~mental,Karsa^+3~macro,Maple^=84~mech,NL^=79~lane,SwordArt^=81~lane|闪电狼',
      'ahq|ahq e-Sports Club|TW|78|Ziv^+1~lane,Mountain^+2~macro,Westdoor^=83~mech,AN^+2~lane,Albis^+2~sense|ahq',
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
