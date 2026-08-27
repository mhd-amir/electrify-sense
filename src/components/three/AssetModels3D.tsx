import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

import type { GridNode } from "@/types/grid";
import { mw } from "@/utils/format";
import { kindAccent, kindLabel, statusColor } from "@/utils/status";

export interface AssetModel3DProps {
  node: GridNode;
  selected: boolean;
  hovered: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

/** Accent/status colour, matching the 2D digital twin exactly. */
function useAssetColor(node: GridNode) {
  const accent = kindAccent[node.kind];
  return node.status === "normal" ? accent : statusColor[node.status];
}

function util(node: GridNode) {
  return Math.max(0, Math.min(1, node.powerMw / Math.max(1, node.capacityMw)));
}

/** Ground ring + hover/selection highlight, shared by every model. */
function Base({
  radius,
  color,
  selected,
  hovered,
}: {
  radius: number;
  color: string;
  selected: boolean;
  hovered: boolean;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const pulse = selected ? 0.55 + Math.sin(clock.elapsedTime * 3) * 0.25 : hovered ? 0.5 : 0.28;
    (ringRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
  });
  return (
    <mesh ref={ringRef} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.18, radius, 48]} />
      <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** Flashing red halo for critical/failed assets. */
function FaultHalo({ radius, active }: { radius: number; active: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const s = 1 + Math.abs(Math.sin(clock.elapsedTime * 5)) * 0.35;
    ref.current.scale.setScalar(s);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = active ? 0.5 - (s - 1) * 0.6 : 0;
  });
  if (!active) return null;
  return (
    <mesh ref={ref} position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius, radius + 0.9, 48]} />
      <meshBasicMaterial color="#ff2d55" transparent opacity={0.5} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** Floating label shown on hover / selection, styled like the existing glass cards. */
function Label({ node, color, visible }: { node: GridNode; color: string; visible: boolean }) {
  if (!visible) return null;
  const u = Math.round(util(node) * 100);
  return (
    <Html
      position={[0, 5.4, 0]}
      center
      distanceFactor={22}
      occlude
      style={{ pointerEvents: "none" }}
    >
      <div
        className="glass w-40 rounded-xl px-2.5 py-1.5 text-center"
        style={{ borderColor: `${color}66`, boxShadow: `0 0 22px -8px ${color}` }}
      >
        <p className="text-[9px] font-semibold tracking-[0.14em] uppercase" style={{ color }}>
          {kindLabel[node.kind]}
        </p>
        <p className="truncate text-xs font-semibold text-foreground">{node.name}</p>
        <p className="tabular text-[10px] text-muted-foreground">
          {mw(node.powerMw)} · {u}%
        </p>
      </div>
    </Html>
  );
}

function Interactive({
  node,
  children,
  onSelect,
  onHover,
}: {
  node: GridNode;
  children: React.ReactNode;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(node.id);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        onHover(null);
        document.body.style.cursor = "auto";
      }}
    >
      {children}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Power plants                                                        */
/* ------------------------------------------------------------------ */

function CoolingTower({
  position,
  color,
  glow,
}: {
  position: [number, number, number];
  color: string;
  glow: number;
}) {
  return (
    <mesh position={position} castShadow>
      <cylinderGeometry args={[0.9, 1.15, 3.2, 16, 1, true]} />
      <meshStandardMaterial
        color="#cbd5e1"
        emissive={color}
        emissiveIntensity={glow * 0.4}
        roughness={0.8}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function ThermalPlant({ node, color }: { node: GridNode; color: string }) {
  const u = util(node);
  const smokeRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!smokeRef.current) return;
    smokeRef.current.children.forEach((c, i) => {
      const t = (clock.elapsedTime * (0.3 + u * 0.5) + i * 0.6) % 2;
      c.position.y = 3.6 + t * 2.2;
      (c as THREE.Mesh).scale.setScalar(0.4 + t * 0.5);
      const mat = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 0.35 - t * 0.18);
    });
  });
  return (
    <group>
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[3, 1.8, 2]} />
        <meshStandardMaterial color="#334155" roughness={0.6} metalness={0.2} />
      </mesh>
      <CoolingTower position={[-1.4, 2.4, 1]} color={color} glow={u} />
      <CoolingTower position={[1.4, 2.4, 1]} color={color} glow={u} />
      <group ref={smokeRef}>
        {[0, 1].map((i) => (
          <mesh key={i} position={[i === 0 ? -1.4 : 1.4, 3.6, 1]}>
            <sphereGeometry args={[0.6, 8, 8]} />
            <meshBasicMaterial color="#e2e8f0" transparent opacity={0.25} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function NuclearPlant({ node, color }: { node: GridNode; color: string }) {
  const u = util(node);
  const domeRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!domeRef.current) return;
    const mat = domeRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.35 + Math.sin(clock.elapsedTime * 1.4) * 0.12 * u + u * 0.5;
  });
  return (
    <group>
      <mesh position={[0, 0.75, -0.6]} castShadow>
        <boxGeometry args={[2.6, 1.5, 1.6]} />
        <meshStandardMaterial color="#334155" roughness={0.6} />
      </mesh>
      <mesh ref={domeRef} position={[0, 1.65, 0.9]} castShadow>
        <sphereGeometry args={[1.35, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#e2e8f0"
          emissive={color}
          emissiveIntensity={0.35}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0, 0.28, 0.9]}>
        <cylinderGeometry args={[1.35, 1.35, 0.55, 20]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.7} />
      </mesh>
    </group>
  );
}

function SolarPlant({ node, color }: { node: GridNode; color: string }) {
  const u = util(node);
  const arrayRef = useRef<THREE.Group>(null);
  const panels = useMemo(() => {
    const list: [number, number][] = [];
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 5; c++) list.push([(c - 2) * 0.85, (r - 1) * 1.1]);
    return list;
  }, []);
  useFrame(({ clock }) => {
    if (!arrayRef.current) return;
    arrayRef.current.children.forEach((mesh) => {
      const mat = (mesh as THREE.Mesh).material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity =
        0.15 + u * 0.9 + Math.sin(clock.elapsedTime * 2 + mesh.position.x) * 0.05 * u;
    });
  });
  return (
    <group ref={arrayRef} rotation={[-0.35, 0, 0]} position={[0, 1, 0]}>
      {panels.map(([x, z], i) => (
        <mesh key={i} position={[x, 0, z]}>
          <boxGeometry args={[0.72, 0.06, 0.9]} />
          <meshStandardMaterial
            color="#1e3a5f"
            emissive={color}
            emissiveIntensity={0.2}
            metalness={0.3}
            roughness={0.35}
          />
        </mesh>
      ))}
    </group>
  );
}

function WindPlant({ node, color }: { node: GridNode; color: string }) {
  const u = util(node);
  const bladesRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!bladesRef.current) return;
    bladesRef.current.rotation.z += delta * (0.6 + u * 5.5);
  });
  return (
    <group>
      <mesh position={[0, 2.3, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.22, 4.6, 10]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
      </mesh>
      <mesh position={[0, 4.6, 0.35]} castShadow>
        <boxGeometry args={[0.35, 0.35, 0.9]} />
        <meshStandardMaterial
          color="#cbd5e1"
          emissive={color}
          emissiveIntensity={0.15}
          roughness={0.5}
        />
      </mesh>
      <group ref={bladesRef} position={[0, 4.6, 0.85]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]} position={[0, 0, 0]}>
            <boxGeometry args={[0.14, 2.4, 0.06]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function HydroPlant({ node, color }: { node: GridNode; color: string }) {
  const u = util(node);
  const waterRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!waterRef.current) return;
    const mat = waterRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.1 + u * 0.4 + Math.sin(clock.elapsedTime * 3) * 0.05;
  });
  return (
    <group>
      <mesh position={[0, 1.1, -0.4]} castShadow>
        <boxGeometry args={[3.4, 2.2, 1.4]} />
        <meshStandardMaterial color="#475569" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.4, 1.1]} castShadow>
        <cylinderGeometry args={[0.6, 0.6, 0.9, 14]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh ref={waterRef} position={[0, 0.05, 1.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.6, 1.6]} />
        <meshStandardMaterial
          color="#2f86ff"
          emissive={color}
          emissiveIntensity={0.2}
          transparent
          opacity={0.65}
        />
      </mesh>
    </group>
  );
}

function BatteryPlant({ node, color }: { node: GridNode; color: string }) {
  const soc = (node.socPct ?? 50) / 100;
  const barRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!barRef.current) return;
    const mat = barRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.4 + Math.sin(clock.elapsedTime * 1.5) * 0.1;
  });
  return (
    <group>
      {[-1, 0, 1].map((x) => (
        <mesh key={x} position={[x * 0.85, 0.6, 0]} castShadow>
          <boxGeometry args={[0.7, 1.2, 0.9]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>
      ))}
      <mesh ref={barRef} position={[0, 0.25 + soc * 1.0, 0.47]}>
        <boxGeometry args={[2.5, Math.max(0.05, soc * 2), 0.05]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function PowerPlantModel({ node, color }: { node: GridNode; color: string }) {
  switch (node.kind) {
    case "coal":
      return <ThermalPlant node={node} color={color} />;
    case "nuclear":
      return <NuclearPlant node={node} color={color} />;
    case "solar":
      return <SolarPlant node={node} color={color} />;
    case "wind":
      return <WindPlant node={node} color={color} />;
    case "hydro":
      return <HydroPlant node={node} color={color} />;
    case "battery":
      return <BatteryPlant node={node} color={color} />;
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* Substation                                                          */
/* ------------------------------------------------------------------ */

function SubstationModel({ node, color }: { node: GridNode; color: string }) {
  const u = util(node);
  const humRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!humRef.current) return;
    humRef.current.children.forEach((mesh) => {
      const mat = (mesh as THREE.Mesh).material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.25 + u * 0.6 + Math.sin(clock.elapsedTime * 4) * 0.05 * u;
    });
  });
  const transformers = useMemo<[number, number][]>(
    () => [
      [-1.1, -0.7],
      [1.1, -0.7],
      [-1.1, 0.9],
      [1.1, 0.9],
    ],
    [],
  );
  return (
    <group>
      {/* fence perimeter */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.35, 2.45, 4, 1]} />
        <meshBasicMaterial color="#475569" transparent opacity={0.5} />
      </mesh>
      <group ref={humRef}>
        {transformers.map(([x, z], i) => (
          <mesh key={i} position={[x, 0.5, z]} castShadow>
            <boxGeometry args={[0.8, 1, 0.7]} />
            <meshStandardMaterial
              color="#334155"
              emissive={color}
              emissiveIntensity={0.25}
              roughness={0.5}
            />
          </mesh>
        ))}
      </group>
      {/* lattice pylon */}
      <mesh position={[0, 1.9, 0]}>
        <coneGeometry args={[0.65, 2.4, 4]} />
        <meshStandardMaterial color="#cbd5e1" wireframe />
      </mesh>
      {[
        [-0.9, 3.1, "x" as const],
        [0.9, 3.1, "x" as const],
      ].map(([x, y], i) => (
        <mesh key={i} position={[x as number, y as number, 0]}>
          <boxGeometry args={[0.9, 0.06, 0.06]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Consumers / urban load                                              */
/* ------------------------------------------------------------------ */

function UrbanLoadModel({ node, color }: { node: GridNode; color: string }) {
  const u = util(node);
  const windowsRef = useRef<THREE.Group>(null);
  const buildings = useMemo(() => {
    const list: { x: number; z: number; h: number; w: number }[] = [];
    const seedArr = [0.4, 0.9, 0.6, 1.3, 0.75, 1.0, 0.5, 1.15];
    let i = 0;
    for (let x = -1.6; x <= 1.6; x += 0.95)
      for (let z = -1.2; z <= 1.2; z += 1.1) {
        const h = 1.2 + (seedArr[i % seedArr.length] ?? 0.7) * 2.2;
        list.push({ x, z, h, w: 0.55 + (i % 3) * 0.08 });
        i++;
      }
    return list;
  }, []);
  useFrame(({ clock }) => {
    if (!windowsRef.current) return;
    windowsRef.current.children.forEach((mesh, i) => {
      const mat = (mesh as THREE.Mesh).material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.25 + u * 1.1 + Math.sin(clock.elapsedTime * 1.6 + i) * 0.08 * u;
    });
  });
  return (
    <group>
      {buildings.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]} castShadow>
          <boxGeometry args={[b.w, b.h, b.w]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
      ))}
      <group ref={windowsRef}>
        {buildings.map((b, i) => (
          <mesh key={i} position={[b.x, b.h * 0.55, b.z + b.w / 2 + 0.001]}>
            <planeGeometry args={[b.w * 0.7, b.h * 0.5]} />
            <meshStandardMaterial
              color="#fef3c7"
              emissive={color}
              emissiveIntensity={0.3}
              transparent
              opacity={0.85}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function FactoryLoadModel({ node, color }: { node: GridNode; color: string }) {
  const u = util(node);
  return (
    <group>
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[2.6, 1.4, 1.6]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>
      <mesh position={[-0.8, 2, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.28, 1.6, 10]} />
        <meshStandardMaterial
          color="#cbd5e1"
          emissive={color}
          emissiveIntensity={0.15 + u * 0.35}
          roughness={0.6}
        />
      </mesh>
      <mesh position={[0.8, 2, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.28, 1.6, 10]} />
        <meshStandardMaterial
          color="#cbd5e1"
          emissive={color}
          emissiveIntensity={0.15 + u * 0.35}
          roughness={0.6}
        />
      </mesh>
    </group>
  );
}

function EvHubModel({ node, color }: { node: GridNode; color: string }) {
  const u = util(node);
  return (
    <group>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.6, 1.6]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>
      {[-0.9, 0, 0.9].map((x) => (
        <mesh key={x} position={[x, 0.6, 0]}>
          <boxGeometry args={[0.2, 1.2, 0.2]} />
          <meshStandardMaterial
            color="#334155"
            emissive={color}
            emissiveIntensity={0.25 + u * 0.5}
            roughness={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

function ConsumerModel({ node, color }: { node: GridNode; color: string }) {
  switch (node.kind) {
    case "city":
      return <UrbanLoadModel node={node} color={color} />;
    case "industry":
      return <FactoryLoadModel node={node} color={color} />;
    case "ev":
      return <EvHubModel node={node} color={color} />;
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* Dispatcher                                                          */
/* ------------------------------------------------------------------ */

const BASE_RADIUS: Record<string, number> = {
  coal: 2.6,
  nuclear: 2.4,
  solar: 2.6,
  wind: 1.3,
  hydro: 2.6,
  battery: 2.1,
  substation: 2.5,
  city: 2.4,
  industry: 2.4,
  ev: 1.6,
};

export function AssetModel3D({ node, selected, hovered, onSelect, onHover }: AssetModel3DProps) {
  const color = useAssetColor(node);
  const radius = BASE_RADIUS[node.kind] ?? 2.2;
  const isFault = node.status === "critical" || node.status === "failed";
  const [localHover, setLocalHover] = useState(false);

  return (
    <Interactive
      node={node}
      onSelect={onSelect}
      onHover={(id) => {
        setLocalHover(Boolean(id));
        onHover(id);
      }}
    >
      <Base radius={radius} color={color} selected={selected} hovered={hovered} />
      <FaultHalo radius={radius} active={isFault} />
      {node.kind === "substation" ? (
        <SubstationModel node={node} color={color} />
      ) : node.kind === "city" || node.kind === "industry" || node.kind === "ev" ? (
        <ConsumerModel node={node} color={color} />
      ) : (
        <PowerPlantModel node={node} color={color} />
      )}
      <Label node={node} color={color} visible={selected || hovered || localHover} />
    </Interactive>
  );
}
