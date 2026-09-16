import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Float,
  Lightformer,
  OrbitControls,
  Sparkles,
} from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { getAvatar } from "@/game/avatars";
import type { AvatarId } from "@/game/types";

function tone(color: string, lightness: number) {
  return new THREE.Color(color).offsetHSL(0, 0, lightness);
}

function Gem({ color }: { color: string }) {
  const gem = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (gem.current) gem.current.rotation.y += delta * 0.7;
  });
  return (
    <mesh ref={gem} castShadow>
      <octahedronGeometry args={[0.11, 2]} />
      <meshPhysicalMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.4}
        roughness={0.08}
        metalness={0.15}
        transmission={0.18}
        thickness={0.5}
      />
    </mesh>
  );
}

function Arm({ side, robe, skin }: { side: -1 | 1; robe: string; skin: string }) {
  return (
    <group position={[side * 0.38, 0.26, 0]} rotation-z={side * 0.09}>
      <mesh position={[0, -0.18, 0]} castShadow>
        <capsuleGeometry args={[0.095, 0.46, 10, 24]} />
        <meshPhysicalMaterial color={robe} roughness={0.62} sheen={0.45} sheenRoughness={0.72} />
      </mesh>
      <mesh position={[0, -0.53, 0]} castShadow>
        <capsuleGeometry args={[0.072, 0.28, 10, 20]} />
        <meshStandardMaterial color={skin} roughness={0.72} />
      </mesh>
      <mesh position={[0, -0.76, 0.01]} scale={[0.8, 1.05, 0.68]} castShadow>
        <sphereGeometry args={[0.1, 24, 18]} />
        <meshStandardMaterial color={skin} roughness={0.72} />
      </mesh>
    </group>
  );
}

function Leg({ side, robe, leather }: { side: -1 | 1; robe: string; leather: THREE.Color }) {
  return (
    <group position={[side * 0.16, -0.65, 0]}>
      <mesh position={[0, -0.25, 0]} castShadow>
        <capsuleGeometry args={[0.115, 0.45, 10, 24]} />
        <meshStandardMaterial color={robe} roughness={0.78} />
      </mesh>
      <mesh position={[0, -0.67, 0.025]} castShadow>
        <capsuleGeometry args={[0.12, 0.36, 10, 24]} />
        <meshPhysicalMaterial color={leather} roughness={0.42} clearcoat={0.08} />
      </mesh>
      <mesh position={[0, -0.92, 0.1]} scale={[1.05, 0.72, 1.7]} castShadow>
        <sphereGeometry args={[0.13, 24, 18]} />
        <meshPhysicalMaterial color={leather} roughness={0.38} clearcoat={0.1} />
      </mesh>
    </group>
  );
}

function Face({ avatar, skin, hair }: { avatar: AvatarId; skin: string; hair: string }) {
  const female = avatar === "mulher";
  const mystic = avatar === "mistico";
  return (
    <group position={[0, 0.9, 0]}>
      <mesh scale={[0.86, 1.08, 0.84]} castShadow>
        <sphereGeometry args={[0.22, 48, 36]} />
        <meshPhysicalMaterial color={skin} roughness={0.62} sheen={0.12} />
      </mesh>
      {!mystic && (
        <>
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.077, 0.025, 0.184]}>
              <mesh>
                <sphereGeometry args={[0.025, 18, 14]} />
                <meshPhysicalMaterial color={tone(hair, -0.28)} roughness={0.15} clearcoat={0.8} />
              </mesh>
              <mesh position={[0, 0, 0.021]}>
                <sphereGeometry args={[0.009, 14, 10]} />
                <meshBasicMaterial color={tone(skin, 0.35)} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, -0.07, 0.206]} rotation-x={-0.1}>
            <capsuleGeometry args={[0.013, 0.065, 6, 12]} />
            <meshStandardMaterial color={tone(skin, -0.08)} roughness={0.65} />
          </mesh>
        </>
      )}
      {mystic ? (
        <>
          <mesh position={[0, 0.03, -0.015]} castShadow>
            <sphereGeometry args={[0.285, 36, 28, 0, Math.PI * 2, 0, Math.PI * 0.72]} />
            <meshPhysicalMaterial color={hair} roughness={0.8} sheen={0.5} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.02, 0.19]} scale={[1.3, 0.8, 0.45]}>
            <torusGeometry args={[0.14, 0.026, 14, 42]} />
            <meshStandardMaterial color={tone(hair, 0.1)} roughness={0.55} />
          </mesh>
        </>
      ) : female ? (
        <>
          <mesh position={[0, 0.075, -0.035]} castShadow>
            <sphereGeometry args={[0.24, 42, 32, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
            <meshPhysicalMaterial color={hair} roughness={0.72} sheen={0.5} />
          </mesh>
          <mesh position={[0, -0.18, -0.13]} rotation-x={0.08} castShadow>
            <capsuleGeometry args={[0.105, 0.48, 10, 24]} />
            <meshPhysicalMaterial color={hair} roughness={0.72} sheen={0.45} />
          </mesh>
        </>
      ) : (
        <mesh position={[0, 0.09, -0.025]} scale={[1, 0.72, 1]} castShadow>
          <sphereGeometry args={[0.235, 42, 30, 0, Math.PI * 2, 0, Math.PI * 0.66]} />
          <meshPhysicalMaterial color={hair} roughness={0.75} sheen={0.35} />
        </mesh>
      )}
    </group>
  );
}

function Figure({ avatar, spin }: { avatar: AvatarId; spin: boolean }) {
  const group = useRef<THREE.Group>(null);
  const skin = getAvatar(avatar);
  const female = avatar === "mulher";
  const mystic = avatar === "mistico";
  const robeDark = useMemo(() => tone(skin.robe, -0.13), [skin.robe]);
  const robeLight = useMemo(() => tone(skin.robe, 0.08), [skin.robe]);
  const leather = useMemo(() => tone(skin.hair, 0.08), [skin.hair]);
  const metal = useMemo(() => tone(skin.trim, -0.03), [skin.trim]);

  useFrame((state, delta) => {
    if (!group.current) return;
    if (spin) group.current.rotation.y += delta * 0.16;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 1.1) * 0.018;
  });

  return (
    <group ref={group}>
      <Leg side={-1} robe={robeDark.getStyle()} leather={leather} />
      <Leg side={1} robe={robeDark.getStyle()} leather={leather} />

      <mesh position={[0, -0.22, 0]} scale={[female ? 0.86 : 1, 1, 0.72]} castShadow>
        <capsuleGeometry args={[0.34, 0.82, 16, 36]} />
        <meshPhysicalMaterial color={skin.robe} roughness={0.58} sheen={0.55} sheenRoughness={0.75} />
      </mesh>
      <mesh position={[0, -0.12, -0.09]} rotation-x={0.05} castShadow>
        <coneGeometry args={[female ? 0.5 : 0.48, 1.35, 48, 2, true]} />
        <meshPhysicalMaterial color={robeDark} roughness={0.68} sheen={0.48} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.18, 0.29]} scale={[0.85, 1, 0.35]} castShadow>
        <sphereGeometry args={[0.3, 36, 24]} />
        <meshPhysicalMaterial color={robeLight} roughness={0.5} sheen={0.5} />
      </mesh>
      <mesh position={[0, -0.03, 0]} scale={[1.06, 0.55, 0.8]} castShadow>
        <torusGeometry args={[0.32, 0.055, 20, 64]} />
        <meshPhysicalMaterial color={leather} roughness={0.35} metalness={0.12} clearcoat={0.18} />
      </mesh>
      <mesh position={[0, -0.04, 0.35]} castShadow>
        <boxGeometry args={[0.15, 0.13, 0.05]} />
        <meshPhysicalMaterial color={metal} metalness={0.72} roughness={0.25} />
      </mesh>

      <Arm side={-1} robe={skin.robe} skin={skin.skin} />
      <Arm side={1} robe={skin.robe} skin={skin.skin} />
      <mesh position={[0, 0.64, 0]}>
        <cylinderGeometry args={[0.085, 0.105, 0.18, 24]} />
        <meshStandardMaterial color={skin.skin} roughness={0.7} />
      </mesh>
      <Face avatar={avatar} skin={skin.skin} hair={skin.hair} />

      <group position={[0.5, -0.03, 0.02]} rotation-z={mystic ? -0.05 : 0.04}>
        <mesh position={[0, 0.12, 0]} castShadow>
          <cylinderGeometry args={[0.027, 0.037, 2.48, 18]} />
          <meshPhysicalMaterial color={leather} roughness={0.48} clearcoat={0.16} />
        </mesh>
        <mesh position={[0, 1.36, 0]}>
          <torusGeometry args={[0.16, 0.022, 16, 48]} />
          <meshPhysicalMaterial color={metal} metalness={0.72} roughness={0.2} />
        </mesh>
        <group position={[0, 1.36, 0]}><Gem color={skin.trim} /></group>
      </group>

      <mesh position={[0, -1.02, 0]} receiveShadow>
        <cylinderGeometry args={[0.72, 0.82, 0.11, 64]} />
        <meshPhysicalMaterial color={robeDark} roughness={0.72} metalness={0.1} />
      </mesh>
      <mesh position={[0, -0.95, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.64, 0.018, 12, 96]} />
        <meshStandardMaterial color={skin.trim} emissive={skin.trim} emissiveIntensity={1.25} />
      </mesh>
    </group>
  );
}

export default function AvatarScene({
  avatar,
  spin = true,
  interactive = false,
}: {
  avatar: AvatarId;
  spin?: boolean;
  interactive?: boolean;
}) {
  const skin = getAvatar(avatar);
  return (
    <Canvas
      shadows
      dpr={[1, 1.65]}
      camera={{ position: [0, 0.12, 5.25], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
    >
      <color attach="background" args={["#12091f"]} />
      <fog attach="fog" args={["#12091f", 5.5, 10]} />
      <hemisphereLight args={["#d8c8ff", "#21102f", 1.25]} />
      <directionalLight
        position={[3.5, 5.5, 4.5]}
        intensity={2.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />
      <spotLight position={[-3, 2.2, 2.5]} intensity={45} angle={0.45} penumbra={0.9} color={skin.trim} />
      <pointLight position={[2.5, 0.2, 2]} intensity={8} color="#f5d6b8" distance={7} />
      <Environment resolution={128}>
        <Lightformer intensity={2.2} position={[0, 4, 3]} scale={[5, 5, 1]} />
        <Lightformer intensity={1.6} color={skin.trim} position={[-4, 1, 1]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
        <Lightformer intensity={0.8} color="#ffd6ad" position={[4, -1, 2]} rotation-y={-Math.PI / 2} scale={[5, 2, 1]} />
      </Environment>
      <Float speed={0.35} rotationIntensity={0.015} floatIntensity={0.04}>
        <Figure avatar={avatar} spin={spin} />
      </Float>
      <Sparkles count={18} scale={[3.2, 3, 2]} size={1.1} speed={0.18} opacity={0.35} color={skin.trim} />
      <ContactShadows position={[0, -0.95, 0]} opacity={0.65} scale={4} blur={2.8} far={3} />
      {interactive && (
        <OrbitControls
          enablePan={false}
          enableZoom
          minDistance={4.35}
          maxDistance={6}
          target={[0, 0.08, 0]}
          minPolarAngle={1.15}
          maxPolarAngle={1.75}
          enableDamping
          dampingFactor={0.08}
        />
      )}
    </Canvas>
  );
}