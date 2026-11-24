import type { Slot } from "@/game/types";

export type Preset = {
  id: string;
  name: string;
  slot: Slot;
  color: string;
};

export const PRESETS: Preset[] = [
  { id: "ao-linen", name: "Linen cát", slot: "ao", color: "#f4efe6" },
  { id: "ao-coral", name: "Áo san hô", slot: "ao", color: "#e5844a" },
  { id: "ao-sea", name: "Áo biển", slot: "ao", color: "#1f6f78" },
  { id: "ao-white", name: "Sơ mi trắng", slot: "ao", color: "#f7f4ee" },
  { id: "quan-ink", name: "Quần than", slot: "quan", color: "#1c2428" },
  { id: "quan-sand", name: "Quần cát", slot: "quan", color: "#c4b49a" },
  { id: "quan-navy", name: "Quần navy", slot: "quan", color: "#16343c" },
];

export type ClothRecord = {
  id: string;
  name: string;
  slot: Slot;
  created: number;
};

const DB = "nhatrang-life";
const STORE = "clothes";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Không mở được tủ đồ"));
  });
}

export function isPreset(id: string) {
  return PRESETS.some((p) => p.id === id);
}

export function presetColor(id: string) {
  return PRESETS.find((p) => p.id === id)?.color ?? "#f4efe6";
}

export async function listClothes(): Promise<ClothRecord[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const rows = (req.result as (ClothRecord & { blob?: Blob })[])
        .map(({ id, name, slot, created }) => ({ id, name, slot, created }))
        .sort((a, b) => b.created - a.created);
      resolve(rows);
    };
    req.onerror = () => reject(req.error ?? new Error("Không đọc được tủ đồ"));
  });
}

export async function addClothingImage(file: File, slot: Slot, name: string): Promise<ClothRecord> {
  if (!file.type.startsWith("image/")) throw new Error("Chỉ nhận file ảnh trang phục.");
  const blob = await fileToJpeg(file);
  const rec = {
    id: `img-${crypto.randomUUID()}`,
    name: name.trim().slice(0, 32) || "Ảnh mới",
    slot,
    created: Date.now(),
    blob,
  };
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(rec);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Không lưu được ảnh"));
  });
  return { id: rec.id, name: rec.name, slot: rec.slot, created: rec.created };
}

export async function removeClothing(id: string) {
  if (isPreset(id)) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Không xóa được"));
  });
}

export async function clothObjectUrl(id: string): Promise<string | null> {
  if (isPreset(id)) return null;
  const db = await openDb();
  const blob = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => {
      const row = req.result as { blob?: Blob } | undefined;
      resolve(row?.blob ?? null);
    };
    req.onerror = () => reject(req.error ?? new Error("Không đọc được ảnh"));
  });
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

async function fileToJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const max = 512;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Không xử lý được ảnh");
  }
  ctx.fillStyle = "#f4efe6";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
  if (!blob) throw new Error("Không nén được ảnh");
  return blob;
}
