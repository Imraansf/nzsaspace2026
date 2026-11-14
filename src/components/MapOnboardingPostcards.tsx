import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Globe, Rocket, ArrowRight, Sparkles, Compass } from 'lucide-react';
import { playTelemetryBeep, playSuccessChime } from '../utils/audio';
import { CelestialBody } from '../types/space';

const TUTORIAL_STORAGE_KEY = 'hasSeenMapTutorial';

interface MapOnboardingPostcardsProps {
  /** Active celestial zone for zone-specific styling */
  zone: CelestialBody;
  /** Temporarily hide while a target or landmark card is open so cards never overlap */
  isTemporarilyHidden?: boolean;
}

interface TutorialStep {
  stepNumber: string;
  title: string;
  body: string;
  ctaLabel: string;
  tiltDeg: number;
  icon: React.ComponentType<{ className?: string }>;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    stepNumber: '01',
    title: 'BACK TO LOBBY',
    body: 'Click the Menu button in the top-left corner anytime to fly back to the spaceship lobby and choose another world: Moon, Mars, or Deepspace.',
    ctaLabel: 'Got it! Next',
    tiltDeg: -1,
    icon: Menu,
  },
  {
    stepNumber: '02',
    title: 'EXPLORE IN 3D',
    body: 'Drag with your mouse or finger to spin the 3D world, scroll to zoom in close, or use the Navigation Control box on the left to orbit and reset the camera.',
    ctaLabel: 'Next',
    tiltDeg: 1,
    icon: Globe,
  },
  {
    stepNumber: '03',
    title: 'MISSION TIMELINE & RELICS',
    body: 'Use the timeline bar at the bottom to browse missions! Click any mission card—or tap any glowing beacon on the map—to zoom in and open its full story dossier.',
    ctaLabel: "Let's Explore!",
    tiltDeg: -1,
    icon: Rocket,
  },
];

export const MapOnboardingPostcards: React.FC<MapOnboardingPostcardsProps> = ({
  zone,
  isTemporarilyHidden = false,
}) => {
  const isMars = zone === 'mars';

  const [hasSeenTutorial, setHasSeenTutorial] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'true') {
        setHasSeenTutorial(true);
      }
    } catch {
      // Ignore storage access errors in restricted iframes
    }
  }, []);

  if (hasSeenTutorial || isTemporarilyHidden) {
    return null;
  }

  const currentStep = TUTORIAL_STEPS[currentStepIndex];
  const StepIcon = currentStep.icon;
  const isLastStep = currentStepIndex === TUTORIAL_STEPS.length - 1;

  const handleAdvance = () => {
    if (!isLastStep) {
      playTelemetryBeep(540);
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      playSuccessChime();
      try {
        window.localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
      } catch {
        // Ignore storage errors
      }
      setHasSeenTutorial(true);
    }
  };

  return (
    <aside
      aria-label="Map Exploration Quick Guide"
      className="pointer-events-none fixed top-16 sm:top-20 right-3 sm:right-5 z-30 w-[calc(100vw-24px)] max-w-[310px] sm:max-w-[330px]"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.stepNumber}
          initial={{ opacity: 0, x: 36, y: 10, scale: 0.94, rotate: currentStep.tiltDeg }}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: currentStep.tiltDeg }}
          exit={{ opacity: 0, x: 40, scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          className={`pointer-events-auto rounded-2xl overflow-hidden backdrop-blur-md shadow-xl border ${
            isMars
              ? 'bg-[rgba(28,20,15,0.88)] border-[#57534E] text-[#F5E6D3]'
              : 'bg-[rgba(10,14,23,0.82)] border-[rgba(248,250,252,0.16)] text-[#F8FAFC]'
          }`}
        >
          {/* Top Accent Hairline Strip */}
          <div
            className={`h-1 w-full ${isMars ? 'bg-[#D97706]' : 'bg-[#38BDF8]'}`}
            aria-hidden="true"
          />

          {/* Postcard Header */}
          <div
            className={`px-4 py-3 flex items-center justify-between gap-2.5 border-b ${
              isMars
                ? 'bg-[#291D16] border-[#57534E]/70'
                : 'bg-[rgba(15,23,42,0.72)] border-[rgba(248,250,252,0.14)]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-bold font-mono tabular-nums ${
                  isMars
                    ? 'bg-[#1C140F] border-[#57534E] text-[#D97706]'
                    : 'bg-[rgba(10,14,23,0.8)] border-[rgba(248,250,252,0.18)] text-[#38BDF8]'
                }`}
              >
                {currentStep.stepNumber}/03
              </span>
              <h3
                className={`font-['Chakra_Petch'] text-sm font-bold uppercase tracking-wide leading-tight ${
                  isMars ? 'text-[#F5E6D3]' : 'text-[#F8FAFC]'
                }`}
              >
                {currentStep.title}
              </h3>
            </div>

            <div
              className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${
                isMars
                  ? 'bg-[#1C140F] border-[#57534E] text-[#D97706]'
                  : 'bg-[rgba(10,14,23,0.8)] border-[rgba(248,250,252,0.16)] text-[#38BDF8]'
              }`}
            >
              <StepIcon className="w-4 h-4" />
            </div>
          </div>

          {/* Postcard Body */}
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex items-start gap-2.5">
              <span
                className={`shrink-0 mt-0.5 w-7 h-7 rounded-lg border flex items-center justify-center ${
                  isMars
                    ? 'bg-[#291D16] border-[#57534E] text-[#D97706]'
                    : 'bg-[rgba(15,23,42,0.72)] border-[rgba(248,250,252,0.16)] text-[#38BDF8]'
                }`}
              >
                {isLastStep ? (
                  <Sparkles className="w-3.5 h-3.5" />
                ) : (
                  <Compass className="w-3.5 h-3.5" />
                )}
              </span>
              <p
                className={`font-['Space_Grotesk'] text-xs sm:text-[13px] font-medium leading-relaxed ${
                  isMars ? 'text-[#E7E5E4]' : 'text-[#94A3B8]'
                }`}
              >
                {currentStep.body}
              </p>
            </div>

            {/* Step Progress Dots + Action Button */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                {TUTORIAL_STEPS.map((step, idx) => (
                  <span
                    key={step.stepNumber}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentStepIndex
                        ? isMars
                          ? 'w-6 bg-[#D97706]'
                          : 'w-6 bg-[#38BDF8]'
                        : idx < currentStepIndex
                        ? isMars
                          ? 'w-2.5 bg-[#C87D32]/70'
                          : 'w-2.5 bg-[#F8FAFC]/60'
                        : isMars
                        ? 'w-2.5 bg-[#44403C]'
                        : 'w-2.5 bg-[rgba(248,250,252,0.18)]'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleAdvance}
                className={`font-['Chakra_Petch'] min-h-[36px] px-4 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 transition-all active:translate-y-0.5 whitespace-nowrap shrink-0 ${
                  isMars
                    ? 'bg-[#D97706] hover:bg-[#C87D32] border-[#D97706] text-[#1C140F]'
                    : 'bg-[#38BDF8] hover:bg-[#7DD3FC] border-[#38BDF8] text-[#0A0E17]'
                }`}
              >
                <span>{currentStep.ctaLabel}</span>
                {!isLastStep && <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </aside>
  );
};
