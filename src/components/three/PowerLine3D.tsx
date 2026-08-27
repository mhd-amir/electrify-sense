import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";

import type { GridLine } from "@/types/grid";
import { statusColor } from "@/utils/status";

const PARTICLES_MAX = 6;

export function PowerLine3D({
  line,
  from,
  to,
  selected,
  onSelect,
}: {
  line: GridLine;
  from: [number, number, number];
  to: [number, number, number];
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const color = statusColor[line.status];
  const failed = line.status === "failed";
  const width = 1.1 + (line.loadPct / 100) * 2.2;

  const curve = useMemo(() => {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const mid = start.clone().lerp(end, 0.5);
    mid.y += 1.6 + line.loadPct / 60;
    return new THREE.QuadraticBezierCurve3(start, mid, end);
  }, [from, to, line.loadPct]);

  const points = useMemo(() => curve.getPoints(24), [curve]);
  const particleCount = failed ? 0 : Math.max(2, Math.round((line.loadPct / 100) * PARTICLES_MAX));
  const particleRefs = useRef<(THREE.Mesh | null)[]>([]);
  const flashRef = useRef<THREE.Group>(null);

  useFrame(({ clock }, delta) => {
    const speed = 0.12 + line.loadPct / 220;
    particleRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const offset = i / Math.max(1, particleCount);
      const t = (clock.elapsedTime * speed + offset) % 1;
      const p = curve.getPoint(t);
      mesh.position.copy(p);
    });
    if (flashRef.current && failed) {
      const s = 0.4 + Math.abs(Math.sin(clock.elapsedTime * 6));
      flashRef.current.visible = s > 0.6;
    }
  });

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onSelect(line.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    >
      <Line
        points={points}
        color={color}
        lineWidth={selected ? width + 2 : width}
        transparent
        opacity={failed ? 0.3 : 0.85}
      />
      {failed ? (
        <group ref={flashRef}>
          <Line points={points} color="#ff2d55" lineWidth={width + 1.5} transparent opacity={0.9} />
        </group>
      ) : (
        Array.from({ length: particleCount }).map((_, i) => (
          <mesh key={i} ref={(el) => (particleRefs.current[i] = el)}>
            <sphereGeometry args={[0.18, 8, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.1} />
          </mesh>
        ))
      )}
    </group>
  );
}
