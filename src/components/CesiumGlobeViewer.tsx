import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PlanetaryLandmark } from '../types/space';
import {
  Compass,
  RotateCcw,
  Globe,
  MapPin,
  Crosshair,
  Layers,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { TelemetryHUD } from './TelemetryHUD';

declare const Cesium: any;

export type CelestialBodyType = 'MOON' | 'MARS' | 'moon' | 'mars';

export interface Relic {
  id: string;
  name: string;
  body: 'MOON' | 'MARS' | 'moon' | 'mars' | 'deep_space';
  lat?: number;
  lon?: number;
  coordinates?: { lat: number; lon: number; secondaryLat?: number; secondaryLon?: number };
  altitude?: number;
  status?: string;
  statusLabel?: string;
  moniker?: string;
  year?: number;
  category?: string;
  [key: string]: any;
}

export interface CesiumGlobeViewerProps {
  relics: Relic[];
  selectedBody: 'MOON' | 'MARS' | 'moon' | 'mars';
  onSelectRelic?: (relic: Relic) => void;
  selectedRelicId?: string | null;
  landmarks?: PlanetaryLandmark[];
  showLandmarks?: boolean;
  onSelectLandmark?: (landmark: PlanetaryLandmark) => void;
  selectedLandmark?: PlanetaryLandmark | null;
  className?: string;
}

export function getRelicGltfUrl(relic: Relic): string {
  if (relic.model3dUrl) return relic.model3dUrl;

  const id = (relic.id || '').toLowerCase();
  const name = (relic.name || '').toLowerCase();

  if (id.includes('apollo') || name.includes('apollo')) {
    return 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/main/3D%20Models/Apollo_11_Lunar_Module/Apollo_11_LM.glb';
  }
  if (id.includes('surveyor') || name.includes('surveyor')) {
    return 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/main/3D%20Models/Surveyor/Surveyor.glb';
  }
  if (id.includes('pathfinder') || name.includes('pathfinder')) {
    return 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/main/3D%20Models/Pathfinder/Pathfinder.glb';
  }
  if (id.includes('spirit') || id.includes('opportunity') || name.includes('opportunity')) {
    return 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/main/3D%20Models/MER_Opportunity/Opportunity.glb';
  }
  if (id.includes('phoenix') || name.includes('phoenix')) {
    return 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/main/3D%20Models/Phoenix/Phoenix.glb';
  }
  if (id.includes('ingenuity') || name.includes('ingenuity')) {
    return 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/main/3D%20Models/Ingenuity/Ingenuity.glb';
  }
  if (id.includes('insight') || name.includes('insight')) {
    return 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/main/3D%20Models/InSight/InSight.glb';
  }
  if (id.includes('viking') || name.includes('viking')) {
    return 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/main/3D%20Models/Viking_Lander/Viking.glb';
  }

  // Default fallback by planetary body
  if ((relic.body || '').toUpperCase() === 'MARS' || relic.body === 'mars') {
    return 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/main/3D%20Models/MER_Opportunity/Opportunity.glb';
  }
  return 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/main/3D%20Models/Apollo_11_Lunar_Module/Apollo_11_LM.glb';
}

const beaconIconCache = new Map<string, string>();

function getRadarTargetIcon(isSelected: boolean): string {
  const key = isSelected ? 'radar-selected' : 'radar-default';
  const cached = beaconIconCache.get(key);
  if (cached) return cached;

  const size = 72;
  const center = size / 2;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Outer Aurora Green radar glow
    const grad = ctx.createRadialGradient(center, center, 4, center, center, center - 2);
    grad.addColorStop(0, isSelected ? 'rgba(56, 189, 248, 0.72)' : 'rgba(56, 189, 248, 0.45)');
    grad.addColorStop(0.55, isSelected ? 'rgba(56, 189, 248, 0.25)' : 'rgba(56, 189, 248, 0.12)');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(center, center, center - 2, 0, Math.PI * 2);
    ctx.fill();

    // Outer radar target ring
    ctx.strokeStyle = isSelected ? '#F8FAFC' : '#38BDF8';
    ctx.lineWidth = isSelected ? 3 : 2.2;
    ctx.beginPath();
    ctx.arc(center, center, isSelected ? 22 : 17, 0, Math.PI * 2);
    ctx.stroke();

    // Inner Aurora Green dashed radar ring
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(center, center, isSelected ? 14 : 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Crosshair ticks
    const tickInner = isSelected ? 20 : 15;
    const tickOuter = isSelected ? 29 : 23;
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(center, center - tickOuter);
    ctx.lineTo(center, center - tickInner);
    ctx.moveTo(center, center + tickInner);
    ctx.lineTo(center, center + tickOuter);
    ctx.moveTo(center - tickOuter, center);
    ctx.lineTo(center - tickInner, center);
    ctx.moveTo(center + tickInner, center);
    ctx.lineTo(center + tickOuter, center);
    ctx.stroke();

    // Crisp Ice White center target core
    ctx.fillStyle = '#F8FAFC';
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(center, center, isSelected ? 7.5 : 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  const dataUrl = canvas.toDataURL('image/png');
  beaconIconCache.set(key, dataUrl);
  return dataUrl;
}

function getPillLabelIcon(labelText: string, isSelected: boolean): string {
  const key = `pill-${isSelected ? '1' : '0'}-${labelText}`;
  const cached = beaconIconCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const font = '700 22px "Chakra Petch", "Space Mono", monospace';
  let textWidth = 120;
  if (ctx) {
    ctx.font = font;
    textWidth = Math.ceil(ctx.measureText(labelText).width);
  }

  const padX = 22;
  const pillW = Math.max(80, textWidth + padX * 2);
  const pillH = 40;
  const margin = 8;

  canvas.width = pillW + margin * 2;
  canvas.height = pillH + margin * 2;

  if (ctx) {
    const x = margin;
    const y = margin;
    const r = pillH / 2;

    ctx.save();
    ctx.shadowColor = isSelected ? 'rgba(56, 189, 248, 0.7)' : 'rgba(56, 189, 248, 0.35)';
    ctx.shadowBlur = isSelected ? 12 : 6;
    ctx.fillStyle = 'rgba(6, 9, 15, 0.94)';
    ctx.beginPath();
    ctx.roundRect(x, y, pillW, pillH, r);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = isSelected ? 3.5 : 2.5;
    ctx.beginPath();
    ctx.roundRect(x, y, pillW, pillH, r);
    ctx.stroke();

    ctx.font = font;
    ctx.fillStyle = '#F8FAFC';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, canvas.width / 2, canvas.height / 2 + 1);
  }

  const dataUrl = canvas.toDataURL('image/png');
  beaconIconCache.set(key, dataUrl);
  return dataUrl;
}

export const CesiumGlobeViewer: React.FC<CesiumGlobeViewerProps> = React.memo(({
  relics = [],
  selectedBody,
  onSelectRelic,
  selectedRelicId,
  landmarks = [],
  showLandmarks = true,
  onSelectLandmark,
  selectedLandmark,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const handlerRef = useRef<any>(null);
  const entitiesMapRef = useRef<Map<string, any>>(new Map());
  const lastFlownRelicIdRef = useRef<string | null>(null);

  const [isCesiumLoaded, setIsCesiumLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hoveredRelic, setHoveredRelic] = useState<Relic | null>(null);
  const [hoveredLandmark, setHoveredLandmark] = useState<PlanetaryLandmark | null>(null);
  const [crosshairCoords, setCrosshairCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [cameraHeightKm, setCameraHeightKm] = useState<number>(0);
  const [activePreset, setActivePreset] = useState<'orbital' | 'north' | 'equator' | 'target'>('orbital');
  const [isOrbiting3dModel, setIsOrbiting3dModel] = useState(false);

  const normalizedBody = selectedBody.toUpperCase() as 'MOON' | 'MARS';

  // Filter relics matching current planetary body
  const currentBodyRelics = relics.filter((r) => {
    const rBody = (r.body || '').toUpperCase();
    return rBody === normalizedBody;
  });

  const activeRelic = currentBodyRelics.find((r) => r.id === selectedRelicId) || null;

  // 1. Check for global window.Cesium availability
  useEffect(() => {
    if (typeof Cesium !== 'undefined') {
      setIsCesiumLoaded(true);
      return;
    }

    const checkInterval = setInterval(() => {
      if (typeof Cesium !== 'undefined') {
        setIsCesiumLoaded(true);
        clearInterval(checkInterval);
      }
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(checkInterval);
      if (typeof Cesium === 'undefined') {
        setLoadError('CesiumJS planetary engine could not be loaded from CDN. Please check network connection.');
      }
    }, 10000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, []);

  // 2. Initialize Cesium.Viewer with high-res planetary ellipsoid & NASA Trek imagery
  useEffect(() => {
    console.log('CesiumGlobeViewer: Attempting initialization. isCesiumLoaded:', isCesiumLoaded, 'container:', containerRef.current);
    if (!isCesiumLoaded || !containerRef.current) return;

    try {
      // Define planetary ellipsoids
      // Moon: mean radius 1,737.4 km
      // Mars: equat radius 3,396.19 km, polar 3,376.20 km
      const planetaryEllipsoid =
        normalizedBody === 'MARS'
          ? new Cesium.Ellipsoid(3396190.0, 3396190.0, 3376200.0)
          : Cesium.Ellipsoid.MOON;

      Cesium.Ellipsoid.default = planetaryEllipsoid;
      if (typeof Cesium !== 'undefined' && Cesium.Ion) {
        Cesium.Ion.defaultAccessToken = '';
      }

      // Clean up previous viewer instance if exists
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }

      // Initialize Cesium.Viewer with standard widgets disabled for a clean HUD look
      const viewer = new Cesium.Viewer(containerRef.current, {
        animation: false,
        timeline: false,
        baseLayer: false,
        baseLayerPicker: false,
        geocoder: false,
        infoBox: false,
        navigationHelpButton: false,
        homeButton: false,
        sceneModePicker: false,
        selectionIndicator: false,
        fullscreenButton: false,
        skyAtmosphere: false, // Disabled for non-Earth planetary bodies to prevent shader crashes
        shadows: false,
      });

      viewerRef.current = viewer;

      // High-DPI rendering for crisp resolution
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      viewer.resolutionScale = dpr;

      // Styling & globe physics
      const scene = viewer.scene;
      scene.globe.baseColor = Cesium.Color.fromCssColorString(
        normalizedBody === 'MARS' ? '#2e120b' : '#0f1118'
      );
      scene.backgroundColor = Cesium.Color.fromCssColorString('#020408');
      scene.globe.enableLighting = true;
      scene.globe.showGroundAtmosphere = false;
      scene.globe.maximumScreenSpaceError = 1.35;
      scene.globe.tileCacheSize = 250;

      // Distance constraints - prevents near-plane collision and globe-invert glitch
      scene.screenSpaceCameraController.minimumZoomDistance = 3000.0; // Safe altitude buffer (3 km)
      scene.screenSpaceCameraController.maximumZoomDistance =
        normalizedBody === 'MARS' ? 40000000.0 : 30000000.0;

      // Remove default Earth imagery
      viewer.imageryLayers.removeAll();

      // High-Res Photographic Equirectangular Base Layer
      const baseMapUrl =
        normalizedBody === 'MARS'
          ? 'https://upload.wikimedia.org/wikipedia/commons/4/46/Solarsystemscope_texture_2k_mars.jpg'
          : 'https://upload.wikimedia.org/wikipedia/commons/2/26/Solarsystemscope_texture_2k_moon.jpg';

      try {
        const baseLayer = new Cesium.SingleTileImageryProvider({
          url: baseMapUrl,
          credit: normalizedBody === 'MARS' ? 'NASA / Viking / USGS' : 'NASA / LRO / ASU',
          rectangle: Cesium.Rectangle.fromDegrees(-180, -90, 180, 90),
          ellipsoid: planetaryEllipsoid,
        });
        viewer.imageryLayers.addImageryProvider(baseLayer);
      } catch (err) {
        console.warn('Cesium base photographic layer note:', err);
      }

      // Multi-Resolution NASA Solar System Trek Scientific Tile Streaming
      const trekUrl =
        normalizedBody === 'MARS'
          ? 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg'
          : 'https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/{z}/{y}/{x}.jpg';

      try {
        const trekLayer = new Cesium.UrlTemplateImageryProvider({
          url: trekUrl,
          tilingScheme: new Cesium.GeographicTilingScheme({
            ellipsoid: planetaryEllipsoid,
            numberOfLevelZeroTilesX: 2,
            numberOfLevelZeroTilesY: 1,
          }),
          maximumLevel: 7,
          credit:
            normalizedBody === 'MARS'
              ? 'NASA / USGS / JPL Mars Trek'
              : 'NASA / GSFC / ASU Lunar Trek',
        });
        viewer.imageryLayers.addImageryProvider(trekLayer);
      } catch (trekErr) {
        console.info('NASA Trek layer note:', trekErr);
      }

      // Initial Camera Flight (High Orbital Perspective)
      const initialHeight = normalizedBody === 'MARS' ? 9500000 : 5500000;
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(0.0, 10.0, initialHeight, planetaryEllipsoid),
        duration: 2.2,
        easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
      });

      // Track Camera Altitude for HUD Readout
      scene.postRender.addEventListener(() => {
        if (!viewer || viewer.isDestroyed()) return;
        const cameraPos = viewer.camera.positionCartographic;
        if (cameraPos) {
          setCameraHeightKm(Math.round(cameraPos.height / 1000));
        }
      });

      // 3. Setup ScreenSpaceEventHandler for Click and Hover (Section 1)
      if (handlerRef.current && !handlerRef.current.isDestroyed()) {
        handlerRef.current.destroy();
      }

      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handlerRef.current = handler;

      // Click Listener: detects picked pin markers or landmarks and notifies parent
      handler.setInputAction((movement: any) => {
        if (!viewer || viewer.isDestroyed()) return;
        const pickedObject = viewer.scene.pick(movement.position);

        if (Cesium.defined(pickedObject) && pickedObject.id) {
          const entity = pickedObject.id;

          if (entity.relicData) {
            const clickedRelic = entity.relicData as Relic;
            onSelectRelic?.(clickedRelic);
          } else if (entity.landmarkData) {
            const clickedLandmark = entity.landmarkData as PlanetaryLandmark;
            onSelectLandmark?.(clickedLandmark);
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      // Hover / Mouse Move: Cursor styling & surface coordinates readout
      handler.setInputAction((movement: any) => {
        if (!viewer || viewer.isDestroyed()) return;

        // Pick Entity on Hover
        const pickedObject = viewer.scene.pick(movement.endPosition);
        if (Cesium.defined(pickedObject) && pickedObject.id) {
          if (pickedObject.id.relicData) {
            viewer.container.style.cursor = 'pointer';
            setHoveredRelic(pickedObject.id.relicData as Relic);
            setHoveredLandmark(null);
          } else if (pickedObject.id.landmarkData) {
            viewer.container.style.cursor = 'pointer';
            setHoveredLandmark(pickedObject.id.landmarkData as PlanetaryLandmark);
            setHoveredRelic(null);
          }
        } else {
          viewer.container.style.cursor = 'default';
          setHoveredRelic(null);
          setHoveredLandmark(null);
        }

        // Raycast surface coordinates under mouse pointer
        const ray = viewer.camera.getPickRay(movement.endPosition);
        if (ray) {
          const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
          if (cartesian) {
            const cartographic = planetaryEllipsoid.cartesianToCartographic(cartesian);
            if (cartographic) {
              setCrosshairCoords({
                lat: Cesium.Math.toDegrees(cartographic.latitude),
                lon: Cesium.Math.toDegrees(cartographic.longitude),
              });
            }
          }
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    } catch (err: any) {
      console.error('Cesium Globe Viewer initialization error:', err);
      setLoadError(err.message || 'Failed to initialize Cesium 3D planetary engine');
    }

    // Component unmounting: safely destroy viewer and handler to prevent WebGL memory leaks
    return () => {
      if (handlerRef.current && !handlerRef.current.isDestroyed()) {
        handlerRef.current.destroy();
        handlerRef.current = null;
      }
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [isCesiumLoaded, normalizedBody, onSelectRelic, onSelectLandmark]);

  // 4. Lightweight 2D Pin Markers (Option B - Section 1)
  // Eliminates WebGL entity.model leaks and terrain clipping bugs
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    const planetaryEllipsoid =
      normalizedBody === 'MARS'
        ? new Cesium.Ellipsoid(3396190.0, 3396190.0, 3376200.0)
        : Cesium.Ellipsoid.MOON;

    // Remove existing relic entities
    const existingRelics = viewer.entities.values.filter((e: any) => e.isRelic);
    existingRelics.forEach((e: any) => viewer.entities.remove(e));
    entitiesMapRef.current.clear();

    currentBodyRelics.forEach((relic) => {
      const isSelected = selectedRelicId === relic.id;
      const lat = relic.lat !== undefined ? relic.lat : relic.coordinates?.lat ?? 0;
      let lon = relic.lon !== undefined ? relic.lon : relic.coordinates?.lon ?? 0;
      while (lon > 180) lon -= 360;
      while (lon < -180) lon += 360;

      // Position anchored at surface with clean elevation offset
      const position = Cesium.Cartesian3.fromDegrees(
        lon,
        lat,
        100, // 100 meters above surface
        planetaryEllipsoid
      );

      const labelText = (relic.moniker || relic.name).toUpperCase();

      // Glowing Aurora Green & Ice White Radar Target Beacon
      const entity = viewer.entities.add({
        id: `relic-${relic.id}`,
        name: relic.name,
        isRelic: true,
        position: position,
        billboard: {
          image: getRadarTargetIcon(isSelected),
          scale: isSelected ? 0.65 : 0.54,
          scaleByDistance: new Cesium.NearFarScalar(1.0e4, 1.15, 1.5e7, 0.55),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });

      entity.relicData = relic;
      entitiesMapRef.current.set(relic.id, entity);

      // Crisp Deep Space Black Pill Label outlined in Aurora Green with Ice White Text
      let yOffset = -18;
      if (relic.id === 'surveyor-3') {
        yOffset = 20; // slightly below its dot
      } else if (relic.id === 'apollo-12-intrepid-alsep') {
        yOffset = -44; // slightly above its dot
      }

      const pillEntity = viewer.entities.add({
        id: `relic-${relic.id}-pill`,
        name: `${relic.name} Label`,
        isRelic: true,
        position: position,
        billboard: {
          image: getPillLabelIcon(labelText, isSelected),
          scale: 0.48,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, yOffset),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 1.0e7),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
      pillEntity.relicData = relic;

      // Optional secondary site pin (e.g., Opportunity Rover at Meridiani Planum)
      if (
        relic.coordinates?.secondaryLat !== undefined &&
        relic.coordinates?.secondaryLon !== undefined
      ) {
        let secLon = relic.coordinates.secondaryLon;
        while (secLon > 180) secLon -= 360;
        while (secLon < -180) secLon += 360;
        const secPosition = Cesium.Cartesian3.fromDegrees(
          secLon,
          relic.coordinates.secondaryLat,
          100,
          planetaryEllipsoid
        );
        const secEntity = viewer.entities.add({
          id: `relic-${relic.id}-secondary`,
          name: `${relic.name} (Opportunity)`,
          isRelic: true,
          position: secPosition,
          billboard: {
            image: getRadarTargetIcon(isSelected),
            scale: isSelected ? 0.65 : 0.54,
            scaleByDistance: new Cesium.NearFarScalar(1.0e4, 1.15, 1.5e7, 0.55),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });
        secEntity.relicData = relic;

        const secPillEntity = viewer.entities.add({
          id: `relic-${relic.id}-secondary-pill`,
          name: `${relic.name} (Opportunity) Label`,
          isRelic: true,
          position: secPosition,
          billboard: {
            image: getPillLabelIcon('OPPORTUNITY (MERIDIANI)', isSelected),
            scale: 0.48,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -18),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 1.0e7),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });
        secPillEntity.relicData = relic;
      }
    });

    viewer.scene.requestRender();
  }, [currentBodyRelics, selectedRelicId, normalizedBody]);

  // 5. Render Planetary Landmarks (Craters, Volcanoes, Canyons, Maria)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    // Remove existing landmarks
    const existingLandmarks = viewer.entities.values.filter((e: any) => e.isLandmark);
    existingLandmarks.forEach((e: any) => viewer.entities.remove(e));

    if (!showLandmarks || landmarks.length === 0) {
      viewer.scene.requestRender();
      return;
    }

    const planetaryEllipsoid =
      normalizedBody === 'MARS'
        ? new Cesium.Ellipsoid(3396190.0, 3396190.0, 3376200.0)
        : Cesium.Ellipsoid.MOON;

    landmarks.forEach((landmark) => {
      const isSelected = selectedLandmark?.id === landmark.id;
      const lat = landmark.coordinates.lat;
      let lon = landmark.coordinates.lon;
      while (lon > 180) lon -= 360;
      while (lon < -180) lon += 360;

      const colorHex = isSelected
        ? '#38BDF8'
        : landmark.type === 'volcano'
        ? '#A78BFA'
        : landmark.type === 'canyon'
        ? '#7C3AED'
        : landmark.type === 'crater'
        ? '#E0F2FE'
        : landmark.type === 'mare'
        ? '#0EA5E9'
        : '#38BDF8';

      const color = Cesium.Color.fromCssColorString(colorHex);

      viewer.entities.add({
        id: `landmark-${landmark.id}`,
        name: landmark.name,
        isLandmark: true,
        position: Cesium.Cartesian3.fromDegrees(
          lon,
          lat,
          normalizedBody === 'MARS' ? 150 : 80,
          planetaryEllipsoid
        ),
        point: {
          pixelSize: isSelected ? 12 : 6,
          color: color.withAlpha(0.9),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 1.5,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: landmark.name,
          font: "10px 'Space Grotesk', monospace",
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: color,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.TOP,
          pixelOffset: new Cesium.Cartesian2(0, 10),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
            0,
            normalizedBody === 'MARS' ? 8500000 : 5000000
          ),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        landmarkData: landmark,
      });
    });

    viewer.scene.requestRender();
  }, [landmarks, showLandmarks, selectedLandmark, normalizedBody]);

  // Automatic Viewport Resizing via ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    const viewer = viewerRef.current;
    if (!container || !viewer) return;

    const handleResize = () => {
      if (viewer && !viewer.isDestroyed()) {
        viewer.resize();
        viewer.scene.requestRender();
      }
    };

    const ro = new ResizeObserver(() => {
      handleResize();
    });

    ro.observe(container);

    return () => {
      ro.disconnect();
    };
  }, [isCesiumLoaded]);

  // 5. Render Active Surface 3D GLTF Model for the Selected Relic Directly on Moon/Mars Regolith
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    const planetaryEllipsoid =
      normalizedBody === 'MARS'
        ? new Cesium.Ellipsoid(3396190.0, 3396190.0, 3376200.0)
        : Cesium.Ellipsoid.MOON;

    // Clean up previous surface 3D model entity
    const existingModel = viewer.entities.getById('active-surface-3d-relic');
    if (existingModel) {
      viewer.entities.remove(existingModel);
    }

    if (!selectedRelicId) {
      viewer.scene.requestRender();
      return;
    }

    const relic = currentBodyRelics.find((r) => r.id === selectedRelicId);
    if (!relic) return;

    const lat = relic.lat !== undefined ? relic.lat : relic.coordinates?.lat ?? 0;
    let lon = relic.lon !== undefined ? relic.lon : relic.coordinates?.lon ?? 0;
    while (lon > 180) lon -= 360;
    while (lon < -180) lon += 360;

    const gltfUrl = getRelicGltfUrl(relic);

    const position = Cesium.Cartesian3.fromDegrees(lon, lat, 12.0, planetaryEllipsoid);

    const heading = Cesium.Math.toRadians(0);
    const pitch = Cesium.Math.toRadians(0);
    const roll = Cesium.Math.toRadians(0);
    const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
    const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

    const modelScale = normalizedBody === 'MARS' ? 20.0 : 22.0;

    viewer.entities.add({
      id: 'active-surface-3d-relic',
      name: `3D Surface Model: ${relic.name}`,
      isSurface3DModel: true,
      position: position,
      orientation: orientation,
      model: {
        uri: gltfUrl,
        minimumPixelSize: 160,
        maximumScale: 3000,
        scale: modelScale,
        runAnimations: true,
        clampAnimations: true,
        shadows: Cesium.ShadowMode.ENABLED,
        heightReference: Cesium.HeightReference.NONE,
      },
      ellipse: {
        semiMajorAxis: 25.0,
        semiMinorAxis: 25.0,
        material: Cesium.Color.fromCssColorString('#38BDF8').withAlpha(0.3),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#38BDF8').withAlpha(0.95),
        outlineWidth: 3.0,
      },
      label: {
        text: `${relic.name.toUpperCase()} (3D MODEL ON SURFACE)`,
        font: 'bold 12px "Space Mono", "Chakra Petch", monospace',
        style: Cesium.LabelStyle.FILL,
        fillColor: Cesium.Color.fromCssColorString('#F8FAFC'),
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString('#06090F').withAlpha(0.92),
        backgroundPadding: new Cesium.Cartesian2(10, 6),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -45),
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 500000),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });

    viewer.scene.requestRender();
  }, [selectedRelicId, currentBodyRelics, normalizedBody]);

  // 6. Camera Fly-To: Smoothly zoom into surface level once when a relic is selected
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    if (!selectedRelicId) {
      lastFlownRelicIdRef.current = null;
      return;
    }

    // Do not fly again if we have already flown to this relic
    if (lastFlownRelicIdRef.current === selectedRelicId) {
      return;
    }
    lastFlownRelicIdRef.current = selectedRelicId;

    const relic = currentBodyRelics.find((r) => r.id === selectedRelicId);
    if (!relic) return;

    const planetaryEllipsoid =
      normalizedBody === 'MARS'
        ? new Cesium.Ellipsoid(3396190.0, 3396190.0, 3376200.0)
        : Cesium.Ellipsoid.MOON;

    const lat = relic.lat !== undefined ? relic.lat : relic.coordinates?.lat ?? 0;
    let lon = relic.lon !== undefined ? relic.lon : relic.coordinates?.lon ?? 0;
    while (lon > 180) lon -= 360;
    while (lon < -180) lon += 360;

    // Focused surface zoom altitude (380km for Moon, 550km for Mars)
    const flyAltitude = normalizedBody === 'MARS' ? 550000 : 380000;

    const cameraDestination = Cesium.Cartesian3.fromDegrees(
      lon,
      lat,
      flyAltitude,
      planetaryEllipsoid
    );

    viewer.camera.flyTo({
      destination: cameraDestination,
      duration: 2.0,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
    });

    setActivePreset('target');
  }, [selectedRelicId, normalizedBody, currentBodyRelics]);

  // Smooth Camera Flight to Selected Landmark
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !selectedLandmark) return;

    const planetaryEllipsoid =
      normalizedBody === 'MARS'
        ? new Cesium.Ellipsoid(3396190.0, 3396190.0, 3376200.0)
        : Cesium.Ellipsoid.MOON;

    const lat = selectedLandmark.coordinates.lat;
    let lon = selectedLandmark.coordinates.lon;
    while (lon > 180) lon -= 360;
    while (lon < -180) lon += 360;

    const flyAltitude =
      (selectedLandmark.diameterKm || 150) * 3500 +
      (normalizedBody === 'MARS' ? 400000 : 250000);

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        lon,
        lat,
        Math.min(flyAltitude, 1200000),
        planetaryEllipsoid
      ),
      duration: 2.2,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
    });
  }, [selectedLandmark, normalizedBody]);

  // Camera Presets: Orbital Overview, North Pole, Equator, Target Focus
  const handleFlyToPreset = useCallback(
    (preset: 'orbital' | 'north' | 'equator' | 'target') => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;

      const planetaryEllipsoid =
        normalizedBody === 'MARS'
          ? new Cesium.Ellipsoid(3396190.0, 3396190.0, 3376200.0)
          : Cesium.Ellipsoid.MOON;

      setActivePreset(preset);

      switch (preset) {
        case 'orbital': {
          const height = normalizedBody === 'MARS' ? 9500000 : 5500000;
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(0.0, 15.0, height, planetaryEllipsoid),
            duration: 2.2,
            easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
          });
          break;
        }
        case 'north': {
          const height = normalizedBody === 'MARS' ? 8000000 : 4500000;
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(0.0, 89.0, height, planetaryEllipsoid),
            orientation: {
              heading: Cesium.Math.toRadians(0.0),
              pitch: Cesium.Math.toRadians(-89.0),
              roll: 0.0,
            },
            duration: 2.2,
            easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
          });
          break;
        }
        case 'equator': {
          const height = normalizedBody === 'MARS' ? 7000000 : 4000000;
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(0.0, 0.0, height, planetaryEllipsoid),
            orientation: {
              heading: Cesium.Math.toRadians(0.0),
              pitch: Cesium.Math.toRadians(-90.0),
              roll: 0.0,
            },
            duration: 2.2,
            easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
          });
          break;
        }
        case 'target': {
          if (selectedRelicId) {
            const relic = currentBodyRelics.find((r) => r.id === selectedRelicId);
            if (relic) {
              const lat = relic.lat !== undefined ? relic.lat : relic.coordinates?.lat ?? 0;
              let lon = relic.lon !== undefined ? relic.lon : relic.coordinates?.lon ?? 0;
              while (lon > 180) lon -= 360;
              while (lon < -180) lon += 360;

              const flyAltitude = normalizedBody === 'MARS' ? 45000 : 38000;
              viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(
                  lon,
                  lat,
                  flyAltitude,
                  planetaryEllipsoid
                ),
                duration: 2.0,
                easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
              });
            }
          }
          break;
        }
      }
    },
    [normalizedBody, selectedRelicId, currentBodyRelics]
  );

  // Manual zoom control helpers
  const handleZoom = (direction: 'in' | 'out') => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    const factor = direction === 'in' ? 0.6 : 1.5;
    viewer.camera.zoomIn(viewer.camera.positionCartographic.height * (1 - factor));
  };

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-[#020408] select-none ${className}`}
    >
      {/* Cesium WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 z-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading Overlay */}
      {!isCesiumLoaded && !loadError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#06090F]/95 backdrop-blur-sm text-[#F8FAFC]">
          <Globe className="w-8 h-8 animate-spin mb-3 text-[#38BDF8]" />
          <h4 className="text-sm font-semibold tracking-wider uppercase font-['Chakra_Petch'] text-[#F8FAFC]">
            Loading NASA {normalizedBody} 3D Engine
          </h4>
          <p className="text-xs text-[#E0F2FE]/80 font-['Space_Grotesk'] mt-1">
            Streaming NASA Solar System Trek multi-resolution telemetry...
          </p>
        </div>
      )}

      {/* Load Error Notification */}
      {loadError && (
        <div className="absolute inset-x-4 top-20 z-30 max-w-md mx-auto p-4 rounded-xl bg-[rgba(6,9,15,0.92)] border-2 border-[#7C3AED] text-[#F8FAFC] text-xs shadow-[0_0_24px_rgba(124,58,237,0.3)]">
          <div className="flex items-center gap-2 font-semibold text-[#A78BFA]">
            <span>Telemetry Notice</span>
          </div>
          <p className="mt-1 text-[#E0F2FE]">{loadError}</p>
        </div>
      )}

      {/* Mobile-Optimized Telemetry HUD & Viewport Controls (< 25-30% screen) */}
      <div className="absolute top-14 sm:top-20 left-2 sm:left-4 z-30 flex flex-col gap-2 pointer-events-none">
        <TelemetryHUD
          selectedBody={selectedBody}
          activeRelic={activeRelic}
          crosshairCoords={crosshairCoords}
          cameraHeightKm={cameraHeightKm}
          activePreset={activePreset}
          onFlyToPreset={handleFlyToPreset}
          onZoom={handleZoom}
          onSelectRelic={onSelectRelic}
        />

        {/* Minimal Hover Tooltip (Compact on mobile) */}
        {hoveredRelic && (
          <div className="pointer-events-auto p-2.5 sm:p-3 max-w-[240px] rounded-2xl bg-[rgba(6,9,15,0.90)] border-2 border-[#38BDF8] backdrop-blur-xl shadow-[0_0_20px_rgba(56,189,248,0.25)] text-[#F8FAFC] animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-[#38BDF8] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] shadow-[0_0_8px_#38BDF8]" />
              <span>{hoveredRelic.statusLabel || 'Hardware'}</span>
            </div>
            <h4 className="text-xs sm:text-sm font-semibold text-[#F8FAFC] mt-0.5 truncate">
              {hoveredRelic.name}
            </h4>
            <div className="mt-1.5 pt-1.5 border-t border-[#38BDF8]/25 flex items-center justify-between text-[9px] font-mono text-[#E0F2FE]/80">
              <span>View Dossier</span>
              <ChevronRight className="w-3 h-3 text-[#38BDF8]" />
            </div>
          </div>
        )}

        {hoveredLandmark && !hoveredRelic && (
          <div className="pointer-events-auto p-2.5 sm:p-3 max-w-[240px] rounded-2xl bg-[rgba(6,9,15,0.90)] border-2 border-[#7C3AED] backdrop-blur-xl shadow-[0_0_20px_rgba(124,58,237,0.25)] text-[#F8FAFC] animate-in fade-in zoom-in-95">
            <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-[#A78BFA] font-bold block">
              {hoveredLandmark.type}
            </span>
            <h4 className="text-xs sm:text-sm font-semibold text-[#F8FAFC] mt-0.5 truncate">
              {hoveredLandmark.name}
            </h4>
            <p className="text-[10px] text-[#E0F2FE]/80 mt-1 line-clamp-2 leading-snug">
              {hoveredLandmark.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});
