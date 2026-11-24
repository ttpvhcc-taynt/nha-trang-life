import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { useGame } from "@/game/store";
import { clothObjectUrl, isPreset, presetColor } from "@/game/wardrobe";
import { C, DECOR, skyFor, lightFor, SOLIDS, SPOTS, TRUNKS } from "@/game/world";
import { sim } from "@/game/sim";
import type { Look } from "@/game/types";

function useClothMap(id: string | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!id || isPreset(id)) {
      setUrl(null);
      return;
    }
    let dead = false;
    let current: string | null = null;
    void clothObjectUrl(id).then((next) => {
      if (dead) {
        if (next) URL.revokeObjectURL(next);
        return;
      }
      current = next;
      setUrl(next);
    });
    return () => {
      dead = true;
      if (current) URL.revokeObjectURL(current);
    };
  }, [id]);

  const [map, setMap] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!url) {
      setMap(null);
      return;
    }
    let dead = false;
    const loader = new THREE.TextureLoader();
    loader.load(url, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      if (dead) tex.dispose();
      else setMap(tex);
    });
    return () => {
      dead = true;
    };
  }, [url]);

  useEffect(() => {
    return () => {
      map?.dispose();
    };
  }, [map]);

  return map;
}

function Scenery() {
  const hour = useGame((s) => s.save?.hour ?? 8);
  const near = useGame((s) => s.near);
  const sky = skyFor(hour);
  const light = lightFor(hour);
  const night = hour >= 19 || hour < 6;

  return (
    <>
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[sky, 28, 78]} />
      <ambientLight intensity={light.ambient} />
      <directionalLight
        position={light.pos}
        intensity={light.sun}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={70}
        shadow-camera-left={-28}
        shadow-camera-right={28}
        shadow-camera-top={28}
        shadow-camera-bottom={-28}
      />
      <hemisphereLight args={["#f4efe6", "#1a4a44", 0.35]} />
      <pointLight position={[-7, 3.2, 6.2]} intensity={night ? 1.4 : 0.15} color={C.trim} distance={10} />
      <pointLight position={[6.3, 2.6, -1]} intensity={night ? 1.1 : 0.2} color={C.trim} distance={8} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -2]} receiveShadow>
        <planeGeometry args={[90, 90]} />
        <meshStandardMaterial color={C.sand} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, -32]} receiveShadow>
        <planeGeometry args={[100, 36]} />
        <meshStandardMaterial color={C.water} roughness={0.35} metalness={0.08} />
      </mesh>

      {SOLIDS.map((b) => (
        <mesh
          key={`${b.minX}-${b.minZ}-${b.color}`}
          position={[(b.minX + b.maxX) / 2, b.h / 2, (b.minZ + b.maxZ) / 2]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[b.maxX - b.minX, b.h, b.maxZ - b.minZ]} />
          <meshStandardMaterial color={b.color} roughness={0.86} />
        </mesh>
      ))}

      {DECOR.map((d) => (
        <mesh key={`${d.x}-${d.y}-${d.z}-${d.w}`} position={[d.x, d.y, d.z]} castShadow receiveShadow>
          <boxGeometry args={[d.w, d.h, d.d]} />
          <meshStandardMaterial color={d.color} roughness={0.8} />
        </mesh>
      ))}

      {TRUNKS.map((t) => (
        <group key={`${t.x}-${t.z}`} position={[t.x, 0, t.z]}>
          <mesh position={[0, 0.7, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.22, 1.4, 8]} />
            <meshStandardMaterial color={C.trunk} roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.85, 0]} castShadow>
            <coneGeometry args={[1.15, 2.1, 8]} />
            <meshStandardMaterial color={C.leaf} roughness={0.85} />
          </mesh>
        </group>
      ))}

      {SPOTS.map((s) => (
        <mesh key={s.id} rotation={[-Math.PI / 2, 0, 0]} position={[s.x, 0.05, s.z]}>
          <ringGeometry args={[0.48, 0.66, 28]} />
          <meshBasicMaterial color={near === s.id ? C.ring : C.ringIdle} />
        </mesh>
      ))}

      <mesh position={[-7.6, 2.5, 5.52]}>
        <boxGeometry args={[0.7, 0.9, 0.08]} />
        <meshStandardMaterial color={night ? "#e7c27a" : "#c9d7d4"} emissive={night ? "#e5844a" : "#000000"} emissiveIntensity={night ? 0.7 : 0} />
      </mesh>
      <mesh position={[-5.8, 2.5, 5.52]}>
        <boxGeometry args={[0.7, 0.9, 0.08]} />
        <meshStandardMaterial color={night ? "#e7c27a" : "#c9d7d4"} emissive={night ? "#e5844a" : "#000000"} emissiveIntensity={night ? 0.7 : 0} />
      </mesh>
    </>
  );
}

function Walker() {
  const look = useGame((s) => s.save?.look);
  const ao = useGame((s) => s.save?.equipped.ao);
  const quan = useGame((s) => s.save?.equipped.quan);
  const aoMap = useClothMap(ao);
  const quanMap = useClothMap(quan);
  const rig = useRef<THREE.Group>(null);
  const bob = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!rig.current || !bob.current) return;
    rig.current.position.set(sim.x, 0, sim.z);
    rig.current.rotation.y = sim.yaw + Math.PI;
    const stride = Math.min(1, Math.abs(sim.speed) / 4.8);
    const wave = Math.sin(state.clock.elapsedTime * 10);
    bob.current.position.y = wave * 0.035 * stride;
    if (armL.current) armL.current.rotation.x = wave * 0.55 * stride;
    if (armR.current) armR.current.rotation.x = -wave * 0.55 * stride;
  });

  const appearance = look ?? { skin: "vang" as const, hair: "bob" as const, hairColor: "den" as const };
  const shirt = ao && isPreset(ao) ? presetColor(ao) : "#f4efe6";
  const pants = quan && isPreset(quan) ? presetColor(quan) : "#1c2428";

  return (
    <group ref={rig}>
      <group ref={bob}>
        <Person look={appearance} shirt={shirt} pants={pants} aoMap={aoMap} quanMap={quanMap} armL={armL} armR={armR} />
      </group>
    </group>
  );
}

function Person({
  look,
  shirt,
  pants,
  aoMap,
  quanMap,
  armL,
  armR,
}: {
  look: Look;
  shirt: string;
  pants: string;
  aoMap: THREE.Texture | null;
  quanMap: THREE.Texture | null;
  armL: RefObject<THREE.Group | null>;
  armR: RefObject<THREE.Group | null>;
}) {
  const skin = C.skin[look.skin];
  const hair = C.hair[look.hairColor];
  const shirtMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: aoMap ? "#ffffff" : shirt,
      map: aoMap,
      roughness: 0.72,
    });
    return m;
  }, [aoMap, shirt]);
  const pantsMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: quanMap ? "#ffffff" : pants,
      map: quanMap,
      roughness: 0.8,
    });
    return m;
  }, [pants, quanMap]);

  useEffect(() => {
    return () => {
      shirtMat.dispose();
      pantsMat.dispose();
    };
  }, [shirtMat, pantsMat]);

  return (
    <group>
      <mesh position={[0, 0.46, 0]} castShadow material={pantsMat}>
        <boxGeometry args={[0.4, 0.52, 0.24]} />
      </mesh>
      <mesh position={[0, 0.98, 0]} castShadow material={shirtMat}>
        <boxGeometry args={[0.5, 0.56, 0.28]} />
      </mesh>
      <group ref={armL} position={[-0.34, 1.12, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow material={shirtMat}>
          <boxGeometry args={[0.1, 0.42, 0.1]} />
        </mesh>
      </group>
      <group ref={armR} position={[0.34, 1.12, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow material={shirtMat}>
          <boxGeometry args={[0.1, 0.42, 0.1]} />
        </mesh>
      </group>
      <mesh position={[-0.12, 0.08, 0.04]} castShadow>
        <boxGeometry args={[0.14, 0.1, 0.22]} />
        <meshStandardMaterial color={C.shoe} roughness={0.6} />
      </mesh>
      <mesh position={[0.12, 0.08, 0.04]} castShadow>
        <boxGeometry args={[0.14, 0.1, 0.22]} />
        <meshStandardMaterial color={C.shoe} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.48, 0]} castShadow>
        <sphereGeometry args={[0.18, 20, 16]} />
        <meshStandardMaterial color={skin} roughness={0.66} />
      </mesh>
      <Hair hair={hair} style={look.hair} />
    </group>
  );
}

function Hair({ hair, style }: { hair: string; style: Look["hair"] }) {
  if (style === "bun") {
    return (
      <mesh position={[0, 1.7, -0.02]} castShadow>
        <sphereGeometry args={[0.1, 14, 12]} />
        <meshStandardMaterial color={hair} roughness={0.8} />
      </mesh>
    );
  }
  if (style === "dai") {
    return (
      <mesh position={[0, 1.4, -0.08]} castShadow>
        <boxGeometry args={[0.38, 0.55, 0.16]} />
        <meshStandardMaterial color={hair} roughness={0.8} />
      </mesh>
    );
  }
  const r = style === "bob" ? 0.2 : 0.16;
  return (
    <mesh position={[0, 1.58, 0]} castShadow>
      <sphereGeometry args={[r, 16, 12]} />
      <meshStandardMaterial color={hair} roughness={0.8} />
    </mesh>
  );
}

function FollowCam() {
  const desired = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const fx = -Math.sin(sim.yaw);
    const fz = -Math.cos(sim.yaw);
    desired.current.set(sim.x - fx * 6.4, 3.15, sim.z - fz * 6.4);
    look.current.set(sim.x, 1.15, sim.z);
    const cam = state.camera;
    cam.position.lerp(desired.current, 1 - Math.exp(-5.5 * dt));
    cam.lookAt(look.current);
  });
  return null;
}

export function World() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [0, 3.15, 12.4], fov: 48, near: 0.1, far: 120 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.shadowMap.type = THREE.PCFShadowMap;
      }}
    >
      <Scenery />
      <Walker />
      <FollowCam />
    </Canvas>
  );
}
