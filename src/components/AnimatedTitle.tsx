import { useState, useEffect, useRef } from 'react';

const WORDS = ["Iron", "Marathon", "Strong", "Fast", "Lean", "Healthy", "Happy", "The"];

export function AnimatedTitle() {
  const [wordIndex, setWordIndex] = useState(0);
  const [animState, setAnimState] = useState<'visible' | 'exiting' | 'entering'>('visible');
  const [settled, setSettled] = useState(false);
  const stepRef = useRef(0);

  // Total steps: 2 full loops (16) + 1 final pass (8) = 24, last one settles
  const TOTAL_STEPS = WORDS.length * 2 + WORDS.length;

  useEffect(() => {
    if (settled) return;

    const getDelay = (step: number) => {
      // Phase 1: fast cycling (first 16 steps)
      if (step < WORDS.length * 2) return 500;
      // Phase 2: deceleration (final pass)
      const finalIndex = step - WORDS.length * 2;
      if (finalIndex < 4) return 600;
      if (finalIndex < 6) return 800;
      if (finalIndex === 6) return 1000;
      return 0; // "The" - settle
    };

    const step = stepRef.current;
    if (step >= TOTAL_STEPS - 1) {
      setSettled(true);
      return;
    }

    const delay = getDelay(step);
    const timer = setTimeout(() => {
      setAnimState('exiting');
      setTimeout(() => {
        const nextStep = stepRef.current + 1;
        stepRef.current = nextStep;
        const nextWordIndex = nextStep % WORDS.length;
        setWordIndex(nextWordIndex);
        setAnimState('entering');
        setTimeout(() => {
          setAnimState('visible');
          if (nextStep >= TOTAL_STEPS - 1) {
            setSettled(true);
          }
        }, 150);
      }, 150);
    }, delay);

    return () => clearTimeout(timer);
  }, [wordIndex, animState, settled]);

  const transformStyle: React.CSSProperties = {
    display: 'inline-block',
    willChange: settled ? 'auto' : 'transform, opacity',
    transition: 'transform 150ms ease-out, opacity 150ms ease-out',
    opacity: animState === 'exiting' || animState === 'entering' ? 0 : 1,
    transform:
      animState === 'exiting'
        ? 'translateY(-10px)'
        : animState === 'entering'
        ? 'translateY(10px)'
        : 'translateY(0)',
  };

  return (
    <div className="flex flex-col items-center gap-1 py-4">
      <h1 className="text-xl tracking-tight">
        <span className="text-primary" style={transformStyle}>
          {WORDS[wordIndex]}
        </span>
        <span className="text-foreground"> Path Tracker</span>
      </h1>
      <p className="text-[11px] font-light text-muted-foreground" style={{ fontFamily: "'Merriweather Sans', sans-serif" }}>
        Powered by Healthy Insight
      </p>
    </div>
  );
}
