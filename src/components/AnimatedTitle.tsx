import { useState, useEffect, useRef, useCallback } from 'react';
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

const TIMINGS = [400, 400, 400, 500, 500, 700, 900];
const RESTART_DELAY = 30_000;

interface AnimatedTitleProps {
  idle?: boolean;
}

export function AnimatedTitle({ idle = true }: AnimatedTitleProps) {
  const [index, setIndex] = useState(0);
  const [settled, setSettled] = useState(false);
  const [emojiVisible, setEmojiVisible] = useState(true);
  const [glowing, setGlowing] = useState(false);
  const [fixedWidth, setFixedWidth] = useState<number | null>(null);
  const containerRef = useRef<HTMLSpanElement>(null);
  const restartRef = useRef<ReturnType<typeof setTimeout>>();

  // Measure widest word on mount
  useEffect(() => {
    const measurer = document.createElement('span');
    measurer.style.cssText =
      'position:absolute;visibility:hidden;white-space:nowrap;pointer-events:none;';
    measurer.style.fontFamily = "'Merriweather', serif";
    measurer.style.fontWeight = '700';
    measurer.style.letterSpacing = '0.02em';
    // Match responsive font size
    const fontSize = window.innerWidth < 640 ? '2.2rem' : window.innerWidth < 768 ? '2.5rem' : '3.5rem';
    measurer.style.fontSize = fontSize;
    document.body.appendChild(measurer);
    let maxW = 0;
    WORDS.forEach(w => {
      measurer.textContent = `${w.emoji}\u00A0${w.word}`;
      maxW = Math.max(maxW, measurer.getBoundingClientRect().width);
    });
    document.body.removeChild(measurer);
    setFixedWidth(Math.ceil(maxW) + 4);
  }, []);

  // Cycle through words
  useEffect(() => {
    if (index >= WORDS.length - 1) {
      setSettled(true);
      setGlowing(true);
      // Fade emoji after 1s
      const emojiTimer = setTimeout(() => setEmojiVisible(false), 1000);
      // Stop glow after 2s
      const glowTimer = setTimeout(() => setGlowing(false), 2000);
      return () => { clearTimeout(emojiTimer); clearTimeout(glowTimer); };
    }
    const timer = setTimeout(() => setIndex(i => i + 1), TIMINGS[index] ?? 400);
    return () => clearTimeout(timer);
  }, [index]);

  const resetAnimation = useCallback(() => {
    setIndex(0);
    setSettled(false);
    setEmojiVisible(true);
    setGlowing(false);
  }, []);

  // Restart after 30s if idle
  useEffect(() => {
    if (!settled || !idle) return;
    restartRef.current = setTimeout(resetAnimation, RESTART_DELAY);
    return () => clearTimeout(restartRef.current);
  }, [settled, idle, resetAnimation]);

  const current = WORDS[index];

  return (
    <div className="flex flex-col items-center w-full">
      <div
        className="inline-flex items-baseline justify-center whitespace-nowrap text-[2.2rem] sm:text-[2.5rem] md:text-[3.5rem] font-bold leading-tight"
        style={{
          fontFamily: "'Merriweather', serif",
          letterSpacing: '0.02em',
        }}
      >
        {/* Rotating word container — fixed width, right-aligned */}
        <span
          ref={containerRef}
          style={{
            display: 'inline-flex',
            justifyContent: 'flex-end',
            alignItems: 'baseline',
            width: fixedWidth ? `${fixedWidth}px` : '10ch',
            position: 'relative',
            height: '1.2em',
            verticalAlign: 'baseline',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={index}
              initial={{ y: '60%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-60%', opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 250 }}
              style={{
                display: 'inline-block',
                color: current.color,
                whiteSpace: 'nowrap',
                textShadow: glowing && settled ? '0 0 12px rgba(80,149,172,0.3)' : 'none',
              }}
            >
              {settled ? (
                <>
                  <motion.span
                    initial={{ opacity: 1 }}
                    animate={{ opacity: emojiVisible ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {current.emoji}
                  </motion.span>
                  {emojiVisible ? '\u00A0' : ''}
                  {current.word}
                </>
              ) : (
                <>{current.emoji}&nbsp;{current.word}</>
              )}
            </motion.span>
          </AnimatePresence>
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
