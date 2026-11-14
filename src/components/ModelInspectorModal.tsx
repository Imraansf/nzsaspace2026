import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Artifact } from '../types/space';
import {
  X,
  RotateCw,
  Eye,
  Layers,
  Cpu,
  Compass,
  Maximize2,
  Sparkles,
  Zap,
  Weight,
  Ruler,
  Radio,
  ChevronRight,
  ShieldAlert,
  ExternalLink,
  Download,
  CheckCircle,
} from 'lucide-react';
import { playTelemetryBeep, playSuccessChime } from '../utils/audio';

export type ShaderVisualMode = 'operational' | 'dust' | 'wireframe';

export interface ModelInspectorModalProps {
  artifact: Artifact | null;
  onClose: () => void;
}

export const ModelInspectorModal: React.FC<ModelInspectorModalProps> = ({
  artifact,
  onClose,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const materialsMapRef = useRef<Map<string, { baseMat: THREE.Material; originalProps: any }>>(
    new Map()
  );

  const [visualMode, setVisualMode] = useState<ShaderVisualMode>('operational');
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [activeSubsystem, setActiveSubsystem] = useState<string | null>(null);
  const [isLoadingGltf, setIsLoadingGltf] = useState(false);
  const [loadedGltfSuccess, setLoadedGltfSuccess] = useState(false);

  // Mouse orbit state
  const orbitState = useRef({
    isDragging: false,
    previousMousePosition: { x: 0, y: 0 },
    rotationX: 0.25,
    rotationY: -0.6,
    distance: 5.5,
  });

  // Calculate technical specs
  const specs = useMemo(() => {
    if (!artifact) return null;

    const isRover = artifact.category === 'rover';
    const isLander = artifact.category === 'uncrewed_lander';
    const isApollo = artifact.category === 'apollo_crewed';
    const isProbe =
      artifact.category === 'interstellar_probe' ||
      artifact.category === 'space_telescope' ||
      artifact.category === 'planetary_orbiter';

    let dimensions = '1.8m × 1.5m × 1.2m';
    let powerSource = 'Multi-Junction Solar Array (GaAs/Ge)';
    let mass = artifact.massKg ? `${artifact.massKg.toLocaleString()} kg` : '185 kg';

    if (isRover) {
      dimensions =
        artifact.id.includes('opportunity')
          ? '1.6m (L) × 2.3m (W) × 1.5m (H)'
          : artifact.id.includes('ingenuity')
          ? '1.2m Rotor Span × 0.49m (H)'
          : '0.65m (L) × 0.48m (W) × 0.30m (H)';
      powerSource =
        artifact.id.includes('opportunity') ||
        artifact.id.includes('pathfinder') ||
        artifact.id.includes('ingenuity')
          ? 'Solar Photovoltaics + Rechargeable Batteries'
          : 'Radioisotope Power System';
      mass = artifact.massKg ? `${artifact.massKg} kg` : '185 kg';
    } else if (isApollo) {
      dimensions = '4.3m (H) × 9.4m (Diagonal Footpad Span)';
      powerSource = 'Ag-Zn Secondary Storage Batteries (28V DC, 1600 Ah)';
      mass = artifact.massKg ? `${artifact.massKg} kg` : '2,034 kg (Descent dry)';
    } else if (isProbe) {
      dimensions = '2.74m Dish Dia · Deep Space Bus';
      powerSource =
        artifact.id.includes('pioneer')
          ? '2× SNAP-19 Plutonium-238 RTGs'
          : 'Solar Array + Xenon / Hydrazine Propulsion';
      mass = artifact.massKg ? `${artifact.massKg} kg` : '258 kg';
    } else if (isLander) {
      dimensions = '2.4m (Span) × 1.5m (H)';
      powerSource =
        artifact.id.includes('viking')
          ? '2× SNAP-19 Plutonium-238 RTGs'
          : 'Twin Solar Arrays';
      mass = artifact.massKg ? `${artifact.massKg} kg` : '350 kg';
    }

    return {
      dimensions,
      powerSource,
      mass,
      agency: artifact.agency,
      mission: artifact.mission,
      location: artifact.locationName,
      status: artifact.statusLabel,
      components: artifact.keyComponents?.length
        ? artifact.keyComponents
        : ['High-Gain Parabolic Telemetry Antenna', 'Science Instrument Array', 'Avionics Bus'],
    };
  }, [artifact]);

  // 1. Initialize Three.js Scene, Camera, Renderer, and Procedural CAD Model
  useEffect(() => {
    if (!artifact || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // SCENE
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // CAMERA
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.5, orbitState.current.distance);
    cameraRef.current = camera;

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // LIGHTING (Space Environment)
    // 1. Direct Harsh Space Sunlight
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.8);
    sunLight.position.set(6, 9, 7);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // 2. Ambient Planetary Surface Reflection (Mars reddish or Lunar grey)
    const bounceColor = artifact.body === 'mars' ? 0x6e2814 : 0x1e2638;
    const groundBounceLight = new THREE.DirectionalLight(bounceColor, 1.2);
    groundBounceLight.position.set(-5, -6, -4);
    scene.add(groundBounceLight);

    // 3. Ambient Starfield Low Fill
    const hemiLight = new THREE.HemisphereLight(0x0f172a, bounceColor, 0.65);
    scene.add(hemiLight);

    // 4. Zone Accent Rim Light
    const rimPoint = new THREE.PointLight(
      artifact.body === 'mars' ? 0xd97706 : 0x38bdf8,
      1.8,
      20
    );
    rimPoint.position.set(-4, 3, -4);
    scene.add(rimPoint);

    // BUILD PROCEDURAL CAD HARDWARE MESH
    const modelGroup = new THREE.Group();
    modelGroupRef.current = modelGroup;
    materialsMapRef.current.clear();

    // Helper to register mesh materials for shader visual mode switching
    const registerMaterial = (mesh: THREE.Mesh, baseMat: THREE.Material) => {
      const stdMat = baseMat as THREE.MeshStandardMaterial;
      materialsMapRef.current.set(mesh.uuid, {
        baseMat,
        originalProps: {
          color: stdMat.color ? stdMat.color.clone() : new THREE.Color(0xcccccc),
          metalness: stdMat.metalness ?? 0.5,
          roughness: stdMat.roughness ?? 0.5,
          wireframe: (baseMat as any).wireframe ?? false,
          emissive: stdMat.emissive ? stdMat.emissive.clone() : new THREE.Color(0x000000),
        },
      });
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    };

    // Material Library
    const goldKaptonMat = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      metalness: 0.9,
      roughness: 0.22,
    });
    const silverAluminumMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.85,
      roughness: 0.35,
    });
    const darkSolarCellMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.95,
      roughness: 0.15,
    });
    const blackCompositeMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.4,
      roughness: 0.7,
    });
    const copperAntennaMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      metalness: 0.88,
      roughness: 0.3,
    });
    const lensCyanMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x0284c7,
      emissiveIntensity: 0.3,
    });

    // 1. Circular Starfield Platform / Telemetry Grid & Surface Regolith Plane
    const gridGeo = new THREE.RingGeometry(2.8, 2.85, 64);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3,
    });
    const gridMesh = new THREE.Mesh(gridGeo, gridMat);
    gridMesh.rotation.x = Math.PI / 2;
    gridMesh.position.y = -1.2;
    modelGroup.add(gridMesh);

    // Planetary Surface Regolith Ground Stage
    const groundCanvas = document.createElement('canvas');
    groundCanvas.width = 512;
    groundCanvas.height = 512;
    const gctx = groundCanvas.getContext('2d');
    if (gctx) {
      const isMars = artifact.body === 'mars';
      const bg = gctx.createRadialGradient(256, 256, 10, 256, 256, 256);
      if (isMars) {
        bg.addColorStop(0, '#7c2d12');
        bg.addColorStop(0.5, '#451a03');
        bg.addColorStop(1, '#1c1917');
      } else {
        bg.addColorStop(0, '#3f3f46');
        bg.addColorStop(0.5, '#27272a');
        bg.addColorStop(1, '#09090b');
      }
      gctx.fillStyle = bg;
      gctx.fillRect(0, 0, 512, 512);

      for (let i = 0; i < 1800; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = Math.random() * 2 + 0.5;
        const alpha = Math.random() * 0.3;
        gctx.fillStyle = isMars ? `rgba(217, 119, 6, ${alpha})` : `rgba(228, 228, 231, ${alpha})`;
        gctx.beginPath();
        gctx.arc(x, y, r, 0, Math.PI * 2);
        gctx.fill();
      }
    }
    const groundTexture = new THREE.CanvasTexture(groundCanvas);
    groundTexture.colorSpace = THREE.SRGBColorSpace;
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(2, 2);

    const groundGeo = new THREE.CylinderGeometry(4.2, 4.5, 0.08, 48);
    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTexture,
      roughness: 0.95,
      metalness: 0.05,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.y = -1.24;
    groundMesh.receiveShadow = true;
    modelGroup.add(groundMesh);

    // Procedural Assembly based on Artifact Category
    const category = artifact.category;

    if (category === 'rover') {
      // --- MARS ROVER (Opportunity / Curiosity / Sojourner archetype) ---
      // 1. Warm Electronics Box (WEB)
      const bodyGeo = new THREE.BoxGeometry(1.6, 0.7, 1.2);
      const bodyMesh = new THREE.Mesh(bodyGeo, goldKaptonMat);
      registerMaterial(bodyMesh, goldKaptonMat);
      bodyMesh.position.y = -0.2;
      modelGroup.add(bodyMesh);

      // 2. Solar Array Wings
      const wingGeo = new THREE.BoxGeometry(2.4, 0.05, 1.6);
      const wingMesh = new THREE.Mesh(wingGeo, darkSolarCellMat);
      registerMaterial(wingMesh, darkSolarCellMat);
      wingMesh.position.set(0, 0.2, 0);
      modelGroup.add(wingMesh);

      // Solar Panel Cell Dividers (Accent line)
      const dividerGeo = new THREE.BoxGeometry(2.42, 0.06, 0.04);
      const dividerMesh = new THREE.Mesh(dividerGeo, silverAluminumMat);
      registerMaterial(dividerMesh, silverAluminumMat);
      dividerMesh.position.set(0, 0.21, 0);
      modelGroup.add(dividerMesh);

      // 3. Pancam / Navcam Mast
      const mastPoleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.3, 16);
      const mastPole = new THREE.Mesh(mastPoleGeo, silverAluminumMat);
      registerMaterial(mastPole, silverAluminumMat);
      mastPole.position.set(0.4, 0.85, 0.35);
      modelGroup.add(mastPole);

      // Mast Head (Pancam stereo eyes)
      const mastHeadGeo = new THREE.BoxGeometry(0.35, 0.15, 0.2);
      const mastHead = new THREE.Mesh(mastHeadGeo, blackCompositeMat);
      registerMaterial(mastHead, blackCompositeMat);
      mastHead.position.set(0.4, 1.5, 0.35);
      modelGroup.add(mastHead);

      const eyeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.08, 16);
      const leftEye = new THREE.Mesh(eyeGeo, lensCyanMat);
      leftEye.rotation.x = Math.PI / 2;
      leftEye.position.set(0.3, 1.5, 0.45);
      const rightEye = leftEye.clone();
      rightEye.position.set(0.5, 1.5, 0.45);
      modelGroup.add(leftEye, rightEye);

      // 4. High-Gain Dish Antenna
      const dishGeo = new THREE.SphereGeometry(0.35, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.4);
      const dishMesh = new THREE.Mesh(dishGeo, silverAluminumMat);
      registerMaterial(dishMesh, silverAluminumMat);
      dishMesh.rotation.x = -Math.PI / 4;
      dishMesh.position.set(-0.5, 0.55, -0.3);
      modelGroup.add(dishMesh);

      const dishHornGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8);
      const dishHorn = new THREE.Mesh(dishHornGeo, copperAntennaMat);
      registerMaterial(dishHorn, copperAntennaMat);
      dishHorn.position.set(-0.5, 0.65, -0.2);
      modelGroup.add(dishHorn);

      // 5. Rocker-Bogie Suspension & 6 Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.15, 20);
      const wheelPositions = [
        [-0.9, -0.85, 0.7],
        [0.0, -0.85, 0.75],
        [0.9, -0.85, 0.7],
        [-0.9, -0.85, -0.7],
        [0.0, -0.85, -0.75],
        [0.9, -0.85, -0.7],
      ];

      wheelPositions.forEach((pos) => {
        const wheel = new THREE.Mesh(wheelGeo, blackCompositeMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(pos[0], pos[1], pos[2]);
        registerMaterial(wheel, blackCompositeMat);
        modelGroup.add(wheel);

        // Suspension strut connecting to chassis
        const strutGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.65, 8);
        const strut = new THREE.Mesh(strutGeo, silverAluminumMat);
        strut.position.set(pos[0] * 0.6, pos[1] + 0.3, pos[2] * 0.7);
        strut.rotation.z = pos[0] > 0 ? 0.3 : -0.3;
        registerMaterial(strut, silverAluminumMat);
        modelGroup.add(strut);
      });

      // 6. Instrument Deployment Device (Robotic Arm)
      const armGeo1 = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8);
      const arm1 = new THREE.Mesh(armGeo1, silverAluminumMat);
      arm1.rotation.z = Math.PI / 3;
      arm1.position.set(0.9, -0.1, 0.0);
      registerMaterial(arm1, silverAluminumMat);
      modelGroup.add(arm1);

      const armTurretGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 12);
      const armTurret = new THREE.Mesh(armTurretGeo, blackCompositeMat);
      armTurret.position.set(1.2, -0.35, 0.0);
      registerMaterial(armTurret, blackCompositeMat);
      modelGroup.add(armTurret);
    } else if (category === 'apollo_crewed' || artifact.id.includes('lunar-module')) {
      // --- APOLLO LUNAR MODULE DESCENT STAGE ---
      // 1. Octagonal Main Descent Chassis
      const octGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.9, 8);
      const octMesh = new THREE.Mesh(octGeo, goldKaptonMat);
      registerMaterial(octMesh, goldKaptonMat);
      octMesh.position.y = 0.0;
      modelGroup.add(octMesh);

      // Central Descent Rocket Engine Bell
      const engineGeo = new THREE.ConeGeometry(0.75, 1.1, 24, 1, true);
      const engineMesh = new THREE.Mesh(engineGeo, blackCompositeMat);
      registerMaterial(engineMesh, blackCompositeMat);
      engineMesh.rotation.x = Math.PI;
      engineMesh.position.y = -0.7;
      modelGroup.add(engineMesh);

      // Ascent Stage Docking Interface Ring
      const ringGeo = new THREE.TorusGeometry(0.9, 0.08, 16, 32);
      const ringMesh = new THREE.Mesh(ringGeo, silverAluminumMat);
      registerMaterial(ringMesh, silverAluminumMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = 0.5;
      modelGroup.add(ringMesh);

      // 4 Outrigger Landing Gear Struts & Footpads
      const legAngles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
      legAngles.forEach((angle, idx) => {
        const radius = 2.0;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        // Primary Landing Strut
        const strutGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.8, 12);
        const strut = new THREE.Mesh(strutGeo, goldKaptonMat);
        strut.position.set(x * 0.6, -0.45, z * 0.6);
        strut.lookAt(x, -1.1, z);
        strut.rotateX(Math.PI / 2);
        registerMaterial(strut, goldKaptonMat);
        modelGroup.add(strut);

        // Circular Lunar Footpad Dish
        const footpadGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.06, 16);
        const footpad = new THREE.Mesh(footpadGeo, goldKaptonMat);
        footpad.position.set(x, -1.1, z);
        registerMaterial(footpad, goldKaptonMat);
        modelGroup.add(footpad);

        // Ingress/Egress Ladder on Forward Gear
        if (idx === 0) {
          const ladderRailGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.4, 8);
          const rail1 = new THREE.Mesh(ladderRailGeo, silverAluminumMat);
          rail1.position.set(x * 0.7 - 0.08, -0.4, z * 0.7);
          const rail2 = rail1.clone();
          rail2.position.set(x * 0.7 + 0.08, -0.4, z * 0.7);
          modelGroup.add(rail1, rail2);
        }
      });
    } else if (
      category === 'interstellar_probe' ||
      category === 'space_telescope' ||
      category === 'planetary_orbiter'
    ) {
      // --- INTERSTELLAR PROBE / DEEP SPACE ORBITER (Voyager / Cassini / New Horizons) ---
      // 1. High-Gain Parabolic Reflector Dish (3.7m Archetype)
      const dishGeo = new THREE.SphereGeometry(1.6, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.38);
      const dishMesh = new THREE.Mesh(dishGeo, silverAluminumMat);
      registerMaterial(dishMesh, silverAluminumMat);
      dishMesh.rotation.x = -Math.PI / 2;
      dishMesh.position.set(0, 0.6, 0);
      modelGroup.add(dishMesh);

      // Central Subreflector Feed Horn
      const feedGeo = new THREE.ConeGeometry(0.2, 0.6, 16);
      const feedMesh = new THREE.Mesh(feedGeo, goldKaptonMat);
      registerMaterial(feedMesh, goldKaptonMat);
      feedMesh.rotation.x = Math.PI;
      feedMesh.position.set(0, 1.25, 0);
      modelGroup.add(feedMesh);

      // Feed Support Tripod
      for (let i = 0; i < 3; i++) {
        const angle = (i * Math.PI * 2) / 3;
        const leg = new THREE.CylinderGeometry(0.02, 0.02, 0.9, 8);
        const legMesh = new THREE.Mesh(leg, blackCompositeMat);
        legMesh.position.set(Math.cos(angle) * 0.6, 0.9, Math.sin(angle) * 0.6);
        legMesh.lookAt(0, 1.2, 0);
        legMesh.rotateX(Math.PI / 2);
        registerMaterial(legMesh, blackCompositeMat);
        modelGroup.add(legMesh);
      }

      // 2. 10-Sided Bus Electronics Chassis
      const busGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.7, 10);
      const busMesh = new THREE.Mesh(busGeo, goldKaptonMat);
      registerMaterial(busMesh, goldKaptonMat);
      busMesh.position.set(0, -0.2, 0);
      modelGroup.add(busMesh);

      // 3. Radioisotope Thermoelectric Generator (RTG) Boom
      const rtgBoomGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8);
      const rtgBoom = new THREE.Mesh(rtgBoomGeo, blackCompositeMat);
      rtgBoom.rotation.z = Math.PI / 2.3;
      rtgBoom.position.set(-1.1, -0.2, 0);
      registerMaterial(rtgBoom, blackCompositeMat);
      modelGroup.add(rtgBoom);

      // 3 Canister RTGs with cooling fins
      for (let j = 0; j < 3; j++) {
        const canGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.45, 12);
        const canMesh = new THREE.Mesh(canGeo, blackCompositeMat);
        canMesh.position.set(-2.0 - j * 0.35, -0.6 - j * 0.15, 0);
        registerMaterial(canMesh, blackCompositeMat);
        modelGroup.add(canMesh);
      }

      // 4. Magnetometer Boom (Deployable Triangular Truss)
      const magBoomGeo = new THREE.CylinderGeometry(0.02, 0.02, 3.2, 6);
      const magBoom = new THREE.Mesh(magBoomGeo, silverAluminumMat);
      magBoom.rotation.z = -Math.PI / 2.2;
      magBoom.position.set(1.5, -0.1, 0);
      registerMaterial(magBoom, silverAluminumMat);
      modelGroup.add(magBoom);

      const magSensorGeo = new THREE.SphereGeometry(0.12, 12, 12);
      const magSensor = new THREE.Mesh(magSensorGeo, goldKaptonMat);
      magSensor.position.set(3.0, -0.5, 0);
      registerMaterial(magSensor, goldKaptonMat);
      modelGroup.add(magSensor);
    } else {
      // --- UNCREWED LANDER / PROBE / INSTRUMENT (Viking / Surveyor / InSight archetype) ---
      // 1. Hexagonal Main Bus
      const hexGeo = new THREE.CylinderGeometry(1.2, 1.3, 0.8, 6);
      const hexMesh = new THREE.Mesh(hexGeo, silverAluminumMat);
      registerMaterial(hexMesh, silverAluminumMat);
      hexMesh.position.y = 0.0;
      modelGroup.add(hexMesh);

      // 2. Dual Decagonal Solar Arrays (InSight / Phoenix style)
      [-1.8, 1.8].forEach((xOffset) => {
        const solarGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.04, 10);
        const solar = new THREE.Mesh(solarGeo, darkSolarCellMat);
        solar.position.set(xOffset, 0.1, 0);
        registerMaterial(solar, darkSolarCellMat);
        modelGroup.add(solar);

        const strutGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.7, 8);
        const strut = new THREE.Mesh(strutGeo, silverAluminumMat);
        strut.rotation.z = Math.PI / 2;
        strut.position.set(xOffset * 0.55, 0.1, 0);
        registerMaterial(strut, silverAluminumMat);
        modelGroup.add(strut);
      });

      // 3. Instrument Domes & Meteorology Mast
      const domeGeo = new THREE.SphereGeometry(0.3, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const domeMesh = new THREE.Mesh(domeGeo, copperAntennaMat);
      domeMesh.position.set(0.3, 0.4, 0.2);
      registerMaterial(domeMesh, copperAntennaMat);
      modelGroup.add(domeMesh);

      const mastGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8);
      const mast = new THREE.Mesh(mastGeo, silverAluminumMat);
      mast.position.set(-0.3, 0.9, -0.3);
      registerMaterial(mast, silverAluminumMat);
      modelGroup.add(mast);

      // 4. Tripod Landing Legs
      for (let k = 0; k < 3; k++) {
        const angle = (k * Math.PI * 2) / 3;
        const lx = Math.cos(angle) * 1.6;
        const lz = Math.sin(angle) * 1.6;

        const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.4, 8);
        const leg = new THREE.Mesh(legGeo, goldKaptonMat);
        leg.position.set(lx * 0.6, -0.45, lz * 0.6);
        leg.lookAt(lx, -1.0, lz);
        leg.rotateX(Math.PI / 2);
        registerMaterial(leg, goldKaptonMat);
        modelGroup.add(leg);

        const padGeo = new THREE.CylinderGeometry(0.25, 0.28, 0.05, 12);
        const pad = new THREE.Mesh(padGeo, goldKaptonMat);
        pad.position.set(lx, -1.0, lz);
        registerMaterial(pad, goldKaptonMat);
        modelGroup.add(pad);
      }
    }

    scene.add(modelGroup);

    // Load official NASA 3D Resources GLTF/GLB model if available
    if (artifact.model3dUrl) {
      setIsLoadingGltf(true);
      const loader = new GLTFLoader();
      loader.load(
        artifact.model3dUrl,
        (gltf) => {
          if (!modelGroupRef.current) return;
          const gltfScene = gltf.scene;

          // Clear procedural meshes and replace with official NASA GLTF geometry
          while (modelGroup.children.length > 0) {
            const child = modelGroup.children[0];
            modelGroup.remove(child);
          }
          // Re-add environment grid ring and surface ground mesh
          modelGroup.add(gridMesh);
          modelGroup.add(groundMesh);

          // Center & Normalize Scale to 3.0 units max dimension
          const box = new THREE.Box3().setFromObject(gltfScene);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1.0;
          const scale = 3.0 / maxDim;

          const bottomY = (box.min.y - center.y) * scale;
          gltfScene.position.set(-center.x * scale, -bottomY - 1.2, -center.z * scale);
          gltfScene.scale.setScalar(scale);

          gltfScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              if (mesh.material) {
                const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
                registerMaterial(mesh, mat);
              }
            }
          });

          modelGroup.add(gltfScene);
          setIsLoadingGltf(false);
          setLoadedGltfSuccess(true);
          playSuccessChime();
        },
        undefined,
        (err) => {
          console.warn('NASA 3D GLTF Model load fallback to procedural CAD:', err);
          setIsLoadingGltf(false);
          setLoadedGltfSuccess(false);
        }
      );
    }

    // RENDER LOOP
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (modelGroupRef.current) {
        if (isAutoRotating && !orbitState.current.isDragging) {
          orbitState.current.rotationY += delta * 0.35;
        }

        // Apply orbit rotations
        modelGroupRef.current.rotation.y = orbitState.current.rotationY;
        modelGroupRef.current.rotation.x = orbitState.current.rotationX;

        // Subtle zero-g space float
        modelGroupRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.8) * 0.05;
      }

      if (cameraRef.current) {
        cameraRef.current.position.z = orbitState.current.distance;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    // RESIZE LISTENER
    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      scene.clear();
    };
  }, [artifact]);

  // 2. Mouse Drag & Scroll Zoom Event Listeners for Orbit Controls
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const onMouseDown = (e: MouseEvent) => {
      orbitState.current.isDragging = true;
      orbitState.current.previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!orbitState.current.isDragging) return;
      const deltaX = e.clientX - orbitState.current.previousMousePosition.x;
      const deltaY = e.clientY - orbitState.current.previousMousePosition.y;

      orbitState.current.rotationY += deltaX * 0.008;
      orbitState.current.rotationX = Math.max(
        -Math.PI / 2.3,
        Math.min(Math.PI / 2.3, orbitState.current.rotationX + deltaY * 0.008)
      );

      orbitState.current.previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      orbitState.current.isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      orbitState.current.distance = Math.max(
        2.6,
        Math.min(10.0, orbitState.current.distance + e.deltaY * 0.005)
      );
    };

    // Touch controls for mobile / tablet
    let initialTouchDistance = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        orbitState.current.isDragging = true;
        orbitState.current.previousMousePosition = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      } else if (e.touches.length === 2) {
        initialTouchDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && orbitState.current.isDragging) {
        const deltaX = e.touches[0].clientX - orbitState.current.previousMousePosition.x;
        const deltaY = e.touches[0].clientY - orbitState.current.previousMousePosition.y;

        orbitState.current.rotationY += deltaX * 0.008;
        orbitState.current.rotationX = Math.max(
          -Math.PI / 2.3,
          Math.min(Math.PI / 2.3, orbitState.current.rotationX + deltaY * 0.008)
        );

        orbitState.current.previousMousePosition = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      } else if (e.touches.length === 2) {
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const diff = initialTouchDistance - currentDist;
        orbitState.current.distance = Math.max(
          2.6,
          Math.min(10.0, orbitState.current.distance + diff * 0.01)
        );
        initialTouchDistance = currentDist;
      }
    };

    const onTouchEnd = () => {
      orbitState.current.isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    container.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);

      container.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  // 3. Shader / Visual Toggles (Operational, Dust Accumulation, Wireframe HUD)
  useEffect(() => {
    materialsMapRef.current.forEach(({ baseMat, originalProps }) => {
      if (!(baseMat instanceof THREE.MeshStandardMaterial)) return;

      if (visualMode === 'operational') {
        baseMat.color.copy(originalProps.color);
        baseMat.metalness = originalProps.metalness;
        baseMat.roughness = originalProps.roughness;
        baseMat.wireframe = false;
        baseMat.emissive.copy(originalProps.emissive);
      } else if (visualMode === 'dust') {
        // Reddish-orange Martian dust overlay or Lunar grey dust
        const dustColor =
          artifact?.body === 'mars'
            ? new THREE.Color(0xb45309) // Rust Orange/Brown
            : new THREE.Color(0x64748b); // Lunar Grey Regolith

        baseMat.color.lerpColors(originalProps.color, dustColor, 0.72);
        baseMat.metalness = Math.max(0.05, originalProps.metalness * 0.2);
        baseMat.roughness = Math.min(0.95, originalProps.roughness * 1.8 + 0.3);
        baseMat.wireframe = false;
        baseMat.emissive.set(0x000000);
      } else if (visualMode === 'wireframe') {
        // Tactical Titanium Wireframe CAD Mode
        baseMat.color.set(0x050608);
        baseMat.wireframe = true;
        baseMat.emissive.set(0xe2e8f0);
        baseMat.emissiveIntensity = 0.9;
      }
      baseMat.needsUpdate = true;
    });
  }, [visualMode, artifact?.body]);

  const handleResetCamera = () => {
    playTelemetryBeep(520);
    orbitState.current.rotationX = 0.25;
    orbitState.current.rotationY = -0.6;
    orbitState.current.distance = 5.5;
  };

  if (!artifact) return null;

  const isMars = artifact.body === 'mars';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-md animate-in fade-in duration-200 ${
        isMars ? 'bg-[#1C140F]/88' : 'bg-[#06090F]/85'
      }`}
    >
      {/* Modal Container */}
      <div
        className={`relative w-full max-w-5xl h-[88vh] max-h-[780px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border ${
          isMars
            ? 'bg-[#291D16] border-[#57534E] text-[#F5E6D3]'
            : 'bg-[rgba(10,14,23,0.92)] border-[rgba(248,250,252,0.18)] text-[#F8FAFC]'
        }`}
      >
        {/* Top Header */}
        <div
          className={`px-5 py-3.5 border-b flex items-center justify-between gap-4 shrink-0 ${
            isMars
              ? 'bg-[#1C140F] border-[#57534E]'
              : 'bg-[rgba(15,23,42,0.75)] border-[rgba(248,250,252,0.14)]'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 ${
                isMars
                  ? 'bg-[#291D16] border-[#57534E] text-[#D97706]'
                  : 'bg-[rgba(10,14,23,0.85)] border-[rgba(248,250,252,0.18)] text-[#38BDF8]'
              }`}
            >
              <Cpu className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider shrink-0 ${
                    isMars
                      ? 'bg-[#D97706]/15 text-[#D97706] border-[#D97706]/40'
                      : 'bg-[rgba(56,189,248,0.12)] text-[#38BDF8] border-[rgba(56,189,248,0.3)]'
                  }`}
                >
                  3D CAD INSPECTOR
                </span>
                <span
                  className={`text-xs font-mono truncate ${
                    isMars ? 'text-[#A8A29E]' : 'text-[#94A3B8]'
                  }`}
                >
                  {artifact.agency} • {artifact.date}
                </span>
              </div>
              <h3
                className={`font-['Chakra_Petch'] text-base sm:text-lg font-bold tracking-wide truncate mt-0.5 ${
                  isMars ? 'text-[#F5E6D3]' : 'text-[#F8FAFC]'
                }`}
              >
                {artifact.name} ({artifact.moniker})
              </h3>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={() => {
              playTelemetryBeep(450);
              onClose();
            }}
            className={`p-2 rounded-full transition-colors ${
              isMars
                ? 'hover:bg-[#44403C] text-[#A8A29E] hover:text-[#F5E6D3]'
                : 'hover:bg-[rgba(248,250,252,0.1)] text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
            title="Close Model Inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content: 3D Viewport on Left, Telemetry Specs on Right */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          {/* 3D WebGL Canvas Viewport */}
          <div
            className={`flex-1 relative h-64 sm:h-80 lg:h-full ${
              isMars ? 'bg-[#1C140F]' : 'bg-[#06090F]'
            }`}
          >
            {/* Three.js Container */}
            <div
              ref={mountRef}
              className="w-full h-full cursor-grab active:cursor-grabbing select-none"
            />

            {/* View Controls Toolbar (Floating on 3D canvas) */}
            <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
              {/* Visual Shader Mode Toggles */}
              <div
                className={`rounded-full p-1 backdrop-blur-md shadow-xl flex items-center text-[10px] font-medium border ${
                  isMars
                    ? 'bg-[rgba(28,20,15,0.88)] border-[#57534E]'
                    : 'bg-[rgba(10,14,23,0.82)] border-[rgba(248,250,252,0.16)]'
                }`}
              >
                <button
                  onClick={() => {
                    playTelemetryBeep(600);
                    setVisualMode('operational');
                  }}
                  className={`font-['Chakra_Petch'] px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                    visualMode === 'operational'
                      ? isMars
                        ? 'bg-[#D97706] text-[#1C140F] font-bold'
                        : 'bg-[#38BDF8] text-[#0A0E17] font-bold'
                      : isMars
                      ? 'text-[#A8A29E] hover:text-[#F5E6D3]'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                  title="Clean Metallic PBR Shading"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Operational</span>
                </button>

                <button
                  onClick={() => {
                    playTelemetryBeep(650);
                    setVisualMode('dust');
                  }}
                  className={`font-['Chakra_Petch'] px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                    visualMode === 'dust'
                      ? isMars
                        ? 'bg-[#C87D32] text-[#1C140F] font-bold'
                        : 'bg-[#38BDF8] text-[#0A0E17] font-bold'
                      : isMars
                      ? 'text-[#A8A29E] hover:text-[#F5E6D3]'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                  title="Dust Accumulation Weathering"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Dust Overlay</span>
                </button>

                <button
                  onClick={() => {
                    playTelemetryBeep(700);
                    setVisualMode('wireframe');
                  }}
                  className={`font-['Chakra_Petch'] px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                    visualMode === 'wireframe'
                      ? isMars
                        ? 'bg-[#F5E6D3] text-[#1C140F] font-bold'
                        : 'bg-[#F8FAFC] text-[#0A0E17] font-bold'
                      : isMars
                      ? 'text-[#A8A29E] hover:text-[#F5E6D3]'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                  title="Tactical Titanium Wireframe"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Wireframe</span>
                </button>
              </div>

              {/* Autorotation Toggle */}
              <button
                onClick={() => {
                  playTelemetryBeep(550);
                  setIsAutoRotating(!isAutoRotating);
                }}
                className={`p-2 rounded-full border backdrop-blur-md transition-colors shadow-lg ${
                  isAutoRotating
                    ? isMars
                      ? 'bg-[#D97706] border-[#D97706] text-[#1C140F]'
                      : 'bg-[#38BDF8] border-[#38BDF8] text-[#0A0E17]'
                    : isMars
                    ? 'bg-[rgba(28,20,15,0.88)] border-[#57534E] text-[#A8A29E] hover:text-[#F5E6D3]'
                    : 'bg-[rgba(10,14,23,0.82)] border-[rgba(248,250,252,0.16)] text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
                title={isAutoRotating ? 'Pause Auto-Rotation' : 'Resume Auto-Rotation'}
              >
                <RotateCw className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin' : ''}`} />
              </button>

              {/* Reset Camera View */}
              <button
                onClick={handleResetCamera}
                className={`p-2 rounded-full border backdrop-blur-md transition-colors shadow-lg ${
                  isMars
                    ? 'bg-[rgba(28,20,15,0.88)] hover:bg-[#44403C] border-[#57534E] text-[#A8A29E] hover:text-[#F5E6D3]'
                    : 'bg-[rgba(10,14,23,0.82)] hover:bg-[rgba(248,250,252,0.12)] border-[rgba(248,250,252,0.16)] text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
                title="Reset Camera View"
              >
                <Compass className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Bottom Orbit Help Overlay */}
            <div
              className={`font-['Space_Grotesk'] absolute bottom-4 left-4 z-10 pointer-events-none text-[10px] font-medium border rounded-full px-3 py-1 backdrop-blur-md ${
                isMars
                  ? 'text-[#A8A29E] bg-[rgba(28,20,15,0.85)] border-[#57534E]'
                  : 'text-[#94A3B8] bg-[rgba(10,14,23,0.78)] border-[rgba(248,250,252,0.16)]'
              }`}
            >
              <span className={isMars ? 'text-[#D97706]' : 'text-[#38BDF8]'}>Drag</span> to orbit •{' '}
              <span className={isMars ? 'text-[#D97706]' : 'text-[#38BDF8]'}>Scroll</span> to zoom
            </div>
          </div>

          {/* Telemetry Side Panel: NASA Spec Sheet */}
          {specs && (
            <div
              className={`w-full lg:w-96 border-t lg:border-t-0 lg:border-l p-6 flex flex-col gap-5 overflow-y-auto ${
                isMars
                  ? 'bg-[#291D16] border-[#57534E]'
                  : 'bg-[rgba(10,14,23,0.88)] border-[rgba(248,250,252,0.14)]'
              }`}
            >
              <div>
                <span
                  className={`text-[10px] font-mono font-bold tracking-wider uppercase block mb-1 ${
                    isMars ? 'text-[#D97706]' : 'text-[#38BDF8]'
                  }`}
                >
                  SYSTEM TELEMETRY
                </span>
                <h4
                  className={`font-['Chakra_Petch'] text-base font-bold ${
                    isMars ? 'text-[#F5E6D3]' : 'text-[#F8FAFC]'
                  }`}
                >
                  Engineering Specifications
                </h4>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div
                  className={`p-4 rounded-2xl border ${
                    isMars
                      ? 'bg-[#1C140F] border-[#44403C]'
                      : 'bg-[rgba(15,23,42,0.65)] border-[rgba(248,250,252,0.14)]'
                  }`}
                >
                  <div
                    className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider ${
                      isMars ? 'text-[#A8A29E]' : 'text-[#94A3B8]'
                    }`}
                  >
                    <Weight className={`w-3.5 h-3.5 ${isMars ? 'text-[#D97706]' : 'text-[#38BDF8]'}`} />
                    <span>Launch Mass</span>
                  </div>
                  <span
                    className={`text-sm font-semibold mt-1 block ${
                      isMars ? 'text-[#F5E6D3]' : 'text-[#F8FAFC]'
                    }`}
                  >
                    {specs.mass}
                  </span>
                </div>

                <div
                  className={`p-4 rounded-2xl border ${
                    isMars
                      ? 'bg-[#1C140F] border-[#44403C]'
                      : 'bg-[rgba(15,23,42,0.65)] border-[rgba(248,250,252,0.14)]'
                  }`}
                >
                  <div
                    className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider ${
                      isMars ? 'text-[#A8A29E]' : 'text-[#94A3B8]'
                    }`}
                  >
                    <Ruler className={`w-3.5 h-3.5 ${isMars ? 'text-[#D97706]' : 'text-[#38BDF8]'}`} />
                    <span>Dimensions</span>
                  </div>
                  <span
                    className={`text-sm font-semibold mt-1 block truncate ${
                      isMars ? 'text-[#F5E6D3]' : 'text-[#F8FAFC]'
                    }`}
                  >
                    {specs.dimensions}
                  </span>
                </div>

                <div
                  className={`col-span-2 p-4 rounded-2xl border ${
                    isMars
                      ? 'bg-[#1C140F] border-[#44403C]'
                      : 'bg-[rgba(15,23,42,0.65)] border-[rgba(248,250,252,0.14)]'
                  }`}
                >
                  <div
                    className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider ${
                      isMars ? 'text-[#A8A29E]' : 'text-[#94A3B8]'
                    }`}
                  >
                    <Zap className={`w-3.5 h-3.5 ${isMars ? 'text-[#D97706]' : 'text-[#38BDF8]'}`} />
                    <span>Power Architecture</span>
                  </div>
                  <span
                    className={`font-['Space_Grotesk'] text-sm mt-1 block leading-snug ${
                      isMars ? 'text-[#E7E5E4]' : 'text-[#F8FAFC]'
                    }`}
                  >
                    {specs.powerSource}
                  </span>
                </div>

                <div
                  className={`col-span-2 p-4 rounded-2xl border ${
                    isMars
                      ? 'bg-[#1C140F] border-[#44403C]'
                      : 'bg-[rgba(15,23,42,0.65)] border-[rgba(248,250,252,0.14)]'
                  }`}
                >
                  <div
                    className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider ${
                      isMars ? 'text-[#A8A29E]' : 'text-[#94A3B8]'
                    }`}
                  >
                    <Radio className={`w-3.5 h-3.5 ${isMars ? 'text-[#D97706]' : 'text-[#38BDF8]'}`} />
                    <span>Resting Site</span>
                  </div>
                  <span
                    className={`font-['Space_Grotesk'] text-sm mt-1 block truncate ${
                      isMars ? 'text-[#E7E5E4]' : 'text-[#F8FAFC]'
                    }`}
                  >
                    {specs.location}
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest ${
                        isMars
                          ? 'bg-[#D97706]/15 text-[#D97706] border-[#D97706]/40'
                          : 'bg-[rgba(56,189,248,0.12)] text-[#38BDF8] border-[rgba(56,189,248,0.3)]'
                      }`}
                    >
                      {specs.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Science Instruments / Key Subsystems */}
              <div>
                <span
                  className={`font-['Chakra_Petch'] text-[10px] font-bold tracking-wider uppercase block mb-2 ${
                    isMars ? 'text-[#D97706]' : 'text-[#38BDF8]'
                  }`}
                >
                  SCIENCE PAYLOAD & SUBSYSTEMS
                </span>
                <div className="space-y-1.5">
                  {specs.components.map((comp, idx) => (
                    <div
                      key={idx}
                      className={`font-['Space_Grotesk'] p-3 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                        isMars
                          ? 'bg-[#1C140F] border-[#44403C] text-[#E7E5E4] hover:border-[#D97706]'
                          : 'bg-[rgba(15,23,42,0.65)] border-[rgba(248,250,252,0.14)] text-[#F8FAFC] hover:border-[rgba(248,250,252,0.3)]'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            isMars ? 'bg-[#D97706]' : 'bg-[#38BDF8]'
                          }`}
                        />
                        <span className="truncate">{comp}</span>
                      </div>
                      <ChevronRight
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isMars ? 'text-[#A8A29E]' : 'text-[#94A3B8]'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* NASA 3D Resources Repository Link & CAD Status */}
              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  isMars
                    ? 'bg-[#1C140F] border-[#44403C]'
                    : 'bg-[rgba(15,23,42,0.65)] border-[rgba(248,250,252,0.14)]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono font-bold tracking-wider">
                  <span className={`uppercase ${isMars ? 'text-[#A8A29E]' : 'text-[#94A3B8]'}`}>
                    NASA 3D RESOURCES
                  </span>
                  {loadedGltfSuccess ? (
                    <span
                      className={`flex items-center gap-1 font-bold ${
                        isMars ? 'text-[#D97706]' : 'text-[#38BDF8]'
                      }`}
                    >
                      <CheckCircle className="w-3 h-3" /> GLTF LOADED
                    </span>
                  ) : isLoadingGltf ? (
                    <span
                      className={`animate-pulse font-bold ${
                        isMars ? 'text-[#C87D32]' : 'text-[#38BDF8]'
                      }`}
                    >
                      FETCHING GLTF...
                    </span>
                  ) : (
                    <span className={`font-bold ${isMars ? 'text-[#F5E6D3]' : 'text-[#F8FAFC]'}`}>
                      CAD MODEL ACTIVE
                    </span>
                  )}
                </div>
                <p
                  className={`text-[10px] font-['Space_Grotesk'] leading-relaxed ${
                    isMars ? 'text-[#A8A29E]' : 'text-[#94A3B8]'
                  }`}
                >
                  Model assets curated from NASA's official 3D Resources GitHub repository (`nasa/NASA-3D-Resources`).
                </p>
                <a
                  href={artifact.nasa3dResourceUrl || 'https://github.com/nasa/NASA-3D-Resources'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`font-['Chakra_Petch'] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold transition-colors ${
                    isMars
                      ? 'bg-[#291D16] hover:bg-[#44403C] text-[#F5E6D3] border-[#57534E]'
                      : 'bg-[rgba(10,14,23,0.8)] hover:bg-[rgba(248,250,252,0.12)] text-[#F8FAFC] border-[rgba(248,250,252,0.18)]'
                  }`}
                >
                  <ExternalLink className={`w-3 h-3 ${isMars ? 'text-[#D97706]' : 'text-[#38BDF8]'}`} />
                  <span>NASA 3D Resources GitHub</span>
                </a>
              </div>

              {/* Inspiring Scientific Legacy Callout */}
              <div
                className={`mt-auto p-4 rounded-2xl border text-xs ${
                  isMars
                    ? 'bg-[#1C140F] border-[#57534E] text-[#E7E5E4]'
                    : 'bg-[rgba(15,23,42,0.65)] border-[rgba(248,250,252,0.16)] text-[#F8FAFC]'
                }`}
              >
                <span
                  className={`font-['Chakra_Petch'] font-bold text-[10px] block mb-1.5 uppercase tracking-widest ${
                    isMars ? 'text-[#D97706]' : 'text-[#38BDF8]'
                  }`}
                >
                  MISSION SIGNIFICANCE
                </span>
                <p
                  className={`font-['Space_Grotesk'] text-[11px] leading-relaxed italic ${
                    isMars ? 'text-[#F5E6D3]' : 'text-[#F8FAFC]'
                  }`}
                >
                  "{artifact.story.headline}"
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
