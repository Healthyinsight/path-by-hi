// MOCK DATA – Replace with AI-generated insights from training data

export interface Insight {
  id: string;
  type: 'positive' | 'warning' | 'suggestion' | 'milestone';
  icon: string;
  title: string;
  body: string;
  source?: string;
  action?: {
    label: string;
    route?: string;
  };
}

export const ALL_INSIGHTS: Insight[] = [
  {
    id: 'insight-1',
    type: 'positive',
    icon: '📈',
    title: 'Löppace förbättras',
    body: 'Din Zone 2-pace har förbättrats 12 sek/km senaste 3 veckorna. Basen byggs!',
    source: 'Build Your Running Base – HI',
  },
  {
    id: 'insight-2',
    type: 'warning',
    icon: '😴',
    title: 'Sömntrend nedåt',
    body: 'Du har snittat 6.1h sömn senaste 5 dagarna. Sikta på 7.5h+ för optimal återhämtning.',
    source: 'Sleep for Performance – HI',
  },
  {
    id: 'insight-3',
    type: 'suggestion',
    icon: '🏊',
    title: 'Simningen saknas',
    body: 'Du har missat simningen 2 veckor i rad. Vill du lägga in ett extra pass?',
    action: { label: 'Se schemat', route: '/schedule' },
  },
  {
    id: 'insight-4',
    type: 'milestone',
    icon: '🎯',
    title: 'Halvvägs!',
    body: '8 av 16 veckor avklarade. Du ligger bra till – 83% schema-compliance.',
  },
  {
    id: 'insight-5',
    type: 'positive',
    icon: '💪',
    title: 'Styrka ökar',
    body: 'Du har ökat vikten i benpress 3 pass i rad. Bra progression!',
  },
  {
    id: 'insight-6',
    type: 'warning',
    icon: '⚠️',
    title: 'Hög belastning',
    body: 'Du har kört hårda pass 4 dagar i rad. Överväg en lättare dag imorgon.',
    source: 'Recovery & Overtraining – HI',
  },
  {
    id: 'insight-7',
    type: 'suggestion',
    icon: '🍗',
    title: 'Proteinbrist igår',
    body: 'Du nådde bara 68% av proteinmålet igår. Försök nå 170g+ idag.',
    action: { label: 'Se kostplan', route: '/nutrition' },
  },
  {
    id: 'insight-8',
    type: 'positive',
    icon: '🔥',
    title: '5-dagars streak!',
    body: '5 pass i rad genomförda! Fortsätt så – konsistens slår perfektion.',
  },
];

// Returns 1-2 insights deterministically based on day
export function getTodayInsights(): Insight[] {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const i1 = dayOfYear % ALL_INSIGHTS.length;
  const i2 = (dayOfYear + 3) % ALL_INSIGHTS.length;
  if (i1 === i2) return [ALL_INSIGHTS[i1]];
  return [ALL_INSIGHTS[i1], ALL_INSIGHTS[i2]];
}
