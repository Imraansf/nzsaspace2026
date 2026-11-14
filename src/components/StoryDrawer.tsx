import React, { useState, useEffect, useRef } from 'react';
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
  const cleanYoutubeUrl = artifact.youtubeUrl ? artifact.youtubeUrl.replace(/\s+/g, '') : undefined;
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

  const diaryPhotos = (artifact.galleryImages || []).filter((g) => g.postcardTarget === 'diary');
  const historyPhotos = (artifact.galleryImages || []).filter((g) => g.postcardTarget === 'history');
  const statsPhotos = (artifact.galleryImages || []).filter((g) => g.postcardTarget === 'stats');

  const statPills = artifact.statPills || {
    mass: artifact.massKg ? `${artifact.massKg.toLocaleString()} kg` : 'See Specs',
    size: 'Mission Hardware',
    power: 'Solar / RTG Power',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden font-sans text-[#1E293B] animate-in fade-in duration-200"
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

      {/* Scrollable Compact Bento Dashboard */}
      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-3 sm:px-5 py-3 sm:py-4 space-y-3.5 pb-8">
          {/* ================================================================ */}
          {/* 1. SLIM COMPACT HEADER BAR                                       */}
          {/* ================================================================ */}
          <header className="bg-[#fffdf7] border-[3px] border-[#1E293B] rounded-2xl px-3.5 py-2.5 shadow-[0_4px_0_#1E293B] flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="shrink-0 px-2.5 py-1 rounded-xl bg-[#facc15] border-2 border-[#1E293B] shadow-[0_2px_0_#1E293B] -rotate-2 flex items-center gap-1">
                <span className="text-sm font-black font-mono tabular-nums text-[#1E293B]">
                  #{artifact.artifactNumber}
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h1 className="text-base sm:text-xl font-black tracking-tight text-[#1E293B] truncate">
                    {artifact.name}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${zoneMeta.badgeBg} border-2 border-[#1E293B] text-[10px] font-black uppercase tracking-wider text-[#1E293B]`}
                  >
                    <Rocket className="w-2.5 h-2.5" />
                    {zoneMeta.label}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#fffbeb] border-2 border-[#1E293B] text-[10px] font-black font-mono tabular-nums text-[#1E293B]">
                    {artifact.year}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-[#b45309] truncate">
                  {artifact.agency} • {artifact.categoryLabel}
                </p>
              </div>
            </div>

            {/* Compact Right Controls */}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              {onInspectModel && artifact.model3dUrl && (
                <button
                  onClick={() => onInspectModel(artifact)}
                  className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#bae6fd] hover:bg-[#7dd3fc] border-2 border-[#1E293B] shadow-[0_2px_0_#1E293B] active:translate-y-0.5 active:shadow-none text-xs font-black text-[#1E293B] flex items-center gap-1.5 transition-all"
                  title="Inspect 3D CAD Model"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">3D Model</span>
                </button>
              )}

              <button
                onClick={() => {
                  nasaVoice.stop();
                  onClose();
                }}
                className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-[#fb923c] hover:bg-[#fdba74] border-2 border-[#1E293B] shadow-[0_2px_0_#1E293B] active:translate-y-0.5 active:shadow-none text-xs font-black text-[#1E293B] flex items-center gap-1.5 transition-all"
                title="Back to 3D Map (Esc)"
              >
                <ArrowLeft className="w-3.5 h-3.5 stroke-[2.75]" />
                <span>Back to Map</span>
              </button>
            </div>
          </header>

          {/* ================================================================ */}
          {/* 2. COMPACT MEDIA SHOWCASE STRIP                                  */}
          {/* ================================================================ */}
          <section className="bg-[#fffdf7] border-[3px] border-[#1E293B] rounded-2xl p-3 shadow-[0_4px_0_#1E293B]">
            <div
              className={`grid gap-3 items-stretch ${
                youtubeId ? 'grid-cols-1 md:grid-cols-12' : 'grid-cols-1'
              }`}
            >
              {/* Photo Card */}
              <div
                className={`flex flex-col rounded-xl overflow-hidden border-2 border-[#1E293B] bg-[#fffbeb] ${
                  youtubeId ? 'md:col-span-5' : 'md:grid md:grid-cols-12'
                }`}
              >
                <div
                  className={`relative bg-[#1E293B] overflow-hidden ${
                    youtubeId
                      ? 'h-44 sm:h-48 w-full'
                      : 'h-48 sm:h-52 w-full md:col-span-7'
                  }`}
                >
                  <div className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#facc15] border-2 border-[#1E293B] text-[10px] font-black uppercase text-[#1E293B] shadow-sm">
                    <Camera className="w-3 h-3" />
                    <span>Mission Photo</span>
                  </div>

                  {!youtubeId && (
                    <div className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fffdf7] border-2 border-[#1E293B] text-[10px] font-black uppercase text-[#1E293B] shadow-sm">
                      <Award className="w-3 h-3 text-[#ea580c]" />
                      <span>Rare Archive Snapshot</span>
                    </div>
                  )}

                  {artifact.imageUrl && !heroImgError ? (
                    <img
                      src={artifact.imageUrl}
                      alt={artifact.name}
                      onError={() => setHeroImgError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-[#fef3c7] to-[#fde68a] text-[#1E293B]">
                      <Rocket className="w-9 h-9 text-[#ea580c] mb-1.5" />
                      <p className="text-xs font-black">{artifact.name}</p>
                      <p className="text-[11px] font-bold text-[#1E293B]/75">
                        NASA Archive • {artifact.year}
                      </p>
                    </div>
                  )}
                </div>

                <div
                  className={`px-3 py-2 text-[11px] font-bold text-[#1E293B] bg-[#fffbeb] flex flex-col justify-center ${
                    youtubeId
                      ? 'border-t-2 border-[#1E293B]/15'
                      : 'md:col-span-5 md:border-l-2 border-t-2 md:border-t-0 border-[#1E293B]/15 p-4 space-y-2'
                  }`}
                >
                  {!youtubeId && (
                    <span className="inline-flex w-fit items-center gap-1 px-2 py-0.5 rounded-md bg-[#fef08a] border border-[#1E293B] text-[10px] font-black uppercase">
                      Historic NASA Frame
                    </span>
                  )}
                  <p className="leading-snug">
                    {artifact.imageCaption || `${artifact.name} — NASA Historical Archive`}
                  </p>
                </div>
              </div>

              {/* Embedded YouTube Player */}
              {youtubeId && (
                <div className="md:col-span-7 flex flex-col rounded-xl overflow-hidden border-2 border-[#1E293B] bg-[#fffbeb]">
                  <div className="px-3 py-1.5 bg-[#fb923c] border-b-2 border-[#1E293B] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#1E293B]">
                      <Youtube className="w-3.5 h-3.5" />
                      <span>Mission Video Feed</span>
                    </div>
                    {cleanYoutubeUrl && (
                      <a
                        href={cleanYoutubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#fffdf7] hover:bg-[#fde047] border border-[#1E293B] text-[10px] font-black text-[#1E293B] transition-colors"
                      >
                        <span>Open YouTube</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>

                  <div className="relative w-full h-44 sm:h-48 bg-black flex-1">
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
          {/* 3. COMPACT BENTO POSTCARD GRID (ALL 5 POSTCARDS IN 2 COMPACT ROWS)*/}
          {/* ================================================================ */}

          {/* ROW A: POSTCARD 1 (2/3) + POSTCARD 2 (1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
            {/* POSTCARD 1 — "MY SPACE DIARY" */}
            <article className="lg:col-span-8 bg-[#fffdf7] border-[3px] border-[#1E293B] rounded-2xl overflow-hidden shadow-[0_4px_0_#1E293B] flex flex-col">
              <div className="bg-gradient-to-r from-[#fde047] via-[#facc15] to-[#fde68a] border-b-2 border-[#1E293B] px-3.5 py-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-[#fffdf7] border-2 border-[#1E293B] text-[10px] font-black uppercase text-[#1E293B]">
                    01
                  </span>
                  <h2 className="text-sm sm:text-base font-black uppercase tracking-tight text-[#1E293B]">
                    My Space Diary
                  </h2>
                  <span className="text-[11px] font-bold text-[#1E293B]/80 hidden sm:inline">
                    — Hear the spacecraft tell its own adventure!
                  </span>
                </div>

                <button
                  onClick={() => {
                    if (nasaVoice.isSpeaking) {
                      nasaVoice.stop();
                    } else {
                      nasaVoice.speakMissionLog(narrationText, nasaVoice.filterEnabled);
                    }
                  }}
                  className={`min-h-[34px] px-3 py-1 rounded-xl border-2 border-[#1E293B] shadow-[0_2px_0_#1E293B] active:translate-y-0.5 active:shadow-none text-xs font-black flex items-center gap-1.5 transition-all ${
                    nasaVoice.isSpeaking
                      ? 'bg-[#fb923c] text-[#1E293B]'
                      : 'bg-[#fffdf7] hover:bg-[#fef08a] text-[#1E293B]'
                  }`}
                >
                  {nasaVoice.isSpeaking ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Stop Story</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-[#ea580c]" />
                      <span>Listen to Story</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3.5 bg-[#fffbeb]/50 flex-1 flex flex-col justify-center gap-2.5">
                <p className="text-xs font-black text-[#b45309] uppercase tracking-wide">
                  “{artifact.story.headline}”
                </p>

                <div
                  className={`grid gap-3 items-center ${
                    diaryPhotos.length > 0 ? 'sm:grid-cols-12' : 'grid-cols-1'
                  }`}
                >
                  <blockquote
                    className={`text-sm leading-relaxed font-semibold text-[#1E293B] bg-[#fffdf7] border-2 border-[#1E293B] rounded-xl p-3 ${
                      diaryPhotos.length > 0 ? 'sm:col-span-8' : ''
                    }`}
                  >
                    “{artifact.firstPersonMonologue}”
                  </blockquote>

                  {diaryPhotos.map((photo) =>
                    !galleryErrors[photo.url] ? (
                      <figure
                        key={photo.url}
                        className="sm:col-span-4 bg-[#fffdf7] border-2 border-[#1E293B] rounded-xl p-1.5 shadow-[0_3px_0_#1E293B]"
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption}
                          onError={() =>
                            setGalleryErrors((prev) => ({ ...prev, [photo.url]: true }))
                          }
                          className="w-full h-28 object-cover rounded-lg border border-[#1E293B]"
                        />
                        <figcaption className="mt-1 px-0.5 text-[10px] font-bold text-[#1E293B] leading-tight">
                          {photo.caption}
                        </figcaption>
                      </figure>
                    ) : null
                  )}
                </div>
              </div>
            </article>

            {/* POSTCARD 2 — "WHERE AM I?" */}
            <article className="lg:col-span-4 bg-[#fffdf7] border-[3px] border-[#1E293B] rounded-2xl overflow-hidden shadow-[0_4px_0_#1E293B] flex flex-col">
              <div className="bg-[#38bdf8] border-b-2 border-[#1E293B] px-3.5 py-2 flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#fffdf7] border-2 border-[#1E293B] text-[10px] font-black uppercase text-[#1E293B]">
                      02
                    </span>
                    <h2 className="text-sm sm:text-base font-black uppercase tracking-tight text-[#1E293B]">
                      Where Am I?
                    </h2>
                  </div>
                  <p className="text-[11px] font-bold text-[#1E293B]">
                    Exact cosmic GPS coordinates &amp; spot
                  </p>
                </div>
                <MapPin className="w-4 h-4 text-[#1E293B] shrink-0" />
              </div>

              <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e0f2fe] border-2 border-[#1E293B] text-[11px] font-black text-[#1E293B]">
                  <span className="w-2 h-2 rounded-full bg-[#ea580c] border border-[#1E293B]" />
                  <span>{zoneMeta.pinText}</span>
                </div>

                <div className="bg-[#f8fafc] border-2 border-[#1E293B] rounded-xl p-2.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#0369a1] block">
                    Landing Spot / Region
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-[#1E293B] leading-snug mt-0.5">
                    {artifact.locationName}
                  </p>
                </div>

                <div className="bg-[#e0f2fe]/60 border-2 border-[#1E293B] rounded-xl p-2.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#0369a1] block">
                    {artifact.hasSurfaceCoordinates ? 'GPS Coordinates' : 'Orbit / Trajectory'}
                  </span>
                  <p className="text-xs font-black font-mono tabular-nums text-[#1E293B] leading-snug mt-0.5">
                    {artifact.coordinates.display}
                  </p>
                  {artifact.distanceAu && (
                    <p className="text-[11px] font-bold text-[#1E293B] mt-1">
                      Distance: {artifact.distanceAu}
                    </p>
                  )}
                </div>
              </div>
            </article>
          </div>

          {/* ROW B: POSTCARDS 3, 4 & 5 (3 COMPACT COLUMNS SIDE-BY-SIDE) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-stretch">
            {/* POSTCARD 3 — "MISSION CLOCK" */}
            <article className="bg-[#fffdf7] border-[3px] border-[#1E293B] rounded-2xl overflow-hidden shadow-[0_4px_0_#1E293B] flex flex-col">
              <div className="bg-[#fb923c] border-b-2 border-[#1E293B] px-3.5 py-2 flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#fffdf7] border-2 border-[#1E293B] text-[10px] font-black uppercase text-[#1E293B]">
                      03
                    </span>
                    <h2 className="text-sm sm:text-base font-black uppercase tracking-tight text-[#1E293B]">
                      Mission Clock
                    </h2>
                  </div>
                  <p className="text-[11px] font-bold text-[#1E293B]">
                    Launch, landing &amp; survival time!
                  </p>
                </div>
                <Clock className="w-4 h-4 text-[#1E293B] shrink-0" />
              </div>

              <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="bg-[#fff7ed] border-2 border-[#1E293B] rounded-xl p-2 text-center">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-[#fb923c] border border-[#1E293B] text-[9px] font-black uppercase text-[#1E293B] mb-0.5">
                      Launch
                    </span>
                    <p className="text-[11px] font-black font-mono tabular-nums text-[#1E293B] break-words">
                      {artifact.timeline.launched}
                    </p>
                  </div>

                  <div className="bg-[#fff7ed] border-2 border-[#1E293B] rounded-xl p-2 text-center">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-[#facc15] border border-[#1E293B] text-[9px] font-black uppercase text-[#1E293B] mb-0.5">
                      Arrival
                    </span>
                    <p className="text-[11px] font-black font-mono tabular-nums text-[#1E293B] break-words">
                      {artifact.timeline.landed || 'Flyby'}
                    </p>
                  </div>

                  <div className="bg-[#fff7ed] border-2 border-[#1E293B] rounded-xl p-2 text-center">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-[#bae6fd] border border-[#1E293B] text-[9px] font-black uppercase text-[#1E293B] mb-0.5">
                      Ended
                    </span>
                    <p className="text-[11px] font-black font-mono tabular-nums text-[#1E293B] break-words">
                      {artifact.timeline.ended || 'Ongoing'}
                    </p>
                  </div>
                </div>

                <p className="text-[11px] font-bold font-mono text-[#1E293B] bg-[#f8fafc] border border-[#1E293B]/25 rounded-xl px-2.5 py-1.5 leading-snug">
                  {artifact.timeline.summary}
                </p>

                <div className="bg-[#fef3c7] border-2 border-[#1E293B] rounded-xl p-2.5">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#facc15] border border-[#1E293B] text-[9px] font-black uppercase text-[#1E293B] mb-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Planned vs. Actual</span>
                  </div>
                  <p className="text-xs font-bold text-[#1E293B] leading-snug">
                    {artifact.plannedVsActual}
                  </p>
                </div>
              </div>
            </article>

            {/* POSTCARD 4 — "HISTORY & SCIENTIFIC LEGACY" */}
            <article className="bg-[#fffdf7] border-[3px] border-[#1E293B] rounded-2xl overflow-hidden shadow-[0_4px_0_#1E293B] flex flex-col">
              <div className="bg-[#6ee7b7] border-b-2 border-[#1E293B] px-3.5 py-2 flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#fffdf7] border-2 border-[#1E293B] text-[10px] font-black uppercase text-[#1E293B]">
                      04
                    </span>
                    <h2 className="text-sm sm:text-base font-black uppercase tracking-tight text-[#1E293B]">
                      History &amp; Legacy
                    </h2>
                  </div>
                  <p className="text-[11px] font-bold text-[#1E293B]">
                    Why this mission changed exploration
                  </p>
                </div>
                <Sparkles className="w-4 h-4 text-[#1E293B] shrink-0" />
              </div>

              <div className="p-3.5 space-y-2.5 flex-1">
                <div className="bg-[#ecfdf5] border-2 border-[#1E293B] rounded-xl p-2.5">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-[#065f46] mb-1">
                    Historical Context
                  </h3>
                  <ul className="space-y-1 text-xs font-semibold text-[#1E293B] leading-snug list-disc pl-4">
                    <li>{artifact.storytellingHook}</li>
                    <li>
                      <span className="font-black">Why left behind: </span>
                      {artifact.story.whyLeftBehind}
                    </li>
                  </ul>
                </div>

                <div className="bg-[#f8fafc] border-2 border-[#1E293B] rounded-xl p-2.5">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-[#065f46] mb-1">
                    Scientific Discoveries &amp; Legacy
                  </h3>
                  <ul className="space-y-1 text-xs font-semibold text-[#1E293B] leading-snug list-disc pl-4">
                    <li>{artifact.scientificDiscoveries}</li>
                    {artifact.funFacts.slice(0, 2).map((fact, idx) => (
                      <li key={idx}>{fact}</li>
                    ))}
                  </ul>
                </div>

                {historyPhotos.map((photo) =>
                  !galleryErrors[photo.url] ? (
                    <figure
                      key={photo.url}
                      className="bg-[#fffbeb] border-2 border-[#1E293B] rounded-xl p-1.5 flex items-center gap-2.5"
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption}
                        onError={() =>
                          setGalleryErrors((prev) => ({ ...prev, [photo.url]: true }))
                        }
                        className="w-24 h-16 object-cover rounded-lg border border-[#1E293B] shrink-0"
                      />
                      <figcaption className="text-[11px] font-bold text-[#1E293B] leading-snug">
                        {photo.caption}
                      </figcaption>
                    </figure>
                  ) : null
                )}
              </div>
            </article>

            {/* POSTCARD 5 — "SPACECRAFT STATS & GADGETS" */}
            <article className="bg-[#fffdf7] border-[3px] border-[#1E293B] rounded-2xl overflow-hidden shadow-[0_4px_0_#1E293B] flex flex-col">
              <div className="bg-[#facc15] border-b-2 border-[#1E293B] px-3.5 py-2 flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#fffdf7] border-2 border-[#1E293B] text-[10px] font-black uppercase text-[#1E293B]">
                      05
                    </span>
                    <h2 className="text-sm sm:text-base font-black uppercase tracking-tight text-[#1E293B]">
                      Stats &amp; Gadgets
                    </h2>
                  </div>
                  <p className="text-[11px] font-bold text-[#1E293B]">
                    Size, power &amp; onboard science tools
                  </p>
                </div>
                <Wrench className="w-4 h-4 text-[#1E293B] shrink-0" />
              </div>

              <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="bg-[#fef9c3] border-2 border-[#1E293B] rounded-xl p-2">
                      <div className="flex items-center gap-1 text-[9px] font-black uppercase text-[#854d0e]">
                        <Scale className="w-3 h-3" />
                        <span>Mass</span>
                      </div>
                      <p className="text-[11px] font-black text-[#1E293B] mt-0.5 leading-tight">
                        {statPills.mass}
                      </p>
                    </div>

                    <div className="bg-[#e0f2fe] border-2 border-[#1E293B] rounded-xl p-2">
                      <div className="flex items-center gap-1 text-[9px] font-black uppercase text-[#075985]">
                        <Ruler className="w-3 h-3" />
                        <span>Size</span>
                      </div>
                      <p className="text-[11px] font-black text-[#1E293B] mt-0.5 leading-tight">
                        {statPills.size}
                      </p>
                    </div>

                    <div className="bg-[#ffedd5] border-2 border-[#1E293B] rounded-xl p-2">
                      <div className="flex items-center gap-1 text-[9px] font-black uppercase text-[#9a3412]">
                        <Zap className="w-3 h-3" />
                        <span>Power</span>
                      </div>
                      <p className="text-[11px] font-black text-[#1E293B] mt-0.5 leading-tight">
                        {statPills.power}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] font-semibold text-[#1E293B] bg-[#f8fafc] border border-[#1E293B]/25 rounded-xl p-2 leading-snug">
                    {artifact.specs}
                  </p>

                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-[#1E293B] mb-1.5">
                      Key Onboard Tools
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {artifact.instruments.map((inst, idx) => (
                        <span
                          key={idx}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border-2 text-[11px] font-extrabold text-[#1E293B] ${
                            INSTRUMENT_TAG_COLORS[idx % INSTRUMENT_TAG_COLORS.length]
                          }`}
                        >
                          <span className="font-mono text-[9px] opacity-75">
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
                        className="bg-[#fffbeb] border-2 border-[#1E293B] rounded-xl p-1.5 flex items-center gap-2.5"
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption}
                          onError={() =>
                            setGalleryErrors((prev) => ({ ...prev, [photo.url]: true }))
                          }
                          className="w-24 h-16 object-cover rounded-lg border border-[#1E293B] shrink-0"
                        />
                        <figcaption className="text-[11px] font-bold text-[#1E293B] leading-snug">
                          {photo.caption}
                        </figcaption>
                      </figure>
                    ) : null
                  )}
                </div>

                {artifact.officialSource && (
                  <div className="pt-2 border-t border-[#1E293B]/15 flex items-center justify-between gap-2 text-[11px]">
                    <span className="inline-flex items-center gap-1 font-mono font-bold text-[#1E293B] truncate">
                      <BookOpen className="w-3 h-3 text-[#b45309] shrink-0" />
                      {artifact.catalogRef || 'NASA Archive'}
                    </span>
                    <a
                      href={artifact.officialSource}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#fffbeb] hover:bg-[#fde047] border-2 border-[#1E293B] font-black text-[#1E293B] shrink-0 transition-colors"
                    >
                      <span>NASA Page</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </article>
          </div>

          {/* ================================================================ */}
          {/* 4. SLIM BOTTOM NAVIGATION STRIP (PREV / NEXT ARTIFACT)           */}
          {/* ================================================================ */}
          <footer className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={onPrevArtifact}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#facc15] hover:bg-[#fde047] border-[3px] border-[#1E293B] shadow-[0_3px_0_#1E293B] active:translate-y-0.5 active:shadow-none text-xs font-black text-[#1E293B] flex items-center gap-1.5 transition-all"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.75]" />
              <span>Previous Artifact</span>
            </button>

            <button
              onClick={() => {
                nasaVoice.stop();
                onClose();
              }}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#fffdf7] hover:bg-[#fef08a] border-2 border-[#1E293B] text-xs font-black text-[#1E293B] transition-colors hidden sm:inline-flex"
            >
              Back to {zoneMeta.label} Globe
            </button>

            <button
              onClick={onNextArtifact}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#fb923c] hover:bg-[#fdba74] border-[3px] border-[#1E293B] shadow-[0_3px_0_#1E293B] active:translate-y-0.5 active:shadow-none text-xs font-black text-[#1E293B] flex items-center gap-1.5 transition-all"
            >
              <span>Next Artifact</span>
              <ChevronRight className="w-4 h-4 stroke-[2.75]" />
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
};
