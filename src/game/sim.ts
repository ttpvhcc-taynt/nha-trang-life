import type { PlaceId } from "@/game/types";
import { nearestSpot, resolveMove } from "@/game/world";

export type ControlsProbe = {
  getYaw: () => number;
  getSpeed: () => number;
  setSteer?: (v: number) => void;
  setKeys?: (codes: string[]) => void;
};

declare global {
  interface Window {
    __controlsTest?: ControlsProbe;
  }
}

export const sim = {
  x: 0,
  z: 6,
  yaw: 0,
  speed: 0,
  started: false,
  uiPause: false,
  keys: new Set<string>(),
  touch: { steer: 0, throttle: 0 },
  steerOverride: null as number | null,
  interactQueued: false,
  near: null as PlaceId | null,
  raf: 0,
  autosaveAcc: 0,
  onInteract: null as null | (() => void),
  onNear: null as null | ((id: PlaceId | null) => void),
  onAutosave: null as null | (() => void),
};

const TURN = 2.6;
const WALK = 4.8;

let listening = false;

function onKeyDown(e: KeyboardEvent) {
  if (e.repeat) return;
  const tag = (e.target as HTMLElement | null)?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  sim.keys.add(e.code);
  if (e.code === "KeyE") sim.interactQueued = true;
  if (e.code.startsWith("Arrow")) e.preventDefault();
}

function onKeyUp(e: KeyboardEvent) {
  sim.keys.delete(e.code);
}

export function step(dt: number) {
  if (!sim.started || sim.uiPause) {
    sim.speed = 0;
    return;
  }

  let steer = 0;
  if (sim.steerOverride !== null) steer = sim.steerOverride;
  else {
    if (sim.keys.has("KeyA") || sim.keys.has("ArrowLeft")) steer += 1;
    if (sim.keys.has("KeyD") || sim.keys.has("ArrowRight")) steer -= 1;
    steer = Math.max(-1, Math.min(1, steer + sim.touch.steer));
  }

  let throttle = 0;
  if (sim.keys.has("KeyW") || sim.keys.has("ArrowUp")) throttle += 1;
  if (sim.keys.has("KeyS") || sim.keys.has("ArrowDown")) throttle -= 1;
  throttle = Math.max(-1, Math.min(1, throttle + sim.touch.throttle));

  sim.yaw += steer * TURN * dt;
  const speed = throttle * WALK;
  sim.speed = speed;
  const fx = -Math.sin(sim.yaw);
  const fz = -Math.cos(sim.yaw);
  const moved = resolveMove(sim.x, sim.z, sim.x + fx * speed * dt, sim.z + fz * speed * dt);
  sim.x = moved.x;
  sim.z = moved.z;

  const near = nearestSpot(sim.x, sim.z);
  if (near !== sim.near) {
    sim.near = near;
    sim.onNear?.(near);
  }

  if (sim.interactQueued) {
    sim.interactQueued = false;
    sim.onInteract?.();
  }

  sim.autosaveAcc += dt;
  if (sim.autosaveAcc > 2) {
    sim.autosaveAcc = 0;
    sim.onAutosave?.();
  }
}

export function startLoop() {
  sim.started = true;
  if (typeof window !== "undefined" && !listening) {
    listening = true;
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", () => {
      sim.keys.clear();
      sim.touch.steer = 0;
      sim.touch.throttle = 0;
    });
  }
  if (sim.raf) cancelAnimationFrame(sim.raf);
  let last = performance.now();
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (sim.started) step(dt);
    else sim.speed = 0;
    sim.raf = requestAnimationFrame(loop);
  };
  sim.raf = requestAnimationFrame(loop);
}

export function stopLoop() {
  sim.started = false;
  sim.speed = 0;
  sim.keys.clear();
  sim.touch.steer = 0;
  sim.touch.throttle = 0;
  if (sim.raf) cancelAnimationFrame(sim.raf);
  sim.raf = 0;
}

export function setTouch(steer: number, throttle: number) {
  sim.touch.steer = steer;
  sim.touch.throttle = throttle;
}

if (typeof window !== "undefined") {
  window.__controlsTest = {
    getYaw: () => sim.yaw,
    getSpeed: () => sim.speed,
    setSteer: (v) => {
      sim.steerOverride = v;
    },
    setKeys: (codes) => {
      sim.keys = new Set(codes);
      sim.steerOverride = null;
    },
  };
}
