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

  const rotating = phase === 'out' || phase === 'in';

  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="text-[2.5rem] md:text-[3.5rem] font-bold leading-tight"
        style={{
          fontFamily: "'Merriweather', serif",
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            minWidth: '10ch',
            textAlign: 'right',
            color,
            opacity: rotating ? 0 : 1,
            transform: phase === 'out' ? 'translateY(-8px)' : phase === 'in' ? 'translateY(8px)' : 'translateY(0)',
            transition: 'transform 120ms ease-out, opacity 120ms ease-out',
            willChange: settled ? 'auto' : 'transform, opacity',
            textShadow: glowing ? '0 0 10px rgba(80,149,172,0.3)' : 'none',
          }}
        >
          {showEmoji && <span style={{ marginRight: '0.2em' }}>{emoji}</span>}
          {word}
        </span>
        {' '}
        <span className="text-foreground">Path Tracker</span>
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
