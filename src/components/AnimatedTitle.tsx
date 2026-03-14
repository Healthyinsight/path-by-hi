import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

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

const TIMINGS = [800, 800, 800, 1000, 1000, 1200, 1500];
const RESTART_DELAY = 30_000;

interface AnimatedTitleProps {
  idle?: boolean;
}

export function AnimatedTitle({ idle = true }: AnimatedTitleProps) {
  const [index, setIndex] = useState(0);
  const [settled, setSettled] = useState(false);
  const [glowing, setGlowing] = useState(false);

  // Cycle through words
  useEffect(() => {
    if (index >= WORDS.length - 1) {
      setSettled(true);
      setGlowing(true);
      // Stop glow after 2s
      const glowTimer = setTimeout(() => setGlowing(false), 2000);
      return () => { clearTimeout(glowTimer); };
    }
    const timer = setTimeout(() => setIndex(i => i + 1), TIMINGS[index] ?? 800);
    return () => clearTimeout(timer);
  }, [index]);

  const resetAnimation = useCallback(() => {
    setIndex(0);
    setSettled(false);
  }, []);

  // Restart after 30s if idle
  useEffect(() => {
    if (!settled || !idle) return;
    const restartRef = setTimeout(resetAnimation, RESTART_DELAY);
    return () => clearTimeout(restartRef);
  }, [settled, idle, resetAnimation]);

  const current = WORDS[index];

  return (
    <div className="flex flex-col items-center w-full">
      {/* 3-column grid: rotating word (right-aligned) | Path Tracker (center) | empty spacer */}
      <div
        className="text-[2.2rem] sm:text-[2.5rem] md:text-[3.5rem] font-bold leading-tight"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'baseline',
          width: '100%',
          fontFamily: "'Merriweather', serif",
          letterSpacing: '0.02em',
        }}
      >
        {/* Column 1: rotating word, right-aligned */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline' }}>
          <AnimatePresence mode="wait">
            <motion.span
              key={index}
              initial={{ y: '60%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-60%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 150 }}
              style={{
                display: 'inline-block',
                color: current.color,
                whiteSpace: 'nowrap',
                textShadow: glowing && settled ? '0 0 12px rgba(80,149,172,0.3)' : 'none',
              }}
            >
              {current.emoji}&nbsp;{current.word}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Column 2: "Path Tracker" — center anchor */}
        <span
          className="text-foreground"
          style={{
            paddingLeft: '0.3em',
            whiteSpace: 'nowrap',
          }}
        >
          Path Tracker
        </span>

        {/* Column 3: empty spacer for symmetry */}
        <div></div>
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
