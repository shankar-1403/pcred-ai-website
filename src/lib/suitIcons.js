const SUIT_ICONS = {
  'msme-advisory-suit': {
    badge: 'from-[#00B2FC] to-[#003BD9]',
    path: 'M4 20V9l8-5 8 5v11M9 20v-6h6v6M3 20h18',
  },
  'startup-suit': {
    badge: 'from-[#3D7BFF] to-[#003BD9]',
    path: 'M14 4c3 0 6 3 6 6l-6 6-6-6c0-3 3-6 6-6zM8 10l-4 1 3 3M14 16l-1 4-3-3M5 19l2.5-2.5M14.5 9.5h.01',
  },
}

// New suits without their own entry get a generic stacked-layers icon
const FALLBACK_ICON = {
  badge: 'from-[#00B2FC] to-[#00245A]',
  path: 'M12 3 3 8l9 5 9-5-9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5',
}

export function suitIcon(slug) {
  return SUIT_ICONS[slug] ?? FALLBACK_ICON
}
