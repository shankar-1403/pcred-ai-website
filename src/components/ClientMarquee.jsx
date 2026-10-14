const CLIENTS = [
  'Arun Malhotra',
  'Priya Shah',
  'Radhika Iyer',
  'Sandeep Gupta',
  'Sneha Verma',
  'Kunal Thakkar',
  'Anil Oberoi',
  'Sanjana Sharma',
  'Anand Kumar',
  'Meera Patel',
]

const AVATAR_TONES = [
  'from-[#00B2FC] to-[#003BD9]',
  'from-[#00245A] to-[#003BD9]',
  'from-[#5CD0FF] to-[#00B2FC]',
]

// Second row starts halfway through the list so the two rows don't line up
const ROWS = [
  { clients: CLIENTS, className: 'client-marquee' },
  { clients: [...CLIENTS.slice(5), ...CLIENTS.slice(0, 5)], className: 'client-marquee-reverse' },
]

function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
}

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
        {CLIENTS.map((name) => (
          <li key={name}>{name}</li>
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
                {row.clients.map((name) => (
                  <li key={`${copy}-${name}`} className="px-1.5">
                    <span className="group inline-flex items-center gap-3 rounded-full border border-white bg-white/80 py-1.5 pr-5 pl-1.5 shadow-[0_10px_24px_-18px_rgba(0,36,90,0.6)] backdrop-blur transition hover:bg-white">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-semibold tracking-wide text-white ${
                          AVATAR_TONES[CLIENTS.indexOf(name) % AVATAR_TONES.length]
                        }`}
                      >
                        {initials(name)}
                      </span>
                      <span className="text-sm font-semibold tracking-tight whitespace-nowrap text-[#00245A]">{name}</span>
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
