import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Globe, Rocket, ArrowRight, Sparkles, Compass } from 'lucide-react';
import { playTelemetryBeep, playSuccessChime } from '../utils/audio';

const TUTORIAL_STORAGE_KEY = 'hasSeenMapTutorial';

interface MapOnboardingPostcardsProps {
  /** Temporarily hide while a target or landmark card is open so cards never overlap */
  isTemporarilyHidden?: boolean;
}

interface TutorialStep {
  stepNumber: string;
  title: string;
  body: string;
  ctaLabel: string;
  tiltDeg: number;
  headerBg: string;
  cardBg: string;
  accentBg: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    stepNumber: '01',
    title: 'BACK TO LOBBY',
    body: 'Click the Menu button in the top-left corner anytime to fly back to the spaceship lobby and choose another world: Moon, Mars, or Deepspace.',
    ctaLabel: 'Got it! Next',
    tiltDeg: -1,
    headerBg: 'bg-[#facc15]',
    cardBg: 'bg-[#fffdf7]',
    accentBg: 'bg-[#fef08a]',
    icon: Menu,
  },
  {
    stepNumber: '02',
    title: 'EXPLORE IN 3D',
    body: 'Drag with your mouse or finger to spin the 3D world, scroll to zoom in close, or use the Navigation Control box on the left to orbit and reset the camera.',
    ctaLabel: 'Next',
    tiltDeg: 1,
    headerBg: 'bg-[#fde047]',
    cardBg: 'bg-[#fffbeb]',
    accentBg: 'bg-[#fef08a]',
    icon: Globe,
  },
  {
    stepNumber: '03',
    title: 'MISSION TIMELINE & RELICS',
    body: 'Use the timeline bar at the bottom to browse missions! Click any mission card—or tap any glowing beacon on the map—to zoom in and open its full story dossier.',
    ctaLabel: "Let's Explore!",
    tiltDeg: -1,
    headerBg: 'bg-[#fb923c]',
    cardBg: 'bg-[#fffdf7]',
    accentBg: 'bg-[#fed7aa]',
    icon: Rocket,
  },
];

export const MapOnboardingPostcards: React.FC<MapOnboardingPostcardsProps> = ({
  isTemporarilyHidden = false,
}) => {
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
          className={`pointer-events-auto ${currentStep.cardBg} border-[3px] border-[#1E293B] rounded-3xl overflow-hidden shadow-[0_7px_0_#1E293B,0_18px_32px_rgba(15,23,42,0.45)] text-[#1E293B]`}
        >
          {/* Airmail Postcard Stripe */}
          <div
            className="h-2 w-full border-b-2 border-[#1E293B]"
            style={{
              background:
                'repeating-linear-gradient(135deg, #fb923c 0px 12px, #fffdf7 12px 20px, #fde047 20px 32px, #fffdf7 32px 40px)',
            }}
            aria-hidden="true"
          />

          {/* Postcard Header */}
          <div
            className={`${currentStep.headerBg} border-b-[3px] border-[#1E293B] px-4 py-3 flex items-center justify-between gap-2.5`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="shrink-0 px-2 py-0.5 rounded-lg bg-[#fffdf7] border-2 border-[#1E293B] text-[11px] font-black font-hud-display shadow-[0_2px_0_#1E293B]">
                {currentStep.stepNumber}/03
              </span>
              <h3 className="font-hud-display text-sm sm:text-base font-bold uppercase tracking-wide text-[#1E293B] leading-tight">
                {currentStep.title}
              </h3>
            </div>

            <div className="w-8 h-8 rounded-xl bg-[#fffdf7] border-2 border-[#1E293B] flex items-center justify-center shrink-0">
              <StepIcon className="w-4 h-4 text-[#1E293B]" />
            </div>
          </div>

          {/* Postcard Body */}
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex items-start gap-2.5">
              <span
                className={`shrink-0 mt-0.5 w-7 h-7 rounded-lg ${currentStep.accentBg} border-2 border-[#1E293B] flex items-center justify-center`}
              >
                {isLastStep ? (
                  <Sparkles className="w-3.5 h-3.5 text-[#1E293B]" />
                ) : (
                  <Compass className="w-3.5 h-3.5 text-[#1E293B]" />
                )}
              </span>
              <p className="font-hud-body text-xs sm:text-[13px] font-semibold leading-relaxed text-[#1E293B]">
                {currentStep.body}
              </p>
            </div>

            {/* Step Progress Dots + Action Button */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                {TUTORIAL_STEPS.map((step, idx) => (
                  <span
                    key={step.stepNumber}
                    className={`h-2 rounded-full border border-[#1E293B] transition-all ${
                      idx === currentStepIndex
                        ? 'w-6 bg-[#facc15]'
                        : idx < currentStepIndex
                        ? 'w-2.5 bg-[#fde047]'
                        : 'w-2.5 bg-[#e2e8f0]'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleAdvance}
                className="font-hud-display min-h-[38px] px-4 py-2 rounded-xl bg-[#facc15] hover:bg-[#fde047] border-2 border-[#1E293B] shadow-[0_3px_0_#1E293B] active:translate-y-0.5 active:shadow-none text-xs font-bold uppercase tracking-wide text-[#1E293B] flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0"
              >
                <span>{currentStep.ctaLabel}</span>
                {!isLastStep && <ArrowRight className="w-3.5 h-3.5 stroke-[2.75]" />}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </aside>
  );
};
