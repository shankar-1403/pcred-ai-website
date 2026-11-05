// The four accent tones from the home page stats strip (blue, violet, teal, amber), used
// sparingly across the site. Full class strings so Tailwind keeps them.
export const TONES = [
  {
    text: 'text-[#003BD9]',
    soft: 'from-[#00B2FC]/50 to-[#00B2FC]/0',
    node: 'from-[#00B2FC] to-[#003BD9] shadow-[0_0_0_6px_rgba(0,178,252,0.12),0_18px_36px_-12px_rgba(0,178,252,0.8)]',
    onDark: 'text-[#7FD3FF]',
  },
  {
    text: 'text-[#6D28D9]',
    soft: 'from-[#8B5CF6]/45 to-[#8B5CF6]/0',
    node: 'from-[#A78BFA] to-[#6D28D9] shadow-[0_0_0_6px_rgba(139,92,246,0.12),0_18px_36px_-12px_rgba(109,40,217,0.8)]',
    onDark: 'text-[#C4B5FD]',
  },
  {
    text: 'text-[#0F766E]',
    soft: 'from-[#14B8A6]/45 to-[#14B8A6]/0',
    node: 'from-[#2DD4BF] to-[#0D9488] shadow-[0_0_0_6px_rgba(45,212,191,0.12),0_18px_36px_-12px_rgba(13,148,136,0.8)]',
    onDark: 'text-[#5EEAD4]',
  },
  {
    text: 'text-[#C2410C]',
    soft: 'from-[#F59E0B]/50 to-[#F59E0B]/0',
    node: 'from-[#FBBF24] to-[#EA580C] shadow-[0_0_0_6px_rgba(251,191,36,0.12),0_18px_36px_-12px_rgba(234,88,12,0.75)]',
    onDark: 'text-[#FCD34D]',
  },
]

export const tone = (index) => TONES[((index % TONES.length) + TONES.length) % TONES.length]
