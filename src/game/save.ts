import { freshSave } from "@/game/logic";
import { SAVE_VERSION, type Look, type Save, type Slot } from "@/game/types";

const KEY = "nhatrang-life.v1";

export function writeSave(save: Save) {
  try {
    const prev = localStorage.getItem(KEY);
    if (prev) localStorage.setItem(`${KEY}.bak`, prev);
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    /* private mode or quota — keep playing in memory */
  }
}

export function readSave(): Save | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Save>;
    if (!parsed || parsed.version !== SAVE_VERSION || !parsed.look || !parsed.name) return null;
    const base = freshSave(parsed.name, parsed.look as Look);
    return {
      ...base,
      ...parsed,
      look: { ...base.look, ...parsed.look },
      equipped: {
        ao: parsed.equipped?.ao ?? base.equipped.ao,
        quan: parsed.equipped?.quan ?? base.equipped.quan,
      } satisfies Record<Slot, string>,
      journal: Array.isArray(parsed.journal) ? parsed.journal.slice(0, 24) : base.journal,
      moments: Array.isArray(parsed.moments) ? parsed.moments : [],
    };
  } catch {
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
