// Icons a suit can use; the CMS offers these as choices and stores the key on the suit.
// All are drawn on a 24×24 grid as 1.8px rounded strokes, centred with a 3px margin, so any of
// them looks balanced in the same badge.
export const SUIT_ICONS = {
  building: {
    label: 'Building',
    badge: 'from-[#00B2FC] to-[#003BD9]',
    path: 'M6 21V4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21M3 21h18M9.5 7h1M13.5 7h1M9.5 11h1M13.5 11h1M10.5 21v-4.5h3V21',
  },
  rocket: {
    label: 'Rocket',
    badge: 'from-[#3D7BFF] to-[#003BD9]',
    path: 'M12 3c2.6 1.9 4 4.9 4 8.5V16H8v-4.5C8 7.9 9.4 4.9 12 3zM8 12.5l-2.5 2.6V18H8M16 12.5l2.5 2.6V18H16M13.5 9.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 1 1 3 0M10.5 19 12 21l1.5-2',
  },
  layers: {
    label: 'Layers',
    badge: 'from-[#00B2FC] to-[#00245A]',
    path: 'M12 3 3 7.5l9 4.5 9-4.5L12 3zM3 12l9 4.5 9-4.5M3 16.5 12 21l9-4.5',
  },
  chart: {
    label: 'Chart',
    badge: 'from-[#5CD0FF] to-[#003BD9]',
    path: 'M3 20.5h18M6.5 16.5v-4M11 16.5v-10M15.5 16.5v-7M20 16.5v-13',
  },
  shield: {
    label: 'Shield',
    badge: 'from-[#00245A] to-[#003BD9]',
    path: 'M12 3 5 6v5.5c0 4.4 3 7.9 7 9.5 4-1.6 7-5.1 7-9.5V6l-7-3zM9 12l2 2 4-4',
  },
  briefcase: {
    label: 'Briefcase',
    badge: 'from-[#00B2FC] to-[#3D7BFF]',
    path: 'M5 7.5h14a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18V9A1.5 1.5 0 0 1 5 7.5zM9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M3.5 13h17M10.5 13v1.5h3V13',
  },
  document: {
    label: 'Document',
    badge: 'from-[#3D7BFF] to-[#00245A]',
    path: 'M6 4.5A1.5 1.5 0 0 1 7.5 3H14l4 4v12.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19.5zM14 3v4h4M9 12h6M9 16h4',
  },
  leaf: {
    label: 'Leaf',
    badge: 'from-[#00B2FC] to-[#003BD9]',
    path: 'M7 17C7 9.3 11.3 5 19 5c0 7.7-4.3 12-12 12zM5 19l8-8',
  },
}

export const DEFAULT_ICON = 'layers'

export function suitIcon(key) {
  return SUIT_ICONS[key] ?? SUIT_ICONS[DEFAULT_ICON]
}
