import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';

const WORDS = [
  { word: "Iron",     emoji: "🏊", color: "#E53935" },
  { word: "Marathon", emoji: "🏃", color: "#FF9800" },
  { word: "Strong",   emoji: "💪", color: "#839F8D" },
  { word: "Fast",     emoji: "⚡", color: "#D4E67C" },
  { word: "Lean",     emoji: "🎯", color: "#5095AC" },
  { word: "Healthy",  emoji: "🌿", color: "#4CAF50" },
  { word: "Happy",    emoji: "😊", color: "#FF9800" },
  { word: "The",      emoji: "✨", color: "#5095AC" },
];

const DELAYS = [400, 400, 400, 500, 500, 700, 900];
const TRANSITION_MS = 300;
const RESTART_DELAY = 30_000;

interface AnimatedTitleProps {
  idle?: boolean;
}

export function AnimatedTitle({ idle = true }: AnimatedTitleProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [settled, setSettled] = useState(false);
  const [glowing, setGlowing] = useState(false);
  const [slotWidth, setSlotWidth] = useState<number>(0);
  const scheduleRef = useRef<ReturnType<typeof setTimeout>>();
  const restartRef = useRef<ReturnType<typeof setTimeout>>();
  const measureRef = useRef<HTMLDivElement>(null);

  // Measure widest word on mount
  useLayoutEffect(() => {
    if (!measureRef.current) return;
    const spans = measureRef.current.querySelectorAll('span');
    let max = 0;
    spans.forEach(s => {
      const w = s.getBoundingClientRect().width;
      if (w > max) max = w;
    });
    setSlotWidth(Math.ceil(max) + 2);
  }, []);

  const resetAnimation = useCallback(() => {
    setCurrentIndex(0);
    setNextIndex(null);
    setTransitioning(false);
    setSettled(false);
    setGlowing(false);
  }, []);

  const advance = useCallback(() => {
    if (settled) return;
    const next = currentIndex + 1;
    if (next >= WORDS.length) return;

    setNextIndex(next);
    // Force a frame so "waiting" position renders, then trigger transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransitioning(true);
      });
    });

    setTimeout(() => {
      setCurrentIndex(next);
      setNextIndex(null);
      setTransitioning(false);
      if (next >= WORDS.length - 1) {
        setSettled(true);
        setGlowing(true);
        setTimeout(() => setGlowing(false), 3000);
      }
    }, TRANSITION_MS + 20);
  }, [currentIndex, settled]);

  // Drive word rotation
  useEffect(() => {
    if (settled || transitioning) return;
    if (currentIndex >= WORDS.length - 1) return;
    scheduleRef.current = setTimeout(advance, DELAYS[currentIndex] ?? 400);
    return () => clearTimeout(scheduleRef.current);
  }, [currentIndex, settled, transitioning, advance]);

  // Restart after 30s if idle
  useEffect(() => {
    if (!settled || !idle) return;
    restartRef.current = setTimeout(resetAnimation, RESTART_DELAY);
    return () => clearTimeout(restartRef.current);
  }, [settled, idle, resetAnimation]);

  const current = WORDS[currentIndex];
  const next = nextIndex !== null ? WORDS[nextIndex] : null;

  return (
    <div className="flex flex-col items-center w-full">
      {/* Hidden measurement container */}
      <div
        ref={measureRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          visibility: 'hidden',
          pointerEvents: 'none',
          fontFamily: "'Merriweather', serif",
          fontWeight: 700,
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
        }}
        className="text-[2.2rem] sm:text-[2.5rem] md:text-[3.5rem]"
      >
        {WORDS.map((w, i) => (
          <span key={i} style={{ display: 'block' }}>
            {w.emoji}&nbsp;{w.word}
          </span>
        ))}
      </div>

      <div
        className="inline-flex items-baseline justify-center whitespace-nowrap text-[2.2rem] sm:text-[2.5rem] md:text-[3.5rem] font-bold leading-tight"
        style={{
          fontFamily: "'Merriweather', serif",
          letterSpacing: '0.02em',
        }}
      >
        {/* Slot container */}
        <span
          style={{
            display: 'inline-block',
            overflow: 'hidden',
            height: '1.2em',
            width: slotWidth > 0 ? slotWidth : '9ch',
            position: 'relative',
            verticalAlign: 'baseline',
            textAlign: 'right',
          }}
        >
          {/* Current word */}
          <span
            style={{
              display: 'block',
              position: 'absolute',
              width: '100%',
              textAlign: 'right',
              right: 0,
              color: current.color,
              transform: transitioning ? 'translateY(-100%)' : 'translateY(0)',
              transition: transitioning ? `transform ${TRANSITION_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)` : 'none',
              willChange: settled ? 'auto' : 'transform',
              textShadow: glowing ? '0 0 10px rgba(80,149,172,0.3)' : 'none',
            }}
          >
            {current.emoji}&nbsp;{current.word}
          </span>

          {/* Next word */}
          {next && (
            <span
              style={{
                display: 'block',
                position: 'absolute',
                width: '100%',
                textAlign: 'right',
                right: 0,
                color: next.color,
                transform: transitioning ? 'translateY(0)' : 'translateY(100%)',
                transition: transitioning ? `transform ${TRANSITION_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)` : 'none',
                willChange: 'transform',
              }}
            >
              {next.emoji}&nbsp;{next.word}
            </span>
          )}
        </span>

        <span className="text-foreground" style={{ marginLeft: '0.3em' }}>
          Path Tracker
        </span>
      </div>

      <p
        className="mt-8 text-muted-foreground"
        style={{ fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.9rem' }}
      >
        Powered by Healthy Insight
      </p>
    </div>
  );
}
