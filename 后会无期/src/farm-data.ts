export type CropKind = "wheat" | "rose" | "pumpkin";

export interface CropDefinition {
  kind: CropKind;
  name: string;
  seedPrice: number;
  sellPrice: number;
  yield: number;
  stageDurations: number[];
  color: string;
}

export const cropDefinitions: Record<CropKind, CropDefinition> = {
  wheat: {
    kind: "wheat",
    name: "小麦",
    seedPrice: 8,
    sellPrice: 24,
    yield: 3,
    stageDurations: [8000, 12000, 16000, 20000],
    color: "#d8f0ab",
  },
  rose: {
    kind: "rose",
    name: "玫瑰",
    seedPrice: 14,
    sellPrice: 42,
    yield: 3,
    stageDurations: [12000, 18000, 24000, 30000],
    color: "#ff697d",
  },
  pumpkin: {
    kind: "pumpkin",
    name: "南瓜",
    seedPrice: 20,
    sellPrice: 68,
    yield: 4,
    stageDurations: [16000, 22000, 30000, 38000],
    color: "#ffbd66",
  },
};

export const farmFriends = [
  { id: "xiaoyu", name: "小雨", online: true, status: "2块地成熟，可帮忙浇水" },
  { id: "ajie", name: "阿杰", online: false, status: "玫瑰正在开花" },
  { id: "tutu", name: "兔兔", online: true, status: "南瓜成熟，等你来偷菜" },
  { id: "old-time", name: "旧时光", online: false, status: "农场暂时无人打理" },
];
