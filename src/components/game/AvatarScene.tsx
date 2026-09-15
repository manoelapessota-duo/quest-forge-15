import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { getAvatar } from "@/game/avatars";
import type { AvatarId } from "@/game/types";

function Figure({ avatar, spin }: { avatar: AvatarId; spin: boolean }) {
  const group = useRef<THREE.Group>(null);
  const skin = getAvatar(avatar);
  const female = avatar === "mulher";
  const mystic = avatar === "mistico";

  useFrame((state, delta) => {
    if (!group.current) return;
    if (spin) group.current.rotation.y += delta * 0.5;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.03;
  });

  return (
    <group ref={group} position={[0, -0.9, 0]}>
      {/* manto / corpo */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <coneGeometry args={[female ? 0.52 : 0.46, 1.5, 24]} />
        <meshStandardMaterial color={skin.robe} roughness={0.55} metalness={0.1} />
      </mesh>
      {/* faixa */}
      <mesh position={[0, 1.05, 0]}>
        <torusGeometry args={[female ? 0.3 : 0.29, 0.045, 12, 32]} />
        <meshStandardMaterial color={skin.trim} roughness={0.35} metalness={0.35} />
      </mesh>
      {/* ombros */}
      <mesh position={[0, 1.48, 0]} castShadow>
        <capsuleGeometry args={[0.26, female ? 0.2 : 0.3, 6, 18]} />
        <meshStandardMaterial color={skin.robe} roughness={0.5} />
      </mesh>
      {/* braços */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 0.32, 1.32, 0]}
          rotation={[0, 0, side * 0.22]}
          castShadow
        >
          <capsuleGeometry args={[0.075, 0.62, 6, 14]} />
          <meshStandardMaterial color={skin.robe} roughness={0.6} />
        </mesh>
      ))}
      {/* pescoço + cabeça */}
      <mesh position={[0, 1.74, 0]}>
        <cylinderGeometry args={[0.08, 0.09, 0.12, 16]} />
        <meshStandardMaterial color={skin.skin} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.94, 0]} castShadow>
        <sphereGeometry args={[0.2, 28, 28]} />
        <meshStandardMaterial color={skin.skin} roughness={0.65} />
      </mesh>
      {/* cabelo / capuz */}
      {mystic ? (
        <mesh position={[0, 1.98, -0.02]} castShadow>
          <coneGeometry args={[0.31, 0.62, 20]} />
          <meshStandardMaterial color={skin.hair} roughness={0.7} />
        </mesh>
      ) : female ? (
        <>
          <mesh position={[0, 2.02, 0]}>
            <sphereGeometry args={[0.225, 24, 24, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
            <meshStandardMaterial color={skin.hair} roughness={0.8} />
          </mesh>
          <mesh position={[0, 1.72, -0.15]}>
            <capsuleGeometry args={[0.12, 0.4, 6, 14]} />
            <meshStandardMaterial color={skin.hair} roughness={0.8} />
          </mesh>
        </>
      ) : (
        <mesh position={[0, 2.04, 0]}>
          <sphereGeometry args={[0.215, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2.1]} />
          <meshStandardMaterial color={skin.hair} roughness={0.8} />
        </mesh>
      )}
      {/* cajado com cristal */}
      <mesh position={[0.5, 1.15, 0.05]} rotation={[0, 0, 0.06]} castShadow>
        <cylinderGeometry args={[0.03, 0.035, 2.3, 10]} />
        <meshStandardMaterial color="#3d2b52" roughness={0.8} />
      </mesh>
      <mesh position={[0.5, 2.35, 0.05]}>
        <octahedronGeometry args={[0.13, 0]} />
        <meshStandardMaterial
          color={skin.trim}
          emissive={new THREE.Color(skin.trim)}
          emissiveIntensity={0.9}
          roughness={0.2}
        />
      </mesh>
      {/* base / plataforma */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <cylinderGeometry args={[0.75, 0.85, 0.12, 36]} />
        <meshStandardMaterial color="#2a1b3d" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <torusGeometry args={[0.68, 0.02, 8, 48]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive={new THREE.Color("#a855f7")}
          emissiveIntensity={0.6}
        />
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
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 1.4, 4.1], fov: 42 }}>
      <color attach="background" args={["#1a0f2b"]} />
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[3, 6, 4]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-3, 2, 2]} intensity={18} color="#c084fc" distance={9} />
      <Environment>
        <Lightformer intensity={1.6} position={[0, 4, 2]} scale={[6, 6, 1]} />
        <Lightformer
          intensity={1}
          color="#a855f7"
          position={[-4, 1, 1]}
          rotation-y={Math.PI / 2}
          scale={[10, 2, 1]}
        />
      </Environment>
      <Figure avatar={avatar} spin={spin} />
      {interactive && (
        <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={1} maxPolarAngle={1.7} />
      )}
    </Canvas>
  );
}
