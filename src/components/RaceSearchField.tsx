import { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { RACES_2026, type Race } from '@/data/races';

interface RaceSearchFieldProps {
  value: string;
  primaryType?: Race['type'];
  onSelect: (race: Race) => void;
  onManualChange: (name: string) => void;
}

export function RaceSearchField({
  value,
  primaryType,
  onSelect,
  onManualChange,
}: RaceSearchFieldProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const query = value;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const filtered = RACES_2026.filter((race) => {
      const haystack = `${race.name} ${race.location}`.toLowerCase();
      return haystack.includes(q);
    });

    const sorted = [...filtered].sort((a, b) => {
      const aPrimary = primaryType && a.type === primaryType;
      const bPrimary = primaryType && b.type === primaryType;
      if (aPrimary && !bPrimary) return -1;
      if (!aPrimary && bPrimary) return 1;
      return a.name.localeCompare(b.name, 'sv');
    });

    return sorted.slice(0, 5);
  }, [query, primaryType]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    onManualChange(next);
    setOpen(true);
  };

  const handleSelect = (race: Race) => {
    onSelect(race);
    setOpen(false);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('sv-SE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={value}
        onChange={handleChange}
        placeholder="Sök bland populära lopp eller skriv eget..."
        className="h-[52px] rounded-lg"
        autoComplete="off"
      />

      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-popover shadow-lg">
          <ul className="divide-y divide-border">
            {results.map((race) => (
              <li
                key={`${race.name}-${race.date}`}
                className="cursor-pointer px-3 py-2 hover:bg-muted/60"
                onClick={() => handleSelect(race)}
              >
                <p className="text-sm font-semibold text-foreground">{race.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(race.date)} • {race.location} • {race.distance}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

