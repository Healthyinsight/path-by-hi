import { useState, useEffect, useRef, useCallback } from 'react';

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

export function AnimatedTitle() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'visible' | 'out' | 'in'>('visible');
  const [settled, setSettled] = useState(false);
  const [showEmoji, setShowEmoji] = useState(true);
  const [glowing, setGlowing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const advance = useCallback(() => {
    if (settled) return;
    setPhase('out');
    timerRef.current = setTimeout(() => {
      setIndex(prev => {
        const next = prev + 1;
        if (next >= WORDS.length - 1) {
          setSettled(true);
          setGlowing(true);
          setTimeout(() => setShowEmoji(false), 1000);
          setTimeout(() => setGlowing(false), 3000);
          return WORDS.length - 1;
        }
        return next;
      });
      setPhase('in');
      timerRef.current = setTimeout(() => setPhase('visible'), 120);
    }, 120);
  }, [settled]);

  useEffect(() => {
    if (settled || phase !== 'visible') return;
    if (index >= WORDS.length - 1) return;
    timerRef.current = setTimeout(advance, DELAYS[index] ?? 400);
    return () => clearTimeout(timerRef.current);
  }, [index, phase, settled, advance]);

  const { word, emoji, color } = WORDS[index];

  const wordStyle: React.CSSProperties = {
    color,
    display: 'inline-block',
    willChange: settled ? 'auto' : 'transform, opacity',
    transition: 'transform 120ms ease-out, opacity 120ms ease-out',
    opacity: phase === 'out' || phase === 'in' ? 0 : 1,
    transform: phase === 'out' ? 'translateY(-8px)' : phase === 'in' ? 'translateY(8px)' : 'translateY(0)',
    textShadow: glowing ? '0 0 10px rgba(80,149,172,0.3)' : 'none',
  };

  return (
    <div className="flex flex-col items-center text-center">
      <div className="leading-tight" style={{ letterSpacing: '0.02em' }}>
        {/* Single line: emoji + rotating word (fixed-width, right-aligned) + "Path Tracker" */}
        <div
          className="flex items-baseline justify-center text-[2.5rem] md:text-[3.5rem] font-bold"
          style={{ fontFamily: "'Merriweather', serif", gap: '0.15em' }}
        >
          {showEmoji && <span style={{ ...wordStyle, fontSize: '0.8em' }}>{emoji}</span>}
          <span
            style={{
              ...wordStyle,
              display: 'inline-flex',
              justifyContent: 'flex-end',
              width: '9ch',
              textAlign: 'right',
            }}
          >
            {word}
          </span>
          <span className="text-foreground">Path Tracker</span>
        </div>
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
