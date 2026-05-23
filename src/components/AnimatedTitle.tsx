import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const WORDS = [
  { word: "Iron",     emoji: "🏊", color: "#E53935" },
  { word: "Marathon", emoji: "🏃", color: "#FF9800" },
  { word: "Strong",   emoji: "💪", color: "#839F8D" },
  { word: "Fast",     emoji: "⚡", color: "#D4E67C" },
  { word: "Lean",     emoji: "🎯", color: "#5095AC" },
  { word: "Healthy",  emoji: "🌿", color: "#4CAF50" },
  { word: "Path",     emoji: "✨", color: "#5095AC" },
];

const TIMINGS = [1500, 1500, 1500, 1500, 1800, 2000];
const RESTART_DELAY = 30_000;

interface AnimatedTitleProps {
  idle?: boolean;
}

export function AnimatedTitle({ idle = true }: AnimatedTitleProps) {
  const [index, setIndex] = useState(0);
  const [settled, setSettled] = useState(false);
  const [glowing, setGlowing] = useState(false);

  useEffect(() => {
    if (index >= WORDS.length - 1) {
      setSettled(true);
      setGlowing(true);
      const glowTimer = setTimeout(() => setGlowing(false), 2000);
      return () => { clearTimeout(glowTimer); };
    }
    const timer = setTimeout(() => setIndex(i => i + 1), TIMINGS[index] ?? 1500);
    return () => clearTimeout(timer);
  }, [index]);

  const resetAnimation = useCallback(() => {
    setIndex(0);
    setSettled(false);
  }, []);

  useEffect(() => {
    if (!settled || !idle) return;
    const restartRef = setTimeout(resetAnimation, RESTART_DELAY);
    return () => clearTimeout(restartRef);
  }, [settled, idle, resetAnimation]);

  const current = WORDS[index];

  return (
    <div className="flex flex-col items-center w-full">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.2em',
          fontFamily: "'Merriweather', serif",
          letterSpacing: '0.02em',
        }}
      >
        {/* Rotating word with emoji */}
        <div
          className="text-[2rem] sm:text-[2.5rem]"
          style={{
            textAlign: 'center',
            minHeight: '1.3em',
            fontFamily: "'Merriweather', serif",
            fontWeight: 700,
          }}
        >
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

        {/* Static "by Hi" */}
        <span
          className="text-[2rem] sm:text-[2.5rem]"
          style={{
            fontFamily: "'Merriweather', serif",
            fontWeight: 700,
            textAlign: 'center',
            whiteSpace: 'nowrap',
            color: '#1A2B32',
          }}
        >
          by HI
</span>
      </div>

      {/* Powered by badge */}
      <div
        className="mt-3"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          fontFamily: "'Merriweather Sans', sans-serif",
          fontSize: '11px',
          letterSpacing: '0.5px',
          color: '#8E9BA3',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: '20px',
          padding: '4px 12px',
          background: 'rgba(255, 255, 255, 0.5)',
        }}
      >
        Powered by Healthy Insight
      </div>
    </div>
  );
}
