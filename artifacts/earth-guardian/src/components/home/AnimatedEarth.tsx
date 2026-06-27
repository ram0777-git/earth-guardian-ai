import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture, Html, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import {
  useRef,
  useMemo,
  Suspense,
  useCallback,
  useEffect,
  useState,
  Component,
  type ReactNode,
} from "react";
import * as THREE from "three";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { LiveAIAnalysisPanel } from "./LiveAIAnalysisPanel";

/* ─── helpers ─────────────────────────────────────────── */

const EARTH_RADIUS = 2;

const DISASTER_PINS = [
  { lat: 35.68, lon: 139.69, label: "Tokyo", color: "#f97316" },
  { lat: 34.05, lon: -118.24, label: "California", color: "#ef4444" },
  { lat: 14.6, lon: 120.98, label: "Philippines", color: "#f97316" },
  { lat: 17.38, lon: 78.49, label: "Hyderabad", color: "#eab308" },
  { lat: 23.68, lon: 90.35, label: "Bangladesh", color: "#ef4444" },
];

const SATELLITES = [
  { radius: 2.85, speed: 0.42, inclination: 0.4, offset: 0 },
  { radius: 3.15, speed: 0.29, inclination: -0.6, offset: 2.1 },
  { radius: 2.65, speed: 0.56, inclination: 1.1, offset: 1.0 },
  { radius: 3.4, speed: 0.23, inclination: 0.2, offset: 3.5 },
  { radius: 2.95, speed: 0.39, inclination: -0.85, offset: 5.0 },
  { radius: 3.25, speed: 0.19, inclination: 0.7, offset: 4.2 },
];

function latLonToVec3(lat: number, lon: number, r: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

/* ─── Error boundary ──────────────────────────────────── */

class CanvasErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? this.props.fallback : this.props.children;
  }
}

/* ─── 3-D sub-components ──────────────────────────────── */

function EarthMesh({ reducedMotion }: { reducedMotion: boolean }) {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);

  const [earthTexture, cloudTexture] = useTexture([
    "https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg",
    "https://unpkg.com/three-globe@2.31.1/example/img/clouds.png",
  ]);

  useFrame((_, delta) => {
    if (reducedMotion) return;
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.06;
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.09;
  });

  return (
    <group>
      {/* Earth sphere */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshPhongMaterial
          map={earthTexture}
          shininess={22}
          specular={new THREE.Color(0x224466)}
        />
      </mesh>

      {/* Cloud layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[EARTH_RADIUS + 0.025, 48, 48]} />
        <meshPhongMaterial
          map={cloudTexture}
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>

      {/* Atmosphere layers */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS + 0.09, 32, 32]} />
        <meshBasicMaterial color={0x1a73e8} transparent opacity={0.09} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS + 0.3, 32, 32]} />
        <meshBasicMaterial color={0x00bcd4} transparent opacity={0.055} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS + 0.58, 32, 32]} />
        <meshBasicMaterial color={0x0d47a1} transparent opacity={0.025} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

function OrbitRings({ reducedMotion }: { reducedMotion: boolean }) {
  const r1 = useRef<THREE.Group>(null);
  const r2 = useRef<THREE.Group>(null);
  const r3 = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (reducedMotion) return;
    if (r1.current) r1.current.rotation.z += delta * 0.1;
    if (r2.current) r2.current.rotation.z -= delta * 0.07;
    if (r3.current) r3.current.rotation.z += delta * 0.05;
  });

  const ringMesh = (radius: number, color: number, opacity: number) => (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.005, 8, 160]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );

  return (
    <>
      <group ref={r1} rotation={[Math.PI / 2, 0, 0]}>{ringMesh(3.0, 0x00bcd4, 0.25)}</group>
      <group ref={r2} rotation={[Math.PI / 3, 0.3, 0]}>{ringMesh(3.5, 0x1a73e8, 0.18)}</group>
      <group ref={r3} rotation={[Math.PI / 5, -0.5, 0]}>{ringMesh(2.75, 0x4285f4, 0.15)}</group>
    </>
  );
}

function Satellite({
  radius, speed, inclination, offset, reducedMotion,
}: {
  radius: number; speed: number; inclination: number; offset: number; reducedMotion: boolean;
}) {
  const g = useRef<THREE.Group>(null);
  const t = useRef(offset);

  useFrame((_, delta) => {
    if (reducedMotion) return;
    t.current += delta * speed;
    if (g.current) {
      g.current.position.set(
        Math.cos(t.current) * radius * Math.cos(inclination),
        Math.sin(t.current) * radius * Math.sin(inclination),
        Math.sin(t.current) * radius * Math.cos(inclination),
      );
    }
  });

  return (
    <group ref={g}>
      <mesh>
        <sphereGeometry args={[0.042, 8, 8]} />
        <meshBasicMaterial color={0x00e5ff} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.14, 0.022, 0.006]} />
        <meshBasicMaterial color={0x1a73e8} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

function RadarPulse({ position, reducedMotion }: { position: THREE.Vector3; reducedMotion: boolean }) {
  const rings = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)];
  const timers = useRef([0, 1.3, 2.6]);
  const DURATION = 3.5;

  useFrame((_, delta) => {
    if (reducedMotion) return;
    rings.forEach((ring, i) => {
      timers.current[i] += delta;
      if (timers.current[i] > DURATION) timers.current[i] = 0;
      const t = timers.current[i] / DURATION;
      if (ring.current) {
        ring.current.scale.setScalar(1 + t * 2.8);
        (ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.5;
      }
    });
  });

  return (
    <group position={position}>
      {rings.map((ring, i) => (
        <mesh key={i} ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.07, 0.1, 32]} />
          <meshBasicMaterial
            color={i % 2 === 0 ? 0x00bcd4 : 0xef4444}
            transparent opacity={0.4}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function DisasterPins({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      {DISASTER_PINS.map((pin) => {
        const pos = latLonToVec3(pin.lat, pin.lon, EARTH_RADIUS + 0.05);
        const norm = pos.clone().normalize();
        return (
          <group key={pin.label} position={pos}>
            <RadarPulse position={new THREE.Vector3(0, 0, 0)} reducedMotion={reducedMotion} />
            <Html
              center
              distanceFactor={8}
              style={{ pointerEvents: "none" }}
              position={norm.clone().multiplyScalar(0.28).toArray()}
            >
              <div style={{
                background: "rgba(0,0,0,0.62)",
                border: `1px solid ${pin.color}`,
                borderRadius: 5,
                padding: "2px 6px",
                fontSize: 9,
                color: pin.color,
                whiteSpace: "nowrap",
                backdropFilter: "blur(4px)",
                boxShadow: `0 0 8px ${pin.color}66`,
                fontFamily: "Roboto, sans-serif",
                fontWeight: 600,
              }}>
                ▲ {pin.label}
              </div>
            </Html>
          </group>
        );
      })}
    </>
  );
}

function ParticleField({ reducedMotion }: { reducedMotion: boolean }) {
  const pts = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const count = 240;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = EARTH_RADIUS + 0.55 + Math.random() * 1.9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (reducedMotion) return;
    if (pts.current) {
      pts.current.rotation.y += delta * 0.014;
      pts.current.rotation.x += delta * 0.006;
    }
  });

  return (
    <points ref={pts}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.027} color={0x4fc3f7} transparent opacity={0.55} sizeAttenuation />
    </points>
  );
}

function CameraRig({
  mouseX, mouseY, reducedMotion,
}: {
  mouseX: React.MutableRefObject<number>;
  mouseY: React.MutableRefObject<number>;
  reducedMotion: boolean;
}) {
  const { camera } = useThree();
  const tx = useRef(0);
  const ty = useRef(0);

  useFrame(() => {
    if (reducedMotion) return;
    tx.current += (mouseX.current * 0.65 - tx.current) * 0.05;
    ty.current += (mouseY.current * 0.38 - ty.current) * 0.05;
    camera.position.x = tx.current;
    camera.position.y = ty.current + 0.5;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

function SceneContent({ mouseX, mouseY, reducedMotion }: {
  mouseX: React.MutableRefObject<number>;
  mouseY: React.MutableRefObject<number>;
  reducedMotion: boolean;
}) {
  return (
    <>
      <CameraRig mouseX={mouseX} mouseY={mouseY} reducedMotion={reducedMotion} />

      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 3, 5]} intensity={1.8} />
      <pointLight position={[-8, 2, -3]} intensity={0.4} color={0x1a73e8} />
      <pointLight position={[0, 6, -4]} intensity={0.3} color={0x00bcd4} />

      <Suspense fallback={null}>
        <EarthMesh reducedMotion={reducedMotion} />
      </Suspense>

      <OrbitRings reducedMotion={reducedMotion} />

      {SATELLITES.map((sat, i) => (
        <Satellite key={i} {...sat} reducedMotion={reducedMotion} />
      ))}

      <DisasterPins reducedMotion={reducedMotion} />
      <ParticleField reducedMotion={reducedMotion} />

      <Stars radius={65} depth={30} count={1200} factor={3} saturation={0} fade speed={reducedMotion ? 0 : 0.3} />

      <EffectComposer>
        <Bloom intensity={0.6} luminanceThreshold={0.18} luminanceSmoothing={0.9} mipmapBlur />
      </EffectComposer>
    </>
  );
}

/* ─── CSS fallback Earth (original design) ───────────── */

const CSS_MARKERS = [
  { x: 72, y: 38, label: "Tokyo" },
  { x: 28, y: 42, label: "CA" },
  { x: 85, y: 55, label: "PH" },
  { x: 62, y: 48, label: "IN" },
];

function CSSEarth() {
  return (
    <div className="relative mx-auto flex h-[340px] w-full max-w-[420px] items-center justify-center md:h-[440px] md:max-w-[480px]" style={{ perspective: "1000px" }}>
      <LiveAIAnalysisPanel />
      {[0, 1, 2].map((i) => (
        <motion.div key={i} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan/20"
          initial={{ width: 120, height: 120, opacity: 0.6 }}
          animate={{ width: 360, height: 360, opacity: 0 }}
          transition={{ duration: 4, repeat: Infinity, delay: i * 1.3, ease: "easeOut" }} />
      ))}
      <motion.div className="absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}>
        <div className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-cyan/15" />
      </motion.div>
      <div className="absolute h-72 w-72 rounded-full bg-gradient-to-br from-primary/40 to-cyan/30 blur-[80px] md:h-96 md:w-96" />
      <div className="relative">
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="relative">
          <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-cyan/30 via-primary/20 to-transparent blur-xl" />
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="relative h-48 w-48 overflow-hidden rounded-full shadow-[0_0_60px_rgba(26,115,232,0.4)] md:h-60 md:w-60"
            style={{ background: "linear-gradient(135deg, #0d47a1 0%, #1a73e8 20%, #4285f4 40%, #00bcd4 60%, #1a73e8 80%, #0d47a1 100%)", backgroundSize: "200% 100%" }}>
            <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full opacity-50" aria-hidden>
              <ellipse cx="80" cy="70" rx="35" ry="25" fill="#fff" opacity="0.55" />
              <ellipse cx="130" cy="90" rx="28" ry="35" fill="#fff" opacity="0.45" />
              <ellipse cx="60" cy="130" rx="30" ry="20" fill="#fff" opacity="0.35" />
              <ellipse cx="150" cy="140" rx="20" ry="15" fill="#fff" opacity="0.45" />
            </svg>
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent" />
          </motion.div>
          {[0, 120, 240].map((deg, i) => (
            <motion.div key={deg} className="absolute left-1/2 top-1/2" style={{ width: 0, height: 0 }}
              animate={{ rotate: 360 }} transition={{ duration: 14 + i * 2, repeat: Infinity, ease: "linear", delay: (deg / 360) * 14 }}>
              <div className="absolute" style={{ transform: `translateX(${110 + i * 15}px) translateY(-4px)` }}>
                <div className="h-2.5 w-2.5 rounded-full bg-cyan shadow-[0_0_12px_rgba(0,188,212,0.8)]" />
              </div>
            </motion.div>
          ))}
        </motion.div>
        {CSS_MARKERS.map((m, i) => (
          <motion.div key={m.label} className="absolute" style={{ left: `${m.x}%`, top: `${m.y}%` }}
            animate={{ y: [0, -6, 0], opacity: [0.7, 1, 0.7] }} transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}>
            <MapPin className="h-4 w-4 text-cyan-400 drop-shadow-[0_0_6px_rgba(0,188,212,0.8)]" />
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        className="absolute right-0 top-6 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-cyan-300 backdrop-blur-xl">
        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />Live Monitoring
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 backdrop-blur-xl">
        847 Regions Active
      </motion.div>
    </div>
  );
}

/* ─── Main export ─────────────────────────────────────── */

export function AnimatedEarth() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const [webglOk, setWebglOk] = useState<boolean | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setWebglOk(hasWebGL());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.current = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseY.current = ((e.clientY - rect.top) / rect.height - 0.5) * -2;
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseX.current = 0;
    mouseY.current = 0;
  }, []);

  // Render CSS fallback while detecting, or if WebGL unavailable
  if (webglOk === null || webglOk === false) {
    return <CSSEarth />;
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative mx-auto flex h-[380px] w-full max-w-[480px] items-center justify-center md:h-[500px] md:max-w-[540px] lg:h-[560px] lg:max-w-[600px]"
    >
      <LiveAIAnalysisPanel />

      <div className="absolute inset-0">
        <CanvasErrorBoundary fallback={<CSSEarth />}>
          <Canvas
            camera={{ position: [0, 0.5, 7], fov: 42 }}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
            dpr={[1, 1.5]}
            performance={{ min: 0.5 }}
            style={{ width: "100%", height: "100%", background: "transparent" }}
          >
            <Suspense fallback={null}>
              <SceneContent mouseX={mouseX} mouseY={mouseY} reducedMotion={reducedMotion} />
            </Suspense>
          </Canvas>
        </CanvasErrorBoundary>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute right-0 top-6 z-10 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-cyan-300 backdrop-blur-xl"
      >
        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        Live Monitoring
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-0 z-10 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 backdrop-blur-xl"
      >
        847 Regions Active
      </motion.div>
    </div>
  );
}
