import {
  useRef,
  useEffect,
  useState,
  useCallback,
  Component,
  type ReactNode,
} from "react";
import * as THREE from "three";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { LiveAIAnalysisPanel } from "./LiveAIAnalysisPanel";

/* ─── Types ────────────────────────────────────────────── */

interface DisasterPin {
  lat: number;
  lon: number;
  label: string;
  color: string;
}

/* ─── Constants ────────────────────────────────────────── */

const R = 2; // Earth radius (world units)

const DISASTER_PINS: DisasterPin[] = [
  { lat: 35.68, lon: 139.69, label: "Tokyo", color: "#f97316" },
  { lat: 34.05, lon: -118.24, label: "California", color: "#ef4444" },
  { lat: 14.6, lon: 120.98, label: "Philippines", color: "#f97316" },
  { lat: 17.38, lon: 78.49, label: "Hyderabad", color: "#eab308" },
  { lat: 23.68, lon: 90.35, label: "Bangladesh", color: "#ef4444" },
];

const SATELLITE_ORBITS = [
  { radius: 2.85, speed: 0.42, incl: 0.4, phase: 0 },
  { radius: 3.15, speed: 0.29, incl: -0.6, phase: 2.1 },
  { radius: 2.65, speed: 0.56, incl: 1.1, phase: 1.0 },
  { radius: 3.4, speed: 0.23, incl: 0.2, phase: 3.5 },
  { radius: 2.95, speed: 0.39, incl: -0.85, phase: 5.0 },
  { radius: 3.25, speed: 0.19, incl: 0.7, phase: 4.2 },
];

/* ─── Helpers ──────────────────────────────────────────── */

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
    const c = document.createElement("canvas");
    return !!(
      c.getContext("webgl2") ||
      c.getContext("webgl") ||
      (c.getContext("experimental-webgl") as WebGLRenderingContext | null)
    );
  } catch {
    return false;
  }
}

/** Generate a procedural Earth-like texture using the 2-D Canvas API */
function makeEarthTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size / 2;
  const ctx = canvas.getContext("2d")!;

  // Ocean base
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#0a3060");
  grad.addColorStop(0.5, "#0d4a8a");
  grad.addColorStop(1, "#0a3060");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Rough continents — simplified shapes inspired by real geography
  ctx.fillStyle = "#2d5a1b";
  const continents: [number, number, number, number, number, number][] = [
    // [cx%, cy%, rx%, ry%, rotation, opacity]
    [19, 38, 7, 11, 0.3, 1],   // North America main
    [17, 52, 5, 7, 0.1, 1],    // Central/South America top
    [18, 65, 6, 10, -0.2, 1],  // South America
    [50, 35, 9, 8, 0.2, 1],    // Europe/Russia
    [55, 50, 8, 10, 0.1, 1],   // Africa
    [72, 38, 10, 9, 0.15, 1],  // Asia
    [82, 55, 5, 6, 0.4, 1],    // SE Asia
    [87, 65, 6, 5, -0.1, 1],   // Australia
    [50, 12, 13, 3, 0, 1],     // Arctic landmass rough
  ];

  for (const [cxP, cyP, rxP, ryP, rot, op] of continents) {
    const cx = (cxP / 100) * canvas.width;
    const cy = (cyP / 100) * canvas.height;
    const rx = (rxP / 100) * canvas.width;
    const ry = (ryP / 100) * canvas.height;
    ctx.save();
    ctx.globalAlpha = op;
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    // jagged edge by combining two ellipses
    ctx.fill();
    ctx.fillStyle = "#3a7020";
    ctx.beginPath();
    ctx.ellipse(rx * 0.2, -ry * 0.15, rx * 0.7, ry * 0.7, rot * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#2d5a1b";
  }

  // Desert/arid tones
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#c8a870";
  const deserts: [number, number, number, number][] = [
    [50, 40, 5, 3.5], // Sahara
    [73, 40, 4, 3],   // Middle East
    [87, 55, 3, 2],   // Australian interior
  ];
  for (const [cxP, cyP, rxP, ryP] of deserts) {
    ctx.beginPath();
    ctx.ellipse(
      (cxP / 100) * canvas.width,
      (cyP / 100) * canvas.height,
      (rxP / 100) * canvas.width,
      (ryP / 100) * canvas.height,
      0, 0, Math.PI * 2
    );
    ctx.fill();
  }

  // Polar ice caps
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = "#d8eeff";
  ctx.beginPath();
  ctx.ellipse(canvas.width / 2, 0, canvas.width * 0.55, canvas.height * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(canvas.width / 2, canvas.height, canvas.width * 0.4, canvas.height * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

/** Generate a cloud-layer texture */
function makeCloudTexture(): THREE.CanvasTexture {
  const w = 1024, h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, w, h);

  const rng = (min: number, max: number) => min + Math.random() * (max - min);

  for (let i = 0; i < 120; i++) {
    const x = rng(0, w);
    const y = rng(0, h);
    const rx = rng(20, 90);
    const ry = rng(8, 30);
    const op = rng(0.08, 0.22);
    ctx.globalAlpha = op;
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rng(0, Math.PI), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

/* ─── Error boundary ───────────────────────────────────── */

class EarthErrorBoundary extends Component<
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

/* ─── Vanilla Three.js Globe ───────────────────────────── */

function Globe3D({
  reducedMotion,
}: {
  reducedMotion: boolean;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  // Track mouse on the container
  useEffect(() => {
    const el = mountRef.current?.parentElement;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      mouseRef.current.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseRef.current.ty = ((e.clientY - rect.top) / rect.height - 0.5) * -2;
    };
    const onLeave = () => {
      mouseRef.current.tx = 0;
      mouseRef.current.ty = 0;
    };

    el.addEventListener("mousemove", onMove as EventListener);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove as EventListener);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // ── Renderer ──────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);

    const W = container.clientWidth || 480;
    const H = container.clientHeight || 480;
    renderer.setSize(W, H);
    container.appendChild(renderer.domElement);

    // ── Scene & camera ────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 200);
    camera.position.set(0, 0.5, 7);
    camera.lookAt(0, 0, 0);

    // ── Lights ────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.38));
    const sun = new THREE.DirectionalLight(0xffffff, 1.9);
    sun.position.set(5, 3, 5);
    scene.add(sun);
    const blueLight = new THREE.PointLight(0x1a73e8, 0.5, 30);
    blueLight.position.set(-8, 2, -3);
    scene.add(blueLight);
    const cyanLight = new THREE.PointLight(0x00bcd4, 0.35, 30);
    cyanLight.position.set(0, 6, -4);
    scene.add(cyanLight);

    // ── Earth sphere ──────────────────────────────────────
    const earthTex = makeEarthTexture();
    const earthGeo = new THREE.SphereGeometry(R, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({
      map: earthTex,
      shininess: 18,
      specular: new THREE.Color(0x224466),
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earthMesh);

    // ── Cloud layer ───────────────────────────────────────
    const cloudTex = makeCloudTexture();
    const cloudGeo = new THREE.SphereGeometry(R + 0.025, 48, 48);
    const cloudMat = new THREE.MeshPhongMaterial({
      alphaMap: cloudTex,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      color: 0xffffff,
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    scene.add(cloudMesh);

    // ── Atmosphere shells ─────────────────────────────────
    const makeAtmo = (r: number, color: number, opacity: number) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(r, 32, 32),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity,
          side: THREE.BackSide,
          depthWrite: false,
        }),
      );
      scene.add(mesh);
      return mesh;
    };
    makeAtmo(R + 0.09, 0x1a73e8, 0.1);
    makeAtmo(R + 0.3, 0x00bcd4, 0.06);
    makeAtmo(R + 0.6, 0x0d47a1, 0.028);

    // ── Orbit rings ───────────────────────────────────────
    const ringConfigs = [
      { r: 3.0, color: 0x00bcd4, opacity: 0.28, incl: 0, rotZ: 0.1 },
      { r: 3.5, color: 0x1a73e8, opacity: 0.2, incl: Math.PI / 3, rotZ: -0.07 },
      { r: 2.75, color: 0x4285f4, opacity: 0.17, incl: Math.PI / 5, rotZ: 0.05 },
    ];
    const rings = ringConfigs.map(({ r, color, opacity, incl }) => {
      const geo = new THREE.TorusGeometry(r, 0.005, 8, 160);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = incl;
      mesh.rotation.z = Math.random() * Math.PI;
      scene.add(mesh);
      return { mesh, speed: ringConfigs.indexOf({ r, color, opacity, incl, rotZ: 0 } as typeof ringConfigs[0]) >= 0 ? 0 : 0 };
    });
    const ringSpeeds = [0.1, -0.07, 0.05];

    // ── Satellites ────────────────────────────────────────
    const satellites = SATELLITE_ORBITS.map((orb) => {
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.042, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x00e5ff }),
      );
      const panelGeo = new THREE.BoxGeometry(0.14, 0.022, 0.006);
      const panelMat = new THREE.MeshBasicMaterial({
        color: 0x1a73e8,
        transparent: true,
        opacity: 0.85,
      });
      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.rotation.z = Math.PI / 2;
      body.add(panel);
      scene.add(body);
      return { body, ...orb, t: orb.phase };
    });

    // ── Disaster pins + radar rings ───────────────────────
    interface RadarRing {
      mesh: THREE.Mesh;
      t: number;
      delay: number;
      isAlt: boolean;
    }
    const radarRings: RadarRing[] = [];

    DISASTER_PINS.forEach((pin) => {
      const pos = latLonToVec3(pin.lat, pin.lon, R + 0.05);
      const norm = pos.clone().normalize();

      // small dot at surface
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 8, 8),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(pin.color) }),
      );
      dot.position.copy(pos);
      scene.add(dot);

      // 3 expanding rings per pin
      for (let i = 0; i < 3; i++) {
        const ringGeo = new THREE.RingGeometry(0.07, 0.1, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(i % 2 === 0 ? 0x00bcd4 : pin.color),
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);

        // Orient ring to face outward from globe surface
        ring.position.copy(pos);
        ring.lookAt(pos.clone().add(norm));

        scene.add(ring);
        radarRings.push({ mesh: ring, t: (i * 1.3) % 3.5, delay: i * 1.3, isAlt: i % 2 !== 0 });
      }
    });

    // ── Particle field ────────────────────────────────────
    const particleCount = 240;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const r2 = R + 0.55 + Math.random() * 1.9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r2 * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r2 * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r2 * Math.cos(phi);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMesh = new THREE.Points(
      particleGeo,
      new THREE.PointsMaterial({
        size: 0.028,
        color: 0x4fc3f7,
        transparent: true,
        opacity: 0.55,
        sizeAttenuation: true,
      }),
    );
    scene.add(particleMesh);

    // ── Stars ─────────────────────────────────────────────
    const starCount = 1200;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r2 = 50 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPos[i * 3] = r2 * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r2 * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = r2 * Math.cos(phi);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMesh = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        size: 0.12,
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
        sizeAttenuation: true,
      }),
    );
    scene.add(starMesh);

    // ── Resize handler ────────────────────────────────────
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    // ── Animation loop ────────────────────────────────────
    let rafId = 0;
    let prevTime = performance.now();
    const RADAR_DURATION = 3.5;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - prevTime) / 1000, 0.05);
      prevTime = now;

      if (!reducedMotion) {
        // Earth + clouds rotate
        earthMesh.rotation.y += delta * 0.06;
        cloudMesh.rotation.y += delta * 0.09;

        // Orbit rings
        rings.forEach((r, i) => {
          r.mesh.rotation.z += delta * ringSpeeds[i];
        });

        // Satellites
        satellites.forEach((sat) => {
          sat.t += delta * sat.speed;
          sat.body.position.set(
            Math.cos(sat.t) * sat.radius * Math.cos(sat.incl),
            Math.sin(sat.t) * sat.radius * Math.sin(sat.incl),
            Math.sin(sat.t) * sat.radius * Math.cos(sat.incl),
          );
        });

        // Radar rings
        radarRings.forEach((rr) => {
          rr.t += delta;
          if (rr.t > RADAR_DURATION) rr.t = 0;
          const progress = rr.t / RADAR_DURATION;
          const scale = 1 + progress * 2.8;
          rr.mesh.scale.setScalar(scale);
          (rr.mesh.material as THREE.MeshBasicMaterial).opacity =
            (1 - progress) * 0.5;
        });

        // Particles drift
        particleMesh.rotation.y += delta * 0.014;
        particleMesh.rotation.x += delta * 0.006;

        // Stars slow drift
        starMesh.rotation.y += delta * 0.004;

        // Mouse parallax on camera
        const mouse = mouseRef.current;
        mouse.x += (mouse.tx * 0.65 - mouse.x) * 0.05;
        mouse.y += (mouse.ty * 0.38 - mouse.y) * 0.05;
        camera.position.x = mouse.x;
        camera.position.y = mouse.y + 0.5;
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
    };
    animate();

    // ── Cleanup ───────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      renderer.dispose();
      earthTex.dispose();
      cloudTex.dispose();
      earthGeo.dispose();
      earthMat.dispose();
      cloudGeo.dispose();
      cloudMat.dispose();
      particleGeo.dispose();
      starGeo.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [reducedMotion]);

  return <div ref={mountRef} className="absolute inset-0" />;
}

/* ─── CSS fallback Earth (no WebGL) ───────────────────── */

const CSS_MARKERS = [
  { x: 72, y: 38, label: "Tokyo" },
  { x: 28, y: 42, label: "CA" },
  { x: 85, y: 55, label: "PH" },
  { x: 62, y: 48, label: "IN" },
];

function CSSEarth() {
  return (
    <div
      className="relative mx-auto flex h-[340px] w-full max-w-[420px] items-center justify-center md:h-[440px] md:max-w-[480px]"
      style={{ perspective: "1000px" }}
    >
      <LiveAIAnalysisPanel />
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan/20"
          initial={{ width: 120, height: 120, opacity: 0.6 }}
          animate={{ width: 360, height: 360, opacity: 0 }}
          transition={{ duration: 4, repeat: Infinity, delay: i * 1.3, ease: "easeOut" }}
        />
      ))}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-cyan/15" />
      </motion.div>
      <div className="absolute h-72 w-72 rounded-full bg-gradient-to-br from-primary/40 to-cyan/30 blur-[80px] md:h-96 md:w-96" />
      <div className="relative">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-cyan/30 via-primary/20 to-transparent blur-xl" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="relative h-48 w-48 overflow-hidden rounded-full shadow-[0_0_60px_rgba(26,115,232,0.4)] md:h-60 md:w-60"
            style={{
              background:
                "linear-gradient(135deg, #0d47a1 0%, #1a73e8 20%, #4285f4 40%, #00bcd4 60%, #1a73e8 80%, #0d47a1 100%)",
              backgroundSize: "200% 100%",
            }}
          >
            <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full opacity-50" aria-hidden>
              <ellipse cx="80" cy="70" rx="35" ry="25" fill="#fff" opacity="0.55" />
              <ellipse cx="130" cy="90" rx="28" ry="35" fill="#fff" opacity="0.45" />
              <ellipse cx="60" cy="130" rx="30" ry="20" fill="#fff" opacity="0.35" />
              <ellipse cx="150" cy="140" rx="20" ry="15" fill="#fff" opacity="0.45" />
            </svg>
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent" />
          </motion.div>
          {[0, 120, 240].map((deg, i) => (
            <motion.div
              key={deg}
              className="absolute left-1/2 top-1/2"
              style={{ width: 0, height: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 14 + i * 2, repeat: Infinity, ease: "linear", delay: (deg / 360) * 14 }}
            >
              <div className="absolute" style={{ transform: `translateX(${110 + i * 15}px) translateY(-4px)` }}>
                <div className="h-2.5 w-2.5 rounded-full bg-cyan shadow-[0_0_12px_rgba(0,188,212,0.8)]" />
              </div>
            </motion.div>
          ))}
        </motion.div>
        {CSS_MARKERS.map((m, i) => (
          <motion.div
            key={m.label}
            className="absolute"
            style={{ left: `${m.x}%`, top: `${m.y}%` }}
            animate={{ y: [0, -6, 0], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
          >
            <MapPin className="h-4 w-4 text-cyan-400 drop-shadow-[0_0_6px_rgba(0,188,212,0.8)]" />
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute right-0 top-6 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-cyan-300 backdrop-blur-xl"
      >
        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        Live Monitoring
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 backdrop-blur-xl"
      >
        847 Regions Active
      </motion.div>
    </div>
  );
}

/* ─── Main export ──────────────────────────────────────── */

export function AnimatedEarth() {
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

  // Still detecting — show a placeholder that matches the container size
  if (webglOk === null) {
    return (
      <div className="relative mx-auto flex h-[380px] w-full max-w-[480px] items-center justify-center md:h-[500px] md:max-w-[540px] lg:h-[560px] lg:max-w-[600px]">
        <div className="h-48 w-48 animate-pulse rounded-full bg-primary/20 md:h-64 md:w-64" />
      </div>
    );
  }

  if (!webglOk) {
    return <CSSEarth />;
  }

  return (
    <EarthErrorBoundary fallback={<CSSEarth />}>
      <div
        className="relative mx-auto flex h-[380px] w-full max-w-[480px] items-center justify-center md:h-[500px] md:max-w-[540px] lg:h-[560px] lg:max-w-[600px]"
      >
        <LiveAIAnalysisPanel />
        <Globe3D reducedMotion={reducedMotion} />

        {/* Status chips */}
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
    </EarthErrorBoundary>
  );
}
