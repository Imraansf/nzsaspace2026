import React, { useState } from 'react';
import {
  Compass,
  RotateCcw,
  Globe,
  Crosshair,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  ChevronUp,
  Activity,
} from 'lucide-react';
import { Relic } from './CesiumGlobeViewer';

interface TelemetryHUDProps {
  selectedBody: 'MOON' | 'MARS' | 'moon' | 'mars';
  activeRelic: Relic | null;
  crosshairCoords: { lat: number; lon: number } | null;
  cameraHeightKm: number;
  activePreset: 'orbital' | 'north' | 'equator' | 'target';
  onFlyToPreset: (preset: 'orbital' | 'north' | 'equator' | 'target') => void;
  onZoom: (direction: 'in' | 'out') => void;
  onSelectRelic?: (relic: Relic) => void;
  className?: string;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({
  selectedBody,
  activeRelic,
  crosshairCoords,
  cameraHeightKm,
  activePreset,
  onFlyToPreset,
  onZoom,
  className = '',
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const normalizedBody = selectedBody.toUpperCase();

  const coordsString = crosshairCoords
    ? `${crosshairCoords.lat >= 0 ? `${crosshairCoords.lat.toFixed(1)}°N` : `${Math.abs(crosshairCoords.lat).toFixed(1)}°S`}, ${crosshairCoords.lon >= 0 ? `${crosshairCoords.lon.toFixed(1)}°E` : `${Math.abs(crosshairCoords.lon).toFixed(1)}°W`}`
    : activeRelic && activeRelic.coordinates
    ? `${activeRelic.coordinates.lat >= 0 ? `${activeRelic.coordinates.lat.toFixed(1)}°N` : `${Math.abs(activeRelic.coordinates.lat).toFixed(1)}°S`}, ${activeRelic.coordinates.lon >= 0 ? `${activeRelic.coordinates.lon.toFixed(1)}°E` : `${Math.abs(activeRelic.coordinates.lon).toFixed(1)}°W`}`
    : '28.5°N, 80.6°W';

  const altitudeString =
    cameraHeightKm > 0
      ? `${cameraHeightKm >= 1000 ? (cameraHeightKm / 1000).toFixed(1) + 'k' : cameraHeightKm.toLocaleString()} km`
      : 'Orbital';

  return (
    <div
      className={`pointer-events-auto select-none touch-manipulation transition-all duration-300 ${
        isMinimized ? 'w-auto' : 'w-56 sm:w-60'
      } ${className}`}
    >
      {/* 1. Minimized Mode */}
      {isMinimized ? (
        <div className="flex items-center gap-1 bg-[#fffdf7] border-[3px] border-[#1e1b4b] rounded-full p-0.5 shadow-[0_4px_0_#1e1b4b]">
          <button
            onClick={() => setIsMinimized(false)}
            className="px-2.5 py-1 flex items-center gap-1.5 rounded-full bg-[#fffbeb] hover:bg-[#fde047] text-[#1e1b4b] text-[10px] font-mono border-2 border-[#1e1b4b] transition-colors"
            title="Expand Telemetry HUD"
          >
            <Activity className="w-3 h-3 text-[#ea580c]" />
            <span className="font-black tracking-wider uppercase">
              HUD • {altitudeString}
            </span>
            <ChevronDown className="w-3 h-3 text-[#1e1b4b]" />
          </button>
        </div>
      ) : (
        /* 2. Expanded Mode: Warm Lobby HUD Card */
        <div className="bg-[#fffdf7] border-[3px] border-[#1e1b4b] rounded-2xl p-2.5 shadow-[0_6px_0_#1e1b4b] flex flex-col gap-2 text-[#1e1b4b]">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-1.5 border-b-2 border-[#1e1b4b]/15">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#ea580c]" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#1e1b4b] font-black">
                NASA {normalizedBody}
              </span>
            </div>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 rounded-lg hover:bg-[#fef08a] text-[#1e1b4b]/70 hover:text-[#1e1b4b] transition-colors"
              title="Minimize Telemetry HUD"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Compact Telemetry Metrics Line */}
          <div className="bg-[#fffbeb] rounded-xl px-2.5 py-1.5 border-2 border-[#1e1b4b]/15 flex items-center justify-between text-[9px] font-mono">
            <span className="text-[#1e1b4b] font-bold truncate">{coordsString}</span>
            <span className="text-[#c2410c] font-black shrink-0 ml-1">{altitudeString}</span>
          </div>

          {/* Camera View Presets */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => onFlyToPreset('orbital')}
              className={`py-1.5 px-1.5 rounded-xl text-[9px] font-mono transition-all flex items-center justify-center gap-1 border-2 ${
                activePreset === 'orbital'
                  ? 'bg-[#facc15] text-[#1e1b4b] font-black border-[#1e1b4b] shadow-[0_2px_0_#1e1b4b]'
                  : 'bg-[#fffbeb] border-[#1e1b4b]/25 text-[#1e1b4b] font-bold hover:bg-[#fef08a] hover:border-[#1e1b4b]'
              }`}
              title="Orbital Overview"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Orbit</span>
            </button>

            <button
              onClick={() => onFlyToPreset('north')}
              className={`py-1.5 px-1.5 rounded-xl text-[9px] font-mono transition-all flex items-center justify-center gap-1 border-2 ${
                activePreset === 'north'
                  ? 'bg-[#facc15] text-[#1e1b4b] font-black border-[#1e1b4b] shadow-[0_2px_0_#1e1b4b]'
                  : 'bg-[#fffbeb] border-[#1e1b4b]/25 text-[#1e1b4b] font-bold hover:bg-[#fef08a] hover:border-[#1e1b4b]'
              }`}
              title="North Pole"
            >
              <Compass className="w-2.5 h-2.5" />
              <span>North</span>
            </button>

            <button
              onClick={() => onFlyToPreset('equator')}
              className={`py-1.5 px-1.5 rounded-xl text-[9px] font-mono transition-all flex items-center justify-center gap-1 border-2 ${
                activePreset === 'equator'
                  ? 'bg-[#facc15] text-[#1e1b4b] font-black border-[#1e1b4b] shadow-[0_2px_0_#1e1b4b]'
                  : 'bg-[#fffbeb] border-[#1e1b4b]/25 text-[#1e1b4b] font-bold hover:bg-[#fef08a] hover:border-[#1e1b4b]'
              }`}
              title="Equator"
            >
              <Globe className="w-2.5 h-2.5" />
              <span>Equator</span>
            </button>
          </div>

          {/* Target Focus & Zoom Row */}
          <div className="flex items-center gap-1.5 pt-1.5 border-t-2 border-[#1e1b4b]/15">
            {activeRelic && (
              <button
                onClick={() => onFlyToPreset('target')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[9px] font-mono font-black transition-all flex items-center justify-center gap-1 border-2 border-[#1e1b4b] shadow-[0_2px_0_#1e1b4b] active:translate-y-0.5 active:shadow-none ${
                  activePreset === 'target'
                    ? 'bg-[#fb923c] text-[#1e1b4b]'
                    : 'bg-[#fffbeb] hover:bg-[#fde047] text-[#1e1b4b]'
                }`}
              >
                <Crosshair className="w-3 h-3" />
                <span>Focus</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              <button
                onClick={() => onZoom('in')}
                className="w-7 h-7 flex items-center justify-center rounded-xl bg-[#fffbeb] hover:bg-[#fde047] text-[#1e1b4b] transition-all border-2 border-[#1e1b4b] shadow-[0_2px_0_#1e1b4b] active:translate-y-0.5 active:shadow-none"
                title="Zoom In"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
              <button
                onClick={() => onZoom('out')}
                className="w-7 h-7 flex items-center justify-center rounded-xl bg-[#fffbeb] hover:bg-[#fde047] text-[#1e1b4b] transition-all border-2 border-[#1e1b4b] shadow-[0_2px_0_#1e1b4b] active:translate-y-0.5 active:shadow-none"
                title="Zoom Out"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
