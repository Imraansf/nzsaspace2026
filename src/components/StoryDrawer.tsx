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
        badgeBg: 'bg-[#fef08a]',
        pinText: 'Lunar Surface Pin',
      };
    case 'mars':
      return {
        label: 'MARS',
        badgeBg: 'bg-[#fed7aa]',
        pinText: 'Red Planet Pin',
      };
    default:
      return {
        label: 'DEEP SPACE',
        badgeBg: 'bg-[#bae6fd]',
        pinText: 'Cosmic Trajectory Pin',
      };
  }
}

const INSTRUMENT_TAG_COLORS = [
  'bg-[#fef08a] border-[#1E293B]',
  'bg-[#bae6fd] border-[#1E293B]',
  'bg-[#fed7aa] border-[#1E293B]',
  'bg-[#bbf7d0] border-[#1E293B]',
  'bg-[#fde68a] border-[#1E293B]',
  'bg-[#e0f2fe] border-[#1E293B]',
];

const POSTCARD_SHADOW =
  'shadow-[0_7px_0_#1E293B,0_18px_30px_rgba(30,41,59,0.18)]';

export const StoryDrawer: React.FC<StoryDrawerProps> = ({
  artifact,
  onClose,
  onNextArtifact,
  onPrevArtifact,
  onInspectModel,
}) => {
  if (!artifact) return null;

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
      iconBg: 'bg-[#fb923c]',
    },
    {
      lead: 'Why It Stayed:',
      text: artifact.story.whyLeftBehind,
      icon: MapPin,
      iconBg: 'bg-[#facc15]',
    },
    {
      lead: 'Amazing Discovery:',
      text: artifact.scientificDiscoveries,
      icon: Sparkles,
      iconBg: 'bg-[#6ee7b7]',
    },
    ...(artifact.funFacts[0]
      ? [
          {
            lead: 'Cool Space Fact:',
            text: artifact.funFacts[0],
            icon: Star,
            iconBg: 'bg-[#38bdf8]',
          },
        ]
      : []),
  ];

  return (
    <div
      ref={scrollRef}
      className="fixed inset-0 z-50 overflow-y-auto font-sans text-[#1E293B]"
      style={{
        background:
          'linear-gradient(155deg, #ea580c 0%, #f59e0b 28%, #fbbf24 58%, #bae6fd 100%)',
      }}
    >
      {/* Subtle Cosmic Lobby Sunburst Overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-20"
        style={{
          background:
            'repeating-conic-gradient(from 0deg at 50% 15%, rgba(255,255,255,0.5) 0deg 10deg, transparent 10deg 26deg)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-8 space-y-8 pb-14">
        {/* ================================================================ */}
        {/* 1. COMPACT MISSION HEADER BAR                                    */}
        {/* ================================================================ */}
        <header className="bg-[#fffdf7] border-[3px] border-[#1E293B] rounded-3xl px-5 py-3.5 shadow-[0_6px_0_#1E293B] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 px-3 py-1 rounded-xl bg-[#facc15] border-2 border-[#1E293B] shadow-[0_2px_0_#1E293B] -rotate-2 flex items-center gap-1">
              <span className="text-sm font-black font-mono tabular-nums text-[#1E293B]">
                #{artifact.artifactNumber}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-[#1E293B] truncate">
                  {artifact.name}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg ${zoneMeta.badgeBg} border-2 border-[#1E293B] text-[10px] font-black uppercase tracking-wider text-[#1E293B]`}
                >
                  <Rocket className="w-3 h-3" />
                  {zoneMeta.label}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#fffbeb] border-2 border-[#1E293B] text-[10px] font-black font-mono tabular-nums text-[#1E293B]">
                  {artifact.year}
                </span>
              </div>
              <p className="text-xs font-bold text-[#b45309] truncate mt-0.5">
                {artifact.agency} • {artifact.categoryLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 ml-auto">
            {onInspectModel && artifact.model3dUrl && (
              <button
                onClick={() => onInspectModel(artifact)}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#bae6fd] hover:bg-[#7dd3fc] border-2 border-[#1E293B] shadow-[0_3px_0_#1E293B] active:translate-y-0.5 active:shadow-none text-xs font-black text-[#1E293B] flex items-center gap-1.5 transition-all"
                title="Inspect 3D CAD Model"
              >
                <Cpu className="w-4 h-4" />
                <span className="hidden sm:inline">3D Model</span>
              </button>
            )}

            <button
              onClick={() => {
                nasaVoice.stop();
                onClose();
              }}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#fb923c] hover:bg-[#fdba74] border-2 border-[#1E293B] shadow-[0_3px_0_#1E293B] active:translate-y-0.5 active:shadow-none text-xs font-black text-[#1E293B] flex items-center gap-1.5 transition-all"
              title="Back to 3D Map (Esc)"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.75]" />
              <span>Back to Map</span>
            </button>
          </div>
        </header>

        {/* ================================================================ */}
        {/* 2. COMPACT MEDIA HEADER (PHOTO + YOUTUBE VIDEO)                  */}
        {/* ================================================================ */}
        <section className="bg-[#fffdf7] border-[3px] border-[#1E293B] rounded-3xl p-4 sm:p-5 shadow-[0_6px_0_#1E293B]">
          <div
            className={`grid gap-4 items-stretch ${
              youtubeId ? 'grid-cols-1 md:grid-cols-12' : 'grid-cols-1'
            }`}
          >
            {/* Mission Photo Card */}
            <div
              className={`flex flex-col rounded-2xl overflow-hidden border-2 border-[#1E293B] bg-[#fffbeb] ${
                youtubeId ? 'md:col-span-5' : 'md:grid md:grid-cols-12'
              }`}
            >
              <div
                className={`relative bg-[#1E293B] overflow-hidden ${
                  youtubeId
                    ? 'h-36 sm:h-40 w-full'
                    : 'h-40 sm:h-44 w-full md:col-span-7'
                }`}
              >
                <div className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#facc15] border-2 border-[#1E293B] text-[10px] font-black uppercase text-[#1E293B] shadow-sm">
                  <Camera className="w-3 h-3" />
                  <span>Mission Photo</span>
                </div>

                {!youtubeId && (
                  <div className="absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fffdf7] border-2 border-[#1E293B] text-[10px] font-black uppercase text-[#1E293B] shadow-sm">
                    <Award className="w-3 h-3 text-[#ea580c]" />
                    <span>Rare Archive Snapshot</span>
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
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-[#fef3c7] to-[#fde68a] text-[#1E293B]">
                    <Rocket className="w-8 h-8 text-[#ea580c] mb-1" />
                    <p className="text-xs font-black">{artifact.name}</p>
                    <p className="text-[11px] font-bold text-[#1E293B]/75">
                      NASA Archive • {artifact.year}
                    </p>
                  </div>
                )}
              </div>

              <div
                className={`px-3.5 py-2.5 text-xs font-bold text-[#1E293B] bg-[#fffbeb] flex flex-col justify-center ${
                  youtubeId
                    ? 'border-t-2 border-[#1E293B]/15'
                    : 'md:col-span-5 md:border-l-2 border-t-2 md:border-t-0 border-[#1E293B]/15 p-5 space-y-2'
                }`}
              >
                {!youtubeId && (
                  <span className="inline-flex w-fit items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#fef08a] border border-[#1E293B] text-[10px] font-black uppercase">
                    Historic NASA Frame
                  </span>
                )}
                <p className="leading-snug line-clamp-2">
                  {artifact.imageCaption ||
                    `${artifact.name} — NASA Historical Archive`}
                </p>
              </div>
            </div>

            {/* Embedded YouTube Video */}
            {youtubeId && (
              <div className="md:col-span-7 flex flex-col rounded-2xl overflow-hidden border-2 border-[#1E293B] bg-[#fffbeb]">
                <div className="px-3.5 py-2 bg-[#fb923c] border-b-2 border-[#1E293B] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#1E293B]">
                    <Youtube className="w-4 h-4" />
                    <span>Mission Video Feed</span>
                  </div>
                  {cleanYoutubeUrl && (
                    <a
                      href={cleanYoutubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fffdf7] hover:bg-[#fde047] border border-[#1E293B] text-[10px] font-black text-[#1E293B] transition-colors"
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
            whileHover={{ rotate: 0, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className={`max-w-4xl mx-auto bg-[#fffdf7] border-[3px] border-[#1E293B] rounded-3xl overflow-hidden ${POSTCARD_SHADOW}`}
          >
            {/* Airmail Postcard Top Strip */}
            <div
              className="h-2.5 w-full border-b-2 border-[#1E293B]"
              style={{
                background:
                  'repeating-linear-gradient(135deg, #fb923c 0px 14px, #fffdf7 14px 24px, #38bdf8 24px 38px, #fffdf7 38px 48px)',
              }}
              aria-hidden="true"
            />

            <div className="bg-gradient-to-r from-[#fde047] via-[#facc15] to-[#fde68a] border-b-[3px] border-[#1E293B] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 rounded-xl bg-[#fffdf7] border-2 border-[#1E293B] text-xs font-black uppercase text-[#1E293B] shadow-[0_2px_0_#1E293B]">
                  01
                </span>
                <div>
                  <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-[#1E293B]">
                    My Space Diary
                  </h2>
                  <p className="text-xs font-bold text-[#1E293B]/80">
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
                  className={`min-h-[40px] px-4 py-2 rounded-xl border-2 border-[#1E293B] shadow-[0_3px_0_#1E293B] active:translate-y-0.5 active:shadow-none text-xs font-black flex items-center gap-2 transition-all ${
                    nasaVoice.isSpeaking
                      ? 'bg-[#fb923c] text-[#1E293B]'
                      : 'bg-[#fffdf7] hover:bg-[#fef08a] text-[#1E293B]'
                  }`}
                >
                  {nasaVoice.isSpeaking ? (
                    <>
                      <VolumeX className="w-4 h-4" />
                      <span>Stop Story</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-[#ea580c]" />
                      <span>Listen to Story</span>
                    </>
                  )}
                </button>

                {/* Decorative Postage Stamp */}
                <div className="hidden sm:flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-[#fffdf7] border-2 border-dashed border-[#1E293B] rotate-3 shadow-sm shrink-0">
                  <Stamp className="w-5 h-5 text-[#ea580c]" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#1E293B] mt-0.5">
                    NASA
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 bg-[#fffbeb]/60 space-y-5">
              <p className="text-sm font-black text-[#b45309] uppercase tracking-wide">
                “{artifact.story.headline}”
              </p>

              <div
                className={`grid gap-6 items-center ${
                  diaryPhotos.length > 0 ? 'md:grid-cols-12' : 'grid-cols-1'
                }`}
              >
                <blockquote
                  className={`text-base leading-relaxed font-semibold text-[#1E293B] bg-[#fffdf7] border-2 border-[#1E293B] rounded-2xl p-6 shadow-sm ${
                    diaryPhotos.length > 0 ? 'md:col-span-8' : ''
                  }`}
                >
                  “{artifact.firstPersonMonologue}”
                </blockquote>

                {diaryPhotos.map((photo) =>
                  !galleryErrors[photo.url] ? (
                    <figure
                      key={photo.url}
                      className="md:col-span-4 bg-[#fffdf7] border-2 border-[#1E293B] rounded-2xl p-2.5 shadow-[0_4px_0_#1E293B]"
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
                        className="w-full h-36 object-cover rounded-xl border border-[#1E293B]"
                      />
                      <figcaption className="mt-2 px-1 text-xs font-bold text-[#1E293B] leading-snug">
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
              whileHover={{ rotate: 0, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className={`bg-[#fffdf7] border-[3px] border-[#1E293B] rounded-3xl overflow-hidden ${POSTCARD_SHADOW}`}
            >
              <div className="bg-[#38bdf8] border-b-[3px] border-[#1E293B] px-6 py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-xl bg-[#fffdf7] border-2 border-[#1E293B] text-xs font-black uppercase text-[#1E293B] shadow-[0_2px_0_#1E293B]">
                    02
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#1E293B]">
                      Where Am I?
                    </h2>
                    <p className="text-xs font-bold text-[#1E293B]">
                      Cosmic GPS spot &amp; coordinates
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#fffdf7] border-2 border-[#1E293B] flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-[#1E293B]" />
                </div>
              </div>

              <div className="p-6 sm:p-7 space-y-5">
                <div className="inline-flex w-fit items-center gap-2 px-3 py-1.5 rounded-full bg-[#e0f2fe] border-2 border-[#1E293B] text-xs font-black text-[#1E293B]">
                  <MapPin className="w-3.5 h-3.5 text-[#ea580c]" />
                  <span>{zoneMeta.pinText}</span>
                </div>

                <div className="bg-[#f8fafc] border-2 border-[#1E293B] rounded-2xl p-4 sm:p-5 space-y-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#0369a1] block">
                    Landing Spot / Region
                  </span>
                  <p className="text-sm sm:text-base font-bold text-[#1E293B] leading-snug">
                    {artifact.locationName}
                  </p>
                </div>

                <div className="bg-[#e0f2fe]/65 border-2 border-[#1E293B] rounded-2xl p-4 sm:p-5 space-y-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#0369a1] block">
                    {artifact.hasSurfaceCoordinates
                      ? 'GPS Coordinates'
                      : 'Orbit / Trajectory'}
                  </span>
                  <p className="text-sm font-black font-mono tabular-nums text-[#1E293B] leading-snug">
                    {artifact.coordinates.display}
                  </p>
                  {artifact.distanceAu && (
                    <p className="text-xs font-bold text-[#1E293B] pt-1">
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
              whileHover={{ rotate: 0, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className={`md:mt-10 bg-[#fffdf7] border-[3px] border-[#1E293B] rounded-3xl overflow-hidden ${POSTCARD_SHADOW}`}
            >
              <div className="bg-[#fb923c] border-b-[3px] border-[#1E293B] px-6 py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-xl bg-[#fffdf7] border-2 border-[#1E293B] text-xs font-black uppercase text-[#1E293B] shadow-[0_2px_0_#1E293B]">
                    03
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#1E293B]">
                      Mission Clock
                    </h2>
                    <p className="text-xs font-bold text-[#1E293B]">
                      Launch, landing &amp; survival time
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#fffdf7] border-2 border-[#1E293B] flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-[#1E293B]" />
                </div>
              </div>

              <div className="p-6 sm:p-7 space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#fff7ed] border-2 border-[#1E293B] rounded-2xl p-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-[#fb923c] border border-[#1E293B] text-[10px] font-black uppercase text-[#1E293B] mb-1">
                      Launch
                    </span>
                    <p className="text-xs font-black font-mono tabular-nums text-[#1E293B] break-words">
                      {artifact.timeline.launched}
                    </p>
                  </div>

                  <div className="bg-[#fff7ed] border-2 border-[#1E293B] rounded-2xl p-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-[#facc15] border border-[#1E293B] text-[10px] font-black uppercase text-[#1E293B] mb-1">
                      Arrival
                    </span>
                    <p className="text-xs font-black font-mono tabular-nums text-[#1E293B] break-words">
                      {artifact.timeline.landed || 'Flyby'}
                    </p>
                  </div>

                  <div className="bg-[#fff7ed] border-2 border-[#1E293B] rounded-2xl p-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-[#bae6fd] border border-[#1E293B] text-[10px] font-black uppercase text-[#1E293B] mb-1">
                      Ended
                    </span>
                    <p className="text-xs font-black font-mono tabular-nums text-[#1E293B] break-words">
                      {artifact.timeline.ended || 'Ongoing'}
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm font-bold font-mono text-[#1E293B] bg-[#f8fafc] border-2 border-[#1E293B]/25 rounded-2xl px-4 py-3 leading-snug">
                  {artifact.timeline.summary}
                </p>

                <div className="bg-[#fef3c7] border-2 border-[#1E293B] rounded-2xl p-4 sm:p-5 space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#facc15] border border-[#1E293B] text-[10px] font-black uppercase text-[#1E293B]">
                    <Sparkles className="w-3 h-3" />
                    <span>Planned vs. Actual</span>
                  </div>
                  <p className="text-sm font-bold text-[#1E293B] leading-relaxed">
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
              whileHover={{ rotate: 0, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className={`bg-[#fffdf7] border-[3px] border-[#1E293B] rounded-3xl overflow-hidden ${POSTCARD_SHADOW}`}
            >
              <div className="bg-[#6ee7b7] border-b-[3px] border-[#1E293B] px-6 py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-xl bg-[#fffdf7] border-2 border-[#1E293B] text-xs font-black uppercase text-[#1E293B] shadow-[0_2px_0_#1E293B]">
                    04
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#1E293B]">
                      History &amp; Scientific Legacy
                    </h2>
                    <p className="text-xs font-bold text-[#1E293B]">
                      Quick facts on why it mattered
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#fffdf7] border-2 border-[#1E293B] flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-[#1E293B]" />
                </div>
              </div>

              <div className="p-6 sm:p-7 space-y-5">
                <ul className="space-y-4">
                  {legacyBullets.map((item) => {
                    const BulletIcon = item.icon;
                    return (
                      <li
                        key={item.lead}
                        className="flex items-start gap-3.5 bg-[#f8fafc] border-2 border-[#1E293B] rounded-2xl p-4"
                      >
                        <span
                          className={`shrink-0 w-9 h-9 rounded-xl ${item.iconBg} border-2 border-[#1E293B] flex items-center justify-center mt-0.5`}
                        >
                          <BulletIcon className="w-4 h-4 text-[#1E293B]" />
                        </span>
                        <p className="text-sm leading-relaxed text-[#1E293B] font-medium">
                          <strong className="font-black text-[#1E293B] mr-1.5">
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
                      className="bg-[#fffbeb] border-2 border-[#1E293B] rounded-2xl p-2.5 flex items-center gap-3.5"
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
                        className="w-28 h-20 object-cover rounded-xl border border-[#1E293B] shrink-0"
                      />
                      <figcaption className="text-xs font-bold text-[#1E293B] leading-snug">
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
              whileHover={{ rotate: 0, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className={`md:mt-10 bg-[#fffdf7] border-[3px] border-[#1E293B] rounded-3xl overflow-hidden ${POSTCARD_SHADOW}`}
            >
              <div className="bg-[#facc15] border-b-[3px] border-[#1E293B] px-6 py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-xl bg-[#fffdf7] border-2 border-[#1E293B] text-xs font-black uppercase text-[#1E293B] shadow-[0_2px_0_#1E293B]">
                    05
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#1E293B]">
                      Spacecraft Stats
                    </h2>
                    <p className="text-xs font-bold text-[#1E293B]">
                      Size, power &amp; science gadgets
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#fffdf7] border-2 border-[#1E293B] flex items-center justify-center shrink-0">
                  <Wrench className="w-5 h-5 text-[#1E293B]" />
                </div>
              </div>

              <div className="p-6 sm:p-7 space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#fef9c3] border-2 border-[#1E293B] rounded-2xl p-3">
                    <div className="flex items-center gap-1 text-[10px] font-black uppercase text-[#854d0e]">
                      <Scale className="w-3.5 h-3.5" />
                      <span>Mass</span>
                    </div>
                    <p className="text-xs sm:text-sm font-black text-[#1E293B] mt-1 leading-tight">
                      {statPills.mass}
                    </p>
                  </div>

                  <div className="bg-[#e0f2fe] border-2 border-[#1E293B] rounded-2xl p-3">
                    <div className="flex items-center gap-1 text-[10px] font-black uppercase text-[#075985]">
                      <Ruler className="w-3.5 h-3.5" />
                      <span>Size</span>
                    </div>
                    <p className="text-xs sm:text-sm font-black text-[#1E293B] mt-1 leading-tight">
                      {statPills.size}
                    </p>
                  </div>

                  <div className="bg-[#ffedd5] border-2 border-[#1E293B] rounded-2xl p-3">
                    <div className="flex items-center gap-1 text-[10px] font-black uppercase text-[#9a3412]">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Power</span>
                    </div>
                    <p className="text-xs sm:text-sm font-black text-[#1E293B] mt-1 leading-tight">
                      {statPills.power}
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-[#1E293B] bg-[#f8fafc] border-2 border-[#1E293B]/25 rounded-2xl p-4 leading-relaxed">
                  {artifact.specs}
                </p>

                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#1E293B] mb-2.5">
                    Key Onboard Gadgets
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {artifact.instruments.map((inst, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-xs font-extrabold text-[#1E293B] ${
                          INSTRUMENT_TAG_COLORS[
                            idx % INSTRUMENT_TAG_COLORS.length
                          ]
                        }`}
                      >
                        <span className="font-mono text-[10px] opacity-75">
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
                      className="bg-[#fffbeb] border-2 border-[#1E293B] rounded-2xl p-2.5 flex items-center gap-3.5"
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
                        className="w-28 h-20 object-cover rounded-xl border border-[#1E293B] shrink-0"
                      />
                      <figcaption className="text-xs font-bold text-[#1E293B] leading-snug">
                        {photo.caption}
                      </figcaption>
                    </figure>
                  ) : null
                )}

                {artifact.officialSource && (
                  <div className="pt-3 border-t-2 border-[#1E293B]/15 flex items-center justify-between gap-3 text-xs">
                    <span className="inline-flex items-center gap-1.5 font-mono font-bold text-[#1E293B] truncate">
                      <BookOpen className="w-4 h-4 text-[#b45309] shrink-0" />
                      {artifact.catalogRef || 'NASA Archive'}
                    </span>
                    <a
                      href={artifact.officialSource}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#fffbeb] hover:bg-[#fde047] border-2 border-[#1E293B] font-black text-[#1E293B] shrink-0 transition-colors"
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
            className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-[#facc15] hover:bg-[#fde047] border-[3px] border-[#1E293B] shadow-[0_4px_0_#1E293B] active:translate-y-0.5 active:shadow-none text-sm font-black text-[#1E293B] flex items-center gap-2 transition-all"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.75]" />
            <span>Previous Artifact</span>
          </button>

          <button
            onClick={() => {
              nasaVoice.stop();
              onClose();
            }}
            className="min-h-[42px] px-4 py-2 rounded-2xl bg-[#fffdf7] hover:bg-[#fef08a] border-2 border-[#1E293B] text-xs font-black text-[#1E293B] transition-colors hidden sm:inline-flex"
          >
            Back to {zoneMeta.label} Globe
          </button>

          <button
            onClick={onNextArtifact}
            className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-[#fb923c] hover:bg-[#fdba74] border-[3px] border-[#1E293B] shadow-[0_4px_0_#1E293B] active:translate-y-0.5 active:shadow-none text-sm font-black text-[#1E293B] flex items-center gap-2 transition-all"
          >
            <span>Next Artifact</span>
            <ChevronRight className="w-4 h-4 stroke-[2.75]" />
          </button>
        </footer>
      </div>
    </div>
  );
};
