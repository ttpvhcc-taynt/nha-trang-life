import type { PlaceId } from "@/game/types";

/** Stylized coastal block. +Y up. yaw 0 looks toward −Z (the sea). */
export const C = {
  sand: "#e4d0ad",
  wet: "#c9b48c",
  water: "#176674",
  villa: "#f4efe6",
  roof: "#c45c3a",
  wood: "#8d5e3c",
  cafe: "#f7f1e6",
  trim: "#e5844a",
  market: "#d9c4a2",
  clinic: "#e6eef0",
  pier: "#b08968",
  trunk: "#6b4630",
  leaf: "#2f6a4e",
  road: "#3c4c4a",
  fence: "#d7cbb8",
  ring: "#e5844a",
  ringIdle: "#9aafa8",
  shoe: "#241c18",
  skin: {
    sang: "#f3d0b8",
    vang: "#e0b48a",
    ngam: "#c48858",
    dam: "#8d5a3c",
  },
  hair: {
    den: "#1c1916",
    nau: "#6b3e2a",
    sang: "#c4a574",
    bac: "#d9d3cb",
  },
} as const;

export type Solid = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  h: number;
  color: string;
};

export type Decor = {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  color: string;
};

export type Spot = {
  id: PlaceId;
  x: number;
  z: number;
  radius: number;
};

export const SOLIDS: Solid[] = [
  { minX: -11, maxX: -3, minZ: -1, maxZ: 5.5, h: 4.8, color: C.villa },
  { minX: 4, maxX: 8.6, minZ: -4.2, maxZ: -0.4, h: 3.2, color: C.cafe },
  { minX: 10, maxX: 16.2, minZ: -8.2, maxZ: -3.8, h: 2.5, color: C.market },
  { minX: -16.4, maxX: -11.6, minZ: 1.6, maxZ: 6.8, h: 3.4, color: C.clinic },
  { minX: -18, maxX: 20, minZ: 14.2, maxZ: 15, h: 0.8, color: C.fence },
];

export const TRUNKS: { x: number; z: number }[] = [
  { x: 1.2, z: -5.6 },
  { x: 3.6, z: -8.2 },
  { x: -2.1, z: -7.1 },
  { x: 8.4, z: -11.4 },
  { x: -6.2, z: -9.4 },
];

export const DECOR: Decor[] = [
  { x: -7, y: 5.15, z: 2.2, w: 8.6, h: 0.45, d: 7.2, color: C.roof },
  { x: -7, y: 2.4, z: 6.15, w: 5.2, h: 0.16, d: 1.3, color: C.roof },
  { x: 6.3, y: 3.15, z: -2.5, w: 5.2, h: 0.12, d: 2.4, color: C.trim },
  { x: 0, y: 0.02, z: -1, w: 3.2, h: 0.04, d: 22, color: C.road },
  { x: 0, y: 0.025, z: -15.6, w: 46, h: 0.04, d: 4.2, color: C.wet },
  { x: 16, y: 0.12, z: -12.5, w: 4.2, h: 0.18, d: 8, color: C.pier },
  { x: 16, y: 0.55, z: -8.6, w: 0.18, h: 0.9, d: 0.18, color: C.wood },
  { x: 16, y: 0.55, z: -16.2, w: 0.18, h: 0.9, d: 0.18, color: C.wood },
];

export const SPOTS: Spot[] = [
  { id: "villa", x: -7, z: 7.4, radius: 2.6 },
  { id: "cafe", x: 6.3, z: 1.3, radius: 2.5 },
  { id: "market", x: 13.1, z: -2.2, radius: 2.6 },
  { id: "clinic", x: -14, z: 8.6, radius: 2.5 },
  { id: "park", x: 2.2, z: -6.4, radius: 2.6 },
  { id: "beach", x: 0, z: -12.4, radius: 3 },
  { id: "pier", x: 16, z: -12.4, radius: 2.8 },
];

export const PLAYER_R = 0.38;
export const BOUND = { minX: -18, maxX: 20, minZ: -17.2, maxZ: 13.6 };
export const SPAWN = { x: 0, z: 6, yaw: 0 };

export function nearestSpot(x: number, z: number): PlaceId | null {
  let best: { id: PlaceId; d: number } | null = null;
  for (const s of SPOTS) {
    const d = Math.hypot(x - s.x, z - s.z);
    if (d <= s.radius && (!best || d < best.d)) best = { id: s.id, d };
  }
  return best?.id ?? null;
}

export function resolveMove(x: number, z: number, nx: number, nz: number) {
  let px = nx;
  let pz = nz;
  if (hits(px, z)) px = x;
  if (hits(px, pz)) pz = z;
  return {
    x: Math.min(BOUND.maxX, Math.max(BOUND.minX, px)),
    z: Math.min(BOUND.maxZ, Math.max(BOUND.minZ, pz)),
  };
}

function hits(x: number, z: number) {
  const r = PLAYER_R;
  for (const b of SOLIDS) {
    if (x + r > b.minX && x - r < b.maxX && z + r > b.minZ && z - r < b.maxZ) return true;
  }
  for (const t of TRUNKS) {
    if (Math.abs(x - t.x) < r + 0.22 && Math.abs(z - t.z) < r + 0.22) return true;
  }
  return false;
}

export function skyFor(hour: number) {
  if (hour < 6 || hour >= 20) return "#102830";
  if (hour < 8) return "#e09a6a";
  if (hour < 17) return "#8ec4c8";
  if (hour < 19) return "#e5844a";
  return "#1a3040";
}

export function lightFor(hour: number) {
  if (hour < 6 || hour >= 20) return { ambient: 0.28, sun: 0.22, pos: [-6, 10, 4] as const };
  if (hour >= 17) return { ambient: 0.42, sun: 0.85, pos: [-14, 8, 6] as const };
  return { ambient: 0.62, sun: 1.2, pos: [14, 20, 8] as const };
}
