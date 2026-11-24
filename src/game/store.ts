import { create } from "zustand";
import { applyAction, freshSave } from "@/game/logic";
import { clearSave, readSave, writeSave } from "@/game/save";
import { sim, startLoop, stopLoop } from "@/game/sim";
import type { Look, PlaceId, Save } from "@/game/types";

export type Panel = null | "place" | "wardrobe" | "journal";

type State = {
  ready: boolean;
  mode: "title" | "play";
  save: Save | null;
  panel: Panel;
  near: PlaceId | null;
  notice: string | null;
  boot: () => void;
  start: (name: string, look: Look, fresh: boolean) => void;
  setNear: (id: PlaceId | null) => void;
  setPanel: (panel: Panel) => void;
  act: (actionId: string) => void;
  equip: (slot: "ao" | "quan", id: string) => void;
  pose: () => void;
  dismiss: () => void;
  reset: () => void;
};

function poseOf(save: Save): Save {
  return { ...save, x: sim.x, z: sim.z, yaw: sim.yaw };
}

export const useGame = create<State>((set, get) => ({
  ready: false,
  mode: "title",
  save: null,
  panel: null,
  near: null,
  notice: null,
  boot: () => {
    if (get().ready) return;
    set({ ready: true, save: readSave() });
  },
  start: (name, look, fresh) => {
    const existing = fresh ? null : get().save;
    const save = existing ?? freshSave(name, look);
    sim.x = save.x;
    sim.z = save.z;
    sim.yaw = save.yaw;
    sim.uiPause = false;
    sim.near = null;
    writeSave(save);
    startLoop();
    set({ mode: "play", save, panel: null, notice: null, near: null });
  },
  setNear: (near) => set({ near }),
  setPanel: (panel) => {
    sim.uiPause = panel !== null;
    set({ panel });
  },
  act: (actionId) => {
    const save = get().save;
    const near = get().near;
    if (!save || !near) return;
    const result = applyAction(save, actionId, near);
    if (!("save" in result)) {
      set({ notice: result.message });
      return;
    }
    const next = poseOf(result.save);
    writeSave(next);
    sim.uiPause = false;
    set({ save: next, notice: result.message, panel: null });
  },
  equip: (slot, id) => {
    const save = get().save;
    if (!save) return;
    const next = poseOf({ ...save, equipped: { ...save.equipped, [slot]: id } });
    writeSave(next);
    set({ save: next });
  },
  pose: () => {
    const save = get().save;
    if (!save || get().mode !== "play") return;
    const next = poseOf(save);
    writeSave(next);
    set({ save: next });
  },
  dismiss: () => set({ notice: null }),
  reset: () => {
    stopLoop();
    clearSave();
    sim.uiPause = false;
    set({ mode: "title", save: null, panel: null, near: null, notice: null });
  },
}));
