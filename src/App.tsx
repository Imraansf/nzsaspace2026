import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Artifact, CelestialBody, PlanetaryLandmark } from './types/space';
import {
  getArtifacts,
  getPlanetaryLandmarks,
  getArtifactById,
} from './utils/space-data';
import { CelestialGlobe } from './components/CelestialGlobe';
import { CesiumGlobeViewer } from './components/CesiumGlobeViewer';
import { DeepSpaceExplorer } from './components/DeepSpaceExplorer';
import { StoryDrawer } from './components/StoryDrawer';
import { LandingIntro } from './components/LandingIntro';
import { MapOnboardingPostcards } from './components/MapOnboardingPostcards';
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

  const isMars = currentBody === 'mars';

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden font-['Space_Grotesk'] select-none ${
        isMars ? 'bg-[#1C140F] text-[#F5E6D3]' : 'bg-[#06090F] text-[#F8FAFC]'
      }`}
    >
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
          className={`font-['Chakra_Petch'] min-h-[40px] px-3.5 py-2 rounded-xl backdrop-blur-md border text-xs font-bold flex items-center gap-2 shadow-lg active:translate-y-0.5 transition-all ${
            isMars
              ? 'bg-[rgba(28,20,15,0.85)] hover:bg-[#291D16] border-[#57534E] text-[#F5E6D3]'
              : 'bg-[rgba(10,14,23,0.78)] hover:bg-[rgba(15,23,42,0.9)] border-[rgba(248,250,252,0.16)] text-[#F8FAFC]'
          }`}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? (
            <X className={`w-4 h-4 ${isMars ? 'text-[#D97706]' : 'text-[#38BDF8]'}`} />
          ) : (
            <Menu className={`w-4 h-4 ${isMars ? 'text-[#D97706]' : 'text-[#38BDF8]'}`} />
          )}
          <span className="tracking-wide uppercase">Menu</span>
          <span className={`font-bold ${isMars ? 'text-[#D97706]' : 'text-[#38BDF8]'}`}>
            · {currentBody === 'deep_space' ? 'Deep Space' : currentBody === 'mars' ? 'Mars' : 'Moon'}
          </span>
        </button>

        {isMenuOpen && (
          <div
            className={`w-64 backdrop-blur-md border rounded-2xl p-1.5 shadow-xl flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-150 ${
              isMars
                ? 'bg-[rgba(28,20,15,0.90)] border-[#57534E]'
                : 'bg-[rgba(10,14,23,0.86)] border-[rgba(248,250,252,0.16)]'
            }`}
          >
            <button
              onClick={() => {
                playTelemetryBeep(380);
                setIsMenuOpen(false);
                setSelectedArtifact(null);
                setSelectedLandmark(null);
                setIsDossierOpen(false);
                setShowLanding(true);
              }}
              className={`font-['Chakra_Petch'] w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-xs font-bold border flex items-center gap-2.5 transition-all ${
                isMars
                  ? 'text-[#F5E6D3] bg-[#291D16] hover:bg-[#44403C] border-[#44403C] hover:border-[#D97706]'
                  : 'text-[#F8FAFC] bg-[rgba(15,23,42,0.65)] hover:bg-[rgba(248,250,252,0.1)] border-[rgba(248,250,252,0.14)] hover:border-[#38BDF8]'
              }`}
            >
              <Home className={`w-4 h-4 shrink-0 ${isMars ? 'text-[#D97706]' : 'text-[#38BDF8]'}`} />
              <div>
                <div className={`font-bold ${isMars ? 'text-[#F5E6D3]' : 'text-[#F8FAFC]'}`}>
                  Back to Main Menu
                </div>
                <div
                  className={`font-['Space_Grotesk'] text-[10px] font-normal ${
                    isMars ? 'text-[#A8A29E]' : 'text-[#94A3B8]'
                  }`}
                >
                  Choose Moon, Mars, or Deep Space
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                handleToggleMute();
              }}
              className={`font-['Chakra_Petch'] w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-xs font-bold border flex items-center gap-2.5 transition-all ${
                isMars
                  ? 'text-[#F5E6D3] bg-[#291D16] hover:bg-[#44403C] border-[#44403C] hover:border-[#D97706]'
                  : 'text-[#F8FAFC] bg-[rgba(15,23,42,0.65)] hover:bg-[rgba(248,250,252,0.1)] border-[rgba(248,250,252,0.14)] hover:border-[#38BDF8]'
              }`}
            >
              {isMuted ? (
                <VolumeX className={`w-4 h-4 shrink-0 ${isMars ? 'text-[#A8A29E]' : 'text-[#94A3B8]'}`} />
              ) : (
                <Volume2 className={`w-4 h-4 shrink-0 ${isMars ? 'text-[#D97706]' : 'text-[#38BDF8]'}`} />
              )}
              <span className="font-bold">{isMuted ? 'Unmute Audio' : 'Mute Audio'}</span>
            </button>
          </div>
        )}
      </nav>

      {/* 2B. Right-Side Quick Tutorial Popups (Zone-Themed) */}
      <MapOnboardingPostcards
        zone={currentBody}
        isTemporarilyHidden={Boolean(
          selectedLandmark || (selectedArtifact && showSmallPopup) || isOverlayOpen
        )}
      />

      {/* 3. Floating Planetary Landmark Card */}
      {selectedLandmark && currentBody !== 'deep_space' && (
        <div
          className={`absolute top-16 right-3 sm:right-4 left-3 sm:left-auto w-auto sm:w-64 max-w-[260px] z-30 rounded-xl p-2.5 sm:p-3 shadow-xl backdrop-blur-md border animate-in fade-in slide-in-from-right-4 duration-300 ${
            isMars
              ? 'bg-[rgba(28,20,15,0.88)] border-[#57534E] text-[#F5E6D3]'
              : 'bg-[rgba(10,14,23,0.82)] border-[rgba(248,250,252,0.16)] text-[#F8FAFC]'
          }`}
        >
          <div
            className={`flex items-center justify-between gap-2 border-b pb-1.5 ${
              isMars ? 'border-[#57534E]/60' : 'border-[rgba(248,250,252,0.14)]'
            }`}
          >
            <div
              className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest font-mono ${
                isMars ? 'text-[#D97706]' : 'text-[#38BDF8]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  isMars ? 'bg-[#D97706]' : 'bg-[#38BDF8]'
                }`}
              />
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
              className={`p-1 rounded-md transition-colors ${
                isMars
                  ? 'hover:bg-[#44403C] text-[#A8A29E] hover:text-[#F5E6D3]'
                  : 'hover:bg-[rgba(248,250,252,0.1)] text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
              aria-label="Close landmark info"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-2 space-y-0.5">
            <h3
              className={`font-['Chakra_Petch'] text-sm font-bold tracking-tight truncate ${
                isMars ? 'text-[#F5E6D3]' : 'text-[#F8FAFC]'
              }`}
            >
              {selectedLandmark.name}
            </h3>
            <div
              className={`text-[10px] font-mono tabular-nums truncate ${
                isMars ? 'text-[#A8A29E]' : 'text-[#94A3B8]'
              }`}
            >
              {selectedLandmark.coordinates.lat >= 0
                ? `${selectedLandmark.coordinates.lat.toFixed(1)}°N`
                : `${Math.abs(selectedLandmark.coordinates.lat).toFixed(1)}°S`}
              ,{' '}
              {selectedLandmark.coordinates.lon >= 0
                ? `${selectedLandmark.coordinates.lon.toFixed(1)}°E`
                : `${Math.abs(selectedLandmark.coordinates.lon).toFixed(1)}°W`}
            </div>
          </div>

          <p
            className={`font-['Space_Grotesk'] text-xs mt-2 leading-relaxed line-clamp-2 ${
              isMars ? 'text-[#E7E5E4]' : 'text-[#94A3B8]'
            }`}
          >
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
              className={`font-['Chakra_Petch'] mt-2.5 w-full py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                isMars
                  ? 'bg-[#D97706] hover:bg-[#C87D32] text-[#1C140F]'
                  : 'bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#0A0E17]'
              }`}
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
            className={`font-['Chakra_Petch'] pointer-events-auto px-4 sm:px-5 py-1.5 sm:py-2 rounded-full border shadow-lg text-[11px] sm:text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all active:translate-y-0.5 backdrop-blur-md ${
              isMars
                ? 'bg-[rgba(28,20,15,0.85)] hover:bg-[#D97706] border-[#57534E] hover:border-[#D97706] text-[#F5E6D3] hover:text-[#1C140F]'
                : 'bg-[rgba(10,14,23,0.78)] hover:bg-[#38BDF8] border-[rgba(248,250,252,0.16)] hover:border-[#38BDF8] text-[#F8FAFC] hover:text-[#0A0E17]'
            }`}
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
            <div
              className={`pointer-events-auto w-full max-w-3xl backdrop-blur-md border rounded-xl sm:rounded-2xl p-1 sm:p-1.5 shadow-lg flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none snap-x snap-mandatory ${
                isMars
                  ? 'bg-[rgba(28,20,15,0.85)] border-[#57534E]'
                  : 'bg-[rgba(10,14,23,0.78)] border-[rgba(248,250,252,0.16)]'
              }`}
            >
              {filteredArtifacts.map((artifact: Artifact) => {
                const isSelected = selectedArtifact?.id === artifact.id;
                return (
                  <button
                    key={artifact.id}
                    onClick={() => handleSelectArtifact(artifact)}
                    className={`flex-shrink-0 snap-center min-w-[105px] sm:min-w-[160px] px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border text-left transition-all ${
                      isSelected
                        ? isMars
                          ? 'bg-[#D97706] border-[#D97706] text-[#1C140F]'
                          : 'bg-[#38BDF8] border-[#38BDF8] text-[#0A0E17]'
                        : isMars
                        ? 'bg-[#291D16] border-[#44403C] text-[#F5E6D3] hover:bg-[#44403C] hover:border-[#D97706]'
                        : 'bg-[rgba(15,23,42,0.65)] border-[rgba(248,250,252,0.14)] text-[#F8FAFC] hover:bg-[rgba(248,250,252,0.1)] hover:border-[rgba(248,250,252,0.3)]'
                    }`}
                  >
                    <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1 sm:gap-1.5 font-mono tabular-nums">
                      <span
                        className={
                          isSelected
                            ? isMars
                              ? 'text-[#1C140F]'
                              : 'text-[#0A0E17]'
                            : isMars
                            ? 'text-[#D97706]'
                            : 'text-[#38BDF8]'
                        }
                      >
                        {artifact.year}
                      </span>
                      {isSelected && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isMars ? 'bg-[#1C140F]' : 'bg-[#0A0E17]'
                          }`}
                        />
                      )}
                    </div>
                    <h4
                      className={`font-['Chakra_Petch'] text-[11px] sm:text-xs font-bold truncate ${
                        isSelected
                          ? isMars
                            ? 'text-[#1C140F]'
                            : 'text-[#0A0E17]'
                          : isMars
                          ? 'text-[#F5E6D3]'
                          : 'text-[#F8FAFC]'
                      }`}
                    >
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
        <div
          className={`absolute top-16 right-3 sm:right-4 left-3 sm:left-auto w-auto sm:w-64 max-w-[260px] z-30 rounded-xl p-2.5 sm:p-3 shadow-xl backdrop-blur-md border animate-in fade-in slide-in-from-right-4 duration-300 ${
            isMars
              ? 'bg-[rgba(28,20,15,0.88)] border-[#57534E] text-[#F5E6D3]'
              : 'bg-[rgba(10,14,23,0.82)] border-[rgba(248,250,252,0.16)] text-[#F8FAFC]'
          }`}
        >
          <div
            className={`flex items-center justify-between gap-2 border-b pb-1.5 ${
              isMars ? 'border-[#57534E]/60' : 'border-[rgba(248,250,252,0.14)]'
            }`}
          >
            <div
              className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest font-mono ${
                isMars ? 'text-[#D97706]' : 'text-[#38BDF8]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  isMars ? 'bg-[#D97706]' : 'bg-[#38BDF8]'
                }`}
              />
              Target Acquired
            </div>
            <button
              onClick={() => setSelectedArtifact(null)}
              className={`p-1 rounded-md transition-colors ${
                isMars
                  ? 'hover:bg-[#44403C] text-[#A8A29E] hover:text-[#F5E6D3]'
                  : 'hover:bg-[rgba(248,250,252,0.1)] text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
              aria-label="Close target info"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-2 space-y-0.5">
            <h3
              className={`font-['Chakra_Petch'] text-sm font-bold tracking-tight truncate ${
                isMars ? 'text-[#F5E6D3]' : 'text-[#F8FAFC]'
              }`}
            >
              {selectedArtifact.name}
            </h3>
            <div
              className={`text-[10px] font-mono truncate ${
                isMars ? 'text-[#A8A29E]' : 'text-[#94A3B8]'
              }`}
            >
              {selectedArtifact.agency} • {selectedArtifact.year} • {selectedArtifact.locationName}
            </div>
          </div>

          <button
            onClick={() => {
              playTelemetryBeep(650);
              setIsDossierOpen(true);
            }}
            className={`font-['Chakra_Petch'] mt-2.5 w-full py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all ${
              isMars
                ? 'bg-[#D97706] hover:bg-[#C87D32] text-[#1C140F]'
                : 'bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#0A0E17]'
            }`}
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
