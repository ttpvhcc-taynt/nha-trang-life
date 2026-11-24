import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { BookOpen, Shirt, X } from "lucide-react";
import { actionHint, blockReason, clock, phaseLabel, shortMoney } from "@/game/logic";
import { MOMENT_COPY, PLACE_INFO, actionsFor } from "@/game/content";
import { MOMENT_ORDER, type Hair, type HairColor, type Look, type Skin } from "@/game/types";
import { DEFAULT_LOOK } from "@/game/types";
import { sim, setTouch } from "@/game/sim";
import { useGame } from "@/game/store";
import {
  addClothingImage,
  clothObjectUrl,
  listClothes,
  PRESETS,
  presetColor,
  removeClothing,
  type ClothRecord,
} from "@/game/wardrobe";

const World = lazy(() => import("@/components/game/World").then((m) => ({ default: m.World })));

export function Game() {
  const ready = useGame((s) => s.ready);
  const mode = useGame((s) => s.mode);
  const boot = useGame((s) => s.boot);

  useEffect(() => {
    boot();
  }, [boot]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") useGame.getState().pose();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
  }, []);

  useEffect(() => {
    sim.onNear = (id) => useGame.getState().setNear(id);
    sim.onInteract = () => {
      const st = useGame.getState();
      if (st.near && !st.panel) st.setPanel("place");
    };
    sim.onAutosave = () => useGame.getState().pose();
    return () => {
      sim.onNear = null;
      sim.onInteract = null;
      sim.onAutosave = null;
    };
  }, []);

  if (!ready) {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg text-fg">
        <p className="text-muted">Đang mở cửa biệt thự…</p>
      </main>
    );
  }

  if (mode === "title") return <Title />;

  return (
    <div className="play-root bg-bg text-fg">
      <div className="play-canvas">
        <Suspense
          fallback={
            <div className="grid h-full place-items-center text-muted">Đang dựng vịnh…</div>
          }
        >
          <World />
        </Suspense>
      </div>
      <Hud />
      <Panels />
    </div>
  );
}

function Title() {
  const saved = useGame((s) => s.save);
  const start = useGame((s) => s.start);
  const reset = useGame((s) => s.reset);
  const [name, setName] = useState(saved?.name ?? "");
  const [look, setLook] = useState<Look>(saved?.look ?? DEFAULT_LOOK);

  return (
    <main className="min-h-dvh bg-bg px-5 py-10 text-fg">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <header>
          <p className="text-xs font-medium tracking-widest text-primary uppercase">Tây Nha Trang</p>
          <h1 className="font-display text-5xl leading-none text-fg">Nha Trang</h1>
          <p className="font-display text-3xl text-primary">Life</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            Đi bộ trong một khối phố nhìn vịnh. Ăn, ngủ, làm việc, gom bưu thiếp. Chơi offline trên máy này.
          </p>
        </header>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-muted">Tên</span>
          <input
            value={name}
            maxLength={24}
            placeholder="Mình"
            onChange={(e) => setName(e.target.value)}
            className="h-11 rounded-lg border border-border bg-surface px-3 text-fg outline-none"
          />
        </label>

        <Choice
          label="Nước da"
          value={look.skin}
          options={[
            ["sang", "Sáng"],
            ["vang", "Vàng"],
            ["ngam", "Ngăm"],
            ["dam", "Đậm"],
          ]}
          onPick={(skin) => setLook({ ...look, skin: skin as Skin })}
        />
        <Choice
          label="Tóc"
          value={look.hair}
          options={[
            ["ngan", "Ngắn"],
            ["bob", "Bob"],
            ["dai", "Dài"],
            ["bun", "Búi"],
          ]}
          onPick={(hair) => setLook({ ...look, hair: hair as Hair })}
        />
        <Choice
          label="Màu tóc"
          value={look.hairColor}
          options={[
            ["den", "Đen"],
            ["nau", "Nâu"],
            ["sang", "Nâu sáng"],
            ["bac", "Bạc"],
          ]}
          onPick={(hairColor) => setLook({ ...look, hairColor: hairColor as HairColor })}
        />

        <button
          type="button"
          className="h-12 rounded-lg bg-primary text-base font-semibold text-primary-fg"
          onClick={() => start(name, look, !saved)}
        >
          Start
        </button>
        <p className="-mt-4 text-center text-sm text-muted">{saved ? "Tiếp tục kỳ nghỉ" : "Bắt đầu kỳ nghỉ"}</p>

        {saved ? (
          <button type="button" className="h-11 text-sm text-muted" onClick={reset}>
            Làm lại từ đầu
          </button>
        ) : null}

        <p className="text-xs leading-relaxed text-muted">
          W tiến, S lùi, A rẽ trái, D rẽ phải. Vòng tròn trên đất là nơi ghé. Tủ đồ nhận ảnh trang phục từ máy — lưu tại chỗ, không cần mạng. Nhân vật luôn mặc đồ.
        </p>
      </div>
    </main>
  );
}

function Choice({
  label,
  value,
  options,
  onPick,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onPick: (id: string) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm text-muted">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([id, text]) => {
          const on = value === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              onClick={() => onPick(id)}
              className={
                on
                  ? "h-11 rounded-lg bg-primary px-3 text-sm font-medium text-primary-fg"
                  : "h-11 rounded-lg border border-border bg-surface px-3 text-sm text-fg"
              }
            >
              {text}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function Hud() {
  const save = useGame((s) => s.save);
  const near = useGame((s) => s.near);
  const notice = useGame((s) => s.notice);
  const dismiss = useGame((s) => s.dismiss);
  const setPanel = useGame((s) => s.setPanel);
  if (!save) return null;
  const place = near ? PLACE_INFO[near].name : "Đang đi dạo";

  return (
    <>
      <header className="hud-top">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-display text-xl leading-none">{save.name}</p>
            <p className="mt-1 text-xs text-muted">
              Ngày {save.day} · {phaseLabel(save.hour)} {clock(save.hour)}
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="icon-btn" aria-label="Tủ đồ" onClick={() => setPanel("wardrobe")}>
              <Shirt className="size-4" aria-hidden />
              Tủ đồ
            </button>
            <button type="button" className="icon-btn" aria-label="Nhật ký" onClick={() => setPanel("journal")}>
              <BookOpen className="size-4" aria-hidden />
              Nhật ký
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="grid flex-1 gap-1.5">
            <Meter label="Sức" value={save.energy} />
            <Meter label="Vui" value={save.mood} />
            <Meter label="No" value={save.satiety} />
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{shortMoney(save.money)}</p>
            <p className="text-xs text-muted">
              Bưu thiếp {save.moments.length}/{MOMENT_ORDER.length}
            </p>
          </div>
        </div>
      </header>

      <div className="hud-bottom">
        <p className="text-center text-sm font-medium">{place}</p>
        {near ? (
          <button type="button" className="mt-2 h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-fg" onClick={() => setPanel("place")}>
            Ghé {place}
          </button>
        ) : (
          <p className="mt-1 text-center text-xs text-muted">W tiến · A trái · D phải · tới vòng tròn</p>
        )}
      </div>

      <Stick />

      {notice ? (
        <div className="hud-notice" role="status">
          <p className="text-sm leading-relaxed">{notice}</p>
          <button type="button" className="icon-btn mt-2" onClick={dismiss}>
            <X className="size-4" aria-hidden />
            Đóng
          </button>
        </div>
      ) : null}
    </>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-xs text-muted">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg">
        <div className="h-full bg-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Stick() {
  const origin = useRef<{ x: number; y: number } | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  function end() {
    origin.current = null;
    setKnob({ x: 0, y: 0 });
    setTouch(0, 0);
  }

  return (
    <div
      className="stick"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        origin.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerMove={(e) => {
        if (!origin.current) return;
        const dx = e.clientX - origin.current.x;
        const dy = e.clientY - origin.current.y;
        const max = 46;
        const cx = Math.max(-1, Math.min(1, dx / max));
        const cy = Math.max(-1, Math.min(1, dy / max));
        setKnob({ x: cx * max, y: cy * max });
        setTouch(-cx, -cy);
      }}
      onPointerUp={end}
      onPointerCancel={end}
      aria-label="Cần di chuyển"
    >
      <span className="stick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}

function Panels() {
  const panel = useGame((s) => s.panel);
  const setPanel = useGame((s) => s.setPanel);
  if (!panel) return null;
  return (
    <div className="sheet" role="dialog" aria-modal="true">
      <div className="mx-auto flex w-full max-w-lg items-center justify-between">
        <h2 className="font-display text-2xl">
          {panel === "wardrobe" ? "Tủ đồ" : panel === "journal" ? "Nhật ký" : "Ghé chỗ này"}
        </h2>
        <button type="button" className="icon-btn" onClick={() => setPanel(null)}>
          <X className="size-4" aria-hidden />
          Đóng
        </button>
      </div>
      {panel === "place" ? <PlacePanel /> : null}
      {panel === "wardrobe" ? <WardrobePanel /> : null}
      {panel === "journal" ? <JournalPanel /> : null}
    </div>
  );
}

function PlacePanel() {
  const save = useGame((s) => s.save);
  const near = useGame((s) => s.near);
  const act = useGame((s) => s.act);
  if (!save || !near) return <p className="text-sm text-muted">Hãy đứng vào vòng tròn.</p>;
  const info = PLACE_INFO[near];
  return (
    <div className="mt-3 flex flex-col gap-3">
      <p className="text-sm text-muted">{info.blurb}</p>
      {actionsFor(near).map((action) => {
        const reason = blockReason(save, action);
        return (
          <button
            key={action.id}
            type="button"
            disabled={!!reason}
            onClick={() => act(action.id)}
            className="rounded-lg border border-border bg-bg px-3 py-3 text-left disabled:opacity-50"
          >
            <span className="block text-sm font-semibold">{action.label}</span>
            <span className="mt-1 block text-xs text-muted">{reason ?? actionHint(action)}</span>
          </button>
        );
      })}
    </div>
  );
}

function WardrobePanel() {
  const save = useGame((s) => s.save);
  const equip = useGame((s) => s.equip);
  const [slot, setSlot] = useState<"ao" | "quan">("ao");
  const [rows, setRows] = useState<ClothRecord[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function refresh() {
    const list = await listClothes();
    setRows(list);
    const next: Record<string, string> = {};
    await Promise.all(
      list.map(async (row) => {
        const url = await clothObjectUrl(row.id);
        if (url) next[row.id] = url;
      }),
    );
    setThumbs((prev) => {
      for (const url of Object.values(prev)) URL.revokeObjectURL(url);
      return next;
    });
  }

  useEffect(() => {
    void refresh();
    return () => {
      setThumbs((prev) => {
        for (const url of Object.values(prev)) URL.revokeObjectURL(url);
        return {};
      });
    };
  }, []);

  async function take(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      const base = file.name.replace(/\.[^.]+$/, "");
      const rec = await addClothingImage(file, slot, base);
      await refresh();
      equip(slot, rec.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thêm được ảnh");
    }
  }

  if (!save) return null;
  const custom = rows.filter((r) => r.slot === slot);
  const presets = PRESETS.filter((p) => p.slot === slot);

  return (
    <div
      className="mt-3 flex flex-col gap-3"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void take(e.dataTransfer.files[0]);
      }}
    >
      <p className="text-sm leading-relaxed text-muted">
        Chọn ảnh áo hoặc quần trên máy. Ảnh in lên trang phục trong game và chỉ nằm trên thiết bị này.
      </p>
      <div className="flex gap-2">
        <button type="button" aria-pressed={slot === "ao"} className={slot === "ao" ? "h-11 flex-1 rounded-lg bg-primary text-sm font-semibold text-primary-fg" : "h-11 flex-1 rounded-lg border border-border text-sm"} onClick={() => setSlot("ao")}>
          Áo
        </button>
        <button type="button" aria-pressed={slot === "quan"} className={slot === "quan" ? "h-11 flex-1 rounded-lg bg-primary text-sm font-semibold text-primary-fg" : "h-11 flex-1 rounded-lg border border-border text-sm"} onClick={() => setSlot("quan")}>
          Quần
        </button>
      </div>
      <button type="button" className="h-11 rounded-lg border border-border bg-bg text-sm font-medium" onClick={() => input.current?.click()}>
        Thêm ảnh vào tủ
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void take(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {error ? <p className="text-sm text-primary">{error}</p> : null}
      <div className="grid grid-cols-2 gap-2">
        {presets.map((p) => (
          <ClothCard
            key={p.id}
            name={p.name}
            on={save.equipped[slot] === p.id}
            color={presetColor(p.id)}
            onPick={() => equip(slot, p.id)}
          />
        ))}
        {custom.map((row) => (
          <ClothCard
            key={row.id}
            name={row.name}
            on={save.equipped[slot] === row.id}
            image={thumbs[row.id]}
            onPick={() => equip(slot, row.id)}
            onRemove={() => {
              void removeClothing(row.id).then(() => {
                if (save.equipped[slot] === row.id) {
                  equip(slot, slot === "ao" ? "ao-linen" : "quan-ink");
                }
                return refresh();
              });
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ClothCard({
  name,
  on,
  color,
  image,
  onPick,
  onRemove,
}: {
  name: string;
  on: boolean;
  color?: string;
  image?: string;
  onPick: () => void;
  onRemove?: () => void;
}) {
  return (
    <div className={on ? "rounded-lg border border-primary bg-bg p-2" : "rounded-lg border border-border bg-bg p-2"}>
      <button type="button" onClick={onPick} className="w-full text-left">
        <span
          className="mb-2 block h-16 w-full rounded-md bg-surface"
          style={image ? { backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: color }}
        />
        <span className="block text-sm font-medium">{name}</span>
        <span className="text-xs text-muted">{on ? "Đang mặc" : "Mặc vào"}</span>
      </button>
      {onRemove ? (
        <button type="button" className="mt-2 h-10 text-xs text-muted" onClick={onRemove}>
          Xóa khỏi tủ
        </button>
      ) : null}
    </div>
  );
}

function JournalPanel() {
  const save = useGame((s) => s.save);
  const reset = useGame((s) => s.reset);
  if (!save) return null;
  return (
    <div className="mt-3 flex flex-col gap-4">
      <div>
        <p className="text-xs tracking-widest text-muted uppercase">Bưu thiếp</p>
        <ul className="mt-2 grid gap-2">
          {MOMENT_ORDER.map((id) => {
            const owned = save.moments.includes(id);
            const copy = MOMENT_COPY[id];
            return (
              <li key={id} className={owned ? "rounded-lg border border-primary px-3 py-2" : "rounded-lg border border-border px-3 py-2 opacity-60"}>
                <p className="text-sm font-semibold">{copy.title}</p>
                <p className="text-xs text-muted">{owned ? copy.line : "Chưa gặp"}</p>
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <p className="text-xs tracking-widest text-muted uppercase">Nhật ký</p>
        <ul className="mt-2 grid gap-2">
          {save.journal.map((entry, i) => (
            <li key={`${entry.day}-${entry.hour}-${i}`} className="text-sm leading-relaxed">
              <span className="text-muted">
                Ngày {entry.day} · {clock(entry.hour)} ·{" "}
              </span>
              {entry.text}
            </li>
          ))}
        </ul>
      </div>
      {save.moments.length === MOMENT_ORDER.length ? (
        <p className="text-sm font-medium text-primary">Đủ bộ bưu thiếp. Kỳ nghỉ này đã thành chuyện để kể.</p>
      ) : null}
      <button type="button" className="h-11 text-sm text-muted" onClick={reset}>
        Xóa kỳ nghỉ và chơi lại
      </button>
    </div>
  );
}
