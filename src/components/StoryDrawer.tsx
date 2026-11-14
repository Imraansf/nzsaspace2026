import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Artifact } from '../types/space';
import {
  Volume2,
  VolumeX,
  BookOpen,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Cpu,
  Clock,
  MapPin,
  Wrench,
  ExternalLink,
  ArrowLeft,
  Rocket,
  Camera,
  Youtube,
  Scale,
  Ruler,
  Zap,
  Award,
  Star,
  Stamp,
} from 'lucide-react';
import { useNASAVoice } from '../hooks/useNASAVoice';

interface StoryDrawerProps {
  artifact: Artifact | null;
  onClose: () => void;
  onNextArtifact: () => void;
  onPrevArtifact: () => void;
  onInspectModel?: (artifact: Artifact) => void;
}

function extractYouTubeId(url: string): string | null {
  try {
    const cleaned = url.replace(/\s+/g, '');
    const parsed = new URL(cleaned);
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.slice(1) || null;
    }
    return parsed.searchParams.get('v');
  } catch {
    return null;
  }
}

function getZoneMeta(body: Artifact['body']) {
  switch (body) {
    case 'moon':
      return {
        label: 'MOON',
        pinText: 'Lunar Surface Pin',
      };
    case 'mars':
      return {
        label: 'MARS',
        pinText: 'Red Planet Pin',
      };
    default:
      return {
        label: 'DEEP SPACE',
        pinText: 'Cosmic Trajectory Pin',
      };
  }
}

export const StoryDrawer: React.FC<StoryDrawerProps> = ({
  artifact,
  onClose,
  onNextArtifact,
  onPrevArtifact,
  onInspectModel,
}) => {
  if (!artifact) return null;

  const isMars = artifact.body === 'mars';
  const [heroImgError, setHeroImgError] = useState(false);
  const [galleryErrors, setGalleryErrors] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const nasaVoice = useNASAVoice({
    defaultPitch: artifact.id === 'spirit-and-opportunity' ? 1.02 : 0.95,
    defaultRate: 0.95,
    defaultFilterEnabled: true,
  });

  const narrationText = `${artifact.name}. ${artifact.firstPersonMonologue}`;
  const cleanYoutubeUrl = artifact.youtubeUrl
    ? artifact.youtubeUrl.replace(/\s+/g, '')
    : undefined;
  const youtubeId = cleanYoutubeUrl ? extractYouTubeId(cleanYoutubeUrl) : null;
  const zoneMeta = getZoneMeta(artifact.body);

  useEffect(() => {
    setHeroImgError(false);
    setGalleryErrors({});
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    return () => {
      nasaVoice.stop();
    };
  }, [artifact.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        nasaVoice.stop();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const diaryPhotos = (artifact.galleryImages || []).filter(
    (g) => g.postcardTarget === 'diary'
  );
  const historyPhotos = (artifact.galleryImages || []).filter(
    (g) => g.postcardTarget === 'history'
  );
  const statsPhotos = (artifact.galleryImages || []).filter(
    (g) => g.postcardTarget === 'stats'
  );

  const statPills = artifact.statPills || {
    mass: artifact.massKg ? `${artifact.massKg.toLocaleString()} kg` : 'See Specs',
    size: 'Mission Hardware',
    power: 'Solar / RTG Power',
  };

  const legacyBullets = [
    {
      lead: 'Big Moment:',
      text: artifact.storytellingHook,
      icon: Rocket,
    },
    {
      lead: 'Why It Stayed:',
      text: artifact.story.whyLeftBehind,
      icon: MapPin,
    },
    {
      lead: 'Amazing Discovery:',
      text: artifact.scientificDiscoveries,
      icon: Sparkles,
    },
    ...(artifact.funFacts[0]
      ? [
          {
            lead: 'Cool Space Fact:',
            text: artifact.funFacts[0],
            icon: Star,
          },
        ]
      : []),
  ];

  // Zone-specific theme tokens
  const cardSurface = isMars
    ? 'bg-[#291D16] border border-[#57534E] text-[#F5E6D3] shadow-xl'
    : 'bg-[rgba(10,14,23,0.86)] backdrop-blur-md border border-[rgba(248,250,252,0.16)] text-[#F8FAFC] shadow-xl';

  const cardHeaderBg = isMars
    ? 'bg-[#1C140F] border-b border-[#57534E]'
    : 'bg-[rgba(15,23,42,0.75)] border-b border-[rgba(248,250,252,0.14)]';

  const subCardSurface = isMars
    ? 'bg-[#1C140F] border border-[#44403C]'
    : 'bg-[rgba(15,23,42,0.65)] border border-[rgba(248,250,252,0.14)]';

  const stepBadgeClass = isMars
    ? 'px-2.5 py-1 rounded-xl bg-[#D97706] border border-[#D97706] text-xs font-bold font-mono uppercase text-[#1C140F]'
    : 'px-2.5 py-1 rounded-xl bg-[#38BDF8] border border-[#38BDF8] text-xs font-bold font-mono uppercase text-[#0A0E17]';

  const headerIconBox = isMars
    ? 'w-10 h-10 rounded-xl bg-[#291D16] border border-[#57534E] flex items-center justify-center shrink-0 text-[#D97706]'
    : 'w-10 h-10 rounded-xl bg-[rgba(10,14,23,0.8)] border border-[rgba(248,250,252,0.16)] flex items-center justify-center shrink-0 text-[#38BDF8]';

  const primaryTitle = isMars ? 'text-[#F5E6D3]' : 'text-[#F8FAFC]';
  const secondaryText = isMars ? 'text-[#A8A29E]' : 'text-[#94A3B8]';
  const bodyText = isMars ? 'text-[#E7E5E4]' : 'text-[#F8FAFC]';
  const accentText = isMars ? 'text-[#D97706]' : 'text-[#38BDF8]';

  return (
    <div
      ref={scrollRef}
      className={`fixed inset-0 z-50 overflow-y-auto font-['Space_Grotesk'] ${primaryTitle}`}
      style={{
        background: isMars
          ? 'radial-gradient(ellipse at 20% 10%, rgba(217, 119, 6, 0.14) 0%, transparent 55%), radial-gradient(ellipse at 85% 20%, rgba(200, 125, 50, 0.12) 0%, transparent 50%), linear-gradient(155deg, #1C140F 0%, #291D16 55%, #1C140F 100%)'
          : 'radial-gradient(ellipse at 18% 12%, rgba(56, 189, 248, 0.10) 0%, transparent 50%), linear-gradient(155deg, #06090F 0%, #0A0E17 55%, #06090F 100%)',
      }}
    >
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-7 pb-14">
        {/* ================================================================ */}
        {/* 1. COMPACT MISSION HEADER BAR                                    */}
        {/* ================================================================ */}
        <header
          className={`rounded-3xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 ${cardSurface}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`shrink-0 px-3 py-1 rounded-xl -rotate-2 flex items-center gap-1 border ${
                isMars
                  ? 'bg-[#D97706] border-[#F5E6D3]/30 text-[#1C140F]'
                  : 'bg-[#38BDF8] border-[#38BDF8] text-[#0A0E17]'
              }`}
            >
              <span className="text-sm font-bold font-mono tabular-nums">
                #{artifact.artifactNumber}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1
                  className={`font-['Chakra_Petch'] text-lg sm:text-xl font-bold tracking-tight truncate ${primaryTitle}`}
                >
                  {artifact.name}
                </h1>
                <span
                  className={`font-['Chakra_Petch'] inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${
                    isMars
                      ? 'bg-[#1C140F] border-[#D97706] text-[#D97706]'
                      : 'bg-[rgba(15,23,42,0.72)] border-[rgba(248,250,252,0.18)] text-[#38BDF8]'
                  }`}
                >
                  <Rocket className="w-3 h-3" />
                  {zoneMeta.label}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-bold font-mono tabular-nums ${
                    isMars
                      ? 'bg-[#1C140F] border-[#57534E] text-[#F5E6D3]'
                      : 'bg-[rgba(15,23,42,0.72)] border-[rgba(248,250,252,0.18)] text-[#F8FAFC]'
                  }`}
                >
                  {artifact.year}
                </span>
              </div>
              <p className={`font-['Space_Grotesk'] text-xs font-medium truncate mt-0.5 ${secondaryText}`}>
                {artifact.agency} • {artifact.categoryLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 ml-auto">
            {onInspectModel && artifact.model3dUrl && (
              <button
                onClick={() => onInspectModel(artifact)}
                className={`font-['Chakra_Petch'] min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:translate-y-0.5 ${
                  isMars
                    ? 'bg-[#1C140F] hover:bg-[#44403C] border-[#57534E] hover:border-[#D97706] text-[#F5E6D3]'
                    : 'bg-[rgba(15,23,42,0.72)] hover:bg-[rgba(248,250,252,0.12)] border-[rgba(248,250,252,0.18)] text-[#F8FAFC]'
                }`}
                title="Inspect 3D CAD Model"
              >
                <Cpu className={`w-4 h-4 ${accentText}`} />
                <span className="hidden sm:inline">3D Model</span>
              </button>
            )}

            <button
              onClick={() => {
                nasaVoice.stop();
                onClose();
              }}
              className={`font-['Chakra_Petch'] min-h-[40px] px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:translate-y-0.5 ${
                isMars
                  ? 'bg-[#D97706] hover:bg-[#C87D32] border-[#D97706] text-[#1C140F]'
                  : 'bg-[#38BDF8] hover:bg-[#7DD3FC] border-[#38BDF8] text-[#0A0E17]'
              }`}
              title="Back to 3D Map (Esc)"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Back to Map</span>
            </button>
          </div>
        </header>

        {/* ================================================================ */}
        {/* 2. COMPACT MEDIA HEADER (PHOTO + YOUTUBE VIDEO)                  */}
        {/* ================================================================ */}
        <section className={`rounded-3xl p-4 sm:p-5 ${cardSurface}`}>
          <div
            className={`grid gap-4 items-stretch ${
              youtubeId ? 'grid-cols-1 md:grid-cols-12' : 'grid-cols-1'
            }`}
          >
            {/* Mission Photo Card */}
            <div
              className={`flex flex-col rounded-2xl overflow-hidden border ${
                isMars
                  ? 'border-[#44403C] bg-[#1C140F]'
                  : 'border-[rgba(248,250,252,0.16)] bg-[rgba(15,23,42,0.72)]'
              } ${youtubeId ? 'md:col-span-5' : 'md:grid md:grid-cols-12'}`}
            >
              <div
                className={`relative overflow-hidden ${
                  isMars ? 'bg-[#1C140F]' : 'bg-[#06090F]'
                } ${
                  youtubeId
                    ? 'h-36 sm:h-40 w-full'
                    : 'h-40 sm:h-44 w-full md:col-span-7'
                }`}
              >
                <div
                  className={`font-['Chakra_Petch'] absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[10px] font-bold uppercase shadow-sm ${
                    isMars
                      ? 'bg-[#D97706] border-[#1C140F] text-[#1C140F]'
                      : 'bg-[#38BDF8] border-[#0A0E17] text-[#0A0E17]'
                  }`}
                >
                  <Camera className="w-3 h-3" />
                  <span>Mission Photo</span>
                </div>

                {!youtubeId && (
                  <div
                    className={`font-['Chakra_Petch'] absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase shadow-sm ${
                      isMars
                        ? 'bg-[#1C140F]/90 border-[#57534E] text-[#F5E6D3]'
                        : 'bg-[rgba(10,14,23,0.85)] border-[rgba(248,250,252,0.2)] text-[#F8FAFC]'
                    }`}
                  >
                    <Award className={`w-3 h-3 ${accentText}`} />
                    <span>Archive Snapshot</span>
                  </div>
                )}

                {artifact.imageUrl && !heroImgError ? (
                  <img
                    src={artifact.imageUrl}
                    alt={artifact.name}
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-full h-full flex flex-col items-center justify-center p-4 text-center ${
                      isMars
                        ? 'bg-gradient-to-br from-[#291D16] to-[#1C140F] text-[#F5E6D3]'
                        : 'bg-gradient-to-br from-[#0F172A] to-[#06090F] text-[#F8FAFC]'
                    }`}
                  >
                    <Rocket className={`w-8 h-8 mb-1 ${accentText}`} />
                    <p className="font-['Chakra_Petch'] text-xs font-bold">{artifact.name}</p>
                    <p className={`font-mono text-[11px] ${secondaryText}`}>
                      NASA Archive • {artifact.year}
                    </p>
                  </div>
                )}
              </div>

              <div
                className={`px-3.5 py-2.5 text-xs font-['Space_Grotesk'] font-medium flex flex-col justify-center ${
                  isMars ? 'bg-[#1C140F] text-[#E7E5E4]' : 'bg-[rgba(15,23,42,0.72)] text-[#F8FAFC]'
                } ${
                  youtubeId
                    ? isMars
                      ? 'border-t border-[#44403C]'
                      : 'border-t border-[rgba(248,250,252,0.14)]'
                    : isMars
                    ? 'md:col-span-5 md:border-l border-t md:border-t-0 border-[#44403C] p-5 space-y-2'
                    : 'md:col-span-5 md:border-l border-t md:border-t-0 border-[rgba(248,250,252,0.14)] p-5 space-y-2'
                }`}
              >
                {!youtubeId && (
                  <span
                    className={`font-['Chakra_Petch'] inline-flex w-fit items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[10px] font-bold uppercase ${
                      isMars
                        ? 'bg-[#D97706] border-[#D97706] text-[#1C140F]'
                        : 'bg-[#38BDF8] border-[#38BDF8] text-[#0A0E17]'
                    }`}
                  >
                    Historic NASA Frame
                  </span>
                )}
                <p className={`leading-snug line-clamp-2 ${secondaryText}`}>
                  {artifact.imageCaption ||
                    `${artifact.name} — NASA Historical Archive`}
                </p>
              </div>
            </div>

            {/* Embedded YouTube Video */}
            {youtubeId && (
              <div
                className={`md:col-span-7 flex flex-col rounded-2xl overflow-hidden border ${
                  isMars
                    ? 'border-[#44403C] bg-[#1C140F]'
                    : 'border-[rgba(248,250,252,0.16)] bg-[rgba(15,23,42,0.72)]'
                }`}
              >
                <div
                  className={`px-3.5 py-2 border-b flex items-center justify-between gap-2 ${
                    isMars
                      ? 'bg-[#1C140F] border-[#44403C]'
                      : 'bg-[rgba(10,14,23,0.85)] border-[rgba(248,250,252,0.14)]'
                  }`}
                >
                  <div
                    className={`font-['Chakra_Petch'] flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${primaryTitle}`}
                  >
                    <Youtube className={`w-4 h-4 ${accentText}`} />
                    <span>Mission Video Feed</span>
                  </div>
                  {cleanYoutubeUrl && (
                    <a
                      href={cleanYoutubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`font-['Chakra_Petch'] inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold transition-colors ${
                        isMars
                          ? 'bg-[#291D16] hover:bg-[#D97706] border-[#57534E] text-[#F5E6D3] hover:text-[#1C140F]'
                          : 'bg-[rgba(15,23,42,0.75)] hover:bg-[#38BDF8] border-[rgba(248,250,252,0.18)] text-[#F8FAFC] hover:text-[#0A0E17]'
                      }`}
                    >
                      <span>Open YouTube</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>

                <div className="relative w-full h-36 sm:h-40 bg-black flex-1">
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
                    title={`${artifact.name} Mission Video`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ================================================================ */}
        {/* 3. POSTCARDS AREA (RESETS ANIMATIONS PER ARTIFACT)               */}
        {/* ================================================================ */}
        <div key={artifact.id} className="space-y-8">
          {/* POSTCARD 01 — WIDE CENTERED FEATURE CARD (-1deg tilt) */}
          <motion.article
            initial={{ opacity: 0, y: 28, rotate: -1 }}
            whileInView={{ opacity: 1, y: 0, rotate: -1 }}
            viewport={{ once: true, amount: 0.2 }}
            whileHover={{ rotate: 0, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className={`max-w-4xl mx-auto rounded-3xl overflow-hidden ${cardSurface}`}
          >
            {/* Top Accent Bar */}
            <div
              className={`h-1.5 w-full ${isMars ? 'bg-[#D97706]' : 'bg-[#38BDF8]'}`}
              aria-hidden="true"
            />

            <div className={`${cardHeaderBg} px-6 py-4 flex flex-wrap items-center justify-between gap-4`}>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={stepBadgeClass}>01</span>
                <div>
                  <h2 className={`font-['Chakra_Petch'] text-lg sm:text-xl font-bold uppercase tracking-tight ${primaryTitle}`}>
                    My Space Diary
                  </h2>
                  <p className={`font-['Space_Grotesk'] text-xs font-medium ${secondaryText}`}>
                    A postcard straight from {zoneMeta.label.toLowerCase()}!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (nasaVoice.isSpeaking) {
                      nasaVoice.stop();
                    } else {
                      nasaVoice.speakMissionLog(
                        narrationText,
                        nasaVoice.filterEnabled
                      );
                    }
                  }}
                  className={`font-['Chakra_Petch'] min-h-[40px] px-4 py-2 rounded-xl border active:translate-y-0.5 text-xs font-bold flex items-center gap-2 transition-all ${
                    nasaVoice.isSpeaking
                      ? isMars
                        ? 'bg-[#D97706] border-[#D97706] text-[#1C140F]'
                        : 'bg-[#38BDF8] border-[#38BDF8] text-[#0A0E17]'
                      : isMars
                      ? 'bg-[#291D16] hover:bg-[#44403C] border-[#57534E] text-[#F5E6D3]'
                      : 'bg-[rgba(10,14,23,0.8)] hover:bg-[rgba(248,250,252,0.12)] border-[rgba(248,250,252,0.18)] text-[#F8FAFC]'
                  }`}
                >
                  {nasaVoice.isSpeaking ? (
                    <>
                      <VolumeX className="w-4 h-4" />
                      <span>Stop Story</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className={`w-4 h-4 ${accentText}`} />
                      <span>Listen to Story</span>
                    </>
                  )}
                </button>

                {/* Decorative Postage Stamp */}
                <div
                  className={`hidden sm:flex flex-col items-center justify-center w-14 h-14 rounded-xl border border-dashed rotate-3 shrink-0 ${
                    isMars
                      ? 'bg-[#291D16] border-[#57534E]'
                      : 'bg-[rgba(10,14,23,0.8)] border-[rgba(248,250,252,0.22)]'
                  }`}
                >
                  <Stamp className={`w-5 h-5 ${accentText}`} />
                  <span className={`font-mono text-[9px] font-bold uppercase tracking-wider mt-0.5 ${primaryTitle}`}>
                    NASA
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-5">
              <p className={`font-['Chakra_Petch'] text-sm font-bold uppercase tracking-wide ${accentText}`}>
                “{artifact.story.headline}”
              </p>

              <div
                className={`grid gap-6 items-center ${
                  diaryPhotos.length > 0 ? 'md:grid-cols-12' : 'grid-cols-1'
                }`}
              >
                <blockquote
                  className={`font-['Space_Grotesk'] text-base leading-relaxed font-medium rounded-2xl p-6 ${subCardSurface} ${bodyText} ${
                    diaryPhotos.length > 0 ? 'md:col-span-8' : ''
                  }`}
                >
                  “{artifact.firstPersonMonologue}”
                </blockquote>

                {diaryPhotos.map((photo) =>
                  !galleryErrors[photo.url] ? (
                    <figure
                      key={photo.url}
                      className={`md:col-span-4 rounded-2xl p-2.5 ${subCardSurface}`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setGalleryErrors((prev) => ({
                            ...prev,
                            [photo.url]: true,
                          }))
                        }
                        className={`w-full h-36 object-cover rounded-xl border ${
                          isMars ? 'border-[#44403C]' : 'border-[rgba(248,250,252,0.14)]'
                        }`}
                      />
                      <figcaption className={`font-['Space_Grotesk'] mt-2 px-1 text-xs font-medium leading-snug ${secondaryText}`}>
                        {photo.caption}
                      </figcaption>
                    </figure>
                  ) : null
                )}
              </div>
            </div>
          </motion.article>

          {/* ============================================================== */}
          {/* STAGGERED 2-COLUMN INCLINED POSTCARD GRID (02, 03, 04, 05)     */}
          {/* ============================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start pt-2">
            {/* POSTCARD 02 — "WHERE AM I?" (-1.5deg tilt) */}
            <motion.article
              initial={{ opacity: 0, y: 36, rotate: -1.5 }}
              whileInView={{ opacity: 1, y: 0, rotate: -1.5 }}
              viewport={{ once: true, amount: 0.2 }}
              whileHover={{ rotate: 0, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className={`rounded-3xl overflow-hidden ${cardSurface}`}
            >
              <div className={`${cardHeaderBg} px-6 py-4 flex items-center justify-between gap-3`}>
                <div className="flex items-center gap-3">
                  <span className={stepBadgeClass}>02</span>
                  <div>
                    <h2 className={`font-['Chakra_Petch'] text-base sm:text-lg font-bold uppercase tracking-tight ${primaryTitle}`}>
                      Where Am I?
                    </h2>
                    <p className={`font-['Space_Grotesk'] text-xs font-medium ${secondaryText}`}>
                      Cosmic GPS spot &amp; coordinates
                    </p>
                  </div>
                </div>
                <div className={headerIconBox}>
                  <MapPin className="w-5 h-5" />
                </div>
              </div>

              <div className="p-6 sm:p-7 space-y-5">
                <div
                  className={`font-['Chakra_Petch'] inline-flex w-fit items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${subCardSurface} ${primaryTitle}`}
                >
                  <MapPin className={`w-3.5 h-3.5 ${accentText}`} />
                  <span>{zoneMeta.pinText}</span>
                </div>

                <div className={`${subCardSurface} rounded-2xl p-4 sm:p-5 space-y-1`}>
                  <span className={`font-['Chakra_Petch'] text-[11px] font-bold uppercase tracking-wider block ${accentText}`}>
                    Landing Spot / Region
                  </span>
                  <p className={`font-['Space_Grotesk'] text-sm sm:text-base font-semibold leading-snug ${primaryTitle}`}>
                    {artifact.locationName}
                  </p>
                </div>

                <div className={`${subCardSurface} rounded-2xl p-4 sm:p-5 space-y-1.5`}>
                  <span className={`font-['Chakra_Petch'] text-[11px] font-bold uppercase tracking-wider block ${accentText}`}>
                    {artifact.hasSurfaceCoordinates
                      ? 'GPS Coordinates'
                      : 'Orbit / Trajectory'}
                  </span>
                  <p className={`text-sm font-bold font-mono tabular-nums leading-snug ${primaryTitle}`}>
                    {artifact.coordinates.display}
                  </p>
                  {artifact.distanceAu && (
                    <p className={`text-xs font-mono pt-1 ${secondaryText}`}>
                      Distance: {artifact.distanceAu}
                    </p>
                  )}
                </div>
              </div>
            </motion.article>

            {/* POSTCARD 03 — "MISSION CLOCK" (+1.5deg tilt, staggered offset) */}
            <motion.article
              initial={{ opacity: 0, y: 36, rotate: 1.5 }}
              whileInView={{ opacity: 1, y: 0, rotate: 1.5 }}
              viewport={{ once: true, amount: 0.2 }}
              whileHover={{ rotate: 0, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className={`md:mt-10 rounded-3xl overflow-hidden ${cardSurface}`}
            >
              <div className={`${cardHeaderBg} px-6 py-4 flex items-center justify-between gap-3`}>
                <div className="flex items-center gap-3">
                  <span className={stepBadgeClass}>03</span>
                  <div>
                    <h2 className={`font-['Chakra_Petch'] text-base sm:text-lg font-bold uppercase tracking-tight ${primaryTitle}`}>
                      Mission Clock
                    </h2>
                    <p className={`font-['Space_Grotesk'] text-xs font-medium ${secondaryText}`}>
                      Launch, landing &amp; survival time
                    </p>
                  </div>
                </div>
                <div className={headerIconBox}>
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="p-6 sm:p-7 space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  <div className={`${subCardSurface} rounded-2xl p-3 text-center`}>
                    <span
                      className={`font-['Chakra_Petch'] inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase mb-1 ${
                        isMars
                          ? 'bg-[#D97706] text-[#1C140F]'
                          : 'bg-[#38BDF8] text-[#0A0E17]'
                      }`}
                    >
                      Launch
                    </span>
                    <p className={`text-xs font-bold font-mono tabular-nums break-words ${primaryTitle}`}>
                      {artifact.timeline.launched}
                    </p>
                  </div>

                  <div className={`${subCardSurface} rounded-2xl p-3 text-center`}>
                    <span
                      className={`font-['Chakra_Petch'] inline-block px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase mb-1 ${
                        isMars
                          ? 'bg-[#291D16] border-[#57534E] text-[#F5E6D3]'
                          : 'bg-[rgba(10,14,23,0.85)] border-[rgba(248,250,252,0.18)] text-[#F8FAFC]'
                      }`}
                    >
                      Arrival
                    </span>
                    <p className={`text-xs font-bold font-mono tabular-nums break-words ${primaryTitle}`}>
                      {artifact.timeline.landed || 'Flyby'}
                    </p>
                  </div>

                  <div className={`${subCardSurface} rounded-2xl p-3 text-center`}>
                    <span
                      className={`font-['Chakra_Petch'] inline-block px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase mb-1 ${
                        isMars
                          ? 'bg-[#291D16] border-[#57534E] text-[#A8A29E]'
                          : 'bg-[rgba(10,14,23,0.85)] border-[rgba(248,250,252,0.18)] text-[#94A3B8]'
                      }`}
                    >
                      Ended
                    </span>
                    <p className={`text-xs font-bold font-mono tabular-nums break-words ${primaryTitle}`}>
                      {artifact.timeline.ended || 'Ongoing'}
                    </p>
                  </div>
                </div>

                <p className={`${subCardSurface} text-xs sm:text-sm font-medium font-mono rounded-2xl px-4 py-3 leading-snug ${secondaryText}`}>
                  {artifact.timeline.summary}
                </p>

                <div className={`${subCardSurface} rounded-2xl p-4 sm:p-5 space-y-2`}>
                  <div
                    className={`font-['Chakra_Petch'] inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      isMars
                        ? 'bg-[#D97706] text-[#1C140F]'
                        : 'bg-[#38BDF8] text-[#0A0E17]'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Planned vs. Actual</span>
                  </div>
                  <p className={`font-['Space_Grotesk'] text-sm font-medium leading-relaxed ${bodyText}`}>
                    {artifact.plannedVsActual}
                  </p>
                </div>
              </div>
            </motion.article>

            {/* POSTCARD 04 — "HISTORY & SCIENTIFIC LEGACY" (-1.5deg tilt) */}
            <motion.article
              initial={{ opacity: 0, y: 36, rotate: -1.5 }}
              whileInView={{ opacity: 1, y: 0, rotate: -1.5 }}
              viewport={{ once: true, amount: 0.2 }}
              whileHover={{ rotate: 0, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className={`rounded-3xl overflow-hidden ${cardSurface}`}
            >
              <div className={`${cardHeaderBg} px-6 py-4 flex items-center justify-between gap-3`}>
                <div className="flex items-center gap-3">
                  <span className={stepBadgeClass}>04</span>
                  <div>
                    <h2 className={`font-['Chakra_Petch'] text-base sm:text-lg font-bold uppercase tracking-tight ${primaryTitle}`}>
                      History &amp; Scientific Legacy
                    </h2>
                    <p className={`font-['Space_Grotesk'] text-xs font-medium ${secondaryText}`}>
                      Quick facts on why it mattered
                    </p>
                  </div>
                </div>
                <div className={headerIconBox}>
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>

              <div className="p-6 sm:p-7 space-y-5">
                <ul className="space-y-4">
                  {legacyBullets.map((item) => {
                    const BulletIcon = item.icon;
                    return (
                      <li
                        key={item.lead}
                        className={`flex items-start gap-3.5 rounded-2xl p-4 ${subCardSurface}`}
                      >
                        <span
                          className={`shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center mt-0.5 ${
                            isMars
                              ? 'bg-[#D97706] border-[#D97706] text-[#1C140F]'
                              : 'bg-[#38BDF8] border-[#38BDF8] text-[#0A0E17]'
                          }`}
                        >
                          <BulletIcon className="w-4 h-4" />
                        </span>
                        <p className={`font-['Space_Grotesk'] text-sm leading-relaxed font-normal ${bodyText}`}>
                          <strong className={`font-['Chakra_Petch'] font-bold mr-1.5 ${primaryTitle}`}>
                            {item.lead}
                          </strong>
                          {item.text}
                        </p>
                      </li>
                    );
                  })}
                </ul>

                {historyPhotos.map((photo) =>
                  !galleryErrors[photo.url] ? (
                    <figure
                      key={photo.url}
                      className={`${subCardSurface} rounded-2xl p-2.5 flex items-center gap-3.5`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setGalleryErrors((prev) => ({
                            ...prev,
                            [photo.url]: true,
                          }))
                        }
                        className={`w-28 h-20 object-cover rounded-xl border shrink-0 ${
                          isMars ? 'border-[#44403C]' : 'border-[rgba(248,250,252,0.14)]'
                        }`}
                      />
                      <figcaption className={`font-['Space_Grotesk'] text-xs font-medium leading-snug ${secondaryText}`}>
                        {photo.caption}
                      </figcaption>
                    </figure>
                  ) : null
                )}
              </div>
            </motion.article>

            {/* POSTCARD 05 — "SPACECRAFT STATS" (+1.5deg tilt, staggered offset) */}
            <motion.article
              initial={{ opacity: 0, y: 36, rotate: 1.5 }}
              whileInView={{ opacity: 1, y: 0, rotate: 1.5 }}
              viewport={{ once: true, amount: 0.2 }}
              whileHover={{ rotate: 0, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className={`md:mt-10 rounded-3xl overflow-hidden ${cardSurface}`}
            >
              <div className={`${cardHeaderBg} px-6 py-4 flex items-center justify-between gap-3`}>
                <div className="flex items-center gap-3">
                  <span className={stepBadgeClass}>05</span>
                  <div>
                    <h2 className={`font-['Chakra_Petch'] text-base sm:text-lg font-bold uppercase tracking-tight ${primaryTitle}`}>
                      Spacecraft Stats
                    </h2>
                    <p className={`font-['Space_Grotesk'] text-xs font-medium ${secondaryText}`}>
                      Size, power &amp; science gadgets
                    </p>
                  </div>
                </div>
                <div className={headerIconBox}>
                  <Wrench className="w-5 h-5" />
                </div>
              </div>

              <div className="p-6 sm:p-7 space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  <div className={`${subCardSurface} rounded-2xl p-3`}>
                    <div className={`font-['Chakra_Petch'] flex items-center gap-1 text-[10px] font-bold uppercase ${accentText}`}>
                      <Scale className="w-3.5 h-3.5" />
                      <span>Mass</span>
                    </div>
                    <p className={`text-xs sm:text-sm font-mono font-bold mt-1 leading-tight ${primaryTitle}`}>
                      {statPills.mass}
                    </p>
                  </div>

                  <div className={`${subCardSurface} rounded-2xl p-3`}>
                    <div className={`font-['Chakra_Petch'] flex items-center gap-1 text-[10px] font-bold uppercase ${accentText}`}>
                      <Ruler className="w-3.5 h-3.5" />
                      <span>Size</span>
                    </div>
                    <p className={`text-xs sm:text-sm font-mono font-bold mt-1 leading-tight ${primaryTitle}`}>
                      {statPills.size}
                    </p>
                  </div>

                  <div className={`${subCardSurface} rounded-2xl p-3`}>
                    <div className={`font-['Chakra_Petch'] flex items-center gap-1 text-[10px] font-bold uppercase ${accentText}`}>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Power</span>
                    </div>
                    <p className={`text-xs sm:text-sm font-mono font-bold mt-1 leading-tight ${primaryTitle}`}>
                      {statPills.power}
                    </p>
                  </div>
                </div>

                <p className={`${subCardSurface} font-['Space_Grotesk'] text-xs sm:text-sm font-medium rounded-2xl p-4 leading-relaxed ${bodyText}`}>
                  {artifact.specs}
                </p>

                <div>
                  <h3 className={`font-['Chakra_Petch'] text-xs font-bold uppercase tracking-wider mb-2.5 ${primaryTitle}`}>
                    Key Onboard Gadgets
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {artifact.instruments.map((inst, idx) => (
                      <span
                        key={idx}
                        className={`font-['Space_Grotesk'] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium ${
                          isMars
                            ? 'bg-[#1C140F] border-[#57534E] text-[#F5E6D3]'
                            : 'bg-[rgba(15,23,42,0.72)] border-[rgba(248,250,252,0.16)] text-[#F8FAFC]'
                        }`}
                      >
                        <span className={`font-mono text-[10px] font-bold ${accentText}`}>
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span>{inst}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {statsPhotos.map((photo) =>
                  !galleryErrors[photo.url] ? (
                    <figure
                      key={photo.url}
                      className={`${subCardSurface} rounded-2xl p-2.5 flex items-center gap-3.5`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setGalleryErrors((prev) => ({
                            ...prev,
                            [photo.url]: true,
                          }))
                        }
                        className={`w-28 h-20 object-cover rounded-xl border shrink-0 ${
                          isMars ? 'border-[#44403C]' : 'border-[rgba(248,250,252,0.14)]'
                        }`}
                      />
                      <figcaption className={`font-['Space_Grotesk'] text-xs font-medium leading-snug ${secondaryText}`}>
                        {photo.caption}
                      </figcaption>
                    </figure>
                  ) : null
                )}

                {artifact.officialSource && (
                  <div
                    className={`pt-3 border-t flex items-center justify-between gap-3 text-xs ${
                      isMars ? 'border-[#57534E]/60' : 'border-[rgba(248,250,252,0.14)]'
                    }`}
                  >
                    <span className={`inline-flex items-center gap-1.5 font-mono font-bold truncate ${secondaryText}`}>
                      <BookOpen className={`w-4 h-4 shrink-0 ${accentText}`} />
                      {artifact.catalogRef || 'NASA Archive'}
                    </span>
                    <a
                      href={artifact.officialSource}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`font-['Chakra_Petch'] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold shrink-0 transition-colors ${
                        isMars
                          ? 'bg-[#1C140F] hover:bg-[#D97706] border-[#57534E] hover:border-[#D97706] text-[#F5E6D3] hover:text-[#1C140F]'
                          : 'bg-[rgba(15,23,42,0.75)] hover:bg-[#38BDF8] border-[rgba(248,250,252,0.18)] hover:border-[#38BDF8] text-[#F8FAFC] hover:text-[#0A0E17]'
                      }`}
                    >
                      <span>NASA Page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </motion.article>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 4. BOTTOM NAVIGATION STRIP (PREV / NEXT ARTIFACT)                */}
        {/* ================================================================ */}
        <footer className="flex items-center justify-between gap-4 pt-4">
          <button
            onClick={onPrevArtifact}
            className={`font-['Chakra_Petch'] min-h-[44px] px-5 py-2.5 rounded-2xl border active:translate-y-0.5 text-sm font-bold flex items-center gap-2 transition-all ${
              isMars
                ? 'bg-[#291D16] hover:bg-[#44403C] border-[#57534E] text-[#F5E6D3]'
                : 'bg-[rgba(10,14,23,0.82)] hover:bg-[rgba(248,250,252,0.1)] border-[rgba(248,250,252,0.16)] text-[#F8FAFC]'
            }`}
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Previous Artifact</span>
          </button>

          <button
            onClick={() => {
              nasaVoice.stop();
              onClose();
            }}
            className={`font-['Chakra_Petch'] min-h-[42px] px-4 py-2 rounded-2xl border text-xs font-bold transition-colors hidden sm:inline-flex ${
              isMars
                ? 'bg-[#1C140F] hover:bg-[#291D16] border-[#57534E] text-[#A8A29E] hover:text-[#F5E6D3]'
                : 'bg-[rgba(10,14,23,0.78)] hover:bg-[rgba(248,250,252,0.1)] border-[rgba(248,250,252,0.16)] text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            Back to {zoneMeta.label} Globe
          </button>

          <button
            onClick={onNextArtifact}
            className={`font-['Chakra_Petch'] min-h-[44px] px-5 py-2.5 rounded-2xl border active:translate-y-0.5 text-sm font-bold flex items-center gap-2 transition-all ${
              isMars
                ? 'bg-[#D97706] hover:bg-[#C87D32] border-[#D97706] text-[#1C140F]'
                : 'bg-[#38BDF8] hover:bg-[#7DD3FC] border-[#38BDF8] text-[#0A0E17]'
            }`}
          >
            <span>Next Artifact</span>
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </footer>
      </div>
    </div>
  );
};
