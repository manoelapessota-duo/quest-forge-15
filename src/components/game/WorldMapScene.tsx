import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Html, Lightformer, MapControls, Sparkles, useTexture } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import worldMapTexture from "@/assets/world-map-premium.jpg";
import { MATERIALS, REGIONS } from "@/game/data";
import { LANDMARKS, MAP_HEIGHT, MAP_NODES, MAP_WIDTH, PORTALS } from "@/game/map";
import { getQuestStatus, isRegionUnlocked } from "@/game/rules";
import { useGame } from "@/game/state";

type Vec3 = [number, number, number];

const MAP_SCALE = 0.012;
const HEIGHT = 0.45;

function worldPoint(x: number, y: number, elevation = 0): Vec3 {
  return [(x - MAP_WIDTH / 2) * MAP_SCALE, elevation, (y - MAP_HEIGHT / 2) * MAP_SCALE];
}

function terrainHeight(x: number, z: number) {
  const mountain = Math.max(0, (z + 1.5) * 0.18) * (0.7 + Math.sin(x * 0.52) * 0.25);
  const ridges = Math.sin(x * 0.7) * 0.26 + Math.cos(z * 0.9) * 0.2 + Math.sin((x + z) * 1.2) * 0.12;
  return Math.max(-0.18, ridges + mountain);
}

function Terrain() {
  const texture = useTexture(worldMapTexture);
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(24, 16.8, 80, 56);
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = -pos.getY(i);
      const h = terrainHeight(x, z) * 0.18;
      pos.setZ(i, h);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial map={texture} roughness={0.82} metalness={0.01} color="#f2e8ff" />
    </mesh>
  );
}

function Water() {
  const material = useRef<THREE.MeshPhysicalMaterial>(null);
  useFrame((state) => {
    if (material.current) material.current.emissiveIntensity = 0.08 + Math.sin(state.clock.elapsedTime * 0.5) * 0.025;
  });
  return (
    <group>
      <mesh position={[-5.8, -0.08, 2.5]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[3.2, 64]} />
        <meshPhysicalMaterial ref={material} color="#385a72" emissive="#2c4369" transparent opacity={0.9} roughness={0.2} metalness={0.1} clearcoat={1} />
      </mesh>
      <mesh position={[-1.7, -0.045, 1.15]} rotation-x={-Math.PI / 2} rotation-z={-0.32}>
        <planeGeometry args={[0.58, 10, 1, 24]} />
        <meshPhysicalMaterial color="#527d91" transparent opacity={0.84} roughness={0.16} clearcoat={1} />
      </mesh>
    </group>
  );
}

function Forest() {
  const trunk = useRef<THREE.InstancedMesh>(null);
  const crown = useRef<THREE.InstancedMesh>(null);
  const transforms = useMemo(() => Array.from({ length: 105 }, (_, i) => {
    const a = (i * 2.399963) % (Math.PI * 2);
    const r = 1.3 + ((i * 47) % 100) / 24;
    const x = 1.4 + Math.cos(a) * r;
    const z = 3.4 + Math.sin(a) * r * 0.7;
    const scale = 0.55 + ((i * 31) % 50) / 100;
    return { x, z, scale, rotation: ((i * 17) % 100) / 100 * Math.PI };
  }), []);
  useEffect(() => {
    if (!trunk.current || !crown.current) return;
    const obj = new THREE.Object3D();
    transforms.forEach((t, i) => {
      const y = terrainHeight(t.x, t.z);
      obj.position.set(t.x, y + t.scale * 0.45, t.z);
      obj.scale.set(t.scale, t.scale, t.scale);
      obj.rotation.set(0, t.rotation, 0);
      obj.updateMatrix();
      trunk.current?.setMatrixAt(i, obj.matrix);
      obj.position.y = y + t.scale * 1.1;
      obj.scale.set(t.scale * 0.75, t.scale * 1.15, t.scale * 0.75);
      obj.updateMatrix();
      crown.current?.setMatrixAt(i, obj.matrix);
    });
    trunk.current.instanceMatrix.needsUpdate = true;
    crown.current.instanceMatrix.needsUpdate = true;
  }, [transforms]);
  return (
    <group>
      <instancedMesh ref={trunk} args={[undefined, undefined, transforms.length]} castShadow>
        <cylinderGeometry args={[0.09, 0.14, 0.9, 10]} />
        <meshStandardMaterial color="#3b2b2f" roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={crown} args={[undefined, undefined, transforms.length]} castShadow>
        <coneGeometry args={[0.48, 1.35, 14, 3]} />
        <meshStandardMaterial color="#28483b" roughness={0.92} />
      </instancedMesh>
    </group>
  );
}

function MountainRange() {
  const peaks = useMemo(() => Array.from({ length: 28 }, (_, i) => {
    const x = -11 + (i % 14) * 1.7 + ((i * 23) % 10) / 18;
    const z = -6.9 + Math.floor(i / 14) * 1.4 + Math.sin(i * 1.7) * 0.35;
    const height = 1.7 + ((i * 37) % 100) / 42;
    return { x, z, height, width: 0.9 + ((i * 19) % 50) / 55 };
  }), []);
  return (
    <group>
      {peaks.map((peak, i) => (
        <group key={i} position={[peak.x, terrainHeight(peak.x, peak.z), peak.z]}>
          <mesh position={[0, peak.height / 2, 0]} castShadow receiveShadow>
            <coneGeometry args={[peak.width, peak.height, 18, 5]} />
            <meshStandardMaterial color={i % 3 === 0 ? "#5f5965" : "#4c4c57"} roughness={0.94} />
          </mesh>
          <mesh position={[0, peak.height * 0.82, 0]}>
            <coneGeometry args={[peak.width * 0.36, peak.height * 0.34, 18]} />
            <meshStandardMaterial color="#b5acc1" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function VillageCluster() {
  const homes: Vec3[] = [
    [-9.4, 0, 4.9], [-8.7, 0, 5.4], [-8.15, 0, 4.65], [-9.2, 0, 3.95],
    [0.1, 0, 5.7], [0.9, 0, 5.2], [1.45, 0, 5.8], [0.6, 0, 4.45],
    [7.5, 0, -1.2], [8.35, 0, -1.55], [7.8, 0, -2.35],
  ];
  return (
    <group>
      {homes.map(([x, , z], i) => (
        <group key={i} position={[x, terrainHeight(x, z), z]} scale={0.38 + (i % 3) * 0.05}>
          <Building position={[0, 0, 0]} kind="vila" />
        </group>
      ))}
    </group>
  );
}

function Road({ points }: { points: Vec3[] }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), [points]);
  return (
    <mesh receiveShadow>
      <tubeGeometry args={[curve, 80, 0.1, 10, false]} />
      <meshStandardMaterial color="#8f7b68" roughness={1} />
    </mesh>
  );
}

function Building({ position, kind }: { position: Vec3; kind: string }) {
  const tower = kind === "torre";
  const fortress = kind === "forte";
  const scale = tower ? 1.35 : fortress ? 1.15 : 0.85;
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        {tower ? <cylinderGeometry args={[0.32, 0.42, 1.5, 20]} /> : <boxGeometry args={[0.9, 0.7, 0.75]} />}
        <meshStandardMaterial color={fortress ? "#605b66" : "#81706c"} roughness={0.9} />
      </mesh>
      <mesh position={[0, tower ? 1.2 : 0.83, 0]} castShadow>
        <coneGeometry args={[tower ? 0.42 : 0.72, tower ? 0.65 : 0.55, tower ? 20 : 4]} />
        <meshPhysicalMaterial color="#3e234d" roughness={0.62} metalness={0.08} />
      </mesh>
      {!tower && [-0.32, 0.32].map((x) => (
        <mesh key={x} position={[x, 0.42, 0.385]}>
          <boxGeometry args={[0.16, 0.24, 0.03]} />
          <meshStandardMaterial color="#d4a862" emissive="#b2763b" emissiveIntensity={0.55} />
        </mesh>
      ))}
    </group>
  );
}

function Portal({ position, unlocked }: { position: Vec3; unlocked: boolean }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => { if (ring.current && unlocked) ring.current.rotation.z += delta * 0.22; });
  return (
    <group position={position}>
      <mesh ref={ring} position={[0, 0.65, 0]} rotation-y={Math.PI / 5}>
        <torusGeometry args={[0.48, 0.07, 18, 64]} />
        <meshStandardMaterial color={unlocked ? "#bd82ff" : "#5a5360"} emissive={unlocked ? "#8f45e8" : "#242029"} emissiveIntensity={unlocked ? 2 : 0.15} metalness={0.55} roughness={0.26} />
      </mesh>
      {unlocked && <pointLight position={[0, 0.65, 0]} intensity={4} distance={3} color="#bd82ff" />}
    </group>
  );
}

function QuestNode({ x, y, status, label, onSelect }: { x: number; y: number; status: string; label: string; onSelect: () => void }) {
  const p = worldPoint(x, y);
  p[1] = terrainHeight(p[0], p[2]) + 0.35;
  const color = status === "completed" ? "#67d99a" : status === "available" ? "#c27aff" : status === "in_progress" ? "#65b9db" : "#716a78";
  return (
    <group position={p}>
      <mesh
        castShadow
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        onPointerOver={() => { document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = "default"; }}
      >
        <octahedronGeometry args={[status === "available" ? 0.16 : 0.12, 1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={status === "locked" ? 0.1 : 1.1} roughness={0.28} metalness={0.2} />
      </mesh>
      <Html center distanceFactor={18} position={[0, 0.36, 0]} zIndexRange={[10, 0]}>
        <button type="button" onClick={onSelect} aria-label={`${label} — ${status}`} className="world-node-hit size-6 rounded-full border-0 bg-transparent" />
      </Html>
    </group>
  );
}

function World({ onSelect }: { onSelect: (materialId: string) => void }) {
  const { save } = useGame();
  const xp = save.player?.xp ?? 0;
  return (
    <>
      <color attach="background" args={["#160d22"]} />
      <fog attach="fog" args={["#251532", 18, 34]} />
      <hemisphereLight args={["#eee7ff", "#25192b", 1.45]} />
      <directionalLight position={[-7, 13, 8]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={11} shadow-camera-bottom={-11} />
      <Environment resolution={128}>
        <Lightformer intensity={2.5} position={[-5, 10, 4]} scale={[10, 10, 1]} />
        <Lightformer intensity={1.5} color="#a968dd" position={[8, 3, -5]} rotation-y={Math.PI / 2} scale={[12, 4, 1]} />
      </Environment>
      <Terrain />
      <Road points={[worldPoint(250,1120,HEIGHT), worldPoint(650,1030,HEIGHT), worldPoint(1010,970,HEIGHT)]} />
      <Road points={[worldPoint(1010,970,HEIGHT), worldPoint(1300,760,HEIGHT), worldPoint(1620,620,HEIGHT)]} />
      <Road points={[worldPoint(1620,620,HEIGHT), worldPoint(1250,390,HEIGHT), worldPoint(980,210,HEIGHT)]} />
      {LANDMARKS.map((mark) => {
        const p = worldPoint(mark.x, mark.y);
        p[1] = terrainHeight(p[0], p[2]);
        return (
          <group key={mark.label}>
            <Building position={p} kind={mark.kind} />
            <Html center position={[p[0], p[1] + (mark.kind === "torre" ? 2.25 : 1.55), p[2]]} distanceFactor={17} zIndexRange={[8,0]}>
              <span className="world-label whitespace-nowrap rounded-sm border border-border/60 bg-background/80 px-2 py-1 text-[10px] font-medium text-parchment shadow-lg backdrop-blur-sm">{mark.label}</span>
            </Html>
          </group>
        );
      })}
      {PORTALS.map((portal) => {
        const p = worldPoint(portal.x, portal.y);
        p[1] = terrainHeight(p[0], p[2]);
        return <Portal key={portal.name} position={p} unlocked={isRegionUnlocked(xp, portal.region)} />;
      })}
      {MAP_NODES.map((node) => {
        const material = MATERIALS.find((m) => m.id === node.materialId);
        if (!material) return null;
        return <QuestNode key={node.materialId} x={node.x} y={node.y} status={getQuestStatus(save, node.materialId)} label={material.name} onSelect={() => onSelect(node.materialId)} />;
      })}
      <Sparkles count={55} scale={[22, 6, 15]} size={1.2} speed={0.12} opacity={0.28} color="#c794ff" />
      <MapControls makeDefault enableRotate minDistance={10} maxDistance={24} maxPolarAngle={0.88} minPolarAngle={0.5} minAzimuthAngle={-0.35} maxAzimuthAngle={0.35} target={[0,0,1]} enableDamping dampingFactor={0.08} />
    </>
  );
}

export default function WorldMapScene({ onSelect }: { onSelect: (materialId: string) => void }) {
  const [ready, setReady] = useState(false);
  return (
    <div className="relative aspect-[4/3] min-h-[430px] w-full overflow-hidden rounded-lg border border-border bg-background">
      <Canvas shadows dpr={[1,1.5]} camera={{ position: [0, 15.5, 8.5], fov: 39, near: 0.1, far: 80 }} gl={{ antialias: true }} onCreated={() => setReady(true)}>
        <World onSelect={onSelect} />
      </Canvas>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-background/85 to-transparent p-3">
        <div>
          <p className="font-display text-sm text-parchment">Terras do PDI</p>
          <p className="text-[10px] text-muted-foreground">Arraste para explorar · role para aproximar</p>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          {REGIONS.map((region) => <span key={region.id} className="rounded-sm border border-border/60 bg-background/75 px-2 py-1 text-[9px] text-muted-foreground backdrop-blur-sm">{region.name}</span>)}
        </div>
      </div>
      {!ready && <div className="absolute inset-0 grid place-items-center bg-background text-sm text-muted-foreground">Erguendo o mundo…</div>}
      <div className="sr-only" aria-label="Lista de missões do mapa">
        {MAP_NODES.map((node) => {
          const material = MATERIALS.find((item) => item.id === node.materialId);
          return material ? <button key={node.materialId} type="button" onClick={() => onSelect(node.materialId)}>{material.name}</button> : null;
        })}
      </div>
    </div>
  );
}