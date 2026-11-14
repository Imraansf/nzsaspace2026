import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Artifact, CelestialBody, PlanetaryLandmark } from './types/space';
import {
  getArtifacts,
  getPlanetaryLandmarks,
  getArtifactById,
  getArtifactColor,
} from './utils/space-data';
import { CelestialGlobe } from './components/CelestialGlobe';
import { CesiumGlobeViewer } from './components/CesiumGlobeViewer';
import { DeepSpaceExplorer } from './components/DeepSpaceExplorer';
import { StoryDrawer } from './components/StoryDrawer';
import { LandingIntro } from './components/LandingIntro';
import {
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  X,
  Menu,
  Home,
} from 'lucide-react';
import { ModelInspectorModal } from './components/ModelInspectorModal';
import {
  toggleAudioMute,
  playTelemetryBeep,
  playRadarPing,
  playSuccessChime,
} from './utils/audio';

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [currentBody, setCurrentBody] = useState<CelestialBody>('moon');
  const [engineMode] = useState<'cesium' | 'globe'>('cesium');
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [showSmallPopup, setShowSmallPopup] = useState(false);
  const [selectedLandmark, setSelectedLandmark] = useState<PlanetaryLandmark | null>(null);
  const [showLandmarks] = useState(true);
  const [inspectingArtifact, setInspectingArtifact] = useState<Artifact | null>(null);
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const artifacts = useMemo(() => getArtifacts(currentBody), [currentBody]);
  const landmarks = useMemo(() => getPlanetaryLandmarks(currentBody), [currentBody]);

  // Zoom onto object first; display small pop-up on the right hand side after zoom animation completes (2.0s duration)
  useEffect(() => {
    if (selectedArtifact && !isDossierOpen) {
      setShowSmallPopup(false);
      const timer = setTimeout(() => {
        setShowSmallPopup(true);
      }, 2100);
      return () => clearTimeout(timer);
    } else {
      setShowSmallPopup(false);
    }
  }, [selectedArtifact?.id, isDossierOpen]);

  const filteredArtifacts = artifacts;

  const handleToggleMute = useCallback(() => {
    const nextMuted = toggleAudioMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      playSuccessChime();
    }
  }, []);

  const handleSelectArtifact = useCallback((artifact: Artifact | null) => {
    playRadarPing();
    setSelectedArtifact(artifact);
    setIsDossierOpen(false);
    setSelectedLandmark(null);
  }, []);

  const handleOpenCadInspector = useCallback((artifact: Artifact) => {
    setInspectingArtifact(artifact);
  }, []);

  const handleSelectLandmark = useCallback((landmark: PlanetaryLandmark) => {
    playRadarPing();
    setSelectedLandmark(landmark);
  }, []);

  const handleNextArtifact = useCallback(() => {
    if (!selectedArtifact || artifacts.length === 0) return;
    const idx = artifacts.findIndex((a) => a.id === selectedArtifact.id);
    const nextIdx = (idx + 1) % artifacts.length;
    handleSelectArtifact(artifacts[nextIdx]);
  }, [selectedArtifact, artifacts, handleSelectArtifact]);

  const handlePrevArtifact = useCallback(() => {
    if (!selectedArtifact || artifacts.length === 0) return;
    const idx = artifacts.findIndex((a) => a.id === selectedArtifact.id);
    const prevIdx = (idx - 1 + artifacts.length) % artifacts.length;
    handleSelectArtifact(artifacts[prevIdx]);
  }, [selectedArtifact, artifacts, handleSelectArtifact]);

  const handleSelectZoneFromLanding = useCallback((zone: CelestialBody) => {
    setCurrentBody(zone);
    setSelectedArtifact(null);
    setSelectedLandmark(null);
    setIsDossierOpen(false);
    setShowLanding(false);
  }, []);

  const isOverlayOpen = Boolean(
    (selectedArtifact && isDossierOpen) ||
    Boolean(inspectingArtifact)
  );

  if (showLanding) {
    return <LandingIntro onSelectZone={handleSelectZoneFromLanding} />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#06090F] text-[#F8FAFC] font-sans select-none">
      {/* 1. Main 3D Viewport (hidden when full-screen menus are open to conserve GPU/WebGL context) */}
      <div className={`absolute inset-0 z-0 ${isOverlayOpen ? 'hidden pointer-events-none' : 'block'}`}>
        <ViewportSection
          currentBody={currentBody}
          engineMode={engineMode}
          filteredArtifacts={filteredArtifacts}
          selectedArtifact={selectedArtifact}
          handleSelectArtifact={handleSelectArtifact}
          landmarks={landmarks}
          showLandmarks={showLandmarks}
          handleSelectLandmark={handleSelectLandmark}
          selectedLandmark={selectedLandmark}
        />
      </div>

      {/* 2. Floating Top-Left Navigation Menu (Returns to Main Menu to select Moon / Mars / Deep Space) */}
      <nav
        aria-label="Main Navigation Menu"
        className="absolute top-3 left-2 sm:top-4 sm:left-4 z-40 flex flex-col items-start gap-2"
      >
        <button
          onClick={() => {
            playTelemetryBeep(420);
            setIsMenuOpen((prev) => !prev);
          }}
          className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[rgba(6,9,15,0.90)] backdrop-blur-xl hover:bg-[#0D131F] border-2 border-[#38BDF8] text-[#F8FAFC] text-xs font-mono font-black flex items-center gap-2 shadow-[0_0_18px_rgba(56,189,248,0.22)] active:translate-y-0.5 transition-all"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X className="w-4 h-4 text-[#38BDF8]" /> : <Menu className="w-4 h-4 text-[#38BDF8]" />}
          <span>Menu</span>
          <span className="text-[#38BDF8] font-extrabold">
            · {currentBody === 'deep_space' ? 'Deep Space' : currentBody === 'mars' ? 'Mars' : 'Moon'}
          </span>
        </button>

        {isMenuOpen && (
          <div className="w-64 bg-[rgba(6,9,15,0.92)] backdrop-blur-xl border-2 border-[#38BDF8] rounded-2xl p-1.5 shadow-[0_0_24px_rgba(56,189,248,0.25)] flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-150">
            <button
              onClick={() => {
                playTelemetryBeep(380);
                setIsMenuOpen(false);
                setSelectedArtifact(null);
                setSelectedLandmark(null);
                setIsDossierOpen(false);
                setShowLanding(true);
              }}
              className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-xs font-bold text-[#F8FAFC] bg-[#0D131F] hover:bg-[#38BDF8]/15 border border-[#38BDF8]/25 hover:border-[#38BDF8] flex items-center gap-2.5 transition-all"
            >
              <Home className="w-4 h-4 text-[#38BDF8] shrink-0" />
              <div>
                <div className="font-black text-[#F8FAFC]">Back to Main Menu</div>
                <div className="text-[10px] text-[#E0F2FE]/75 font-mono font-bold">
                  Choose Moon, Mars, or Deep Space
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                handleToggleMute();
              }}
              className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-xs font-bold text-[#F8FAFC] bg-[#0D131F] hover:bg-[#38BDF8]/15 border border-[#38BDF8]/25 hover:border-[#38BDF8] flex items-center gap-2.5 transition-all"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-[#A78BFA] shrink-0" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#38BDF8] shrink-0" />
              )}
              <span className="font-extrabold">{isMuted ? 'Unmute Audio' : 'Mute Audio'}</span>
            </button>
          </div>
        )}
      </nav>

      {/* 3. Floating Planetary Landmark Card: Ice Blue Spec Sheet */}
      {selectedLandmark && currentBody !== 'deep_space' && (
        <div className="absolute top-16 right-3 sm:right-4 left-3 sm:left-auto w-auto sm:w-64 max-w-[260px] z-30 bg-[rgba(6,9,15,0.90)] border-2 border-[#38BDF8] rounded-xl p-2.5 sm:p-3 shadow-[0_0_24px_rgba(56,189,248,0.22)] backdrop-blur-xl animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center justify-between gap-2 border-b border-[#38BDF8]/25 pb-1.5">
            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest font-mono text-[#38BDF8]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse" />
              {selectedLandmark.type === 'volcano'
                ? 'Shield Volcano'
                : selectedLandmark.type === 'canyon'
                ? 'Tectonic Canyon'
                : selectedLandmark.type === 'crater'
                ? 'Impact Crater'
                : selectedLandmark.type === 'mare'
                ? 'Basaltic Plain'
                : 'Landmark'}
              {selectedLandmark.diameterKm ? ` • ${selectedLandmark.diameterKm} km` : ''}
            </div>
            <button
              onClick={() => setSelectedLandmark(null)}
              className="p-1 rounded-md hover:bg-[#38BDF8]/20 text-[#E0F2FE]/70 hover:text-[#F8FAFC] transition-colors"
              aria-label="Close landmark info"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-2 space-y-0.5">
            <h3 className="text-sm font-bold tracking-tight text-[#F8FAFC] truncate">
              {selectedLandmark.name}
            </h3>
            <div className="text-[10px] font-mono tabular-nums text-[#E0F2FE]/80 truncate">
              {selectedLandmark.coordinates.lat >= 0
                ? `${selectedLandmark.coordinates.lat.toFixed(1)}°N`
                : `${Math.abs(selectedLandmark.coordinates.lat).toFixed(1)}°S`}
              ,{' '}
              {selectedLandmark.coordinates.lon >= 0
                ? `${selectedLandmark.coordinates.lon.toFixed(1)}°E`
                : `${Math.abs(selectedLandmark.coordinates.lon).toFixed(1)}°W`}
            </div>
          </div>

          <p className="text-xs text-[#E0F2FE]/90 mt-2 leading-relaxed line-clamp-2">
            {selectedLandmark.description}
          </p>

          {selectedLandmark.associatedArtifactId && (
            <button
              onClick={() => {
                const artifact = getArtifactById(
                  selectedLandmark.associatedArtifactId!
                );
                if (artifact) {
                  handleSelectArtifact(artifact);
                }
              }}
              className="mt-2.5 w-full py-1.5 px-3 rounded-lg bg-[#38BDF8] text-[#06090F] font-bold text-xs flex items-center justify-center gap-1 transition-all hover:bg-[#0EA5E9] shadow-[0_0_12px_rgba(56,189,248,0.35)]"
            >
              <span>View Hardware</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* 4. Minimalist Bottom Carousel / Equipment Timeline */}
      {currentBody !== 'deep_space' && (
        <div
          className="absolute bottom-3 sm:bottom-4 inset-x-0 z-20 flex flex-col items-center gap-2 sm:gap-3 px-2 sm:px-4 pointer-events-none transition-all duration-500"
        >
          {/* Collapse / Expand Toggle Button */}
          <button
            onClick={() => {
              playTelemetryBeep(400);
              setIsTimelineCollapsed(!isTimelineCollapsed);
            }}
            className="pointer-events-auto px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-[rgba(6,9,15,0.90)] hover:bg-[#38BDF8] border-2 border-[#38BDF8] shadow-[0_0_18px_rgba(56,189,248,0.28)] text-[11px] sm:text-xs font-black text-[#F8FAFC] hover:text-[#06090F] flex items-center gap-1.5 sm:gap-2 transition-all active:translate-y-0.5 backdrop-blur-xl"
          >
            {isTimelineCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Show Mission Timeline</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Hide Timeline</span>
              </>
            )}
          </button>

          {/* Timeline Carousel Strip: Simplistic & Mobile Friendly */}
          {!isTimelineCollapsed && (
            <div className="pointer-events-auto w-full max-w-3xl bg-[rgba(6,9,15,0.90)] backdrop-blur-xl border-2 border-[#38BDF8] rounded-xl sm:rounded-2xl p-1 sm:p-1.5 shadow-[0_0_24px_rgba(56,189,248,0.22)] flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none snap-x snap-mandatory">
              {filteredArtifacts.map((artifact: Artifact) => {
                const isSelected = selectedArtifact?.id === artifact.id;
                return (
                  <button
                    key={artifact.id}
                    onClick={() => handleSelectArtifact(artifact)}
                    className={`flex-shrink-0 snap-center min-w-[105px] sm:min-w-[160px] px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#38BDF8] border-[#F8FAFC] text-[#06090F] shadow-[0_0_14px_rgba(56,189,248,0.45)] scale-[1.03]'
                        : 'bg-[#0D131F] border-[#38BDF8]/30 text-[#F8FAFC] hover:bg-[#38BDF8]/15 hover:border-[#38BDF8]'
                    }`}
                  >
                    <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider mb-0.5 flex items-center gap-1 sm:gap-1.5 font-mono tabular-nums">
                      <span className={isSelected ? 'text-[#06090F]' : 'text-[#38BDF8]'}>
                        {artifact.year}
                      </span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#06090F]" />}
                    </div>
                    <h4 className={`text-[11px] sm:text-xs font-extrabold truncate ${isSelected ? 'text-[#06090F]' : 'text-[#F8FAFC]'}`}>
                      {artifact.moniker}
                    </h4>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. Small Target Popup (Appears after zoom) */}
      {selectedArtifact && !isDossierOpen && showSmallPopup && (
        <div className="absolute top-16 right-3 sm:right-4 left-3 sm:left-auto w-auto sm:w-64 max-w-[260px] z-30 bg-[rgba(6,9,15,0.90)] border-2 border-[#38BDF8] rounded-xl p-2.5 sm:p-3 shadow-[0_0_24px_rgba(56,189,248,0.25)] backdrop-blur-xl animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center justify-between gap-2 border-b border-[#38BDF8]/25 pb-1.5">
            <div
              className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest font-mono text-[#38BDF8]"
            >
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse"
              />
              Target Acquired
            </div>
            <button
              onClick={() => setSelectedArtifact(null)}
              className="p-1 rounded-md hover:bg-[#38BDF8]/20 text-[#E0F2FE]/70 hover:text-[#F8FAFC] transition-colors"
              aria-label="Close target info"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-2 space-y-0.5">
            <h3 className="text-sm font-bold tracking-tight truncate text-[#F8FAFC]">
              {selectedArtifact.name}
            </h3>
            <div className="text-[10px] font-mono text-[#E0F2FE]/80 truncate">
              {selectedArtifact.agency} • {selectedArtifact.year} • {selectedArtifact.locationName}
            </div>
          </div>

          <button
            onClick={() => {
              playTelemetryBeep(650);
              setIsDossierOpen(true);
            }}
            className="mt-2.5 w-full py-1.5 px-3 rounded-lg bg-[#38BDF8] text-[#06090F] font-bold text-xs flex items-center justify-center gap-1 transition-all hover:bg-[#0EA5E9] shadow-[0_0_12px_rgba(56,189,248,0.35)]"
          >
            <span>Get details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 6. Full-Screen NASA Mission Dossier Window */}
      {selectedArtifact && isDossierOpen && (
        <StoryDrawer
          artifact={selectedArtifact}
          onClose={() => setIsDossierOpen(false)}
          onNextArtifact={handleNextArtifact}
          onPrevArtifact={handlePrevArtifact}
          onInspectModel={handleOpenCadInspector}
        />
      )}

      {/* 7. Interactive 3D CAD Model Inspector Modal */}
      {inspectingArtifact && (
        <ModelInspectorModal
          artifact={inspectingArtifact}
          onClose={() => setInspectingArtifact(null)}
        />
      )}
    </div>
  );
}

// Sub-component to isolate 3D viewport rendering and prevent refreshes on UI toggle
const ViewportSection = React.memo(({
  currentBody,
  engineMode,
  filteredArtifacts,
  selectedArtifact,
  handleSelectArtifact,
  landmarks,
  showLandmarks,
  handleSelectLandmark,
  selectedLandmark
}: any) => {
  return (
    <>
      {currentBody === 'deep_space' ? (
        <DeepSpaceExplorer
          key="deep_space"
          artifacts={filteredArtifacts}
          selectedArtifact={selectedArtifact}
          onSelectArtifact={handleSelectArtifact}
        />
      ) : engineMode === 'cesium' ? (
        <CesiumGlobeViewer
          key={currentBody}
          selectedBody={currentBody === 'mars' ? 'MARS' : 'MOON'}
          relics={filteredArtifacts}
          selectedRelicId={selectedArtifact?.id}
          onSelectRelic={(relic: any) => {
            const fullArtifact = filteredArtifacts.find((a: Artifact) => a.id === relic.id);
            if (fullArtifact) {
              handleSelectArtifact(fullArtifact);
            }
          }}
          landmarks={landmarks}
          showLandmarks={showLandmarks}
          onSelectLandmark={handleSelectLandmark}
          selectedLandmark={selectedLandmark}
        />
      ) : (
        <CelestialGlobe
          key={currentBody}
          body={currentBody}
          artifacts={filteredArtifacts}
          selectedArtifact={selectedArtifact}
          onSelectArtifact={handleSelectArtifact}
          landmarks={landmarks}
          showLandmarks={showLandmarks}
          onSelectLandmark={handleSelectLandmark}
          selectedLandmark={selectedLandmark}
        />
      )}
    </>
  );
});
