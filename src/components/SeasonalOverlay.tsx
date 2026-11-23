import React, { useEffect, useRef, useState } from 'react';

export const SeasonalOverlay: React.FC = () => {
  // Check seasonal state: defaults to enabled during Nov/Dec, or user override
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('vault_seasonal_theme');
    if (saved === 'false' || saved === 'disabled') return false;
    if (saved === 'true' || saved === 'enabled') return true;
    // Auto-schedule during holiday season (Month 10 = Nov, Month 11 = Dec in 0-indexed JS)
    const month = new Date().getMonth();
    return month === 10 || month === 11 || month === 0;
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Global toggle hook for convenience
  useEffect(() => {
    (window as any).toggleSeasonalTheme = () => {
      setIsEnabled((prev) => {
        const next = !prev;
        localStorage.setItem('vault_seasonal_theme', next ? 'enabled' : 'disabled');
        return next;
      });
    };
  }, []);

  // 60FPS Snow Canvas Animation Loop
  useEffect(() => {
    if (!isEnabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isRunning = true;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const flakes = Array.from({ length: 65 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 1.4 + Math.random() * 2.4,
      vy: 0.55 + Math.random() * 1.15,
      p: Math.random() * Math.PI * 2,
    }));

    const renderLoop = () => {
      if (!isRunning) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
      ctx.beginPath();

      for (const f of flakes) {
        f.y += f.vy;
        f.p += 0.015;
        f.x += Math.sin(f.p) * 0.45;

        if (f.y > canvas.height) {
          f.y = -6;
          f.x = Math.random() * canvas.width;
        }

        ctx.moveTo(f.x, f.y);
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      }

      ctx.fill();
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isEnabled]);

  if (!isEnabled) return null;

  return (
    <>
      <style>{`
        .ww-overlay {
          pointer-events: none !important;
          user-select: none !important;
        }
        @keyframes wwSantaFly {
          0% { transform: translateX(-220px) translateY(0px); }
          50% { transform: translateX(50vw) translateY(-8px); }
          100% { transform: translateX(calc(100vw + 220px)) translateY(0px); }
        }
        .ww-santa-runner {
          animation: wwSantaFly 22s linear infinite;
          will-change: transform;
        }
      `}</style>

      {/* 1. Flying Santa & Reindeer Sleigh below navbar */}
      <div
        className="ww-overlay fixed top-[52px] sm:top-[60px] left-0 w-full h-[40px] z-[70] overflow-hidden"
        aria-hidden="true"
      >
        <div className="ww-santa-runner inline-block pt-1">
          <svg width="155" height="36" viewBox="0 0 210 48" style={{ overflow: 'visible' }}>
            {/* Sleigh */}
            <path d="M44 25 C40 16,48 11,56 14 C61 16,62 22,59 27 Z" fill="#92400e" />
            <path d="M60 26 C60 20,70 20,71 26 Z" fill="#dc2626" />
            <circle cx="66" cy="18" r="3.4" fill="#fed7aa" />
            <path d="M41 24 L74 24 C78 24,80 28,77 32 L45 32 Z" fill="#dc2626" />
            <path d="M38 36 L77 36 C82 36,84 32,81 30" fill="none" stroke="#fbbf24" strokeWidth="1.8" />
            {/* Reins */}
            <path d="M76 25 Q102 29 124 22 M76 25 Q128 31 174 21" fill="none" stroke="#fbbf24" strokeWidth="1.1" />
            {/* Reindeers */}
            <g transform="translate(114,11)">
              <ellipse cx="15" cy="16" rx="9" ry="4.5" fill="#92400e" />
              <ellipse cx="27.5" cy="8.5" rx="4.2" ry="2.8" fill="#a16207" />
            </g>
            <g transform="translate(164,9)">
              <ellipse cx="16" cy="16.5" rx="9.5" ry="4.8" fill="#a16207" />
              <ellipse cx="29" cy="8.5" rx="4.5" ry="3" fill="#b45309" />
              <circle cx="33.8" cy="8.5" r="2.3" fill="#ef4444" />
            </g>
          </svg>
        </div>
      </div>

      {/* 2. Layered Bottom Snowbanks */}
      <div
        className="ww-overlay fixed bottom-0 left-0 w-full h-[42px] sm:h-[50px] z-[70]"
        aria-hidden="true"
      >
        <svg viewBox="0 0 1440 84" preserveAspectRatio="none" className="w-full h-full block">
          <path
            d="M0,44 C220,24 410,56 670,34 C910,14 1140,52 1440,32 L1440,84 L0,84 Z"
            fill="rgba(224, 242, 254, 0.75)"
          />
          <path
            d="M0,52 C160,36 330,62 540,48 C760,34 960,62 1190,44 C1310,35 1385,44 1440,50 L1440,84 L0,84 Z"
            fill="rgba(255, 255, 255, 0.95)"
          />
        </svg>
      </div>

      {/* 3. Left Corner Scene: Mini Christmas Tree + Wrapped Gifts */}
      <div
        className="ww-overlay fixed bottom-6 sm:bottom-8 left-3 sm:left-6 w-[110px] sm:w-[135px] z-[71]"
        aria-hidden="true"
      >
        <svg viewBox="0 0 154 96" className="w-full h-auto overflow-visible">
          {/* Tree Trunk */}
          <rect x="33" y="76" width="10" height="13" rx="2" fill="#78350f" />
          {/* Tree Tiers */}
          <path d="M38 47 L6 78 L70 78 Z" fill="#14532d" />
          <path d="M38 30 L12 58 L64 58 Z" fill="#166534" />
          <path d="M38 15 L19 39 L57 39 Z" fill="#16a34a" />
          {/* Gold Star */}
          <polygon
            points="38,5 40.1,9.6 45,10.1 41.3,13.4 42.4,18.2 38,15.7 33.6,18.2 34.7,13.4 31,10.1 35.9,9.6"
            fill="#fbbf24"
          />
          {/* Gift Box 1 (Red & Gold) */}
          <rect x="75" y="64" width="28" height="23" rx="3" fill="#dc2626" />
          <rect x="86" y="61" width="5.5" height="26" fill="#fbbf24" />
          {/* Gift Box 2 (Emerald & Gold) */}
          <rect x="107" y="68" width="23" height="19" rx="2.5" fill="#059669" />
          <rect x="116.5" y="65.5" width="4.5" height="21.5" fill="#fbbf24" />
        </svg>
      </div>

      {/* 4. Right Corner Scene: Stockings & Holiday Gifts (placed to left of Foxxy button) */}
      <div
        className="ww-overlay fixed bottom-6 sm:bottom-8 right-28 sm:right-36 w-[120px] sm:w-[145px] z-[71] hidden md:block"
        aria-hidden="true"
      >
        <svg viewBox="0 0 174 100" className="w-full h-auto overflow-visible">
          {/* Blue Gift */}
          <g transform="translate(8,69)">
            <rect x="0" y="3.5" width="24" height="18" rx="2.5" fill="#2563eb" />
            <rect x="10" y="1.5" width="4" height="20" fill="#fbbf24" />
            <rect x="0" y="10.5" width="24" height="3.6" fill="#fbbf24" />
          </g>
          {/* Red Gift */}
          <g transform="translate(36,63)">
            <rect x="0" y="4" width="28" height="22" rx="3" fill="#dc2626" />
            <rect x="11.5" y="2" width="5" height="24" fill="#fbbf24" />
            <rect x="0" y="12.5" width="28" height="4.5" fill="#fbbf24" />
          </g>
          {/* Green Gift */}
          <g transform="translate(42,47)">
            <rect x="0" y="3" width="18" height="13" rx="2" fill="#059669" />
            <rect x="7.5" y="1.5" width="3" height="14.5" fill="#ef4444" />
          </g>
          {/* Small Ornaments */}
          <circle cx="72" cy="85" r="4" fill="#ef4444" />
          <circle cx="83" cy="86.5" r="3.5" fill="#fbbf24" />
          {/* Stocking Stand */}
          <g transform="translate(86,14)">
            <rect x="52" y="14" width="5.5" height="60" rx="2.5" fill="#78350f" />
            <rect x="4" y="12" width="58" height="5" rx="2.5" fill="#78350f" />
            {/* Red Stocking */}
            <g transform="translate(10,16) rotate(4)">
              <path d="M4 6 L18 6 L18 26 C18 33,14 37,6 39 C1 40.2,-3 37.5,-2 33 C-1 29,4 27,4 23 Z" fill="#dc2626" />
              <rect x="2" y="2" width="18" height="6.5" rx="3" fill="#f8fafc" />
            </g>
            {/* Green Stocking */}
            <g transform="translate(32,16) rotate(-5)">
              <path d="M4 6 L17 6 L17 24 C17 30,13 34,6 36 C1.5 37.2,-2.2 34.8,-1.2 30.5 C-0.3 26.8,4 25,4 21.5 Z" fill="#10b981" />
              <rect x="2" y="2" width="17" height="6" rx="2.8" fill="#f8fafc" />
            </g>
            <circle cx="53.5" cy="13" r="2" fill="#ef4444" />
            <circle cx="57" cy="13.5" r="1.8" fill="#dc2626" />
          </g>
        </svg>
      </div>

      {/* 5. 60FPS Falling Snow Canvas */}
      <canvas
        ref={canvasRef}
        className="ww-overlay fixed inset-0 w-full h-full z-[75]"
        aria-hidden="true"
      />
    </>
  );
};
