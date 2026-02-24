// Canonical mastery color and label mappings — imported by all UI components
// that display mastery state badges or indicators.

/** Radix UI color tokens for mastery badge backgrounds */
export const MASTERY_COLORS: Record<
  string,
  'gray' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'gold'
> = {
  unseen: 'gray',
  introduced: 'gray',
  apprentice_1: 'orange',
  apprentice_2: 'orange',
  apprentice_3: 'orange',
  apprentice_4: 'orange',
  journeyman: 'blue',
  expert: 'green',
  master: 'purple',
  burned: 'gold',
}

/** Human-readable labels for mastery states */
export const MASTERY_LABELS: Record<string, string> = {
  unseen: 'Unseen',
  introduced: 'Introduced',
  apprentice_1: 'Apprentice 1',
  apprentice_2: 'Apprentice 2',
  apprentice_3: 'Apprentice 3',
  apprentice_4: 'Apprentice 4',
  journeyman: 'Journeyman',
  expert: 'Expert',
  master: 'Master',
  burned: 'Burned',
}

/** Ordered list of mastery states for pipeline/dot-map displays */
export const MASTERY_ORDER = [
  'unseen',
  'introduced',
  'apprentice_1',
  'apprentice_2',
  'apprentice_3',
  'apprentice_4',
  'journeyman',
  'expert',
  'master',
  'burned',
] as const

/** CSS hex colors for mastery states — used in custom SVG/canvas rendering */
export const MASTERY_HEX: Record<string, string> = {
  unseen: '#8b8d98',
  introduced: '#8b8d98',
  apprentice_1: '#f76b15',
  apprentice_2: '#f76b15',
  apprentice_3: '#f76b15',
  apprentice_4: '#f76b15',
  journeyman: '#3e63dd',
  expert: '#30a46c',
  master: '#8e4ec6',
  burned: '#ffb224',
}

/** Convert a mastery state string to a human-readable label */
export function formatMasteryLabel(state: string): string {
  if (MASTERY_LABELS[state]) return MASTERY_LABELS[state]
  return state
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
