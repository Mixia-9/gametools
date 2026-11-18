import type { Locale } from './ui';

/** 分类标签/简介的四语翻译（slug 对应 categories.json） */
export const catI18n: Record<Locale, Record<string, { label: string; blurb: string }>> = {
  en: {},
  'zh-CN': {
    'game-ideation': { label: '概念/立项', blurb: '用 AI 头脑风暴概念、玩法与原型。' },
    'concept-art': { label: '原画/概念图', blurb: '为美术方向生成情绪板与概念图。' },
    'character-art': { label: '立绘/角色', blurb: '角色设计、立绘与插画工作流。' },
    '3d-models': { label: '3D 建模', blurb: '文本/图片转 3D 网格与管线清理。' },
    'retopo-uv': { label: '重拓扑/UV', blurb: '自动重拓扑与 UV 展开——把高模变成能进引擎的游戏网格。' },
    textures: { label: '贴图/材质', blurb: '从提示词或照片生成 PBR 贴图与材质。' },
    animation: { label: '动画', blurb: '自动动画、无标记动捕与物理辅助 K 帧。' },
    environments: { label: '环境/天空盒', blurb: '360° 天空盒、全景与世界观视觉。' },
    music: { label: '音乐', blurb: '原创配乐、自适应音乐与免授权音乐。' },
    sfx: { label: '音效', blurb: '从文本提示生成游戏音效与拟音。' },
    voice: { label: '语音', blurb: 'AI 配音、配音多语种化与本地化 VO。' },
    'npc-dialogue': { label: 'NPC/对话', blurb: '运行时 LLM 驱动的 NPC 与引擎 SDK 对话系统。' },
    narrative: { label: '叙事/剧情', blurb: '任务文案、分支叙事与世界观设定。' },
    localization: { label: '本地化/LQA', blurb: 'AI 辅助翻译、配音管线与语言 QA。' },
    'code-testing': { label: '代码/QA', blurb: '编程助手、引擎 AI 副驾与自动化测试。' },
    marketing: { label: '营销素材', blurb: '预告片、商店图、截图与社媒素材。' },
  },
  'zh-TW': {
    'game-ideation': { label: '概念/立項', blurb: '用 AI 腦力激盪概念、玩法與原型。' },
    'concept-art': { label: '原畫/概念圖', blurb: '為美術方向生成情緒板與概念圖。' },
    'character-art': { label: '立繪/角色', blurb: '角色設計、立繪與插畫工作流。' },
    '3d-models': { label: '3D 建模', blurb: '文字/圖片轉 3D 網格與管線清理。' },
    'retopo-uv': { label: '重拓撲/UV', blurb: '自動重拓撲與 UV 展開——把高模變成能進引擎的遊戲網格。' },
    textures: { label: '貼圖/材質', blurb: '從提示詞或照片生成 PBR 貼圖與材質。' },
    animation: { label: '動畫', blurb: '自動動畫、無標記動捕與物理輔助 K 幀。' },
    environments: { label: '環境/天空盒', blurb: '360° 天空盒、全景與世界觀視覺。' },
    music: { label: '音樂', blurb: '原創配樂、自適應音樂與免授權音樂。' },
    sfx: { label: '音效', blurb: '從文字提示生成遊戲音效與擬音。' },
    voice: { label: '語音', blurb: 'AI 配音、多語種配音與在地化 VO。' },
    'npc-dialogue': { label: 'NPC/對話', blurb: '執行時 LLM 驅動的 NPC 與引擎 SDK 對話系統。' },
    narrative: { label: '敘事/劇情', blurb: '任務文案、分支敘事與世界觀設定。' },
    localization: { label: '在地化/LQA', blurb: 'AI 輔助翻譯、配音管線與語言 QA。' },
    'code-testing': { label: '代碼/QA', blurb: '程式助手、引擎 AI 副駕與自動化測試。' },
    marketing: { label: '行銷素材', blurb: '預告片、商店圖、截圖與社群素材。' },
  },
  ja: {
    'game-ideation': { label: '企画/立案', blurb: 'AIでコンセプト、デザイン、プロトタイプを練る。' },
    'concept-art': { label: 'コンセプトアート', blurb: 'アートディレクション用のムードボードとコンセプトアート。' },
    'character-art': { label: 'キャラクター/立絵', blurb: 'キャラデザ、立ち絵、イラストのワークフロー。' },
    '3d-models': { label: '3Dモデル', blurb: 'テキスト/画像から3Dメッシュ生成とクリーンアップ。' },
    'retopo-uv': { label: 'リトポ/UV', blurb: '自動リトポロジーとUV展開 — ハイポリをエンジンに載せられるゲームメッシュへ。' },
    textures: { label: 'テクスチャ/マテリアル', blurb: 'プロンプトや写真からPBRテクスチャを生成。' },
    animation: { label: 'アニメーション/モーキャプ', blurb: '自動アニメ、マーカーレス mocap、物理アシスト。' },
    environments: { label: '環境/スカイボックス', blurb: '360°スカイボックス、パノラマ、世界観ビジュアル。' },
    music: { label: '音楽', blurb: 'オリジナルBGM、アダプティブ音楽、ロイヤリティフリー。' },
    sfx: { label: '効果音', blurb: 'テキストからゲームSFXやフォーリーを生成。' },
    voice: { label: 'ボイス', blurb: 'AIボイス、吹き替え、多言語VO。' },
    'npc-dialogue': { label: 'NPC/会話', blurb: 'LLMによるランタイムNPCとエンジンSDK連携。' },
    narrative: { label: 'シナリオ/ライティング', blurb: 'クエスト文、分岐シナリオ、設定資料。' },
    localization: { label: 'ローカライズ/LQA', blurb: 'AI翻訳、吹替パイプライン、言語QA。' },
    'code-testing': { label: 'コード/QA', blurb: 'コーディング支援、エンジンAI、自動テスト。' },
    marketing: { label: 'マーケティング素材', blurb: 'トレーラー、ストア画像、スクショ、SNS素材。' },
  },
};

export function catLabel(slug: string, enLabel: string, locale: Locale): string {
  return catI18n[locale]?.[slug]?.label ?? enLabel;
}

export function catBlurb(slug: string, enBlurb: string, locale: Locale): string {
  return catI18n[locale]?.[slug]?.blurb ?? enBlurb;
}
