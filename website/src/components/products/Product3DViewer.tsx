"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Layers,
  Sparkles,
  Info,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/cn";

export interface Product3DViewerProps {
  category: string;
  name: string;
  modelNumber?: string;
  className?: string;
  height?: string | number;
  autoRotateInit?: boolean;
  showHotspots?: boolean;
  onExpandModal?: () => void;
}

interface Hotspot {
  id: string;
  title: string;
  desc: string;
  pos: [number, number, number];
}

export function Product3DViewer({
  category,
  name,
  modelNumber,
  className,
  height = "460px",
  autoRotateInit = true,
  showHotspots = true,
  onExpandModal,
}: Product3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const initialCamPos = useRef<[number, number, number]>([0, 1.2, 2.8]);

  const [loading, setLoading] = useState(true);
  const [autoRotate, setAutoRotate] = useState(autoRotateInit);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [showHelper, setShowHelper] = useState(true);

  // Generate category-specific hotspots
  const hotspots: Hotspot[] = (() => {
    const cat = category.toLowerCase();
    if (cat.includes("battery")) {
      return [
        { id: "bms", title: "Smart BMS", desc: "Active cell balancing & thermal management", pos: [0.35, 0.1, 0.45] },
        { id: "terminals", title: "Dual Terminals", desc: "High-amp brass positive & negative lugs", pos: [-0.35, 0.15, 0.45] },
        { id: "display", title: "SOC Indicator", desc: "Real-time LED state-of-charge readout", pos: [0, 0.15, 0.52] },
      ];
    }
    if (cat.includes("inverter")) {
      return [
        { id: "heatsink", title: "Anodized Fins", desc: "Fanless silent convection cooling (<35 dB)", pos: [0, 0.25, -0.2] },
        { id: "oled", title: "OLED Interface", desc: "Color system metrics & power flow status", pos: [0, 0.35, 0.22] },
        { id: "switch", title: "DC Isolator", desc: "Integrated safety disconnect switch", pos: [-0.3, -0.3, 0.2] },
      ];
    }
    if (cat.includes("water") || cat.includes("purifier")) {
      return [
        { id: "uv", title: "UV-C Chamber", desc: "99.99% viral & microbial inactivation", pos: [0, 0.2, 0.2] },
        { id: "tank", title: "8L Food-grade Tank", desc: "BPA-free sealed antimicrobial reservoir", pos: [0, -0.1, 0.15] },
      ];
    }
    return [
      { id: "core", title: "Olitec Core Engine", desc: "Precision-engineered industrial grade components", pos: [0, 0.1, 0.2] },
      { id: "enclosure", title: "Rugged Casing", desc: "High-durability impact resistant exterior", pos: [0.25, -0.1, 0.2] },
    ];
  })();

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let isMounted = true;
    let width = container.clientWidth || 600;
    let h = typeof height === "number" ? height : container.clientHeight || 460;

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / h, 0.1, 100);
    camera.position.set(...initialCamPos.current);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.0;
    controls.maxDistance = 5.5;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // Do not go under floor
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.6;
    controlsRef.current = controls;

    // Hide helper banner once user drags
    controls.addEventListener("start", () => {
      setShowHelper(false);
    });

    // 5. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xfff8eb, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.4);
    dirLight1.position.set(3, 4, 3);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    dirLight1.shadow.camera.near = 0.5;
    dirLight1.shadow.camera.far = 10;
    scene.add(dirLight1);

    // Olitec signature brand rim light
    const rimLight = new THREE.DirectionalLight(0xf99f1e, 1.6);
    rimLight.position.set(-3, 2, -3);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xd9ecff, 1.0);
    fillLight.position.set(0, -2, 3);
    scene.add(fillLight);

    // Subtle floor shadow
    const floorGeo = new THREE.PlaneGeometry(6, 6);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.15 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.65;
    floor.receiveShadow = true;
    scene.add(floor);

    // Soft circular shadow plate
    const shadowPlateGeo = new THREE.RingGeometry(0, 1.1, 48);
    const shadowPlateMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
    });
    const shadowPlate = new THREE.Mesh(shadowPlateGeo, shadowPlateMat);
    shadowPlate.rotation.x = -Math.PI / 2;
    shadowPlate.position.y = -0.648;
    scene.add(shadowPlate);

    // 6. Build or Load Model
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    async function loadOrBuildModel() {
      const catLower = category.toLowerCase();

      // If Battery, try loading the converted STEP CAD json model
      if (catLower.includes("battery")) {
        try {
          const res = await fetch("/models/olitec-battery.json");
          if (res.ok) {
            const data = await res.json();
            if (data && data.parts && data.parts.length > 0) {
              const cadGroup = new THREE.Group();
              data.parts.forEach((part: any) => {
                const geom = new THREE.BufferGeometry();
                const positions: number[] = [];
                part.triangles.forEach((tri: number[][]) => {
                  tri.forEach((pt: number[]) => {
                    positions.push(pt[0], pt[1], pt[2]);
                  });
                });
                geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
                geom.computeVertexNormals();

                const col = new THREE.Color(part.color[0], part.color[1], part.color[2]);
                const mat = new THREE.MeshStandardMaterial({
                  color: col,
                  metalness: part.name.includes("Terminal") ? 0.8 : 0.4,
                  roughness: part.name.includes("Front") ? 0.3 : 0.5,
                });
                const mesh = new THREE.Mesh(geom, mat);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                cadGroup.add(mesh);
              });

              // Add realistic details onto the CAD battery model
              addBatteryDetails(cadGroup);
              cadGroup.position.y = -0.2;
              modelGroup.add(cadGroup);
              if (isMounted) setLoading(false);
              return;
            }
          }
        } catch {
          // Fall through to procedural battery builder
        }
        buildProceduralBattery(modelGroup);
      } else if (catLower.includes("inverter")) {
        buildProceduralInverter(modelGroup);
      } else if (catLower.includes("water") || catLower.includes("purifier")) {
        buildProceduralPurifier(modelGroup);
      } else if (catLower.includes("cooler")) {
        buildProceduralCooler(modelGroup);
      } else if (catLower.includes("fan")) {
        buildProceduralFan(modelGroup);
      } else {
        buildProceduralAppliance(modelGroup);
      }

      if (isMounted) setLoading(false);
    }

    loadOrBuildModel();

    // 7. Animation Loop
    function animate() {
      animFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // 8. Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const nw = container.clientWidth;
      const nh = typeof height === "number" ? height : container.clientHeight || 460;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      controls.dispose();
    };
  }, [category, height]);

  // Sync controls autoRotate state
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Wireframe toggle
  useEffect(() => {
    if (!modelGroupRef.current) return;
    modelGroupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => (m.wireframe = wireframe));
        } else {
          child.material.wireframe = wireframe;
        }
      }
    });
  }, [wireframe]);

  // Controls actions
  const resetCamera = useCallback(() => {
    if (!controlsRef.current || !cameraRef.current) return;
    cameraRef.current.position.set(...initialCamPos.current);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  }, []);

  const zoomIn = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.multiplyScalar(0.85);
    controlsRef.current.update();
  }, []);

  const zoomOut = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.multiplyScalar(1.15);
    controlsRef.current.update();
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative overflow-hidden rounded-[25.528px] border border-[#e6e6e6] bg-gradient-to-b from-[#f9fafb] via-white to-[#f4f5f7] select-none",
        isFullscreen && "fixed inset-0 z-50 rounded-none border-none",
        className,
      )}
      style={{ height: isFullscreen ? "100vh" : height }}
    >
      {/* 3D Canvas */}
      <canvas ref={canvasRef} className="block size-full cursor-grab active:cursor-grabbing outline-none" />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm transition-opacity">
          <div className="size-12 rounded-full border-4 border-brand-200 border-t-brand-500 animate-spin" />
          <p className="mt-4 font-sans text-sm font-semibold text-slate-700">Loading 3D Hardware Model...</p>
        </div>
      )}

      {/* Header Info Pill */}
      <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2.5">
        <div className="glass-panel flex items-center gap-2 rounded-full px-3.5 py-1.5 shadow-sm">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-black">Interactive 3D View</span>
          <span className="text-xs text-muted font-medium">· 360° CAD</span>
        </div>
        {modelNumber && (
          <div className="hidden sm:flex glass-panel items-center gap-1.5 rounded-full px-3 py-1.5 shadow-sm">
            <span className="text-xs font-semibold text-brand-600">{modelNumber}</span>
          </div>
        )}
      </div>

      {/* Drag & Zoom Interaction Helper Prompt */}
      {showHelper && !loading && (
        <div className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 z-10 animate-fade-in transition-opacity">
          <div className="glass-panel flex items-center gap-2 rounded-full px-4 py-1.5 shadow-sm text-xs font-medium text-slate-700">
            <Sparkles className="size-3.5 text-brand-500" />
            <span>Drag to rotate · Scroll to zoom · Inspect hardware</span>
          </div>
        </div>
      )}

      {/* Interactive Hotspot Tooltip */}
      {activeHotspot && (
        <div className="absolute bottom-16 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-xs z-20 animate-fade-in rounded-[18px] border border-[#e6e6e6] bg-white/95 p-4 shadow-xl backdrop-blur-md">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-brand-500 shrink-0" />
              <p className="text-sm font-bold text-black">{activeHotspot.title}</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveHotspot(null)}
              className="text-xs font-bold text-muted hover:text-black"
            >
              ✕
            </button>
          </div>
          <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{activeHotspot.desc}</p>
        </div>
      )}

      {/* Floating Toolbar Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 rounded-full border border-white/80 bg-white/90 p-1.5 shadow-[0_8px_24px_rgb(0_0_0/0.08)] backdrop-blur-md">
        {/* Auto Rotate Toggle */}
        <button
          type="button"
          onClick={() => setAutoRotate((prev) => !prev)}
          title={autoRotate ? "Pause auto-rotation" : "Start auto-rotation"}
          className={cn(
            "flex size-9 items-center justify-center rounded-full transition-colors",
            autoRotate ? "bg-brand-50 text-brand-600" : "text-slate-700 hover:bg-slate-100",
          )}
        >
          {autoRotate ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5" />}
        </button>

        {/* Zoom In */}
        <button
          type="button"
          onClick={zoomIn}
          title="Zoom In"
          className="flex size-9 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <ZoomIn className="size-4" />
        </button>

        {/* Zoom Out */}
        <button
          type="button"
          onClick={zoomOut}
          title="Zoom Out"
          className="flex size-9 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <ZoomOut className="size-4" />
        </button>

        {/* Reset Camera */}
        <button
          type="button"
          onClick={resetCamera}
          title="Reset camera view"
          className="flex size-9 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <RotateCcw className="size-4" />
        </button>

        {/* Wireframe toggle */}
        <button
          type="button"
          onClick={() => setWireframe((prev) => !prev)}
          title={wireframe ? "Realistic Shading" : "Wireframe CAD Mode"}
          className={cn(
            "flex size-9 items-center justify-center rounded-full transition-colors",
            wireframe ? "bg-brand-50 text-brand-600" : "text-slate-700 hover:bg-slate-100",
          )}
        >
          <Layers className="size-4" />
        </button>

        <div className="h-4 w-px bg-slate-200" />

        {/* Fullscreen / Modal Toggle */}
        <button
          type="button"
          onClick={() => {
            if (onExpandModal) {
              onExpandModal();
            } else {
              toggleFullscreen();
            }
          }}
          title={onExpandModal ? "Open Full Inspection Modal" : isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          className="flex size-9 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 transition-colors"
        >
          {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        </button>
      </div>

      {/* Top-Right Fullscreen / Modal Trigger Icon */}
      {onExpandModal && !isFullscreen && (
        <button
          type="button"
          onClick={onExpandModal}
          className="glass-panel group absolute right-3.5 top-3.5 z-20 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm transition-all hover:bg-white hover:text-brand-600 hover:scale-105 active:scale-95"
          title="Open full 3D inspection modal"
        >
          <Maximize2 className="size-3.5 text-brand-500 transition-transform group-hover:scale-110" />
          <span className="hidden sm:inline">Full Screen</span>
        </button>
      )}

      {/* Hotspots Quick Switcher Buttons */}
      {showHotspots && (
        <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-1.5">
          {hotspots.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => setActiveHotspot(activeHotspot?.id === h.id ? null : h)}
              className={cn(
                "glass-panel text-xs font-semibold px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-sm",
                activeHotspot?.id === h.id ? "brand-gradient text-black font-bold shadow-md" : "text-slate-700 hover:bg-white",
              )}
            >
              <Info className="size-3 text-brand-600" />
              <span>{h.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ====================================================================
 * Procedural High-Fidelity 3D Hardware Model Builders
 * ==================================================================== */

function addBatteryDetails(group: THREE.Group) {
  // Add illuminated LED bar
  const ledGeo = new THREE.BoxGeometry(0.12, 0.015, 0.01);
  const ledMat = new THREE.MeshBasicMaterial({ color: 0x44ab48 });
  const led = new THREE.Mesh(ledGeo, ledMat);
  led.position.set(0, 0.08, 0.46);
  group.add(led);

  // Olitec front brand plate
  const plateGeo = new THREE.BoxGeometry(0.2, 0.04, 0.005);
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0xf99f1e,
    metalness: 0.3,
    roughness: 0.3,
  });
  const plate = new THREE.Mesh(plateGeo, plateMat);
  plate.position.set(-0.25, 0.08, 0.46);
  group.add(plate);
}

function buildProceduralBattery(group: THREE.Group) {
  const batteryGroup = new THREE.Group();

  // Main chassis (19-inch rack style LFP unit)
  const chassisGeo = new THREE.BoxGeometry(1.4, 0.45, 1.2);
  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x22252a,
    metalness: 0.6,
    roughness: 0.35,
  });
  const chassis = new THREE.Mesh(chassisGeo, chassisMat);
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  batteryGroup.add(chassis);

  // Front Fascia Plate
  const frontGeo = new THREE.BoxGeometry(1.42, 0.43, 0.04);
  const frontMat = new THREE.MeshStandardMaterial({
    color: 0xe5e7eb,
    metalness: 0.2,
    roughness: 0.4,
  });
  const front = new THREE.Mesh(frontGeo, frontMat);
  front.position.set(0, 0, 0.61);
  front.castShadow = true;
  batteryGroup.add(front);

  // Olitec Orange Accent Strip
  const stripGeo = new THREE.BoxGeometry(1.42, 0.03, 0.045);
  const stripMat = new THREE.MeshStandardMaterial({
    color: 0xf99f1e,
    metalness: 0.4,
    roughness: 0.3,
  });
  const strip = new THREE.Mesh(stripGeo, stripMat);
  strip.position.set(0, 0.16, 0.61);
  batteryGroup.add(strip);

  // Positive Terminal (Red)
  const termPosGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.07, 24);
  const termPosMat = new THREE.MeshStandardMaterial({ color: 0xd91b1b, metalness: 0.5, roughness: 0.2 });
  const termPos = new THREE.Mesh(termPosGeo, termPosMat);
  termPos.rotation.x = Math.PI / 2;
  termPos.position.set(-0.45, 0, 0.64);
  batteryGroup.add(termPos);

  // Negative Terminal (Black)
  const termNegGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.07, 24);
  const termNegMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.5, roughness: 0.2 });
  const termNeg = new THREE.Mesh(termNegGeo, termNegMat);
  termNeg.rotation.x = Math.PI / 2;
  termNeg.position.set(-0.3, 0, 0.64);
  batteryGroup.add(termNeg);

  // Digital LCD SOC Display
  const lcdGeo = new THREE.BoxGeometry(0.24, 0.12, 0.01);
  const lcdMat = new THREE.MeshStandardMaterial({ color: 0x0a192f, roughness: 0.1 });
  const lcd = new THREE.Mesh(lcdGeo, lcdMat);
  lcd.position.set(0.1, 0, 0.635);
  batteryGroup.add(lcd);

  // Status LEDs (RUN, ALARM, FAULT)
  [-0.08, -0.04, 0, 0.04, 0.08].forEach((x, i) => {
    const ledGeo = new THREE.CircleGeometry(0.01, 16);
    const ledMat = new THREE.MeshBasicMaterial({ color: i === 4 ? 0xf99f1e : 0x44ab48 });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(x + 0.1, -0.08, 0.638);
    batteryGroup.add(led);
  });

  // Rack handles
  [-0.62, 0.62].forEach((x) => {
    const handleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.26, 16);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x71717a, metalness: 0.8, roughness: 0.2 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(x, 0, 0.67);
    batteryGroup.add(handle);
  });

  batteryGroup.scale.set(0.9, 0.9, 0.9);
  group.add(batteryGroup);
}

function buildProceduralInverter(group: THREE.Group) {
  const invGroup = new THREE.Group();

  // Main Inverter Body (Sleek Wall-mount Chassis)
  const bodyGeo = new THREE.BoxGeometry(0.95, 1.35, 0.32);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.1,
    roughness: 0.3,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  invGroup.add(body);

  // Rear Heat Sink Cooling Fins
  for (let i = -0.55; i <= 0.55; i += 0.07) {
    const finGeo = new THREE.BoxGeometry(0.9, 0.02, 0.08);
    const finMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.4 });
    const fin = new THREE.Mesh(finGeo, finMat);
    fin.position.set(0, i, -0.19);
    invGroup.add(fin);
  }

  // Front Fascia Glass Plate
  const glassGeo = new THREE.BoxGeometry(0.85, 1.25, 0.02);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    metalness: 0.2,
    roughness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.position.set(0, 0, 0.17);
  invGroup.add(glass);

  // Olitec Signature Glowing Halo Ring
  const ringGeo = new THREE.RingGeometry(0.14, 0.17, 48);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xf99f1e,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.set(0, 0.22, 0.185);
  invGroup.add(ring);

  // Center Status Display Screen
  const dispGeo = new THREE.CircleGeometry(0.12, 32);
  const dispMat = new THREE.MeshBasicMaterial({ color: 0x030712 });
  const disp = new THREE.Mesh(dispGeo, dispMat);
  disp.position.set(0, 0.22, 0.186);
  invGroup.add(disp);

  // Olitec Logo Accent
  const logoGeo = new THREE.BoxGeometry(0.24, 0.035, 0.005);
  const logoMat = new THREE.MeshStandardMaterial({ color: 0xf99f1e, metalness: 0.5, roughness: 0.2 });
  const logo = new THREE.Mesh(logoGeo, logoMat);
  logo.position.set(0, -0.25, 0.182);
  invGroup.add(logo);

  // Bottom AC/DC Connection Bay
  const bayGeo = new THREE.BoxGeometry(0.85, 0.15, 0.26);
  const bayMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.4 });
  const bay = new THREE.Mesh(bayGeo, bayMat);
  bay.position.set(0, -0.68, 0);
  invGroup.add(bay);

  // DC Switch Knob
  const knobGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.05, 24);
  const knobMat = new THREE.MeshStandardMaterial({ color: 0xd91b1b, metalness: 0.3, roughness: 0.3 });
  const knob = new THREE.Mesh(knobGeo, knobMat);
  knob.rotation.x = Math.PI / 2;
  knob.position.set(-0.25, -0.68, 0.14);
  invGroup.add(knob);

  invGroup.scale.set(0.9, 0.9, 0.9);
  group.add(invGroup);
}

function buildProceduralPurifier(group: THREE.Group) {
  const pGroup = new THREE.Group();

  // Base / Enclosure
  const bodyGeo = new THREE.CylinderGeometry(0.42, 0.46, 1.15, 36);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.2 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  pGroup.add(body);

  // Transparent Water Tank
  const tankGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.45, 32);
  const tankMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    transmission: 0.85,
    opacity: 1,
    transparent: true,
    roughness: 0.08,
    ior: 1.33,
  });
  const tank = new THREE.Mesh(tankGeo, tankMat);
  tank.position.set(0, 0.12, 0.08);
  pGroup.add(tank);

  // Chrome Water Spout / Faucet
  const spoutGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.16, 16);
  const spoutMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 });
  const spout = new THREE.Mesh(spoutGeo, spoutMat);
  spout.rotation.x = Math.PI / 3;
  spout.position.set(0, -0.22, 0.48);
  pGroup.add(spout);

  // Olitec Brand Trim Band
  const bandGeo = new THREE.CylinderGeometry(0.425, 0.425, 0.04, 36);
  const bandMat = new THREE.MeshStandardMaterial({ color: 0xf99f1e, metalness: 0.4, roughness: 0.3 });
  const band = new THREE.Mesh(bandGeo, bandMat);
  band.position.set(0, -0.15, 0);
  pGroup.add(band);

  pGroup.scale.set(0.85, 0.85, 0.85);
  group.add(pGroup);
}

function buildProceduralCooler(group: THREE.Group) {
  const cGroup = new THREE.Group();

  // Main Cooler Cabinet
  const cabGeo = new THREE.BoxGeometry(0.9, 1.3, 0.75);
  const cabMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.1, roughness: 0.3 });
  const cab = new THREE.Mesh(cabGeo, cabMat);
  cab.castShadow = true;
  cGroup.add(cab);

  // Front Air Grill / Louvers
  for (let y = -0.15; y <= 0.35; y += 0.08) {
    const louverGeo = new THREE.BoxGeometry(0.72, 0.025, 0.04);
    const louverMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.2, roughness: 0.5 });
    const louver = new THREE.Mesh(louverGeo, louverMat);
    louver.position.set(0, y, 0.38);
    cGroup.add(louver);
  }

  // Honeycomb Side Pads
  [-0.46, 0.46].forEach((x) => {
    const padGeo = new THREE.BoxGeometry(0.03, 0.8, 0.5);
    const padMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(x, 0.05, 0);
    cGroup.add(pad);
  });

  // Brand Accent Band
  const bandGeo = new THREE.BoxGeometry(0.92, 0.05, 0.77);
  const bandMat = new THREE.MeshStandardMaterial({ color: 0xf99f1e, metalness: 0.3, roughness: 0.4 });
  const band = new THREE.Mesh(bandGeo, bandMat);
  band.position.set(0, 0.45, 0);
  cGroup.add(band);

  cGroup.scale.set(0.8, 0.8, 0.8);
  group.add(cGroup);
}

function buildProceduralFan(group: THREE.Group) {
  const fGroup = new THREE.Group();

  // Central Motor Hub
  const hubGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.22, 32);
  const hubMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.4, roughness: 0.3 });
  const hub = new THREE.Mesh(hubGeo, hubMat);
  hub.castShadow = true;
  fGroup.add(hub);

  // Olitec Center Gold Emblem
  const capGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.03, 32);
  const capMat = new THREE.MeshStandardMaterial({ color: 0xf99f1e, metalness: 0.7, roughness: 0.2 });
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.y = -0.12;
  fGroup.add(cap);

  // 3 Aerodynamic Blades
  for (let i = 0; i < 3; i++) {
    const angle = (i * 2 * Math.PI) / 3;
    const bladeGeo = new THREE.BoxGeometry(0.16, 0.015, 0.9);
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.3, roughness: 0.4 });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.set(Math.cos(angle) * 0.55, 0.02, Math.sin(angle) * 0.55);
    blade.rotation.y = -angle;
    blade.rotation.x = 0.15; // Pitch angle
    fGroup.add(blade);
  }

  // Downrod & Ceiling Canopy
  const rodGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 16);
  const rodMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, metalness: 0.8, roughness: 0.2 });
  const rod = new THREE.Mesh(rodGeo, rodMat);
  rod.position.y = 0.36;
  fGroup.add(rod);

  fGroup.scale.set(0.9, 0.9, 0.9);
  group.add(fGroup);
}

function buildProceduralAppliance(group: THREE.Group) {
  const aGroup = new THREE.Group();

  // Heavy duty Motor Base
  const baseGeo = new THREE.CylinderGeometry(0.35, 0.44, 0.65, 32);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.3 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = -0.25;
  base.castShadow = true;
  aGroup.add(base);

  // Speed Dial Knob
  const knobGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 24);
  const knobMat = new THREE.MeshStandardMaterial({ color: 0xf99f1e, metalness: 0.6, roughness: 0.2 });
  const knob = new THREE.Mesh(knobGeo, knobMat);
  knob.rotation.x = Math.PI / 2;
  knob.position.set(0, -0.25, 0.4);
  aGroup.add(knob);

  // Stainless Steel Jar
  const jarGeo = new THREE.CylinderGeometry(0.28, 0.22, 0.6, 24);
  const jarMat = new THREE.MeshStandardMaterial({ color: 0xe4e4e7, metalness: 0.9, roughness: 0.15 });
  const jar = new THREE.Mesh(jarGeo, jarMat);
  jar.position.y = 0.35;
  jar.castShadow = true;
  aGroup.add(jar);

  // Jar Handle
  const handleGeo = new THREE.TorusGeometry(0.12, 0.02, 12, 24, Math.PI);
  const handleMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 });
  const handle = new THREE.Mesh(handleGeo, handleMat);
  handle.rotation.z = -Math.PI / 2;
  handle.position.set(0.29, 0.35, 0);
  aGroup.add(handle);

  aGroup.scale.set(0.85, 0.85, 0.85);
  group.add(aGroup);
}
