import React, { useEffect, useRef, useState } from 'react';
import { CelestialBody } from '../types/space';
import { playTelemetryBeep } from '../utils/audio';

interface LandingIntroProps {
  onSelectZone: (zone: CelestialBody) => void;
}

interface TwinkleStar {
  x: number;
  y: number;
  size: number;
  speed: number;
  phase: number;
  color: string;
}

export const LandingIntro: React.FC<LandingIntroProps> = ({ onSelectZone }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animationFrameId = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const starPalette = ['#F8FAFC', '#E0F2FE', '#38BDF8', '#A78BFA'];

    const createStars = (): TwinkleStar[] => {
      const count = Math.min(75, Math.floor((width * height) / 18000));
      return Array.from({ length: count }, (_, idx) => ({
        x: Math.random() * width,
        y: Math.random() * height * 0.82,
        size: 3 + (idx % 4) * 1.6,
        speed: 0.35 + (idx % 3) * 0.35,
        phase: Math.random() * Math.PI * 2,
        color: starPalette[idx % starPalette.length],
      }));
    };

    let stars = createStars();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      stars = createStars();
    };

    window.addEventListener('resize', handleResize);

    const drawFourPointStar = (x: number, y: number, r: number, alpha: number, color: string) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.quadraticCurveTo(x, y, x, y + r);
      ctx.quadraticCurveTo(x, y, x - r, y);
      ctx.quadraticCurveTo(x, y, x, y - r);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    let t = 0;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      t += 0.03;

      for (const star of stars) {
        if (!prefersReducedMotion) {
          star.x -= star.speed;
          if (star.x < -20) {
            star.x = width + 20;
            star.y = Math.random() * height * 0.82;
          }
        }
        const pulse = prefersReducedMotion ? 0.8 : 0.45 + 0.55 * Math.sin(t + star.phase);
        drawFourPointStar(star.x, star.y, star.size * (0.85 + 0.2 * pulse), pulse, star.color);
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleChooseZone = (zone: CelestialBody) => {
    if (isExiting) return;
    playTelemetryBeep(zone === 'moon' ? 440 : zone === 'mars' ? 520 : 620);
    setIsExiting(true);
    setTimeout(() => {
      onSelectZone(zone);
    }, 340);
  };

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto overflow-x-hidden flex flex-col items-center justify-center transition-all duration-300 ${
        isExiting ? 'opacity-0 scale-[1.03] pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        background:
          'linear-gradient(180deg, #06090F 0%, #0D131F 52%, #06090F 100%)',
      }}
    >
      {/* Scoped Aurora Lobby Keyframes */}
      <style>{`
        @keyframes aurora-ribbon-1 {
          0%, 100% { transform: translateX(-4%) translateY(0px) skewX(-6deg) scaleY(1); opacity: 0.58; }
          50% { transform: translateX(4%) translateY(-16px) skewX(4deg) scaleY(1.08); opacity: 0.82; }
        }
        @keyframes aurora-ribbon-2 {
          0%, 100% { transform: translateX(4%) translateY(0px) skewX(5deg) scaleY(1.04); opacity: 0.48; }
          50% { transform: translateX(-5%) translateY(14px) skewX(-5deg) scaleY(0.95); opacity: 0.75; }
        }
        @keyframes cloud-drift-slow {
          0%, 100% { transform: translateX(-12px); }
          50% { transform: translateX(18px); }
        }
        @keyframes cloud-drift-alt {
          0%, 100% { transform: translateX(14px); }
          50% { transform: translateX(-16px); }
        }
        @keyframes lobby-rocket-cruise {
          0%, 100% { transform: translateX(-14px); }
          50% { transform: translateX(14px); }
        }
        @keyframes lobby-rocket-bounce {
          0%, 100% { transform: translateY(0px) rotate(-0.6deg); }
          50% { transform: translateY(-9px) rotate(1deg); }
        }
        @keyframes smooth-thruster-outer {
          0%, 100% { transform: scaleX(0.95) scaleY(0.96); opacity: 0.92; }
          50% { transform: scaleX(1.18) scaleY(1.06); opacity: 1; }
        }
        @keyframes smooth-thruster-inner {
          0%, 100% { transform: scaleX(0.92) scaleY(0.94); opacity: 0.96; }
          50% { transform: scaleX(1.14) scaleY(1.05); opacity: 1; }
        }
        @keyframes exhaust-puff {
          0% { transform: translateX(0px) scale(0.75); opacity: 0.78; }
          100% { transform: translateX(-72px) scale(1.45); opacity: 0; }
        }
        @keyframes speed-streak {
          0% { transform: translateX(60px); opacity: 0; }
          25% { opacity: 0.85; }
          75% { opacity: 0.85; }
          100% { transform: translateX(-160px); opacity: 0; }
        }
        .aurora-wave-primary {
          animation: aurora-ribbon-1 14s ease-in-out infinite;
        }
        .aurora-wave-secondary {
          animation: aurora-ribbon-2 18s ease-in-out infinite;
        }
        .cloud-slow {
          animation: cloud-drift-slow 14s ease-in-out infinite;
        }
        .cloud-alt {
          animation: cloud-drift-alt 18s ease-in-out infinite;
        }
        .lobby-rocket-track {
          animation: lobby-rocket-cruise 6s ease-in-out infinite;
        }
        .lobby-rocket-bob {
          animation: lobby-rocket-bounce 2.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
        }
        .smooth-flame-outer {
          transform-origin: 126px 64px;
          animation: smooth-thruster-outer 1.15s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
        }
        .smooth-flame-inner {
          transform-origin: 126px 64px;
          animation: smooth-thruster-inner 0.9s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
        }
        .exhaust-puff-1 { animation: exhaust-puff 1.6s ease-out infinite; }
        .exhaust-puff-2 { animation: exhaust-puff 1.6s ease-out 0.53s infinite; }
        .exhaust-puff-3 { animation: exhaust-puff 1.6s ease-out 1.06s infinite; }
        .speed-line-1 { animation: speed-streak 2.1s linear infinite; }
        .speed-line-2 { animation: speed-streak 1.7s linear 0.7s infinite; }
        .speed-line-3 { animation: speed-streak 2.4s linear 1.2s infinite; }
        @media (prefers-reduced-motion: reduce) {
          .aurora-wave-primary,
          .aurora-wave-secondary,
          .cloud-slow,
          .cloud-alt,
          .lobby-rocket-track,
          .lobby-rocket-bob,
          .smooth-flame-outer,
          .smooth-flame-inner,
          .exhaust-puff-1,
          .exhaust-puff-2,
          .exhaust-puff-3,
          .speed-line-1,
          .speed-line-2,
          .speed-line-3 {
            animation: none !important;
          }
        }
      `}</style>

      {/* Flowing Aurora Borealis Light Ribbons */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          className="aurora-wave-primary absolute -top-24 -left-1/4 w-[150%] h-[62%]"
          style={{
            background:
              'radial-gradient(ellipse 65% 42% at 35% 40%, rgba(56, 189, 248, 0.30) 0%, rgba(16, 185, 129, 0.14) 45%, transparent 75%), radial-gradient(ellipse 55% 38% at 72% 35%, rgba(124, 58, 237, 0.28) 0%, rgba(147, 51, 234, 0.12) 48%, transparent 76%)',
            filter: 'blur(38px)',
          }}
        />
        <div
          className="aurora-wave-secondary absolute top-[12%] -right-1/4 w-[150%] h-[58%]"
          style={{
            background:
              'linear-gradient(115deg, transparent 15%, rgba(124, 58, 237, 0.22) 36%, rgba(56, 189, 248, 0.26) 56%, rgba(147, 51, 234, 0.16) 72%, transparent 88%)',
            filter: 'blur(46px)',
          }}
        />
        <svg
          viewBox="0 0 1440 420"
          preserveAspectRatio="none"
          className="aurora-wave-primary absolute top-0 left-0 w-full h-[55%] opacity-55"
        >
          <defs>
            <linearGradient id="auroraRibbonGradA" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
              <stop offset="28%" stopColor="#38BDF8" stopOpacity="0.45" />
              <stop offset="62%" stopColor="#7C3AED" stopOpacity="0.42" />
              <stop offset="85%" stopColor="#38BDF8" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="auroraRibbonGradB" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0" />
              <stop offset="35%" stopColor="#9333EA" stopOpacity="0.38" />
              <stop offset="70%" stopColor="#38BDF8" stopOpacity="0.40" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M-60 220 C220 90, 480 280, 760 150 C1020 35, 1260 210, 1500 110 L1500 20 L-60 20 Z"
            fill="url(#auroraRibbonGradA)"
          />
          <path
            d="M-60 280 C260 160, 560 320, 880 190 C1120 95, 1310 245, 1500 175 L1500 60 L-60 60 Z"
            fill="url(#auroraRibbonGradB)"
          />
        </svg>
      </div>

      {/* Twinkling Ice White & Aurora Stars Canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none" />

      {/* Dark-Tinted Horizon Clouds */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Top-Left Cloud */}
        <svg
          viewBox="0 0 220 90"
          className="cloud-slow absolute top-6 -left-8 sm:left-8 w-44 sm:w-60 opacity-85 drop-shadow-[0_8px_16px_rgba(56,189,248,0.12)]"
        >
          <path
            d="M36 74 H182 C198 74 208 62 208 49 C208 37 198 26 184 26 C181 11 167 4 152 6 C141 -1 122 2 114 14 C101 8 83 13 77 27 C62 24 47 32 43 45 C30 46 22 56 24 65 C25 71 30 74 36 74 Z"
            fill="#0D131F"
            stroke="#38BDF8"
            strokeOpacity="0.45"
            strokeWidth="2.5"
          />
        </svg>

        {/* Top-Right Cloud */}
        <svg
          viewBox="0 0 220 90"
          className="cloud-alt absolute top-10 -right-10 sm:right-10 w-40 sm:w-56 opacity-80 drop-shadow-[0_8px_16px_rgba(124,58,237,0.14)]"
        >
          <path
            d="M36 74 H182 C198 74 208 62 208 49 C208 37 198 26 184 26 C181 11 167 4 152 6 C141 -1 122 2 114 14 C101 8 83 13 77 27 C62 24 47 32 43 45 C30 46 22 56 24 65 C25 71 30 74 36 74 Z"
            fill="#0D131F"
            stroke="#7C3AED"
            strokeOpacity="0.5"
            strokeWidth="2.5"
          />
        </svg>

        {/* Bottom Horizon Clouds */}
        <svg
          viewBox="0 0 280 100"
          className="cloud-alt absolute -bottom-4 -left-10 w-64 sm:w-80 opacity-90"
        >
          <path
            d="M18 92 H262 C272 92 276 80 270 70 C264 56 246 48 230 52 C222 28 194 18 170 28 C154 8 118 8 102 32 C80 26 56 38 50 56 C32 54 16 66 14 80 C13 87 15 92 18 92 Z"
            fill="#0D131F"
            stroke="#38BDF8"
            strokeOpacity="0.4"
            strokeWidth="2.5"
          />
        </svg>

        <svg
          viewBox="0 0 280 100"
          className="cloud-slow absolute -bottom-4 -right-10 w-64 sm:w-80 opacity-90"
        >
          <path
            d="M18 92 H262 C272 92 276 80 270 70 C264 56 246 48 230 52 C222 28 194 18 170 28 C154 8 118 8 102 32 C80 26 56 38 50 56 C32 54 16 66 14 80 C13 87 15 92 18 92 Z"
            fill="#0D131F"
            stroke="#7C3AED"
            strokeOpacity="0.45"
            strokeWidth="2.5"
          />
        </svg>
      </div>

      {/* Main Lobby Content Container */}
      <div className="relative z-10 w-full max-w-4xl px-4 sm:px-6 py-6 sm:py-8 flex flex-col items-center text-center my-auto">
        {/* Top Lobby Title Banner */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-xl bg-[#0D131F] border-[3px] border-[#38BDF8] shadow-[0_4px_0_#38BDF8,0_0_24px_rgba(56,189,248,0.22)] -rotate-1 mb-3">
          <span className="bg-[#38BDF8] text-[#06090F] text-xs font-black font-mono px-2 py-0.5 rounded-md border-2 border-[#06090F] tracking-wider uppercase">
            SPACE RELICS
          </span>
          <span className="text-xs sm:text-sm font-extrabold tracking-wide uppercase text-[#F8FAFC]">
            NASA Explorer Lobby
          </span>
        </div>

        <h1
          className="text-3xl sm:text-5xl font-black tracking-tight text-[#F8FAFC] max-w-2xl leading-[1.08] uppercase"
          style={{
            textShadow: '0 4px 0 #06090F, 0 0 28px rgba(56, 189, 248, 0.35)',
            WebkitTextStroke: '1px #06090F',
          }}
        >
          Abandoned in Space, Not Forgotten!
        </h1>

        {/* Mission Briefing Cards (Ice White Cards with Aurora Green Headers/Borders & Deep Space Black Text) */}
        <div className="mt-4 sm:mt-5 w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#F8FAFC] text-[#06090F] rounded-2xl overflow-hidden border-[3px] border-[#38BDF8] outline outline-2 outline-[#06090F] shadow-[0_6px_0_#38BDF8,0_12px_24px_rgba(56,189,248,0.18)] -rotate-1 text-left">
            <div className="bg-[#38BDF8] px-3.5 py-1.5 border-b-2 border-[#06090F]">
              <div className="text-[11px] font-black uppercase tracking-wider text-[#06090F] font-mono">
                01 · Pick a Zone
              </div>
            </div>
            <p className="p-3.5 text-xs sm:text-[13px] font-bold leading-snug text-[#06090F]">
              Launch to the Moon, Mars, or Deepspace using the mission buttons below!
            </p>
          </div>

          <div className="bg-[#F8FAFC] text-[#06090F] rounded-2xl overflow-hidden border-[3px] border-[#38BDF8] outline outline-2 outline-[#06090F] shadow-[0_6px_0_#38BDF8,0_12px_24px_rgba(56,189,248,0.18)] rotate-1 text-left">
            <div className="bg-[#38BDF8] px-3.5 py-1.5 border-b-2 border-[#06090F]">
              <div className="text-[11px] font-black uppercase tracking-wider text-[#06090F] font-mono">
                02 · Spot the Relics
              </div>
            </div>
            <p className="p-3.5 text-xs sm:text-[13px] font-bold leading-snug text-[#06090F]">
              Spin the 3D worlds and tap glowing markers or the timeline bar to zoom in!
            </p>
          </div>

          <div className="bg-[#F8FAFC] text-[#06090F] rounded-2xl overflow-hidden border-[3px] border-[#38BDF8] outline outline-2 outline-[#06090F] shadow-[0_6px_0_#38BDF8,0_12px_24px_rgba(56,189,248,0.18)] -rotate-1 text-left">
            <div className="bg-[#38BDF8] px-3.5 py-1.5 border-b-2 border-[#06090F]">
              <div className="text-[11px] font-black uppercase tracking-wider text-[#06090F] font-mono">
                03 · Hear Their Story
              </div>
            </div>
            <p className="p-3.5 text-xs sm:text-[13px] font-bold leading-snug text-[#06090F]">
              Open any relic dossier for 3D models, NASA videos, and first-person tales!
            </p>
          </div>
        </div>

        {/* Centerpiece: 2D Horizontal Spaceship With Continuous Smooth Motion & Aurora Plasma Thrusters */}
        <div
          className="relative w-full max-w-xl h-36 sm:h-44 my-4 sm:my-6 flex items-center justify-center"
          aria-hidden="true"
        >
          {/* Passing Speed-Line Stars */}
          <svg
            viewBox="0 0 520 150"
            className="absolute inset-0 w-full h-full pointer-events-none"
            fill="none"
          >
            <line
              x1="430"
              y1="30"
              x2="495"
              y2="30"
              stroke="#F8FAFC"
              strokeWidth="3.5"
              strokeLinecap="round"
              className="speed-line-1"
            />
            <line
              x1="390"
              y1="118"
              x2="470"
              y2="118"
              stroke="#38BDF8"
              strokeWidth="3.5"
              strokeLinecap="round"
              className="speed-line-2"
            />
            <line
              x1="440"
              y1="74"
              x2="505"
              y2="74"
              stroke="#7C3AED"
              strokeWidth="3"
              strokeLinecap="round"
              className="speed-line-3"
            />
          </svg>

          <div className="lobby-rocket-track">
            <div className="lobby-rocket-bob">
              <svg
                viewBox="0 0 380 128"
                className="w-72 sm:w-[400px] h-auto drop-shadow-[0_10px_20px_rgba(56,189,248,0.28)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="lobbyOuterFlame" x1="100%" y1="50%" x2="0%" y2="50%">
                    <stop offset="0%" stopColor="#38BDF8" />
                    <stop offset="55%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#9333EA" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="lobbyInnerFlame" x1="100%" y1="50%" x2="0%" y2="50%">
                    <stop offset="0%" stopColor="#F8FAFC" />
                    <stop offset="45%" stopColor="#E0F2FE" />
                    <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="lobbyHull" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#F8FAFC" />
                    <stop offset="72%" stopColor="#E0F2FE" />
                    <stop offset="100%" stopColor="#CBD5E1" />
                  </linearGradient>
                </defs>

                {/* Smooth Floating Aurora Plasma Exhaust Puffs */}
                <circle cx="102" cy="64" r="7" fill="#F8FAFC" className="exhaust-puff-1" />
                <circle cx="96" cy="57" r="5.5" fill="#38BDF8" className="exhaust-puff-2" />
                <circle cx="98" cy="71" r="6" fill="#7C3AED" className="exhaust-puff-3" />

                {/* Smooth Animated Aurora Plasma Thruster Flame */}
                <g className="smooth-flame-outer">
                  <path
                    d="M128 48 C92 43, 40 54, 18 64 C40 74, 92 85, 128 80 Z"
                    fill="url(#lobbyOuterFlame)"
                  />
                </g>
                <g className="smooth-flame-inner">
                  <path
                    d="M128 54 C102 51, 64 58, 46 64 C64 70, 102 77, 128 74 Z"
                    fill="url(#lobbyInnerFlame)"
                  />
                </g>

                {/* Rear Thruster Bell */}
                <path
                  d="M124 48 L142 52 L142 76 L124 80 Z"
                  fill="#0D131F"
                  stroke="#06090F"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />

                {/* Aurora Green & Cosmic Purple Top & Bottom Tail Fins */}
                <path
                  d="M150 43 L128 16 L168 25 L182 43 Z"
                  fill="#38BDF8"
                  stroke="#06090F"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M150 85 L128 112 L168 103 L182 85 Z"
                  fill="#38BDF8"
                  stroke="#06090F"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />

                {/* Main Chunky Rocket Body (Ice White Hull) */}
                <path
                  d="M142 42 L262 42 C288 42, 314 50, 338 64 C314 78, 288 86, 262 86 L142 86 Z"
                  fill="url(#lobbyHull)"
                  stroke="#06090F"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />

                {/* Deep Space Black Dorsal Panel Accent */}
                <path
                  d="M168 76 L262 76 C272 76, 280 74, 286 73 L286 84 C278 85, 270 86, 262 86 L168 86 Z"
                  fill="#0D131F"
                />

                {/* Aurora Green Nose Cone */}
                <path
                  d="M286 44.5 C304 49, 322 55.5, 338 64 C322 72.5, 304 79, 286 83.5 Z"
                  fill="#38BDF8"
                  stroke="#06090F"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />

                {/* Deep Space Black Collar & Cosmic Purple Racing Stripe */}
                <rect
                  x="144"
                  y="44"
                  width="12"
                  height="40"
                  fill="#0D131F"
                  stroke="#06090F"
                  strokeWidth="2.5"
                />
                <rect
                  x="166"
                  y="59"
                  width="110"
                  height="10"
                  rx="4"
                  fill="#7C3AED"
                  stroke="#06090F"
                  strokeWidth="2.5"
                />

                {/* Glossy Ice White Top Highlight */}
                <path
                  d="M168 49 H266"
                  stroke="#F8FAFC"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  opacity="0.95"
                />

                {/* Cockpit Viewport (Aurora Green Rim + Cosmic Purple Glass) */}
                <circle cx="248" cy="64" r="14" fill="#38BDF8" stroke="#06090F" strokeWidth="3.5" />
                <circle cx="248" cy="64" r="9.5" fill="#7C3AED" stroke="#06090F" strokeWidth="2.5" />
                <path
                  d="M243 59 A6.5 6.5 0 0 1 253 59"
                  stroke="#F8FAFC"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Side Stabilizer Wing (Deep Space Black Panel) */}
                <rect
                  x="170"
                  y="60"
                  width="46"
                  height="8"
                  rx="4"
                  fill="#0D131F"
                  stroke="#06090F"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Skewed Tactile 3-Button Destination Menu (Deep Space Black & Ice White with Thick Aurora Green Borders) */}
        <div
          className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 px-2"
          role="navigation"
          aria-label="Choose exploration zone"
        >
          <button
            onClick={() => handleChooseZone('moon')}
            className="group min-h-[54px] px-6 py-3 rounded-xl -skew-x-6 bg-[#06090F] hover:bg-[#38BDF8] text-[#F8FAFC] hover:text-[#06090F] font-black text-base tracking-wide uppercase border-[3px] border-[#38BDF8] ring-2 ring-[#F8FAFC]/80 shadow-[0_6px_0_#38BDF8,0_0_20px_rgba(56,189,248,0.2)] hover:shadow-[0_6px_0_#F8FAFC,0_0_28px_rgba(56,189,248,0.65)] hover:scale-105 hover:-translate-y-1 active:translate-y-1 active:shadow-[0_2px_0_#38BDF8] transition-all duration-150 focus-visible:outline-4 focus-visible:outline-[#38BDF8]"
          >
            <span className="block skew-x-6">Moon</span>
          </button>

          <button
            onClick={() => handleChooseZone('mars')}
            className="group min-h-[54px] px-6 py-3 rounded-xl -skew-x-6 bg-[#F8FAFC] hover:bg-[#38BDF8] text-[#06090F] font-black text-base tracking-wide uppercase border-[3px] border-[#38BDF8] ring-2 ring-[#06090F] shadow-[0_6px_0_#38BDF8,0_0_20px_rgba(56,189,248,0.25)] hover:shadow-[0_6px_0_#F8FAFC,0_0_28px_rgba(56,189,248,0.65)] hover:scale-105 hover:-translate-y-1 active:translate-y-1 active:shadow-[0_2px_0_#38BDF8] transition-all duration-150 focus-visible:outline-4 focus-visible:outline-[#38BDF8]"
          >
            <span className="block skew-x-6">Mars</span>
          </button>

          <button
            onClick={() => handleChooseZone('deep_space')}
            className="group min-h-[54px] px-6 py-3 rounded-xl -skew-x-6 bg-[#06090F] hover:bg-[#38BDF8] text-[#F8FAFC] hover:text-[#06090F] font-black text-base tracking-wide uppercase border-[3px] border-[#38BDF8] ring-2 ring-[#F8FAFC]/80 shadow-[0_6px_0_#38BDF8,0_0_20px_rgba(56,189,248,0.2)] hover:shadow-[0_6px_0_#F8FAFC,0_0_28px_rgba(56,189,248,0.65)] hover:scale-105 hover:-translate-y-1 active:translate-y-1 active:shadow-[0_2px_0_#38BDF8] transition-all duration-150 focus-visible:outline-4 focus-visible:outline-[#38BDF8]"
          >
            <span className="block skew-x-6">Deepspace</span>
          </button>
        </div>
      </div>
    </div>
  );
};
