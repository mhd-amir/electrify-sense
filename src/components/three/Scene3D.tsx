import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, GizmoHelper, GizmoViewport, Grid, OrbitControls } from "@react-three/drei";
import { Maximize2 } from "lucide-react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { useGrid } from "@/context/GridContext";
import { AssetModel3D } from "@/components/three/AssetModels3D";
import { PowerLine3D } from "@/components/three/PowerLine3D";
import { nodeWorldPos, WORLD_BOUNDS } from "@/components/three/coords";

function SceneContents() {
  const { state, selectedId, setSelectedId } = useGrid();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const positions = useMemo(() => {
    const map = new Map<string, [number, number, number]>();
    state.nodes.forEach((n) => map.set(n.id, nodeWorldPos(n)));
    return map;
  }, [state.nodes]);

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[20, 30, 10]} intensity={0.9} castShadow />
      <hemisphereLight args={["#3b5bff", "#050816", 0.4]} />

      <Grid
        args={[WORLD_BOUNDS.halfX * 2.4, WORLD_BOUNDS.halfZ * 2.4]}
        cellColor="#1e293b"
        sectionColor="#334155"
        fadeDistance={70}
        fadeStrength={1.5}
        infiniteGrid={false}
        position={[0, 0, 0]}
      />

      {state.lines.map((line) => {
        const from = positions.get(line.from);
        const to = positions.get(line.to);
        if (!from || !to) return null;
        return (
          <PowerLine3D
            key={line.id}
            line={line}
            from={from}
            to={to}
            selected={selectedId === line.id}
            onSelect={setSelectedId}
          />
        );
      })}

      {state.nodes.map((node) => {
        const pos = positions.get(node.id);
        if (!pos) return null;
        return (
          <group key={node.id} position={pos}>
            <AssetModel3D
              node={node}
              selected={selectedId === node.id}
              hovered={hoveredId === node.id}
              onSelect={setSelectedId}
              onHover={setHoveredId}
            />
          </group>
        );
      })}
    </>
  );
}

/** Full-screen interactive 3D digital twin: orbit camera, low-poly asset models, animated power flow. */
export function Scene3D() {
  const { setSelectedId } = useGrid();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const recenter = () => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.target.set(0, 0, 0);
    controls.object.position.set(0, 26, 42);
    controls.update();
  };

  return (
    <div className="relative h-[calc(100vh-16rem)] min-h-[520px] overflow-hidden rounded-2xl border border-border/60 bg-[#050816]">
      <Canvas
        shadows
        camera={{ position: [0, 26, 42], fov: 42 }}
        onPointerMissed={() => setSelectedId(null)}
      >
        <color attach="background" args={["#050816"]} />
        <fog attach="fog" args={["#050816", 40, 110]} />
        <Suspense fallback={null}>
          <SceneContents />
          <Environment preset="night" />
        </Suspense>
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={12}
          maxDistance={90}
          maxPolarAngle={Math.PI / 2.05}
        />
        <GizmoHelper alignment="bottom-right" margin={[64, 64]}>
          <GizmoViewport axisColors={["#ff4d6d", "#22e39a", "#38e8ff"]} labelColor="black" />
        </GizmoHelper>
      </Canvas>
      <button
        onClick={recenter}
        className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-xl border border-info/40 bg-info/10 px-3 py-1.5 text-[11px] font-semibold tracking-wider text-info uppercase backdrop-blur"
      >
        <Maximize2 className="size-3.5" /> Recenter view
      </button>
    </div>
  );
}
