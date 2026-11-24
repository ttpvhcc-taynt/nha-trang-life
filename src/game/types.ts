export const SAVE_VERSION = 1;

export type Hair = "ngan" | "bob" | "dai" | "bun";
export type HairColor = "den" | "nau" | "sang" | "bac";
export type Skin = "sang" | "vang" | "ngam" | "dam";
export type Slot = "ao" | "quan";

export type Look = {
  skin: Skin;
  hair: Hair;
  hairColor: HairColor;
};

export type PlaceId =
  | "villa"
  | "beach"
  | "park"
  | "cafe"
  | "market"
  | "pier"
  | "clinic";

export type MomentId =
  | "ban-cong"
  | "chan-cat"
  | "cho"
  | "xe-dap"
  | "vinh"
  | "dem";

export type JournalEntry = {
  day: number;
  hour: number;
  text: string;
};

export type Save = {
  version: number;
  name: string;
  look: Look;
  day: number;
  hour: number;
  energy: number;
  mood: number;
  satiety: number;
  money: number;
  x: number;
  z: number;
  yaw: number;
  journal: JournalEntry[];
  moments: MomentId[];
  clinicDay: number;
  equipped: Record<Slot, string>;
};

export const DEFAULT_LOOK: Look = {
  skin: "vang",
  hair: "bob",
  hairColor: "den",
};

export const MOMENT_ORDER: MomentId[] = [
  "ban-cong",
  "chan-cat",
  "cho",
  "xe-dap",
  "vinh",
  "dem",
];
