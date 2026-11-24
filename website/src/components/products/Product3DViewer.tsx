"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
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
  simpleGifMode?: boolean;
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
  autoRotateInit = false, // Not animated: stationary front-three-quarter view by default
  showHotspots = true,
  simpleGifMode = false,
}: Product3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const catLower = category.toLowerCase();
  // Canonical camera angle matching the exact 3D CAD model screenshot confirmed by user
  const initialCamPos = useRef<[number, number, number]>(
    catLower.includes("battery")
      ? [0.75, 0.30, 1.55]
      : [-1.22, 0.40, 2.15]
  );

  const [loading, setLoading] = useState(true);
  const [autoRotate, setAutoRotate] = useState(autoRotateInit);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [showHelper, setShowHelper] = useState(true);
  const [webGlError, setWebGlError] = useState(false);

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
    const camera = new THREE.PerspectiveCamera(38, width / h, 0.1, 100);
    camera.position.set(...initialCamPos.current);
    cameraRef.current = camera;

    // 3. Renderer (Protected against WebGL context exhaustion)
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "default",
      });
    } catch (e) {
      console.warn("Could not create WebGL context:", e);
      setWebGlError(true);
      setLoading(false);
      return;
    }

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn("WebGL context lost.");
      setWebGlError(true);
      setLoading(false);
    };
    canvas.addEventListener("webglcontextlost", handleContextLost, false);

    renderer.setSize(width, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.8;
    controls.maxDistance = 6.0;
    controls.minPolarAngle = Math.PI * 0.1;
    controls.maxPolarAngle = Math.PI * 0.9;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = simpleGifMode ? 1.8 : 1.5;
    controls.enableZoom = !simpleGifMode; // Disable zoom in card mode so page scrolls naturally
    controls.enablePan = !simpleGifMode;
    controls.enableRotate = true;
    controlsRef.current = controls;

    // Hide helper banner once user drags
    controls.addEventListener("start", () => {
      setShowHelper(false);
    });

    // 5. Studio Lighting (Front three-quarter balanced studio coverage)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight1.position.set(3, 4, 3);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    scene.add(dirLight1);

    // Front-left key light on the camera side so chassis and front screen are crisp & bright
    const keyCamLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyCamLight.position.set(-2.5, 3.5, 3.5);
    scene.add(keyCamLight);

    // Bottom fill light so rotating underneath is crystal-clear
    const bottomLight = new THREE.DirectionalLight(0xffffff, 1.2);
    bottomLight.position.set(0, -3, 0);
    scene.add(bottomLight);

    // Olitec signature brand rim light
    const rimLight = new THREE.DirectionalLight(0xf99f1e, 1.6);
    rimLight.position.set(-2.5, 3, -3);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xd9ecff, 1.4);
    fillLight.position.set(0, 0, 3.5);
    scene.add(fillLight);

    // 6. Build or Load Model
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    async function loadOrBuildModel() {
      const catLower = category.toLowerCase();
      const nameLower = name.toLowerCase();
      const isThreePhase =
        nameLower.includes("three") ||
        nameLower.includes("3h") ||
        (modelNumber ? modelNumber.toLowerCase().includes("3h") : false);

      if (catLower.includes("battery")) {
        try {
          let res = await fetch("/3d/olitec-battery.json");
          if (!res.ok) {
            res = await fetch("/models/olitec-battery.json");
          }
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
                  metalness: part.name.includes("Terminal") ? 0.8 : 0.35,
                  roughness: part.name.includes("Front") ? 0.25 : 0.45,
                });
                const mesh = new THREE.Mesh(geom, mat);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                cadGroup.add(mesh);
              });

              addBatteryDetails(cadGroup);

              const box = new THREE.Box3().setFromObject(cadGroup);
              const center = box.getCenter(new THREE.Vector3());
              const size = box.getSize(new THREE.Vector3());

              const maxDim = Math.max(size.x, size.y, size.z);
              const targetScale = 1.20 / (maxDim || 1);
              cadGroup.scale.set(targetScale, targetScale, targetScale);

              cadGroup.position.x = -center.x * targetScale;
              cadGroup.position.y = -center.y * targetScale;
              cadGroup.position.z = -center.z * targetScale;

              modelGroup.add(cadGroup);
              if (isMounted) setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.warn("Could not load /models/olitec-battery.json:", err);
        }
        buildProceduralBattery(modelGroup);
      } else if (catLower.includes("inverter")) {
        try {
          const loader = new GLTFLoader();
          let gltf;
          try {
            gltf = await loader.loadAsync("/3d/inverter.glb");
          } catch {
            gltf = await loader.loadAsync("/models/inverter.glb");
          }
          const model = gltf.scene;

          const objectsToRemove: THREE.Object3D[] = [];
          model.traverse((child) => {
            const lowerName = child.name.toLowerCase();
            if (
              lowerName.includes("plane") ||
              lowerName.includes("backdrop") ||
              lowerName.includes("studio") ||
              lowerName.includes("camera") ||
              lowerName.includes("light")
            ) {
              objectsToRemove.push(child);
            }
          });
          objectsToRemove.forEach((obj) => {
            if (obj.parent) obj.parent.remove(obj);
          });

          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());

          const maxDim = Math.max(size.x, size.y, size.z);
          // Scale inverter model cleanly
          const targetScale = 1.25 / (maxDim || 1);
          model.scale.set(targetScale, targetScale, targetScale);

          model.position.x = -center.x * targetScale;
          model.position.y = -center.y * targetScale;
          model.position.z = -center.z * targetScale;

          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach((m) => {
                    m.side = THREE.DoubleSide;
                  });
                } else {
                  child.material.side = THREE.DoubleSide;
                }
              }
            }
          });

          modelGroup.add(model);
          if (isMounted) setLoading(false);
          return;
        } catch (err) {
          console.warn("Could not load /models/inverter.glb:", err);
          buildProceduralInverter(modelGroup, isThreePhase);
        }
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
      const nh = container.clientHeight || (typeof height === "number" ? height : 420);
      if (nw === 0 || nh === 0) return;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh, false);
    };

    window.addEventListener("resize", handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      resizeObserver.disconnect();
      if (controls) controls.dispose();
      // Dispose meshes & materials to prevent memory / context exhaustion
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else if (obj.material) {
            obj.material.dispose();
          }
        }
      });
      if (renderer) {
        try {
          renderer.dispose();
          const gl = renderer.getContext();
          const ext = gl?.getExtension("WEBGL_lose_context");
          if (ext) ext.loseContext();
        } catch {
          // ignore
        }
      }
    };
  }, [category, name, modelNumber, height, simpleGifMode, autoRotate]);

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
        "group relative overflow-hidden select-none flex flex-col",
        simpleGifMode
          ? "h-full w-full flex-1 bg-transparent"
          : "rounded-[25.528px] border border-[#e6e6e6] bg-gradient-to-b from-[#f9fafb] via-white to-[#f4f5f7]",
        isFullscreen && "fixed inset-0 z-50 rounded-none border-none",
        className,
      )}
      style={{ height: isFullscreen ? "100vh" : typeof height === "number" ? `${height}px` : height }}
    >
      {/* 3D Canvas */}
      <canvas ref={canvasRef} className="block size-full flex-1 cursor-grab active:cursor-grabbing outline-none" />

      {/* Fallback image if WebGL context is lost or blocked */}
      {webGlError && (
        <div className="absolute inset-0 flex items-center justify-center p-6 bg-slate-50/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              category.toLowerCase().includes("battery")
                ? "/images/products/lfp-battery.svg"
                : "/images/products/single-phase-inverter.svg"
            }
            alt={name}
            className="max-h-[85%] max-w-[85%] object-contain drop-shadow-[0_16px_28px_rgba(0,0,0,0.14)]"
          />
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm transition-opacity">
          <div className="size-12 rounded-full border-4 border-brand-200 border-t-brand-500 animate-spin" />
          <p className="mt-4 font-sans text-sm font-semibold text-slate-700">Loading 3D Hardware Model...</p>
        </div>
      )}

      {/* Header Info Pill - Hidden in simpleGifMode */}
      {simpleGifMode ? null : (
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
      )}

      {/* Interactive Hotspot Tooltip */}
      {!simpleGifMode && activeHotspot && (
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

      {/* Floating Toolbar Controls - Hidden in simpleGifMode */}
      {!simpleGifMode && (
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

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            className="flex size-9 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
        </div>
      )}

      {/* Hotspots Quick Switcher Buttons */}
      {!simpleGifMode && showHotspots && (
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
 * Procedural High-Fidelity 3D Hardware Model Builders & Helpers
 * ==================================================================== */

function addBatteryDetails(group: THREE.Group) {
  // Add illuminated green LED bar
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

function createInverterTexture(isThreePhase: boolean): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Deep dark display background
  ctx.fillStyle = "#090E1A";
  ctx.fillRect(0, 0, 512, 768);

  // Subtle gloss sheen
  const grad = ctx.createLinearGradient(0, 0, 512, 768);
  grad.addColorStop(0, "rgba(255, 255, 255, 0.09)");
  grad.addColorStop(0.3, "rgba(255, 255, 255, 0.02)");
  grad.addColorStop(0.7, "rgba(0, 0, 0, 0.1)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0.35)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 768);

  // "OLITEC" Brand Text on upper face
  ctx.fillStyle = "#F99F1E";
  ctx.font = "bold 38px 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("OLITEC", 256, 110);

  // Center display circular glow
  const cx = 256;
  const cy = 380;

  // Outer dark circle
  ctx.beginPath();
  ctx.arc(cx, cy, 146, 0, Math.PI * 2);
  ctx.fillStyle = "#04070E";
  ctx.fill();

  // Olitec Signature Glowing Halo Ring
  ctx.beginPath();
  ctx.arc(cx, cy, 124, 0, Math.PI * 2);
  ctx.lineWidth = 22;
  ctx.strokeStyle = "#F99F1E";
  ctx.shadowColor = "#F99F1E";
  ctx.shadowBlur = 28;
  ctx.stroke();

  // Fine inner accent ring
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(cx, cy, 112, 0, Math.PI * 2);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "#FDBA74";
  ctx.stroke();

  // Center dark core
  ctx.beginPath();
  ctx.arc(cx, cy, 110, 0, Math.PI * 2);
  ctx.fillStyle = "#070B14";
  ctx.fill();

  // Status Indicator Dots at bottom of front face
  ctx.shadowBlur = 0;
  const dotCount = isThreePhase ? 5 : 4;
  const startX = isThreePhase ? 128 : 156;
  const step = isThreePhase ? 64 : 66;
  const dotY = 650;

  for (let i = 0; i < dotCount; i++) {
    const x = startX + i * step;
    ctx.beginPath();
    ctx.arc(x, dotY, 12, 0, Math.PI * 2);
    ctx.fillStyle = "#1E293B";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#334155";
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createBatteryTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Clean satin white/light grey faceplate
  ctx.fillStyle = "#F8FAFC";
  ctx.fillRect(0, 0, 1024, 512);

  // Beveled border
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 8;
  ctx.strokeRect(12, 12, 1000, 488);

  // Top-left "OLITEC" Logo
  ctx.fillStyle = "#F99F1E";
  ctx.font = "bold 46px 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("OLITEC", 90, 115);

  // Top-right 5 Segmented Green Battery LEDs
  const ledStartX = 710;
  const ledY = 115;
  const segW = 36;
  const segH = 22;
  const segGap = 14;

  for (let i = 0; i < 5; i++) {
    const x = ledStartX + i * (segW + segGap);
    ctx.beginPath();
    ctx.roundRect(x, ledY - segH / 2, segW, segH, 6);
    ctx.fillStyle = "#22C55E";
    ctx.shadowColor = "#22C55E";
    ctx.shadowBlur = 14;
    ctx.fill();
  }

  // Center Recessed Specification Plate
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.roundRect(80, 255, 864, 130, 18);
  ctx.fillStyle = "#EDF2F7";
  ctx.fill();
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Ratings text
  ctx.fillStyle = "#334155";
  ctx.font = "bold 36px 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("51.2 V   ·   100 Ah   ·   LiFePO₄", 512, 320);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function buildProceduralBattery(group: THREE.Group) {
  const batteryGroup = new THREE.Group();
  const width = 1.48;
  const height = 0.74;
  const depth = 0.80;

  // 1. Main Technical Enclosure Body
  const chassisGeo = new THREE.BoxGeometry(width, height, depth);
  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.65,
    roughness: 0.35,
  });
  const chassis = new THREE.Mesh(chassisGeo, chassisMat);
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  batteryGroup.add(chassis);

  // 2. Front Fascia Plate
  const frontGeo = new THREE.BoxGeometry(width * 0.98, height * 0.96, 0.04);
  const frontMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.15,
    roughness: 0.3,
  });
  const front = new THREE.Mesh(frontGeo, frontMat);
  front.position.set(0, 0, depth / 2 + 0.02);
  front.castShadow = true;
  batteryGroup.add(front);

  // 3. Front Faceplate Graphics Texture
  const faceGeo = new THREE.PlaneGeometry(width * 0.96, height * 0.94);
  const faceTexture = createBatteryTexture();
  const faceMat = new THREE.MeshStandardMaterial({
    map: faceTexture,
    metalness: 0.2,
    roughness: 0.25,
  });
  const faceMesh = new THREE.Mesh(faceGeo, faceMat);
  faceMesh.position.set(0, 0, depth / 2 + 0.042);
  batteryGroup.add(faceMesh);

  // 4. Physical 3D Glowing Green LED segments
  const ledStartX = 0.28;
  const ledY = 0.17;
  for (let i = 0; i < 5; i++) {
    const ledGeo = new THREE.BoxGeometry(0.045, 0.025, 0.015);
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x22c55e,
      emissiveIntensity: 0.6,
      roughness: 0.2,
    });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(ledStartX + i * 0.065, ledY, depth / 2 + 0.048);
    batteryGroup.add(led);
  }

  // 5. Heavy-duty Dual Terminals (Red Positive & Black Negative)
  const termPosGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 24);
  const termPosMat = new THREE.MeshStandardMaterial({ color: 0xd91b1b, metalness: 0.6, roughness: 0.2 });
  const termPos = new THREE.Mesh(termPosGeo, termPosMat);
  termPos.rotation.x = Math.PI / 2;
  termPos.position.set(-0.48, -0.18, depth / 2 + 0.06);
  batteryGroup.add(termPos);

  const termNegGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 24);
  const termNegMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.6, roughness: 0.2 });
  const termNeg = new THREE.Mesh(termNegGeo, termNegMat);
  termNeg.rotation.x = Math.PI / 2;
  termNeg.position.set(-0.34, -0.18, depth / 2 + 0.06);
  batteryGroup.add(termNeg);

  // 6. Left and Right Heavy-Duty Aluminum Rack Handles
  [-width / 2 + 0.04, width / 2 - 0.04].forEach((x) => {
    const handleGeo = new THREE.CylinderGeometry(0.018, 0.018, height * 0.55, 16);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.2 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(x, 0, depth / 2 + 0.09);
    batteryGroup.add(handle);
  });

  // 7. Dark Bottom Support Feet
  [-width * 0.32, width * 0.32].forEach((x) => {
    const footGeo = new THREE.BoxGeometry(0.18, 0.04, 0.12);
    const footMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
    const foot = new THREE.Mesh(footGeo, footMat);
    foot.position.set(x, -height / 2 - 0.02, 0.05);
    batteryGroup.add(foot);
  });

  // Center and scale to fit card viewport perfectly
  batteryGroup.scale.set(0.76, 0.76, 0.76);
  group.add(batteryGroup);
}

function buildProceduralInverter(group: THREE.Group, isThreePhase: boolean = false) {
  const invGroup = new THREE.Group();
  const width = isThreePhase ? 1.10 : 0.94;
  const height = 1.36;
  const depth = isThreePhase ? 0.32 : 0.28;

  // 1. Main Inverter Body (Sleek Wall-mount Chassis with rounded corners)
  const bodyGeo = new THREE.BoxGeometry(width, height, depth);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.12,
    roughness: 0.28,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  invGroup.add(body);

  // 2. Rear Anodized Heat Sink Cooling Fins
  const finCount = isThreePhase ? 12 : 10;
  const finSpacing = (height * 0.8) / finCount;
  const finStartY = -(height * 0.4) + finSpacing / 2;

  for (let i = 0; i < finCount; i++) {
    const finY = finStartY + i * finSpacing;
    const finGeo = new THREE.BoxGeometry(width * 0.94, 0.022, 0.08);
    const finMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.75,
      roughness: 0.35,
    });
    const fin = new THREE.Mesh(finGeo, finMat);
    fin.position.set(0, finY, -depth / 2 - 0.04);
    fin.castShadow = true;
    invGroup.add(fin);
  }

  // 3. Wall mounting bracket
  const bracketGeo = new THREE.BoxGeometry(width * 0.82, 0.06, 0.02);
  const bracketMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
  const bracket = new THREE.Mesh(bracketGeo, bracketMat);
  bracket.position.set(0, height * 0.32, -depth / 2 - 0.08);
  invGroup.add(bracket);

  // 4. Front Fascia Glass Plate with High-Definition Screen Texture
  const screenWidth = width * 0.78;
  const screenHeight = height * 0.75;
  const screenGeo = new THREE.PlaneGeometry(screenWidth, screenHeight);
  const screenTexture = createInverterTexture(isThreePhase);
  const screenMat = new THREE.MeshStandardMaterial({
    map: screenTexture,
    metalness: 0.25,
    roughness: 0.15,
  });
  const screenMesh = new THREE.Mesh(screenGeo, screenMat);
  screenMesh.position.set(0, 0.04, depth / 2 + 0.003);
  invGroup.add(screenMesh);

  // 5. 3D Glowing Halo Ring overlay (adds specular 3D depth over the canvas)
  const ringGeo = new THREE.RingGeometry(0.12, 0.15, 48);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xf99f1e,
    emissive: 0xf99f1e,
    emissiveIntensity: 0.45,
    metalness: 0.3,
    roughness: 0.2,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.set(0, 0.04 - 0.02, depth / 2 + 0.006);
  invGroup.add(ring);

  // 6. Bottom AC/DC Connection Bay
  const bayGeo = new THREE.BoxGeometry(width * 0.88, 0.14, depth * 0.82);
  const bayMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.4 });
  const bay = new THREE.Mesh(bayGeo, bayMat);
  bay.position.set(0, -height / 2 - 0.07, 0);
  bay.castShadow = true;
  invGroup.add(bay);

  // 7. Red DC Disconnect Switch Knob
  const knobGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.05, 24);
  const knobMat = new THREE.MeshStandardMaterial({ color: 0xd91b1b, metalness: 0.4, roughness: 0.3 });
  const knob = new THREE.Mesh(knobGeo, knobMat);
  knob.rotation.x = Math.PI / 2;
  knob.position.set(-width * 0.3, -height / 2 - 0.07, depth * 0.35);
  invGroup.add(knob);

  // Center and scale to fit card viewport perfectly
  invGroup.scale.set(0.76, 0.76, 0.76);
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
