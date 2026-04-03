import { describe, expect, it } from 'vitest';
import { en } from './locales/en';
import { sv } from './locales/sv';

function leafKeys(obj: unknown, prefix = ''): Set<string> {
  const out = new Set<string>();
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    if (prefix) out.add(prefix);
    return out;
  }
  const o = obj as Record<string, unknown>;
  const keys = Object.keys(o);
  if (keys.length === 0 && prefix) out.add(prefix);
  for (const k of keys) {
    const v = o[k];
    const p = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      for (const x of leafKeys(v, p)) out.add(x);
    } else {
      out.add(p);
    }
  }
  return out;
}

describe('locale parity', () => {
  it('sv and en share the same nested translation keys', () => {
    const s = leafKeys(sv);
    const e = leafKeys(en);
    const onlySv = [...s].filter((k) => !e.has(k)).sort();
    const onlyEn = [...e].filter((k) => !s.has(k)).sort();
    expect({ onlySv, onlyEn }).toEqual({ onlySv: [], onlyEn: [] });
  });
});
