interface Props {
  emoji: string;
  message: string;
}

export function CoachingCard({ emoji, message }: Props) {
  return (
    <div className="tip-callout mb-4 flex items-start gap-3 animate-in fade-in duration-500">
      <span className="mt-0.5 text-xl">{emoji}</span>
      <p className="text-sm leading-relaxed text-foreground">{message}</p>
    </div>
  );
}
