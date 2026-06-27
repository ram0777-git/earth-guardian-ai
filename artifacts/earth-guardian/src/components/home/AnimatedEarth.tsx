import {
  useRef,
  useEffect,
  useState,
  Component,
  type ReactNode,
} from "react";
import * as THREE from "three";
import { motion } from "framer-motion";
import { Satellite, Activity, Shield, Globe2 } from "lucide-react";
import { LiveAIAnalysisPanel } from "./LiveAIAnalysisPanel";

/* ─── Constants ────────────────────────────────────────── */

const R = 2;

const DISASTER_PINS = [
  { lat: 35.68, lon: 139.69, label: "Tokyo", color: "#f97316" },
  { lat: 34.05, lon: -118.24, label: "California", color: "#ef4444" },
  { lat: 14.6,  lon: 120.98,  label: "Philippines", color: "#f97316" },
  { lat: 17.38, lon: 78.49,   label: "Hyderabad", color: "#eab308" },
  { lat: 23.68, lon: 90.35,   label: "Bangladesh", color: "#ef4444" },
  { lat: 37.57, lon: 126.98,  label: "Seoul", color: "#eab308" },
  { lat: -33.86, lon: 151.21, label: "Sydney", color: "#f97316" },
];

const SATELLITE_ORBITS = [
  { radius: 2.85, speed: 0.42, incl: 0.4,   phase: 0 },
  { radius: 3.15, speed: 0.29, incl: -0.6,  phase: 2.1 },
  { radius: 2.65, speed: 0.56, incl: 1.1,   phase: 1.0 },
  { radius: 3.4,  speed: 0.23, incl: 0.2,   phase: 3.5 },
  { radius: 2.95, speed: 0.39, incl: -0.85, phase: 5.0 },
  { radius: 3.25, speed: 0.19, incl: 0.7,   phase: 4.2 },
];

/* ─── Helpers ──────────────────────────────────────────── */

function latLonToVec3(lat: number, lon: number, r: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch { return false; }
}

/* ─── Texture generators ───────────────────────────────── */

function makeEarthDayTexture(): THREE.CanvasTexture {
  const W = 2048, H = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Deep ocean with depth gradient
  const ocean = ctx.createLinearGradient(0, 0, 0, H);
  ocean.addColorStop(0,   "#071a3d");
  ocean.addColorStop(0.15,"#09266e");
  ocean.addColorStop(0.5, "#0d3b8a");
  ocean.addColorStop(0.85,"#09266e");
  ocean.addColorStop(1,   "#071a3d");
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, W, H);

  // Shallow coastal water rings — subtle lighter edges
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#1a5fc4";
  [
    [19, 38, 9, 13], [17, 52, 6.5, 9], [18, 65, 7.5, 12],
    [50, 35, 11, 10],[55, 50, 10, 12], [72, 38, 12, 11],
    [82, 55, 6.5, 7.5],[87, 65, 7.5, 6.5],
  ].forEach(([cx, cy, rx, ry]) => {
    ctx.beginPath();
    ctx.ellipse((cx/100)*W, (cy/100)*H, (rx/100)*W+14, (ry/100)*H+14, 0, 0, Math.PI*2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Landmass base (green-brown)
  const drawLand = (cx:number, cy:number, rx:number, ry:number, rot:number, fill:string, alpha=1) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = fill;
    ctx.translate((cx/100)*W, (cy/100)*H);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, (rx/100)*W, (ry/100)*H, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  };

  // Primary continents
  const lands: [number,number,number,number,number,string][] = [
    [19,38, 7,11,  0.3, "#2e5e1c"],  // North America
    [16,50, 5, 7,  0.1, "#2e5e1c"],  // Central America
    [17,65, 6,11, -0.2, "#2e5e1c"],  // South America
    [49,33, 9, 9,  0.2, "#3a6b24"],  // Europe/W.Russia
    [62,35,11, 8,  0.1, "#2e5e1c"],  // Russia/Central Asia
    [54,52, 8,11,  0.15,"#2e5e1c"],  // Africa
    [76,37,10, 9,  0.18,"#2e5e1c"],  // Asia
    [83,55, 5, 6,  0.4, "#2e5e1c"],  // SE Asia
    [87,65, 7, 5, -0.1, "#2e5e1c"],  // Australia
    [50,10,14, 4,  0,   "#c8d8e8"],  // Arctic
  ];
  for (const [cx,cy,rx,ry,rot,fill] of lands) drawLand(cx,cy,rx,ry,rot,fill);

  // Highland/mountain overlays (brighter green or brown)
  const highlands: [number,number,number,number,number,string][] = [
    [18,36, 3.5,6,  0.3, "#4a7a30"], // Rockies/Appalachians
    [18,66, 3,5,   -0.1, "#3d6b20"], // Andes
    [49,32, 5,4,    0.3, "#4a8030"], // Alps/Pyrenees
    [76,35, 6,4,    0.2, "#3a6b24"], // Himalayas
    [75,42, 4,3,    0.1, "#4a7a30"], // Tibetan Plateau
  ];
  for (const [cx,cy,rx,ry,rot,fill] of highlands) drawLand(cx,cy,rx,ry,rot,fill,0.8);

  // Deserts
  const deserts: [number,number,number,number,string][] = [
    [52,42, 5,3.5, "#c8a860"],  // Sahara
    [70,38, 4,3,   "#c4a058"],  // Arabia
    [87,57, 3,2,   "#c8aa60"],  // Australian outback
    [20,60, 2.5,2, "#c8a060"],  // Atacama/Patagonia
  ];
  ctx.globalAlpha = 0.5;
  for (const [cx,cy,rx,ry,fill] of deserts) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse((cx/100)*W, (cy/100)*H, (rx/100)*W, (ry/100)*H, 0, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Polar ice
  ctx.globalAlpha = 0.82;
  ctx.fillStyle = "#daeeff";
  ctx.beginPath();
  ctx.ellipse(W/2, 2, W*0.54, H*0.085, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(W/2, H-2, W*0.42, H*0.075, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function makeEarthNightTexture(): THREE.CanvasTexture {
  const W = 2048, H = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#01050e";
  ctx.fillRect(0, 0, W, H);

  // City light clusters: [cx%, cy%, spreadX, spreadY, intensity, dotCount]
  const cities: [number,number,number,number,number,number][] = [
    [19,36, 45,30, 0.92, 80],  // USA East
    [15,35, 30,20, 0.75, 50],  // USA West
    [18,48, 25,18, 0.60, 35],  // Mexico
    [20,62, 30,20, 0.65, 40],  // Brazil
    [49,30, 55,35, 0.95, 90],  // Europe
    [56,33, 35,25, 0.70, 50],  // Middle East
    [59,45, 25,22, 0.65, 40],  // East Africa
    [76,33, 60,35, 0.98, 100], // India/China
    [80,28, 30,22, 0.80, 60],  // Japan/Korea
    [83,54, 28,18, 0.60, 35],  // SE Asia
    [87,64, 20,12, 0.55, 25],  // Australia
    [53,30, 20,15, 0.50, 20],  // North Africa
  ];

  for (const [cxP,cyP,sxP,syP,intensity,dots] of cities) {
    const cx = (cxP/100)*W, cy = (cyP/100)*H;
    const sx = (sxP/1000)*W, sy = (syP/1000)*H;

    // Glow bloom
    const grd = ctx.createRadialGradient(cx,cy,0, cx,cy, sx*1.8);
    grd.addColorStop(0, `rgba(255,200,100,${intensity*0.5})`);
    grd.addColorStop(0.4, `rgba(255,170,50,${intensity*0.25})`);
    grd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(cx, cy, sx*2, sy*2, 0, 0, Math.PI*2);
    ctx.fill();

    // Individual city light dots
    for (let i = 0; i < dots; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random();
      const x = cx + Math.cos(angle) * sx * r;
      const y = cy + Math.sin(angle) * sy * r * 0.6;
      const bright = 0.6 + Math.random() * 0.4;
      ctx.fillStyle = `rgba(255,${180+Math.floor(Math.random()*60)},${60+Math.floor(Math.random()*60)},${intensity*bright})`;
      ctx.beginPath();
      ctx.arc(x, y, 0.6 + Math.random()*1.4, 0, Math.PI*2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

function makeCloudTexture(): THREE.CanvasTexture {
  const W = 2048, H = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, W, H);

  const rng = (a:number,b:number) => a + Math.random()*(b-a);
  // Cloud systems
  for (let i = 0; i < 180; i++) {
    const x = rng(0, W), y = rng(0, H);
    const rx = rng(18, 110), ry = rng(7, 32);
    ctx.save();
    ctx.globalAlpha = rng(0.05, 0.2);
    ctx.fillStyle = "white";
    ctx.translate(x, y);
    ctx.rotate(rng(0, Math.PI));
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI*2);
    ctx.fill();
    // Inner brighter core
    ctx.globalAlpha = rng(0.04, 0.12);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx*0.55, ry*0.6, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

/* ─── GLSL shaders ─────────────────────────────────────── */

const EARTH_VERT = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPos;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewPos = mvPos.xyz;
    gl_Position = projectionMatrix * mvPos;
  }
`;

const EARTH_FRAG = `
  uniform sampler2D dayTex;
  uniform sampler2D nightTex;
  uniform vec3 sunDir;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPos;

  void main() {
    float cosA = dot(vNormal, normalize(sunDir));
    float blend = smoothstep(-0.18, 0.28, cosA);

    vec4 day   = texture2D(dayTex,   vUv);
    vec4 night = texture2D(nightTex, vUv);

    // Slightly brighten the day side specular
    vec3 viewDir = normalize(-vViewPos);
    vec3 halfVec = normalize(normalize(sunDir) + viewDir);
    float spec = pow(max(0.0, dot(vNormal, halfVec)), 32.0) * 0.12;
    day.rgb += vec3(0.3, 0.5, 0.8) * spec;

    vec4 color = mix(night, day, blend);

    // Fresnel atmospheric rim
    float rim = 1.0 - abs(dot(vNormal, viewDir));
    rim = pow(rim, 3.2);
    color.rgb += vec3(0.12, 0.28, 0.65) * rim * 0.9;

    // Soft terminator warm glow
    float term = smoothstep(0.0, 0.6, cosA) * (1.0 - smoothstep(0.4, 0.8, cosA));
    color.rgb += vec3(0.7, 0.28, 0.08) * term * 0.12;

    gl_FragColor = color;
  }
`;

/* ─── Error boundary ───────────────────────────────────── */

class EarthErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() { return this.state.error ? this.props.fallback : this.props.children; }
}

/* ─── Globe3D ──────────────────────────────────────────── */

function Globe3D({ reducedMotion }: { reducedMotion: boolean }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  useEffect(() => {
    const el = mountRef.current?.parentElement;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      mouseRef.current.tx = ((e.clientX - r.left) / r.width  - 0.5) * 2;
      mouseRef.current.ty = ((e.clientY - r.top)  / r.height - 0.5) * -2;
    };
    const onLeave = () => { mouseRef.current.tx = 0; mouseRef.current.ty = 0; };
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

    /* ── Renderer ─────────────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    const W = container.clientWidth || 480;
    const H = container.clientHeight || 480;
    renderer.setSize(W, H);
    container.appendChild(renderer.domElement);

    /* ── Scene & camera ───────────────────────────────── */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 400);
    camera.position.set(0, 0.4, 7.2);
    camera.lookAt(0, 0, 0);

    /* ── Lights ───────────────────────────────────────── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.15));
    const sun = new THREE.DirectionalLight(0xfffbf0, 2.4);
    sun.position.set(5, 2.5, 4);
    scene.add(sun);
    const fill = new THREE.PointLight(0x1a73e8, 0.4, 40);
    fill.position.set(-9, 3, -4);
    scene.add(fill);
    const cyan = new THREE.PointLight(0x00bcd4, 0.25, 35);
    cyan.position.set(2, 7, -3);
    scene.add(cyan);

    /* ── Textures ─────────────────────────────────────── */
    const dayTex   = makeEarthDayTexture();
    const nightTex = makeEarthNightTexture();
    const cloudTex = makeCloudTexture();

    /* ── Earth with day/night shader ──────────────────── */
    const sunDir = new THREE.Vector3(5, 2.5, 4).normalize();
    const earthMat = new THREE.ShaderMaterial({
      uniforms: {
        dayTex:   { value: dayTex },
        nightTex: { value: nightTex },
        sunDir:   { value: sunDir },
      },
      vertexShader:   EARTH_VERT,
      fragmentShader: EARTH_FRAG,
    });
    const earthMesh = new THREE.Mesh(new THREE.SphereGeometry(R, 72, 72), earthMat);
    scene.add(earthMesh);

    /* ── Cloud layer ──────────────────────────────────── */
    const cloudMat = new THREE.MeshPhongMaterial({
      alphaMap: cloudTex,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      color: 0xffffff,
    });
    const cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(R + 0.022, 52, 52), cloudMat);
    scene.add(cloudMesh);

    /* ── Atmosphere shells ────────────────────────────── */
    const mkAtmo = (r: number, color: number, op: number) => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(r, 32, 32),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, side: THREE.BackSide, depthWrite: false }),
      );
      scene.add(m); return m;
    };
    mkAtmo(R + 0.07, 0x3a90ff, 0.11);
    mkAtmo(R + 0.25, 0x00bcd4, 0.065);
    mkAtmo(R + 0.55, 0x0d47a1, 0.032);
    mkAtmo(R + 1.1,  0x081e4a, 0.018);

    /* ── Orbit rings ──────────────────────────────────── */
    const ringDefs = [
      { r: 3.0,  color: 0x00bcd4, op: 0.30, inclX: Math.PI/2,      inclZ: 0.0,  spd:  0.10 },
      { r: 3.55, color: 0x1a73e8, op: 0.22, inclX: Math.PI/3,      inclZ: 0.3,  spd: -0.07 },
      { r: 2.72, color: 0x4285f4, op: 0.18, inclX: Math.PI/5,      inclZ: -0.5, spd:  0.05 },
    ];
    const rings = ringDefs.map(({ r, color, op, inclX, inclZ }) => {
      const m = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.0045, 8, 180),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op }),
      );
      m.rotation.x = inclX;
      m.rotation.z = inclZ;
      scene.add(m);
      return m;
    });
    const ringSpeeds = ringDefs.map(d => d.spd);

    /* ── Satellites ───────────────────────────────────── */
    const satellites = SATELLITE_ORBITS.map(orb => {
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.044, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x00e5ff }),
      );
      // Solar panels
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.024, 0.005),
        new THREE.MeshBasicMaterial({ color: 0x1a73e8, transparent: true, opacity: 0.88 }),
      );
      panel.rotation.z = Math.PI / 2;
      body.add(panel);
      // Tiny glow sphere
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.18 }),
      );
      body.add(glow);
      scene.add(body);
      return { body, ...orb, t: orb.phase };
    });

    /* ── Disaster pins + radar rings ─────────────────── */
    interface RR { mesh: THREE.Mesh; t: number; basePos: THREE.Vector3; }
    const radarRings: RR[] = [];

    DISASTER_PINS.forEach(pin => {
      const pos = latLonToVec3(pin.lat, pin.lon, R + 0.04);
      const norm = pos.clone().normalize();

      // Surface glow dot
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.028, 10, 10),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(pin.color) }),
      );
      dot.position.copy(pos);
      scene.add(dot);

      // 3 expanding radar rings
      for (let i = 0; i < 3; i++) {
        const rg = new THREE.RingGeometry(0.06, 0.09, 32);
        const rm = new THREE.MeshBasicMaterial({
          color: new THREE.Color(i % 2 === 0 ? 0x00bcd4 : pin.color),
          transparent: true, opacity: 0.5,
          side: THREE.DoubleSide, depthWrite: false,
        });
        const ring = new THREE.Mesh(rg, rm);
        ring.position.copy(pos);
        ring.lookAt(pos.clone().add(norm));
        scene.add(ring);
        radarRings.push({ mesh: ring, t: (i * 1.2) % 3.6, basePos: pos.clone() });
      }
    });
    const RADAR_DUR = 3.6;

    /* ── Particles ────────────────────────────────────── */
    const PC = 280;
    const pPos = new Float32Array(PC * 3);
    for (let i = 0; i < PC; i++) {
      const rr = R + 0.5 + Math.random() * 2.0;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      pPos[i*3]   = rr * Math.sin(p) * Math.cos(t);
      pPos[i*3+1] = rr * Math.sin(p) * Math.sin(t);
      pPos[i*3+2] = rr * Math.cos(p);
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const particles = new THREE.Points(pGeo,
      new THREE.PointsMaterial({ size: 0.026, color: 0x4fc3f7, transparent: true, opacity: 0.55, sizeAttenuation: true }),
    );
    scene.add(particles);

    /* ── Stars (multi-layer) ──────────────────────────── */
    const makeStars = (count: number, rMin: number, rMax: number, size: number, color: number, opacity: number) => {
      const sp = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const r = rMin + Math.random() * (rMax - rMin);
        const t = Math.random() * Math.PI * 2;
        const p = Math.acos(2 * Math.random() - 1);
        sp[i*3]   = r * Math.sin(p) * Math.cos(t);
        sp[i*3+1] = r * Math.sin(p) * Math.sin(t);
        sp[i*3+2] = r * Math.cos(p);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(sp, 3));
      const m = new THREE.Points(g, new THREE.PointsMaterial({ size, color, transparent: true, opacity, sizeAttenuation: true }));
      scene.add(m);
      return m;
    };
    const stars1 = makeStars(1600, 55, 90,  0.10, 0xffffff, 0.65);
    const stars2 = makeStars(600,  55, 90,  0.18, 0xffffff, 0.80);
    const starsB = makeStars(120,  60, 80,  0.22, 0xa8d4ff, 0.72); // blue-tinted bright
    const starsW = makeStars(80,   58, 85,  0.26, 0xfff5dc, 0.88); // warm bright

    /* ── Shooting stars ───────────────────────────────── */
    interface ShootingStar {
      line: THREE.Line;
      geo: THREE.BufferGeometry;
      mat: THREE.LineBasicMaterial;
      active: boolean;
      t: number;
      dur: number;
      start: THREE.Vector3;
      end: THREE.Vector3;
      cooldown: number;
      elapsed: number;
    }
    const shootingStars: ShootingStar[] = Array.from({ length: 7 }, (_, i) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
      const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
      const line = new THREE.Line(geo, mat);
      scene.add(line);
      return { line, geo, mat, active: false, t: 0, dur: 0, start: new THREE.Vector3(), end: new THREE.Vector3(), cooldown: 4 + i * 2.5, elapsed: 0 };
    });

    const spawnStar = (s: ShootingStar) => {
      s.active = true; s.t = 0; s.elapsed = 0;
      s.dur = 0.38 + Math.random() * 0.28;
      const r = 50 + Math.random() * 25;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.PI * 0.2) + Math.random() * (Math.PI * 0.6);
      s.start.set(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
      const dir = new THREE.Vector3((Math.random()-0.5)*0.4, -0.35 - Math.random()*0.4, -(0.15 + Math.random()*0.35)).normalize();
      s.end.copy(s.start).addScaledVector(dir, 9 + Math.random() * 5);
      s.cooldown = 8 + Math.random() * 18;
    };

    /* ── Resize ───────────────────────────────────────── */
    const ro = new ResizeObserver(() => {
      const w = container.clientWidth, h = container.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(container);

    /* ── Animation loop ───────────────────────────────── */
    let raf = 0, prev = performance.now();

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;

      if (!reducedMotion) {
        earthMesh.rotation.y  += dt * 0.055;
        cloudMesh.rotation.y  += dt * 0.083;

        rings.forEach((r, i) => { r.rotation.z += dt * ringSpeeds[i]; });

        satellites.forEach(sat => {
          sat.t += dt * sat.speed;
          sat.body.position.set(
            Math.cos(sat.t) * sat.radius * Math.cos(sat.incl),
            Math.sin(sat.t) * sat.radius * Math.sin(sat.incl),
            Math.sin(sat.t) * sat.radius * Math.cos(sat.incl),
          );
        });

        radarRings.forEach(rr => {
          rr.t += dt;
          if (rr.t > RADAR_DUR) rr.t = 0;
          const p = rr.t / RADAR_DUR;
          rr.mesh.scale.setScalar(1 + p * 3.0);
          (rr.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.52;
        });

        particles.rotation.y  += dt * 0.012;
        particles.rotation.x  += dt * 0.005;
        stars1.rotation.y     += dt * 0.003;
        starsB.rotation.y     += dt * 0.0025;

        // Shooting stars
        shootingStars.forEach(s => {
          s.elapsed += dt;
          if (!s.active) {
            if (s.elapsed >= s.cooldown) spawnStar(s);
          } else {
            s.t += dt / s.dur;
            if (s.t >= 1) {
              s.active = false; s.mat.opacity = 0;
            } else {
              s.mat.opacity = Math.sin(s.t * Math.PI) * 0.92;
              const head = new THREE.Vector3().lerpVectors(s.start, s.end, s.t);
              const tail = new THREE.Vector3().lerpVectors(s.start, s.end, Math.max(0, s.t - 0.18));
              const pos = s.geo.attributes.position as THREE.BufferAttribute;
              pos.setXYZ(0, tail.x, tail.y, tail.z);
              pos.setXYZ(1, head.x, head.y, head.z);
              pos.needsUpdate = true;
            }
          }
        });

        // Mouse parallax
        const m = mouseRef.current;
        m.x += (m.tx * 0.7 - m.x) * 0.048;
        m.y += (m.ty * 0.4 - m.y) * 0.048;
        camera.position.x = m.x;
        camera.position.y = m.y + 0.4;
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      [dayTex, nightTex, cloudTex].forEach(t => t.dispose());
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [reducedMotion]);

  return <div ref={mountRef} className="absolute inset-0" />;
}

/* ─── Floating stat chips ──────────────────────────────── */

interface StatChipProps {
  icon: ReactNode;
  value: string;
  label: string;
  color: string;
  delay?: number;
  pulse?: boolean;
  className?: string;
}

function StatChip({ icon, value, label, color, delay = 0, pulse = false, className = "" }: StatChipProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute z-10 ${className}`}
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 4 + delay, repeat: Infinity, ease: "easeInOut" }}
      >
        <div
          className="flex items-center gap-2 rounded-2xl border border-white/12 bg-black/30 px-3 py-2 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
          style={{ boxShadow: `0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.08)` }}
        >
          <div className={`flex h-7 w-7 items-center justify-center rounded-xl`} style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
            <span style={{ color }}>{icon}</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white leading-none">{value}</span>
              {pulse && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
              )}
            </div>
            <div className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.12em]" style={{ color: `${color}bb` }}>{label}</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── CSS fallback Earth ───────────────────────────────── */

function CSSEarth() {
  return (
    <div className="relative mx-auto flex h-[340px] w-full max-w-[420px] items-center justify-center md:h-[440px] md:max-w-[480px]" style={{ perspective: "1000px" }}>
      <LiveAIAnalysisPanel />
      {[0,1,2].map(i => (
        <motion.div key={i}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan/20"
          initial={{ width: 120, height: 120, opacity: 0.6 }}
          animate={{ width: 360, height: 360, opacity: 0 }}
          transition={{ duration: 4, repeat: Infinity, delay: i * 1.3, ease: "easeOut" }}
        />
      ))}
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
            </svg>
          </motion.div>
        </motion.div>
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

  if (webglOk === null) {
    return (
      <div className="relative mx-auto flex h-[380px] w-full max-w-[480px] items-center justify-center md:h-[500px] md:max-w-[540px] lg:h-[560px] lg:max-w-[600px]">
        <div className="h-48 w-48 animate-pulse rounded-full bg-primary/20 md:h-64 md:w-64" />
      </div>
    );
  }

  if (!webglOk) return <CSSEarth />;

  return (
    <EarthErrorBoundary fallback={<CSSEarth />}>
      <div className="relative mx-auto flex h-[380px] w-full max-w-[480px] items-center justify-center md:h-[500px] md:max-w-[540px] lg:h-[560px] lg:max-w-[600px]">

        {/* 3D Canvas */}
        <div className="absolute inset-0">
          <Globe3D reducedMotion={reducedMotion} />
        </div>

        {/* Live AI analysis floating panel */}
        <LiveAIAnalysisPanel />

        {/* Floating glassmorphism stat chips */}
        <StatChip
          icon={<Shield size={13} />}
          value="95%"
          label="AI Accuracy"
          color="#22d3ee"
          delay={1.0}
          className="left-3 top-5 hidden sm:flex"
        />
        <StatChip
          icon={<Globe2 size={13} />}
          value="847"
          label="Regions"
          color="#60a5fa"
          delay={1.15}
          className="bottom-12 left-3 hidden sm:flex"
        />
        <StatChip
          icon={<Satellite size={13} />}
          value="6"
          label="Satellites"
          color="#818cf8"
          delay={1.3}
          className="bottom-12 right-3 hidden lg:flex"
        />
        <StatChip
          icon={<Activity size={13} />}
          value="Live"
          label="Monitoring"
          color="#34d399"
          delay={1.45}
          pulse
          className="right-3 top-5 hidden lg:flex"
        />

        {/* Mobile-only status chip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs font-medium text-cyan-300 backdrop-blur-xl sm:hidden"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          Live
        </motion.div>
      </div>
    </EarthErrorBoundary>
  );
}
