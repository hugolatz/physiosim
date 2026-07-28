import type { Readout } from '@physiosim/engine';

/** German number formatting: comma as decimal separator, fixed precision. */
export function formatValue(readout: Readout): string {
  return readout.value.toLocaleString('de-DE', {
    minimumFractionDigits: readout.precision,
    maximumFractionDigits: readout.precision,
  });
}

export type Deviation = 'low' | 'normal' | 'high' | 'unknown';

export function deviation(readout: Readout): Deviation {
  if (readout.normal === undefined) return 'unknown';
  if (readout.value < readout.normal.low) return 'low';
  if (readout.value > readout.normal.high) return 'high';
  return 'normal';
}

/** Model time as a compact German string: 2 d 04:15 h. */
export function formatModelTime(seconds: number): string {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const hhmm = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} h`;
  return days > 0 ? `${days} d ${hhmm}` : hhmm;
}

export const GROUP_LABELS: Record<Readout['group'], string> = {
  haemodynamik: 'Hämodynamik',
  niere: 'Niere',
  hormone: 'Hormone und Reflexe',
  labor: 'Labor',
  bilanz: 'Bilanzen',
};
