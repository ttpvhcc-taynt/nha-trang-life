import { ACTIONS } from "@/game/content";
import { MOMENT_COPY } from "@/game/content";
import { SPAWN } from "@/game/world";
import {
  DEFAULT_LOOK,
  MOMENT_ORDER,
  SAVE_VERSION,
  type JournalEntry,
  type Look,
  type MomentId,
  type PlaceId,
  type Save,
} from "@/game/types";
import type { ActionDef } from "@/game/content";

export function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

export function shortMoney(n: number) {
  const sign = n < 0 ? "−" : "";
  const v = Math.abs(Math.round(n));
  if (v >= 1_000_000) {
    const tr = v / 1_000_000;
    const text = (tr >= 10 ? tr.toFixed(0) : tr.toFixed(1)).replace(".", ",");
    return `${sign}${text} tr`;
  }
  if (v >= 1000) return `${sign}${Math.round(v / 1000)}k`;
  return `${sign}${v}₫`;
}

export function phaseLabel(hour: number) {
  if (hour < 11) return "Sáng";
  if (hour < 14) return "Trưa";
  if (hour < 18) return "Chiều";
  return "Tối";
}

export function clock(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function freshSave(name: string, look: Look = DEFAULT_LOOK): Save {
  const clean = name.trim().slice(0, 24) || "Mình";
  return {
    version: SAVE_VERSION,
    name: clean,
    look,
    day: 1,
    hour: 8,
    energy: 86,
    mood: 64,
    satiety: 72,
    money: 2_400_000,
    x: SPAWN.x,
    z: SPAWN.z,
    yaw: SPAWN.yaw,
    journal: [{ day: 1, hour: 8, text: "Cửa biệt thự mở. Vịnh nằm phía trước." }],
    moments: [],
    clinicDay: 0,
    equipped: { ao: "ao-linen", quan: "quan-ink" },
  };
}

export function blockReason(save: Save, action: ActionDef): string | null {
  if (action.sleep) {
    if (save.hour < 20 && save.energy > 30) return "Còn sớm. Đi dạo thêm đã.";
    return null;
  }
  if (save.hour + action.hours > 23) return "Khuya rồi. Về biệt thự ngủ.";
  if (action.minHour !== undefined && save.hour < action.minHour) return "Chưa tới giờ.";
  if (action.maxHour !== undefined && save.hour > action.maxHour) return "Đã qua giờ thuyền.";
  if (action.clinic && save.clinicDay === save.day) return "Hôm nay đã khám.";
  if (save.money + action.money < 0) return "Không đủ tiền.";
  if (action.energy <= -12 && save.energy < 15) return "Mệt quá. Ăn hoặc nghỉ đã.";
  if (action.energy <= -12 && save.satiety < 16) return "Đói. Ăn gì đã.";
  return null;
}

export function applyAction(save: Save, actionId: string, place: PlaceId): { save: Save; message: string } | { message: string } {
  const action = ACTIONS.find((a) => a.id === actionId && a.place === place);
  if (!action) return { message: "Không làm được việc này ở đây." };
  const reason = blockReason(save, action);
  if (reason) return { message: reason };

  if (action.sleep) {
    const slept: Save = {
      ...save,
      day: save.day + 1,
      hour: 7,
      energy: clamp(save.energy + (save.satiety < 22 ? 36 : 62)),
      satiety: clamp(save.satiety - 28),
      mood: clamp(save.mood + (save.satiety < 22 ? -4 : 6)),
      journal: pushJournal(save, "Ngủ một giấc. Sáng hôm sau vịnh vẫn ở đó.", save.day + 1, 7),
    };
    return { save: slept, message: action.line };
  }

  const endHour = save.hour + action.hours;
  const moments = grantMoments(save.moments, action.moment, save.hour, endHour, place);
  const gained = moments.filter((id) => !save.moments.includes(id));
  const next: Save = {
    ...save,
    hour: endHour,
    energy: clamp(save.energy + action.energy),
    mood: clamp(save.mood + action.mood),
    satiety: clamp(save.satiety + action.satiety),
    money: Math.max(0, save.money + action.money),
    moments,
    clinicDay: action.clinic ? save.day : save.clinicDay,
    journal: pushJournal(save, action.line, save.day, endHour),
  };
  const extra = gained.map((id) => MOMENT_COPY[id].title).join(", ");
  const message = extra ? `${action.line} Bưu thiếp mới: ${extra}.` : action.line;
  return { save: next, message };
}

function grantMoments(
  current: MomentId[],
  moment: MomentId | undefined,
  startHour: number,
  endHour: number,
  place: PlaceId,
) {
  const set = new Set(current);
  if (moment) set.add(moment);
  if ((startHour >= 18 || endHour >= 18) && (place === "beach" || place === "pier")) set.add("dem");
  return MOMENT_ORDER.filter((id) => set.has(id));
}

function pushJournal(save: Save, text: string, day: number, hour: number): JournalEntry[] {
  return [{ day, hour, text }, ...save.journal].slice(0, 24);
}

export function actionHint(action: ActionDef) {
  if (action.sleep) return "Sang ngày mới";
  const bits = [`${action.hours} giờ`];
  if (action.money) bits.push(action.money > 0 ? `+${shortMoney(action.money)}` : shortMoney(action.money));
  if (action.satiety >= 12) bits.push("no");
  if (action.energy >= 8) bits.push("lấy sức");
  if (action.mood >= 10) bits.push("vui");
  return bits.join(" · ");
}
