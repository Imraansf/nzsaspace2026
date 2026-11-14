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
        <div className="flex items-center gap-1 bg-[rgba(6,9,15,0.90)] backdrop-blur-xl border-2 border-[#38BDF8] rounded-full p-0.5 shadow-[0_0_20px_rgba(56,189,248,0.22)]">
          <button
            onClick={() => setIsMinimized(false)}
            className="px-2.5 py-1 flex items-center gap-1.5 rounded-full bg-[#0D131F] hover:bg-[#38BDF8]/20 text-[#F8FAFC] text-[10px] font-mono border border-[#38BDF8]/50 transition-colors"
            title="Expand Telemetry HUD"
          >
            <Activity className="w-3 h-3 text-[#38BDF8]" />
            <span className="font-black tracking-wider uppercase">
              HUD • {altitudeString}
            </span>
            <ChevronDown className="w-3 h-3 text-[#38BDF8]" />
          </button>
        </div>
      ) : (
        /* 2. Expanded Mode: Aurora Black & Ice White HUD Card */
        <div className="bg-[rgba(6,9,15,0.90)] backdrop-blur-xl border-2 border-[#38BDF8] rounded-2xl p-2.5 shadow-[0_0_24px_rgba(56,189,248,0.2)] flex flex-col gap-2 text-[#F8FAFC]">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-1.5 border-b border-[#38BDF8]/25">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8] shadow-[0_0_8px_#38BDF8]" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#F8FAFC] font-black">
                NASA {normalizedBody}
              </span>
            </div>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 rounded-lg hover:bg-[#38BDF8]/20 text-[#E0F2FE]/80 hover:text-[#F8FAFC] transition-colors"
              title="Minimize Telemetry HUD"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Compact Telemetry Metrics Line */}
          <div className="bg-[#0D131F] rounded-xl px-2.5 py-1.5 border border-[#38BDF8]/35 flex items-center justify-between text-[9px] font-mono tabular-nums">
            <span className="text-[#F8FAFC] font-bold truncate">{coordsString}</span>
            <span className="text-[#38BDF8] font-black shrink-0 ml-1">{altitudeString}</span>
          </div>

          {/* Camera View Presets */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => onFlyToPreset('orbital')}
              className={`py-1.5 px-1.5 rounded-xl text-[9px] font-mono transition-all flex items-center justify-center gap-1 border ${
                activePreset === 'orbital'
                  ? 'bg-[#38BDF8] text-[#06090F] font-black border-[#38BDF8] shadow-[0_0_12px_rgba(56,189,248,0.45)]'
                  : 'bg-[#0D131F] border-[#38BDF8]/35 text-[#F8FAFC] font-bold hover:bg-[#38BDF8]/15 hover:border-[#38BDF8]'
              }`}
              title="Orbital Overview"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Orbit</span>
            </button>

            <button
              onClick={() => onFlyToPreset('north')}
              className={`py-1.5 px-1.5 rounded-xl text-[9px] font-mono transition-all flex items-center justify-center gap-1 border ${
                activePreset === 'north'
                  ? 'bg-[#38BDF8] text-[#06090F] font-black border-[#38BDF8] shadow-[0_0_12px_rgba(56,189,248,0.45)]'
                  : 'bg-[#0D131F] border-[#38BDF8]/35 text-[#F8FAFC] font-bold hover:bg-[#38BDF8]/15 hover:border-[#38BDF8]'
              }`}
              title="North Pole"
            >
              <Compass className="w-2.5 h-2.5" />
              <span>North</span>
            </button>

            <button
              onClick={() => onFlyToPreset('equator')}
              className={`py-1.5 px-1.5 rounded-xl text-[9px] font-mono transition-all flex items-center justify-center gap-1 border ${
                activePreset === 'equator'
                  ? 'bg-[#38BDF8] text-[#06090F] font-black border-[#38BDF8] shadow-[0_0_12px_rgba(56,189,248,0.45)]'
                  : 'bg-[#0D131F] border-[#38BDF8]/35 text-[#F8FAFC] font-bold hover:bg-[#38BDF8]/15 hover:border-[#38BDF8]'
              }`}
              title="Equator"
            >
              <Globe className="w-2.5 h-2.5" />
              <span>Equator</span>
            </button>
          </div>

          {/* Target Focus & Zoom Row */}
          <div className="flex items-center gap-1.5 pt-1.5 border-t border-[#38BDF8]/25">
            {activeRelic && (
              <button
                onClick={() => onFlyToPreset('target')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[9px] font-mono font-black transition-all flex items-center justify-center gap-1 border active:translate-y-0.5 ${
                  activePreset === 'target'
                    ? 'bg-[#38BDF8] text-[#06090F] border-[#38BDF8] shadow-[0_0_12px_rgba(56,189,248,0.45)]'
                    : 'bg-[#0D131F] hover:bg-[#38BDF8]/20 border-[#38BDF8]/50 text-[#F8FAFC]'
                }`}
              >
                <Crosshair className="w-3 h-3" />
                <span>Focus</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              <button
                onClick={() => onZoom('in')}
                className="w-7 h-7 flex items-center justify-center rounded-xl bg-[#0D131F] hover:bg-[#38BDF8] text-[#F8FAFC] hover:text-[#06090F] transition-all border border-[#38BDF8]/50 active:translate-y-0.5"
                title="Zoom In"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
              <button
                onClick={() => onZoom('out')}
                className="w-7 h-7 flex items-center justify-center rounded-xl bg-[#0D131F] hover:bg-[#38BDF8] text-[#F8FAFC] hover:text-[#06090F] transition-all border border-[#38BDF8]/50 active:translate-y-0.5"
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
