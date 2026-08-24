export type SceneTone = "sunset" | "split" | "cosmic" | "rain" | "moon" | "seasons" | "final";

export interface Scene {
  id: string;
  index: number;
  eyebrow: string;
  title: string;
  subtitle: string;
  lyrics: string[];
  tone: SceneTone;
}

export const scenes: Scene[] = [
  {
    id: "sunset",
    index: 1,
    eyebrow: "首屏 · 黄昏与操场",
    title: "漫天晚霞与相框的召唤",
    subtitle: "滑动开启回忆",
    tone: "sunset",
    lyrics: ["夕阳惹红了操场 黄昏撒了糖", "旧照片锁上那天 目光对望", "Hey 那冰川 与海岛 你们有看吗"],
  },
  {
    id: "glacier",
    index: 2,
    eyebrow: "二屏 · 远方与遗憾",
    title: "冰川海岛与遗憾的后来",
    subtitle: "拖动中线，看见过往与现在",
    tone: "split",
    lyrics: ["年少的爱都输给 一句后来呢", "后来再 未见过 那么美的日落"],
  },
  {
    id: "crossroad",
    index: 3,
    eyebrow: "三屏 · 路口与梦游",
    title: "影子消失，星河升起",
    subtitle: "拖动星空，寻找闪烁的宇宙坐标",
    tone: "cosmic",
    lyrics: ["天黑了 影子会 消失在路口", "挥手的 温柔却 仍陪着我梦游", "是晚风 是星河 是宇宙坐标闪烁"],
  },
  {
    id: "fragment",
    index: 4,
    eyebrow: "四屏 · 独自与星辰",
    title: "手持星星的碎片，再各自漂流",
    subtitle: "点击碎片，收集散落的旧照片",
    tone: "cosmic",
    lyrics: ["那冰川 与海岛 后来独自看过", "流着泪 依然觉 得很有幸呢", "我们曾 被那样 认真的爱过"],
  },
  {
    id: "rain",
    index: 5,
    eyebrow: "五屏 · 晚窗与钟声",
    title: "夏日晚雨，与未抵达的教堂",
    subtitle: "擦开雨雾，看见过去的地方",
    tone: "rain",
    lyrics: ["名叫过去的地方 夏日不散场", "雨滴告白了晚窗 敲在心上", "Hey 那钟声 与教堂 你们走到吗"],
  },
  {
    id: "moon",
    index: 6,
    eyebrow: "六屏 · 月色与流星",
    title: "没说完的话，躲进月色",
    subtitle: "写下一句真心话，或点击流星",
    tone: "moon",
    lyrics: ["我没说 完的话 统统躲进月色", "你没牵 住的手 像流星飞过"],
  },
  {
    id: "seasons",
    index: 7,
    eyebrow: "七屏 · 四季与烟火",
    title: "花开叶落，盛大的告别",
    subtitle: "点击夜空，放一朵属于你的烟火",
    tone: "seasons",
    lyrics: ["是花开 是叶落 是烟火腾空", "是我们仍想念着却不再见了"],
  },
  {
    id: "final",
    index: 8,
    eyebrow: "终屏 · 宇宙关联",
    title: "和宇宙的温柔关联着",
    subtitle: "生成一张专属温柔坐标卡",
    tone: "final",
    lyrics: ["我们虽然不再见，但已被宇宙认真爱过。"],
  },
];

export const regretMessages = [
  "后来我去了海岛，但身边不再是你。",
  "那天的晚霞像一封没有寄出的信。",
  "我们都很好，只是没有再一起走到那里。",
  "我还记得操场上的风，也记得你转身时的光。",
];

export const strangerWhispers = [
  "愿你后来遇见的每片星河，都温柔。",
  "我没有忘记，只是学会了不打扰。",
  "谢谢你认真爱过那时的我。",
  "如果流星会回头，请替我说一句晚安。",
];
