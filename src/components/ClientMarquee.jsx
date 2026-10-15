// PLACEHOLDER: made-up company names for the layout. Replace with real clients before launch.
const CLIENTS = [
  { name: 'Shree Ganesh Textiles', sector: 'Textiles' },
  { name: 'Patel Agro Foods', sector: 'Food processing' },
  { name: 'Mehta Precision Tools', sector: 'Engineering' },
  { name: 'Sai Packaging Co.', sector: 'Packaging' },
  { name: 'Kaveri Spice Works', sector: 'Spices' },
  { name: 'Nirmal Polymers', sector: 'Plastics' },
  { name: 'Aarav Electricals', sector: 'Electricals' },
  { name: 'Sunrise Ceramics', sector: 'Ceramics' },
  { name: 'Vardhan Auto Components', sector: 'Auto parts' },
  { name: 'Lotus Apparel House', sector: 'Garments' },
  { name: 'Bharat Steel Fabricators', sector: 'Steel' },
  { name: 'GreenLeaf Organics', sector: 'Agriculture' },
]

const BADGE_TONES = [
  'from-[#00B2FC] to-[#003BD9]',
  'from-[#00245A] to-[#003BD9]',
  'from-[#5CD0FF] to-[#00B2FC]',
]

// Second row starts halfway through the list so the two rows don't line up
const half = Math.ceil(CLIENTS.length / 2)
const ROWS = [
  { clients: CLIENTS, className: 'client-marquee' },
  { clients: [...CLIENTS.slice(half), ...CLIENTS.slice(0, half)], className: 'client-marquee-reverse' },
]

function ClientMarquee() {
  return (
    <section aria-label="Clients" className="relative overflow-hidden bg-[#EAF6FF] pt-6 pb-20">
      <div className="mx-auto flex max-w-screen-xl items-center gap-4 px-6">
        <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-transparent to-[#00245A]/15" />
        <p className="font-mono text-[11px] tracking-[0.28em] text-[#00245A]/60 uppercase">
          Our <span className="text-[#003BD9]">clients</span>
        </p>
        <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-l from-transparent to-[#00245A]/15" />
      </div>

      <ul className="sr-only">
        {CLIENTS.map((client) => (
          <li key={client.name}>{client.name}</li>
        ))}
      </ul>

      <div
        aria-hidden="true"
        className="mt-8 flex flex-col gap-3 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
      >
        {ROWS.map((row) => (
          <div key={row.className} className={`${row.className} flex w-max`}>
            {[0, 1].map((copy) => (
              <ul key={copy} className="flex">
                {row.clients.map((client) => (
                  <li key={`${copy}-${client.name}`} className="px-1.5">
                    <span className="inline-flex items-center gap-3 rounded-2xl border border-white bg-white/85 py-2 pr-4 pl-2 shadow-[0_10px_24px_-18px_rgba(0,36,90,0.6)] backdrop-blur transition hover:bg-white">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ${
                          BADGE_TONES[CLIENTS.indexOf(client) % BADGE_TONES.length]
                        }`}
                      >
                        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none">
                          <path
                            d="M4 21V5.5L11 3v18M11 8l9 3v10M3 21h18M7 7.5h1M7 11h1M7 14.5h1M14.5 13h2M14.5 16.5h2"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <span className="flex flex-col leading-tight">
                        <span className="text-sm font-bold tracking-tight whitespace-nowrap text-[#00245A]">{client.name}</span>
                        <span className="font-mono text-[10px] tracking-wide whitespace-nowrap text-[#003BD9]/70 uppercase">
                          {client.sector}
                        </span>
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

export default ClientMarquee
