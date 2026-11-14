import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Artifact } from '../types/space';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { playTelemetryBeep } from '../utils/audio';

interface MissionTimelineBarProps {
  artifacts: Artifact[];
  selectedArtifact: Artifact | null;
  onSelectArtifact: (artifact: Artifact) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  toggleShowLabel?: string;
  toggleHideLabel?: string;
}

export const MissionTimelineBar: React.FC<MissionTimelineBarProps> = ({
  artifacts,
  selectedArtifact,
  onSelectArtifact,
  isCollapsed,
  onToggleCollapse,
  toggleShowLabel = 'Show Mission Timeline',
  toggleHideLabel = 'Hide Timeline',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 6);
  }, []);

  useEffect(() => {
    if (isCollapsed) return;
    updateScrollButtons();
    const timer = setTimeout(updateScrollButtons, 80);
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [artifacts, isCollapsed, updateScrollButtons]);

  // Center selected card smoothly when selection changes
  useEffect(() => {
    if (isCollapsed || !selectedArtifact || !scrollContainerRef.current) return;
    const activeBtn = scrollContainerRef.current.querySelector<HTMLButtonElement>(
      `[data-artifact-id="${selectedArtifact.id}"]`
    );
    if (activeBtn) {
      activeBtn.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [selectedArtifact?.id, isCollapsed]);

  const handleScrollBy = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    playTelemetryBeep(direction === 'left' ? 460 : 520);
    const step = Math.max(220, Math.round(el.clientWidth * 0.55));
    el.scrollBy({
      left: direction === 'left' ? -step : step,
      behavior: 'smooth',
    });
  };

  return (
    <div className="absolute bottom-3 sm:bottom-4 inset-x-0 z-20 flex flex-col items-center gap-2 sm:gap-2.5 px-2 sm:px-4 pointer-events-none transition-all duration-300">
      {/* Collapse / Expand Toggle Button */}
      <button
        onClick={() => {
          playTelemetryBeep(400);
          onToggleCollapse();
        }}
        className="pointer-events-auto font-hud-display px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-[#facc15] hover:bg-[#fde047] border-[3px] border-[#0f172a] shadow-[0_4px_0_#0f172a] text-[11px] sm:text-xs font-bold uppercase tracking-wide text-[#0f172a] flex items-center gap-1.5 sm:gap-2 transition-all active:translate-y-0.5 active:shadow-[0_2px_0_#0f172a] whitespace-nowrap shrink-0"
      >
        {isCollapsed ? (
          <>
            <ChevronUp className="w-4 h-4 text-[#0f172a]" />
            <span>{toggleShowLabel}</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4 text-[#0f172a]" />
            <span>{toggleHideLabel}</span>
          </>
        )}
      </button>

      {/* Cohesive Deep-Space Glass Timeline Bar with Smooth Left/Right Scroll Arrows */}
      {!isCollapsed && (
        <div
          className="pointer-events-auto w-full max-w-4xl rounded-2xl p-1.5 sm:p-2 border-[3px] border-[#fde047] shadow-[0_6px_0_#020617,0_14px_28px_rgba(2,6,23,0.65)] backdrop-blur-md flex items-center gap-1.5 sm:gap-2"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.88)' }}
        >
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={() => handleScrollBy('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll missions left"
            className={`shrink-0 w-9 h-11 sm:w-10 sm:h-12 rounded-xl border-2 flex items-center justify-center transition-all ${
              canScrollLeft
                ? 'bg-[#facc15] hover:bg-[#fde047] border-[#0f172a] text-[#0f172a] shadow-[0_3px_0_#0f172a] active:translate-y-0.5 active:shadow-none cursor-pointer'
                : 'bg-[#1e293b]/70 border-[#fde047]/30 text-[#94a3b8]/50 cursor-default'
            }`}
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.75]" />
          </button>

          {/* Smooth Horizontal Scroll Track */}
          <div
            ref={scrollContainerRef}
            onScroll={updateScrollButtons}
            className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-0.5 px-0.5"
          >
            {artifacts.map((artifact) => {
              const isSelected = selectedArtifact?.id === artifact.id;
              return (
                <button
                  key={artifact.id}
                  data-artifact-id={artifact.id}
                  onClick={() => onSelectArtifact(artifact)}
                  className={`flex-shrink-0 snap-start min-w-[132px] sm:min-w-[162px] px-3 py-2 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? 'bg-[#facc15] border-[#fffdf7] text-[#0f172a] shadow-[0_3px_0_#b45309] scale-[1.02]'
                      : 'bg-[#1e293b]/95 border-[#fde047]/60 text-[#f8fafc] hover:bg-[#334155] hover:border-[#facc15] shadow-[0_3px_0_#020617]'
                  }`}
                >
                  <div className="text-[10px] font-hud-body font-bold uppercase tracking-wider mb-0.5 flex items-center justify-between gap-1.5 tabular-nums">
                    <span className={isSelected ? 'text-[#9a3412]' : 'text-[#fde047]'}>
                      {artifact.year}
                    </span>
                    <span
                      className={`text-[9px] font-hud-display px-1.5 py-0.2 rounded ${
                        isSelected
                          ? 'bg-[#0f172a] text-[#facc15]'
                          : 'bg-[#0f172a]/70 text-[#fde047]'
                      }`}
                    >
                      #{artifact.artifactNumber}
                    </span>
                  </div>
                  <h4
                    className={`font-hud-display text-xs sm:text-[13px] font-bold truncate ${
                      isSelected ? 'text-[#0f172a]' : 'text-white'
                    }`}
                  >
                    {artifact.moniker}
                  </h4>
                </button>
              );
            })}
          </div>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={() => handleScrollBy('right')}
            disabled={!canScrollRight}
            aria-label="Scroll missions right"
            className={`shrink-0 w-9 h-11 sm:w-10 sm:h-12 rounded-xl border-2 flex items-center justify-center transition-all ${
              canScrollRight
                ? 'bg-[#facc15] hover:bg-[#fde047] border-[#0f172a] text-[#0f172a] shadow-[0_3px_0_#0f172a] active:translate-y-0.5 active:shadow-none cursor-pointer'
                : 'bg-[#1e293b]/70 border-[#fde047]/30 text-[#94a3b8]/50 cursor-default'
            }`}
          >
            <ChevronRight className="w-5 h-5 stroke-[2.75]" />
          </button>
        </div>
      )}
    </div>
  );
};
