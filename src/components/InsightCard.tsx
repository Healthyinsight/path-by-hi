import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Moon, Dumbbell, Utensils } from 'lucide-react';
import type { InsightWithReason } from '@/hooks/useInsights';

const severityStyles: Record<string, { border: string; bg: string; iconColor: string }> = {
  positive: { border: '#839F8D', bg: 'rgba(131, 159, 141, 0.05)', iconColor: '#839F8D' },
  info:     { border: '#5095AC', bg: 'rgba(80, 149, 172, 0.05)', iconColor: '#5095AC' },
  warning:  { border: '#E8A838', bg: 'rgba(232, 168, 56, 0.05)', iconColor: '#E8A838' },
};

const categoryIcons: Record<string, React.ElementType> = {
  recovery: Moon,
  training: Dumbbell,
  nutrition: Utensils,
};

export function InsightCard({ rule, index = 0 }: { rule: InsightWithReason; index?: number }) {
  const { t } = useTranslation();
  const s = severityStyles[rule.severity] || severityStyles.info;
  const Icon = categoryIcons[rule.category] || Dumbbell;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        borderLeft: `3px solid ${s.border}`,
        background: s.bg,
        borderRadius: '12px',
        padding: '14px 16px',
      }}
      className="space-y-2"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Icon size={16} style={{ color: s.iconColor }} />
        <p style={{ fontFamily: "'Merriweather', serif", fontSize: '15px', fontWeight: 600, color: '#1A2B32' }}>
          {rule.insight_title}
        </p>
      </div>

      {/* Body */}
      <p style={{ fontFamily: "'Merriweather Sans', sans-serif", fontSize: '14px', color: '#3D4F58', lineHeight: 1.55 }}>
        {rule.insight_body}
      </p>

      {/* Reasoning */}
      {rule.reasoning && (
        <p style={{
          fontFamily: "'Merriweather Sans', sans-serif",
          fontSize: '12px',
          color: '#8E9BA3',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          paddingTop: '6px',
        }}>
          ↳ {rule.reasoning}
        </p>
      )}

      {/* Action */}
      {rule.action_text && (
        <div style={{
          background: 'rgba(80, 149, 172, 0.08)',
          borderRadius: '8px',
          padding: '8px 12px',
        }}>
          <p style={{ fontFamily: "'Merriweather Sans', sans-serif", fontSize: '13px', fontWeight: 600, color: '#5095AC' }}>
            💡 {rule.action_text}
          </p>
        </div>
      )}

      {/* Source */}
      {rule.source_name && (
        <p style={{ fontFamily: "'Merriweather Sans', sans-serif", fontSize: '11px', color: '#8E9BA3' }}>
          📚 {t('insight.basedOn')}{' '}
          {rule.source_url ? (
            <a href={rule.source_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>
              {rule.source_name}
            </a>
          ) : (
            rule.source_name
          )}
        </p>
      )}
    </motion.div>
  );
}
