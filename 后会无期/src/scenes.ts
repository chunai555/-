export type SceneId = "intro" | "farm" | "race" | "dance" | "memory" | "finale";

export interface SceneCopy {
  id: SceneId;
  index: string;
  kicker: string;
  title: string;
  lyric: string;
  hint: string;
}

export const scenes: SceneCopy[] = [
  {
    id: "intro",
    index: "01",
    kicker: "序幕 · 青春的通行证",
    title: "你若离去，后会无期",
    lyric: "你若离去，后会无期",
    hint: "点击登入记忆",
  },
  {
    id: "farm",
    index: "02",
    kicker: "落寞农场 · 等不到的丰收",
    title: "等不到风中你的脸颊",
    lyric: "等不到，掩饰的雨落下 / 我的眼泪被你觉察",
    hint: "点击枯萎作物",
  },
  {
    id: "race",
    index: "03",
    kicker: "狂飙飞车 · 爱的时差与尾灯",
    title: "我们的爱也有时差",
    lyric: "等不到，不经意的牵挂 / 却没出息的放不下",
    hint: "长按 ↑ 或 W 加速",
  },
  {
    id: "dance",
    index: "04",
    kicker: "炫舞斗秀场 · 错开的舞步",
    title: "错的并不是你，而是全世界",
    lyric: "你说陪我到某年某月某天 / 却把我丢在某日某夜某街",
    hint: "跟随方向键，再按空格",
  },
  {
    id: "memory",
    index: "05",
    kicker: "记忆翻篇 · 遗忘的黑夜与白雪",
    title: "我把记忆都翻遍",
    lyric: "却没有发现我们约好的明天 / 你留给昨天",
    hint: "移动鼠标，抹去落雪",
  },
  {
    id: "finale",
    index: "06",
    kicker: "终章 · 蝴蝶发卡与谢幕",
    title: "您的青春已下线",
    lyric: "我们约好的明天 / 你留给昨天",
    hint: "最后一次，收起发卡",
  },
];

const dancePattern = ["←", "↑", "↓", "→", "↑", "←", "→", "↓", "←", "↑", "→", "↓"] as const;

export const danceChart = Array.from({ length: 80 }, (_, index) => {
  const phase = index < 20 ? "warmup" : index < 44 ? "build" : index < 68 ? "dense" : "finale";
  const interval = index < 20 ? 900 : index < 44 ? 760 : index < 68 ? 650 : 560;
  return {
    key: dancePattern[index % dancePattern.length],
    interval,
    phase,
  };
});

export const danceSequence = ["←", "↑", "↓", "→", "←", "→", "Space"] as const;

export const memoryNotes = [
  "赱卟詘の击莈，媞伱給の誋憶",
  "2010.08.17 晴，今天偷到你的玫瑰了",
  "[em]e100[/em] 后会无期",
  "情侣空间已到期，是否续费昨天？",
  "上线提醒：特别关心 23:59",
  "把明天留给留言板，把昨天留给你",
];
