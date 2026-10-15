// Icons a suit can use; the CMS offers these as choices and stores the key on the suit.
export const SUIT_ICONS = {
  building: {
    label: 'Building',
    badge: 'from-[#00B2FC] to-[#003BD9]',
    path: 'M4 20V9l8-5 8 5v11M9 20v-6h6v6M3 20h18',
  },
  rocket: {
    label: 'Rocket',
    badge: 'from-[#3D7BFF] to-[#003BD9]',
    path: 'M14 4c3 0 6 3 6 6l-6 6-6-6c0-3 3-6 6-6zM8 10l-4 1 3 3M14 16l-1 4-3-3M5 19l2.5-2.5M14.5 9.5h.01',
  },
  layers: {
    label: 'Layers',
    badge: 'from-[#00B2FC] to-[#00245A]',
    path: 'M12 3 3 8l9 5 9-5-9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5',
  },
  chart: {
    label: 'Chart',
    badge: 'from-[#5CD0FF] to-[#003BD9]',
    path: 'M4 20h16M7 16v-4M12 16V8M17 16v-7',
  },
  shield: {
    label: 'Shield',
    badge: 'from-[#00245A] to-[#003BD9]',
    path: 'M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3zM9 12l2 2 4-4',
  },
  briefcase: {
    label: 'Briefcase',
    badge: 'from-[#00B2FC] to-[#3D7BFF]',
    path: 'M4 8h16v11H4zM9 8V5h6v3M4 13h16',
  },
  document: {
    label: 'Document',
    badge: 'from-[#3D7BFF] to-[#00245A]',
    path: 'M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5',
  },
  leaf: {
    label: 'Leaf',
    badge: 'from-[#00B2FC] to-[#003BD9]',
    path: 'M5 19c0-8 5-14 15-14 0 10-6 15-14 15M5 19l7-7',
  },
}

export const DEFAULT_ICON = 'layers'

export function suitIcon(key) {
  return SUIT_ICONS[key] ?? SUIT_ICONS[DEFAULT_ICON]
}
