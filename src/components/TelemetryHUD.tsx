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
  const isMars = normalizedBody === 'MARS';

  const coordsString = crosshairCoords
    ? `${crosshairCoords.lat >= 0 ? `${crosshairCoords.lat.toFixed(1)}°N` : `${Math.abs(crosshairCoords.lat).toFixed(1)}°S`}, ${crosshairCoords.lon >= 0 ? `${crosshairCoords.lon.toFixed(1)}°E` : `${Math.abs(crosshairCoords.lon).toFixed(1)}°W`}`
    : activeRelic && activeRelic.coordinates
    ? `${activeRelic.coordinates.lat >= 0 ? `${activeRelic.coordinates.lat.toFixed(1)}°N` : `${Math.abs(activeRelic.coordinates.lat).toFixed(1)}°S`}, ${activeRelic.coordinates.lon >= 0 ? `${activeRelic.coordinates.lon.toFixed(1)}°E` : `${Math.abs(activeRelic.coordinates.lon).toFixed(1)}°W`}`
    : '28.5°N, 80.6°W';

  const altitudeString =
    cameraHeightKm > 0
      ? `${cameraHeightKm >= 1000 ? (cameraHeightKm / 1000).toFixed(1) + 'k' : cameraHeightKm.toLocaleString()} km`
      : 'Orbital';

  const panelClasses = isMars
    ? 'bg-[rgba(28,20,15,0.85)] backdrop-blur-md border border-[#57534E] text-[#F5E6D3]'
    : 'bg-[rgba(10,14,23,0.78)] backdrop-blur-md border border-[rgba(248,250,252,0.16)] text-[#F8FAFC]';

  const inactiveBtnClasses = isMars
    ? 'bg-[#291D16] border-[#57534E] text-[#F5E6D3] hover:bg-[#44403C] hover:border-[#D97706]'
    : 'bg-[rgba(15,23,42,0.65)] border-[rgba(248,250,252,0.16)] text-[#F8FAFC] hover:bg-[rgba(248,250,252,0.12)] hover:border-[rgba(248,250,252,0.3)]';

  const activeBtnClasses = isMars
    ? 'bg-[#D97706] text-[#1C140F] font-bold border-[#D97706]'
    : 'bg-[#38BDF8] text-[#0A0E17] font-bold border-[#38BDF8]';

  return (
    <div
      className={`pointer-events-auto select-none touch-manipulation transition-all duration-300 ${
        isMinimized ? 'w-auto' : 'w-56 sm:w-60'
      } ${className}`}
    >
      {/* 1. Minimized Mode */}
      {isMinimized ? (
        <div className={`flex items-center gap-1 rounded-full p-0.5 shadow-lg ${panelClasses}`}>
          <button
            onClick={() => setIsMinimized(false)}
            className={`px-2.5 py-1 flex items-center gap-1.5 rounded-full text-[10px] font-['Chakra_Petch'] transition-colors ${
              isMars
                ? 'bg-[#291D16] hover:bg-[#44403C] text-[#F5E6D3] border border-[#57534E]'
                : 'bg-[rgba(15,23,42,0.7)] hover:bg-[rgba(248,250,252,0.1)] text-[#F8FAFC] border border-[rgba(248,250,252,0.16)]'
            }`}
            title="Expand Telemetry HUD"
          >
            <Activity className={`w-3 h-3 ${isMars ? 'text-[#D97706]' : 'text-[#38BDF8]'}`} />
            <span className="font-bold tracking-wider uppercase">
              HUD · <span className="font-mono">{altitudeString}</span>
            </span>
            <ChevronDown className={`w-3 h-3 ${isMars ? 'text-[#D97706]' : 'text-[#38BDF8]'}`} />
          </button>
        </div>
      ) : (
        /* 2. Expanded Mode */
        <div className={`rounded-2xl p-2.5 shadow-lg flex flex-col gap-2 ${panelClasses}`}>
          {/* Header Bar */}
          <div
            className={`flex items-center justify-between pb-1.5 border-b ${
              isMars ? 'border-[#57534E]/60' : 'border-[rgba(248,250,252,0.14)]'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isMars ? 'bg-[#D97706]' : 'bg-[#38BDF8]'
                }`}
              />
              <span className="text-[11px] font-['Chakra_Petch'] font-bold uppercase tracking-wider">
                NASA {normalizedBody}
              </span>
            </div>
            <button
              onClick={() => setIsMinimized(true)}
              className={`p-1 rounded-lg transition-colors ${
                isMars
                  ? 'hover:bg-[#44403C] text-[#A8A29E] hover:text-[#F5E6D3]'
                  : 'hover:bg-[rgba(248,250,252,0.1)] text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
              title="Minimize Telemetry HUD"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Compact Telemetry Metrics Line */}
          <div
            className={`rounded-xl px-2.5 py-1.5 border flex items-center justify-between text-[9px] font-mono tabular-nums ${
              isMars
                ? 'bg-[#291D16] border-[#44403C]'
                : 'bg-[rgba(6,9,15,0.55)] border-[rgba(248,250,252,0.14)]'
            }`}
          >
            <span className={`font-medium truncate ${isMars ? 'text-[#F5E6D3]' : 'text-[#F8FAFC]'}`}>
              {coordsString}
            </span>
            <span
              className={`font-bold shrink-0 ml-1 ${
                isMars ? 'text-[#D97706]' : 'text-[#38BDF8]'
              }`}
            >
              {altitudeString}
            </span>
          </div>

          {/* Camera View Presets */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => onFlyToPreset('orbital')}
              className={`py-1.5 px-1.5 rounded-xl text-[10px] font-['Chakra_Petch'] transition-all flex items-center justify-center gap-1 border ${
                activePreset === 'orbital' ? activeBtnClasses : `${inactiveBtnClasses} font-semibold`
              }`}
              title="Orbital Overview"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Orbit</span>
            </button>

            <button
              onClick={() => onFlyToPreset('north')}
              className={`py-1.5 px-1.5 rounded-xl text-[10px] font-['Chakra_Petch'] transition-all flex items-center justify-center gap-1 border ${
                activePreset === 'north' ? activeBtnClasses : `${inactiveBtnClasses} font-semibold`
              }`}
              title="North Pole"
            >
              <Compass className="w-2.5 h-2.5" />
              <span>North</span>
            </button>

            <button
              onClick={() => onFlyToPreset('equator')}
              className={`py-1.5 px-1.5 rounded-xl text-[10px] font-['Chakra_Petch'] transition-all flex items-center justify-center gap-1 border ${
                activePreset === 'equator' ? activeBtnClasses : `${inactiveBtnClasses} font-semibold`
              }`}
              title="Equator"
            >
              <Globe className="w-2.5 h-2.5" />
              <span>Equator</span>
            </button>
          </div>

          {/* Target Focus & Zoom Row */}
          <div
            className={`flex items-center gap-1.5 pt-1.5 border-t ${
              isMars ? 'border-[#57534E]/60' : 'border-[rgba(248,250,252,0.14)]'
            }`}
          >
            {activeRelic && (
              <button
                onClick={() => onFlyToPreset('target')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-['Chakra_Petch'] font-bold transition-all flex items-center justify-center gap-1 border active:translate-y-0.5 ${
                  activePreset === 'target' ? activeBtnClasses : inactiveBtnClasses
                }`}
              >
                <Crosshair className="w-3 h-3" />
                <span>Focus</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              <button
                onClick={() => onZoom('in')}
                className={`w-7 h-7 flex items-center justify-center rounded-xl transition-all border active:translate-y-0.5 ${
                  isMars
                    ? 'bg-[#291D16] hover:bg-[#D97706] text-[#F5E6D3] hover:text-[#1C140F] border-[#57534E]'
                    : 'bg-[rgba(15,23,42,0.65)] hover:bg-[#38BDF8] text-[#F8FAFC] hover:text-[#0A0E17] border-[rgba(248,250,252,0.16)]'
                }`}
                title="Zoom In"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
              <button
                onClick={() => onZoom('out')}
                className={`w-7 h-7 flex items-center justify-center rounded-xl transition-all border active:translate-y-0.5 ${
                  isMars
                    ? 'bg-[#291D16] hover:bg-[#D97706] text-[#F5E6D3] hover:text-[#1C140F] border-[#57534E]'
                    : 'bg-[rgba(15,23,42,0.65)] hover:bg-[#38BDF8] text-[#F8FAFC] hover:text-[#0A0E17] border-[rgba(248,250,252,0.16)]'
                }`}
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
