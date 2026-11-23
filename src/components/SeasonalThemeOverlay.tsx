import React, { useEffect, useRef } from 'react';
import { SiteTheme } from '../types';

interface SeasonalThemeOverlayProps {
  activeTheme: SiteTheme | null;
}

declare global {
  interface Window {
    __destroyWinterWonderland?: () => void;
  }
}

export const SeasonalThemeOverlay: React.FC<SeasonalThemeOverlayProps> = ({ activeTheme }) => {
  const snowCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const santaCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Santa & Snow 60FPS Animation Loops with Teardown
  useEffect(() => {
    if (!activeTheme?.ambient || activeTheme.ambient.type === 'none') {
      if (window.__destroyWinterWonderland) {
        window.__destroyWinterWonderland();
      }
      return;
    }

    let running = true;
    let snowAnimFrame: number | null = null;
    let santaAnimFrame: number | null = null;
    const cleanups: Array<() => void> = [];

    // 1. Falling Snow Canvas Loop
    if (activeTheme.ambient.fallingSnow) {
      const c = snowCanvasRef.current;
      if (c) {
        const ctx = c.getContext('2d');
        if (ctx) {
          let w = (c.width = window.innerWidth);
          let h = (c.height = window.innerHeight);

          const onResizeSnow = () => {
            if (!c) return;
            w = c.width = window.innerWidth;
            h = c.height = window.innerHeight;
          };
          window.addEventListener('resize', onResizeSnow, { passive: true });
          cleanups.push(() => window.removeEventListener('resize', onResizeSnow));

          const count = activeTheme.ambient.particleCount || 55;
          const color = activeTheme.ambient.particleColor || 'rgba(255, 255, 255, 0.82)';
          const flakes = Array.from({ length: count }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            r: 1.5 + Math.random() * 2.2,
            s: 0.6 + Math.random() * 1.1,
          }));

          const loopSnow = () => {
            if (!running) return;
            if (!document.hidden) {
              ctx.clearRect(0, 0, w, h);
              ctx.beginPath();
              ctx.fillStyle = color;
              for (let i = 0; i < flakes.length; i++) {
                const f = flakes[i];
                f.y += f.s;
                if (f.y > h) {
                  f.y = -6;
                  f.x = Math.random() * w;
                }
                ctx.moveTo(f.x + f.r, f.y);
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
              }
              ctx.fill();
            }
            snowAnimFrame = requestAnimationFrame(loopSnow);
          };

          snowAnimFrame = requestAnimationFrame(loopSnow);
          cleanups.push(() => {
            if (snowAnimFrame) cancelAnimationFrame(snowAnimFrame);
          });
        }
      }
    }

    // 2. Running Santa & Reindeer Sleigh Canvas Loop (Above Footer Snowline)
    if (activeTheme.ambient.runningSanta) {
      const sc = santaCanvasRef.current;
      if (sc) {
        const sctx = sc.getContext('2d');
        if (sctx) {
          let sw = (sc.width = window.innerWidth);
          sc.height = 70;

          const onResizeSanta = () => {
            if (!sc) return;
            sw = sc.width = window.innerWidth;
          };
          window.addEventListener('resize', onResizeSanta, { passive: true });
          cleanups.push(() => window.removeEventListener('resize', onResizeSanta));

          let sx = -180;
          const runSanta = () => {
            if (!running) return;
            if (!document.hidden) {
              sx += 1.25;
              if (sx > sw + 180) sx = -180;
              const gy = 54;
              sctx.clearRect(0, 0, sw, 70);

              // Reins
              sctx.strokeStyle = 'rgba(251,191,36,0.8)';
              sctx.lineWidth = 1.1;
              sctx.beginPath();
              sctx.moveTo(sx + 8, gy - 16);
              sctx.lineTo(sx + 92, gy - 12);
              sctx.stroke();

              // Sleigh body
              sctx.fillStyle = '#dc2626';
              sctx.beginPath();
              if (typeof sctx.roundRect === 'function') {
                sctx.roundRect(sx - 20, gy - 14, 36, 10, 4);
              } else {
                sctx.rect(sx - 20, gy - 14, 36, 10);
              }
              sctx.fill();

              // Sleigh runners (gold)
              sctx.strokeStyle = '#fbbf24';
              sctx.lineWidth = 1.6;
              sctx.beginPath();
              sctx.moveTo(sx - 22, gy - 1);
              sctx.lineTo(sx + 20, gy - 1);
              sctx.stroke();

              // Santa torso & head
              sctx.fillStyle = '#dc2626';
              sctx.beginPath();
              sctx.arc(sx - 2, gy - 18, 6, 0, Math.PI * 2);
              sctx.fill();
              sctx.fillStyle = '#fed7aa';
              sctx.beginPath();
              sctx.arc(sx, gy - 25, 3.8, 0, Math.PI * 2);
              sctx.fill();

              // Reindeer team (2 reindeer)
              [48, 86].forEach((off, idx) => {
                const rx = sx + off;
                const stride = Math.sin(sx * 0.14 + idx) * 5;
                sctx.strokeStyle = '#78350f';
                sctx.lineWidth = 2;
                sctx.beginPath();
                sctx.moveTo(rx - 5, gy - 9);
                sctx.lineTo(rx - 5 - stride, gy);
                sctx.moveTo(rx + 5, gy - 9);
                sctx.lineTo(rx + 5 + stride, gy);
                sctx.stroke();

                sctx.fillStyle = '#92400e';
                sctx.beginPath();
                sctx.ellipse(rx, gy - 12, 9, 4.5, 0, 0, Math.PI * 2);
                sctx.fill();

                sctx.beginPath();
                sctx.arc(rx + 11, gy - 18, 3.6, 0, Math.PI * 2);
                sctx.fill();

                // Rudolph's glowing red nose on the lead reindeer
                if (idx === 1) {
                  sctx.fillStyle = '#ef4444';
                  sctx.beginPath();
                  sctx.arc(rx + 15, gy - 18, 1.6, 0, Math.PI * 2);
                  sctx.fill();
                }
              });
            }
            santaAnimFrame = requestAnimationFrame(runSanta);
          };

          santaAnimFrame = requestAnimationFrame(runSanta);
          cleanups.push(() => {
            if (santaAnimFrame) cancelAnimationFrame(santaAnimFrame);
          });
        }
      }
    }

    // Expose window.__destroyWinterWonderland for global teardown
    window.__destroyWinterWonderland = () => {
      running = false;
      cleanups.forEach((c) => c());
    };

    return () => {
      running = false;
      cleanups.forEach((c) => c());
    };
  }, [activeTheme?.ambient]);

  if (!activeTheme) {
    return null;
  }

  const { navbar, footer, corners, ambient } = activeTheme;

  return (
    <>
      {/* Global Theme Animation Keyframes */}
      <style>{`
        .ww-overlay { pointer-events: none !important; contain: layout style paint; }
        @keyframes wwBulbGlow {
          0%, 100% { opacity: 1; filter: brightness(1.2) drop-shadow(0 0 3px currentColor); }
          50% { opacity: 0.35; filter: brightness(0.75); }
        }
        @keyframes themeRunnerFly {
          0% { transform: translateX(-240px) translateY(0px); }
          50% { transform: translateX(50vw) translateY(-8px); }
          100% { transform: translateX(calc(100vw + 240px)) translateY(0px); }
        }
        .theme-runner-animated {
          animation: themeRunnerFly 18s linear infinite;
          will-change: transform;
        }
      `}</style>

      {/* 1. Navbar Top Announcement / Greeting Banner */}
      {navbar?.bannerText && (
        <div
          role="region"
          aria-label="Seasonal announcement banner"
          style={{
            background: navbar.bannerBg || 'linear-gradient(90deg, #064e3b, #991b1b, #064e3b)',
            color: navbar.bannerTextColor || '#ffffff',
          }}
          className="w-full text-center py-1.5 px-4 font-semibold text-xs leading-tight shadow-xs select-none pointer-events-none relative z-40 transition-all duration-300"
        >
          <span>{navbar.bannerText}</span>
        </div>
      )}

      {/* 2. Top Navbar Bottom String Lights Decoration */}
      {navbar?.stringLights && navbar.stringLightsSvg && (
        <div
          aria-hidden="true"
          className="ww-overlay fixed top-[48px] sm:top-[50px] lg:top-[56px] left-0 w-full h-[26px] z-30 overflow-hidden"
          dangerouslySetInnerHTML={{ __html: navbar.stringLightsSvg }}
        />
      )}

      {/* 3. Navbar Bottom Runner (Flying Santa, Reindeer, or Garland strip if specified) */}
      {navbar?.runnerSvg && (
        <div
          aria-hidden="true"
          style={{ height: `${navbar.runnerHeight || 42}px` }}
          className="ww-overlay fixed top-[52px] sm:top-[60px] left-0 w-full overflow-hidden z-30"
        >
          <div
            className="theme-runner-animated inline-block pt-1"
            dangerouslySetInnerHTML={{ __html: navbar.runnerSvg }}
          />
        </div>
      )}

      {/* 4. Above-Footer Blended Snowbanks Wave */}
      {footer?.blendSvg && (
        <div
          aria-hidden="true"
          style={{ height: `${footer.blendHeight || 54}px` }}
          className="ww-overlay fixed bottom-0 left-0 w-full z-[9996]"
          dangerouslySetInnerHTML={{ __html: footer.blendSvg }}
        />
      )}

      {/* 5. Running Santa Canvas Above Footer Snowline */}
      {ambient && ambient.runningSanta && (
        <canvas
          ref={santaCanvasRef}
          aria-hidden="true"
          className="ww-overlay fixed bottom-[16px] left-0 w-full h-[70px] z-[9998]"
        />
      )}

      {/* 6. Bottom-Left Corner Scene (Christmas tree + snowman + gifts) */}
      {corners?.bottomLeftSvg && (
        <div
          aria-hidden="true"
          className={`ww-overlay fixed bottom-[12px] left-[22px] w-[180px] sm:w-[194px] z-[9999] transition-all duration-300 ${
            corners.scaleOnMobile ? 'hidden sm:block' : ''
          }`}
          dangerouslySetInnerHTML={{ __html: corners.bottomLeftSvg }}
        />
      )}

      {/* 7. Bottom-Right Corner Scene (placed to the left of the floating Foxxy button) */}
      {corners?.bottomRightSvg && (
        <div
          aria-hidden="true"
          className={`ww-overlay fixed bottom-[12px] right-[76px] sm:right-[88px] w-[140px] sm:w-[160px] z-[9997] transition-all duration-300 ${
            corners.scaleOnMobile ? 'hidden sm:block' : ''
          }`}
          dangerouslySetInnerHTML={{ __html: corners.bottomRightSvg }}
        />
      )}

      {/* 8. Ambient Falling Snow Canvas */}
      {ambient && ambient.fallingSnow && (
        <canvas
          ref={snowCanvasRef}
          aria-hidden="true"
          className="ww-overlay fixed inset-0 w-full h-full z-[10000]"
        />
      )}
    </>
  );
};
