"use client";

import {
  Canvas,
  useFrame,
  useThree,
} from "@react-three/fiber";

import {
  Float,
  PerspectiveCamera,
  RoundedBox,
  Stars,
  Text,
} from "@react-three/drei";

import {
  Bloom,
  EffectComposer,
  Vignette,
} from "@react-three/postprocessing";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import * as THREE from "three";

/* ============================================================
   THINKSYNC CINEMATIC HERO
============================================================ */

const WORD = "THINKSYNC";

/* ============================================================
   FLOATING MODULE
============================================================ */

function FloatingModule({
  title,
  subtitle,
  symbol,
  color,
  glow,
  position,
  delay,
  scale = 1,
}: {
  title: string;
  subtitle: string;
  symbol: string;
  color: string;
  glow: string;
  position: [number, number, number];
  delay: number;
  scale?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const cardRef = useRef<THREE.Group>(null);

  const startY = position[1];

  useFrame((state) => {
    if (!groupRef.current || !cardRef.current) return;

    const t = state.clock.elapsedTime;

    groupRef.current.position.y =
      startY +
      Math.sin(t * 0.65 + delay) * 0.22;

    groupRef.current.rotation.z =
      Math.sin(t * 0.45 + delay) * 0.035;

    groupRef.current.rotation.y =
      Math.sin(t * 0.32 + delay) * 0.06;

    cardRef.current.position.y =
      Math.sin(t * 0.9 + delay) * 0.035;
  });

  return (
    <group
      ref={groupRef}
      position={position}
      scale={scale}
    >
      <Float
        speed={0.7}
        floatIntensity={0.08}
        rotationIntensity={0.02}
      >
        <group ref={cardRef}>

          {/* OUTER GLOW */}

          <RoundedBox
            args={[1.75, 0.82, 0.12]}
            radius={0.1}
            smoothness={6}
          >
            <meshBasicMaterial
              color={glow}
              transparent
              opacity={0.16}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </RoundedBox>

          {/* MAIN GLASS CARD */}

          <RoundedBox
            args={[1.55, 0.7, 0.16]}
            radius={0.08}
            smoothness={6}
            position={[0, 0, 0.04]}
          >
            <meshPhysicalMaterial
              color="#07101c"
              metalness={0.7}
              roughness={0.2}
              transparent
              opacity={0.93}
            />
          </RoundedBox>

          {/* COLORED EDGE */}

          <mesh
            position={[-0.73, 0, 0.14]}
          >
            <boxGeometry
              args={[0.025, 0.48, 0.025]}
            />

            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.9}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {/* SYMBOL CIRCLE */}

          <mesh
            position={[-0.48, 0.03, 0.16]}
          >
            <torusGeometry
              args={[0.16, 0.012, 12, 48]}
            />

            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.95}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {/* SYMBOL */}

          <Text
            position={[-0.48, 0.025, 0.18]}
            fontSize={0.105}
            color={color}
            anchorX="center"
            anchorY="middle"
          >
            {symbol}
          </Text>

          {/* TITLE */}

          <Text
            position={[0.2, 0.1, 0.18]}
            fontSize={0.105}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.025}
          >
            {title}
          </Text>

          {/* SUBTITLE */}

          <Text
            position={[0.2, -0.11, 0.18]}
            fontSize={0.06}
            color="#8d9aac"
            anchorX="center"
            anchorY="middle"
          >
            {subtitle}
          </Text>

          {/* STATUS DOT */}

          <mesh
            position={[0.63, 0.25, 0.18]}
          >
            <sphereGeometry
              args={[0.018, 12, 12]}
            />

            <meshBasicMaterial
              color={color}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

        </group>
      </Float>
    </group>
  );
}

/* ============================================================
   FLOATING MODULE SYSTEM
============================================================ */

function FloatingModules() {
  return (
    <group>

      <FloatingModule
        title="AI"
        subtitle="Smart assistance"
        symbol="AI"
        color="#8b5cf6"
        glow="#8b5cf6"
        position={[-5.0, 2.8, -0.8]}
        delay={0}
        scale={0.95}
      />

      <FloatingModule
        title="STUDY"
        subtitle="Learn smarter"
        symbol="BOOK"
        color="#22d3ee"
        glow="#22d3ee"
        position={[4.8, 2.4, -1.1]}
        delay={1.8}
        scale={0.92}
      />

      <FloatingModule
        title="EXPENSE"
        subtitle="Track spending"
        symbol="₹"
        color="#f59e0b"
        glow="#f59e0b"
        position={[-4.4, -1.45, -0.5]}
        delay={3.2}
        scale={0.9}
      />

      <FloatingModule
        title="SHOP"
        subtitle="Choose better"
        symbol="AI"
        color="#ec4899"
        glow="#ec4899"
        position={[4.45, -1.15, -0.7]}
        delay={4.8}
        scale={0.9}
      />

    </group>
  );
}

/* ============================================================
   NEON ARC
============================================================ */


function NeonArc() {
  const lineRef = useRef<THREE.Group>(null);

  const points = useMemo(() => {
    const result: THREE.Vector3[] = [];

    for (let i = 0; i <= 100; i++) {
      const t = i / 100;

      const x = THREE.MathUtils.lerp(-6.8, 6.8, t);

      const y = -0.45 + Math.sin(t * Math.PI) * 2.35;

      const z = -0.4 + Math.sin(t * Math.PI) * 0.7;

      result.push(new THREE.Vector3(x, y, z));
    }

    return result;
  }, []);

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  const lines = useMemo(() => {
    return [
      new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({
          color: "#ffffff",
          transparent: true,
          opacity: 0.92,
        })
      ),
      new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({
          color: "#22d3ee",
          transparent: true,
          opacity: 0.32,
        })
      ),
      new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({
          color: "#8b5cf6",
          transparent: true,
          opacity: 0.18,
        })
      ),
    ];
  }, [geometry]);

  useFrame((state) => {
    if (!lineRef.current) return;

    const t = state.clock.elapsedTime;

    lineRef.current.rotation.z =
      Math.sin(t * 0.25) * 0.018;

    lineRef.current.position.y =
      Math.sin(t * 0.3) * 0.035;
  });

  return (
    <group ref={lineRef}>
      <primitive object={lines[0]} />
      <primitive object={lines[1]} scale={1.01} />
      <primitive object={lines[2]} scale={1.02} />
    </group>
  );
}


/* ============================================================
   ENERGY PARTICLES
============================================================ */

function EnergyParticles() {
  const groupRef =
    useRef<THREE.Group>(null);

  const particles = useMemo(() => {
    return Array.from(
      { length: 110 },
      () => {
        const angle =
          Math.random() *
          Math.PI *
          2;

        const radius =
          5 +
          Math.random() * 5;

        return {
          x:
            Math.cos(angle) *
            radius,

          y:
            Math.sin(angle) *
            radius *
            0.55,

          z:
            -2 +
            Math.random() * 3,

          size:
            0.008 +
            Math.random() *
            0.018,

          speed:
            0.1 +
            Math.random() *
            0.35,

          phase:
            Math.random() *
            Math.PI *
            2,
        };
      }
    );
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;

    const t =
      state.clock.elapsedTime;

    groupRef.current.rotation.y =
      t * 0.015;

    groupRef.current.children.forEach(
      (child, index) => {
        const particle =
          particles[index];

        child.position.y =
          particle.y +
          Math.sin(
            t *
              particle.speed +
              particle.phase
          ) *
          0.08;
      }
    );
  });

  return (
    <group ref={groupRef}>

      {particles.map(
        (particle, index) => {
          const color =
            index % 4 === 0
              ? "#22d3ee"
              : index % 4 === 1
              ? "#8b5cf6"
              : index % 4 === 2
              ? "#ec4899"
              : "#ffffff";

          return (
            <mesh
              key={index}
              position={[
                particle.x,
                particle.y,
                particle.z,
              ]}
            >
              <sphereGeometry
                args={[
                  particle.size,
                  6,
                  6,
                ]}
              />

              <meshBasicMaterial
                color={color}
                transparent
                opacity={0.65}
              />
            </mesh>
          );
        }
      )}

    </group>
  );
}

/* ============================================================
   THINKSYNC LETTER
============================================================ */

function SyncLetter({
  character,
  index,
  total,
}: {
  character: string;
  index: number;
  total: number;
}) {
  const ref =
    useRef<THREE.Group>(null);

  const { pointer } =
    useThree();

  const phase =
    index * 0.48;

  useFrame((state) => {
    if (!ref.current) return;

    const t =
      state.clock.elapsedTime;

    const wave =
      Math.sin(
        t * 0.8 + phase
      );

    const wave2 =
      Math.sin(
        t * 0.45 +
        phase * 1.7
      );

    ref.current.position.y =
      wave * 0.12 +
      wave2 * 0.045;

    ref.current.rotation.z =
      wave * 0.045;

    ref.current.rotation.y =
      Math.sin(
        t * 0.5 + phase
      ) * 0.07;

    const baseX =
      (index -
        (total - 1) / 2) *
      1.05;

    const targetX =
      baseX +
      pointer.x *
      0.14 *
      ((index -
        total / 2) /
        total);

    ref.current.position.x +=
      (targetX -
        ref.current.position.x) *
      0.02;
  });

  return (
    <group
      ref={ref}
      position={[
        (index -
          (total - 1) / 2) *
          1.05,
        0,
        1.0,
      ]}
    >

      <Text
        position={[0, 0, -0.06]}
        fontSize={1.15}
        color="#22d3ee"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.12}
      >
        {character}
      </Text>

      <Text
        fontSize={1.08}
        fontWeight={700}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.015}
      >
        {character}
      </Text>

      <Text
        position={[0.025, 0, -0.025]}
        fontSize={1.08}
        color="#8b5cf6"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.1}
      >
        {character}
      </Text>

    </group>
  );
}

/* ============================================================
   THINKSYNC TYPOGRAPHY
============================================================ */

function ThinkSyncTypography() {
  return (
    <group>
      {WORD.split("").map(
        (character, index) => (
          <SyncLetter
            key={`${character}-${index}`}
            character={character}
            index={index}
            total={WORD.length}
          />
        )
      )}
    </group>
  );
}

/* ============================================================
   CENTER ENERGY + TS LOGO
============================================================ */

function EnergyCore({
  resolving,
}: {
  resolving: boolean;
}) {
  const ref =
    useRef<THREE.Mesh>(null);

  const ref2 =
    useRef<THREE.Mesh>(null);

  const groupRef =
    useRef<THREE.Group>(null);

  useFrame((state) => {
    const t =
      state.clock.elapsedTime;

    if (ref.current) {
      ref.current.scale.setScalar(
        1 +
        Math.sin(t * 1.7) *
        0.15
      );

      ref.current.rotation.z =
        t * 0.7;

      ref.current.rotation.x =
        Math.sin(t * 0.5) *
        0.3;
    }

    if (ref2.current) {
      ref2.current.rotation.z =
        -t * 0.5;

      ref2.current.rotation.y =
        t * 0.35;
    }

    if (groupRef.current) {
      const target =
        resolving ? 3.2 : 1;

      groupRef.current.scale.lerp(
        new THREE.Vector3(
          target,
          target,
          target
        ),
        0.08
      );

      if (resolving) {
        groupRef.current.rotation.y +=
          0.08;
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={[0, 1.15, 0]}
    >

      {/* WHITE OUTER RING */}

      <mesh ref={ref}>
        <torusGeometry
          args={[
            0.55,
            0.012,
            12,
            80,
          ]}
        />

        <meshBasicMaterial
          color="#ffffff"
          toneMapped={false}
        />
      </mesh>

      {/* VIOLET INNER RING */}

      <mesh
        ref={ref2}
        scale={0.72}
      >
        <torusGeometry
          args={[
            0.55,
            0.006,
            12,
            80,
          ]}
        />

        <meshBasicMaterial
          color="#8b5cf6"
          transparent
          opacity={0.8}
          blending={
            THREE.AdditiveBlending
          }
        />
      </mesh>

      {/* TS LOGO */}

      <Text
        position={[0, 0, 0.03]}
        fontSize={0.32}
        fontWeight={700}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.015}
        outlineColor="#22d3ee"
      >
        TS
      </Text>

      {/* INNER GLOW */}

      <mesh scale={0.72}>
        <sphereGeometry
          args={[
            0.42,
            32,
            32,
          ]}
        />

        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={
            resolving
              ? 0.28
              : 0.06
          }
          blending={
            THREE.AdditiveBlending
          }
          depthWrite={false}
        />
      </mesh>

    </group>
  );
}

/* ============================================================
   CAMERA
============================================================ */

function CameraRig() {
  const {
    camera,
    pointer,
  } = useThree();

  useFrame(() => {
    const targetX =
      pointer.x * 0.28;

    const targetY =
      pointer.y * 0.12;

    camera.position.x +=
      (targetX -
        camera.position.x) *
      0.025;

    camera.position.y +=
      (targetY -
        camera.position.y) *
      0.025;

    camera.lookAt(
      0,
      0.5,
      0
    );
  });

  return null;
}

/* ============================================================
   SCENE
============================================================ */

function Scene({
  resolving,
}: {
  resolving: boolean;
}) {
  return (
    <>

      <PerspectiveCamera
        makeDefault
        position={[
          0,
          0,
          10,
        ]}
        fov={42}
      />

      <CameraRig />

      {/* FOG */}

      <fog
        attach="fog"
        args={[
          "#010106",
          10,
          28,
        ]}
      />

      {/* LIGHTING */}

      <ambientLight
        intensity={0.12}
      />

      <pointLight
        position={[
          0,
          2,
          4,
        ]}
        intensity={13}
        distance={12}
        color="#22d3ee"
      />

      <pointLight
        position={[
          4,
          2,
          1,
        ]}
        intensity={9}
        distance={10}
        color="#8b5cf6"
      />

      <pointLight
        position={[
          -4,
          -1,
          2,
        ]}
        intensity={7}
        distance={9}
        color="#ec4899"
      />

      {/* STARS */}

      <Stars
        radius={65}
        depth={40}
        count={1300}
        factor={1.8}
        saturation={0}
        fade
        speed={0.15}
      />

      {/* PARTICLES */}

      <EnergyParticles />

      {/* NEON ARC */}

      <NeonArc />

      {/* FLOATING MODULES */}

      <FloatingModules />

      {/* MAIN WORD */}

      <Float
        speed={0.45}
        rotationIntensity={0.025}
        floatIntensity={0.15}
      >
        <ThinkSyncTypography />
      </Float>

      {/* TS ENERGY CORE */}

      <EnergyCore
        resolving={resolving}
      />

      {/* FLOOR */}

      <mesh
        rotation={[
          -Math.PI / 2,
          0,
          0,
        ]}
        position={[
          0,
          -2.05,
          0,
        ]}
      >
        <planeGeometry
          args={[
            18,
            8,
          ]}
        />

        <meshBasicMaterial
          color="#06101d"
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* BLOOM */}

      <EffectComposer
        multisampling={4}
      >
        <Bloom
          intensity={1.25}
          luminanceThreshold={0.25}
          luminanceSmoothing={0.85}
          mipmapBlur
        />

        <Vignette
          eskil={false}
          offset={0.16}
          darkness={0.58}
        />
      </EffectComposer>

    </>
  );
}

/* ============================================================
   HOME EXPERIENCE
============================================================ */

export default function HomeExperience() {
  const router = useRouter();

  const [resolving, setResolving] =
    useState(false);

  const handleEnter = () => {
    if (resolving) return;

    setResolving(true);

    setTimeout(() => {
      router.push("/login");
    }, 1200);
  };

  return (
    <main
      className={`
        relative
        h-screen
        w-full
        overflow-hidden
        bg-[#010106]
        transition-all
        duration-1000
        ${
          resolving
            ? "scale-110 opacity-0"
            : "scale-100 opacity-100"
        }
      `}
    >

      {/* ======================================================
          3D CANVAS
      ====================================================== */}

      <Canvas
        dpr={[
          1,
          2,
        ]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference:
            "high-performance",
        }}
      >
        <Scene
          resolving={resolving}
        />
      </Canvas>

      {/* ======================================================
          TOP BRAND
      ====================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          left-7
          top-6
          z-30
        "
      >
        <div
          className="
            flex
            items-center
            gap-2
          "
        >

          <span
            className="
              h-2
              w-2
              rounded-full
              bg-cyan-400
              shadow-[0_0_15px_#22d3ee]
            "
          />

          <span
            className="
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.35em]
              text-white/80
            "
          >
            THINKSYNC
          </span>

        </div>
      </div>

      {/* ======================================================
          CENTER COPY
      ====================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          bottom-[15%]
          left-1/2
          z-30
          w-full
          -translate-x-1/2
          px-6
          text-center
        "
      >

        <p
          className="
            text-[9px]
            font-medium
            uppercase
            tracking-[0.55em]
            text-cyan-300/80
          "
        >
          INTELLIGENT STUDENT WORKSPACE
        </p>

        <h1
          className="
            mt-4
            text-2xl
            font-semibold
            tracking-tight
            text-white
            sm:text-4xl
          "
        >
          Everything in sync.
        </h1>

        <p
          className="
            mx-auto
            mt-3
            max-w-md
            text-xs
            leading-6
            text-zinc-400
            sm:text-sm
          "
        >
          Study smarter. Manage your money.
          Make better decisions.
        </p>

      </div>

      {/* ======================================================
          ENTER THINKSYNC BUTTON
      ====================================================== */}

      <div
        className="
          pointer-events-auto
          absolute
          bottom-[6%]
          left-1/2
          z-30
          -translate-x-1/2
        "
      >

        <button
          onClick={handleEnter}
          disabled={resolving}
          className="
            group
            relative
            flex
            items-center
            gap-4
            overflow-hidden
            rounded-full
            border
            border-white/20
            bg-white
            px-7
            py-3
            text-xs
            font-semibold
            text-black
            shadow-[0_0_35px_rgba(34,211,238,0.22)]
            transition
            duration-300
            hover:scale-105
            hover:shadow-[0_0_50px_rgba(139,92,246,0.45)]
            disabled:cursor-wait
          "
        >

          <span>
            {resolving
              ? "ENTERING THINKSYNC..."
              : "ENTER THINKSYNC"}
          </span>

          <span
            className="
              transition-transform
              duration-300
              group-hover:translate-x-1
            "
          >
            →
          </span>

        </button>

      </div>

      {/* ======================================================
          BOTTOM STATUS
      ====================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          bottom-5
          left-6
          z-30
          hidden
          items-center
          gap-2
          sm:flex
        "
      >

        <span
          className="
            h-1.5
            w-1.5
            animate-pulse
            rounded-full
            bg-emerald-400
            shadow-[0_0_10px_#34d399]
          "
        />

        <span
          className="
            text-[8px]
            uppercase
            tracking-[0.3em]
            text-zinc-600
          "
        >
          CORE ONLINE
        </span>

      </div>

      {/* ======================================================
          RIGHT STATUS
      ====================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          bottom-5
          right-6
          z-30
          hidden
          text-right
          sm:block
        "
      >

        <p
          className="
            text-[8px]
            uppercase
            tracking-[0.3em]
            text-zinc-600
          "
        >
          STUDY · MONEY · SHOP
        </p>

      </div>

      {/* ======================================================
          TS RESOLUTION SCREEN
      ====================================================== */}

      {resolving && (
        <div
          className="
            pointer-events-none
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-[#010106]
          "
        >

          <div
            className="
              relative
              flex
              items-center
              justify-center
            "
          >

            {/* OUTER PULSE */}

            <div
              className="
                absolute
                h-40
                w-40
                animate-ping
                rounded-full
                border
                border-cyan-400/30
              "
            />

            {/* VIOLET RING */}

            <div
              className="
                absolute
                h-28
                w-28
                rounded-full
                border
                border-violet-400/50
                shadow-[0_0_60px_rgba(34,211,238,0.5)]
              "
            />

            {/* TS */}

            <span
              className="
                relative
                text-4xl
                font-black
                tracking-[0.15em]
                text-white
                drop-shadow-[0_0_25px_rgba(34,211,238,0.9)]
              "
            >
              TS
            </span>

          </div>

        </div>
      )}

    </main>
  );
}