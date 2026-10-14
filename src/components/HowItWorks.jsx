const steps = [
  {
    n: '01',
    title: 'Pick a report',
    body: 'Browse the products and choose the file that matches the decision in front of you.',
    icon: 'pick',
  },
  {
    n: '02',
    title: 'Send an enquiry',
    body: 'Share the product name on WhatsApp. We keep the request short so nothing gets lost.',
    icon: 'enquire',
  },
  {
    n: '03',
    title: 'Get the details',
    body: 'We send back what you need to read the report clearly, without extra noise.',
    icon: 'details',
  },
]

function StepIcon({ name }) {
  const common = {
    className: 'h-6 w-6',
    viewBox: '0 0 24 24',
    fill: 'none',
    'aria-hidden': true,
  }

  if (name === 'enquire') {
    return (
      <svg {...common}>
        <path d="M5 12a7 7 0 0 1 12.3-4.6A6 6 0 0 1 19 12c0 4.2-3.1 7-7 7H8l-3 2.2V12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 11.5h6M9 14.5h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  if (name === 'details') {
    return (
      <svg {...common}>
        <path d="M7 3.8h7.2L19.2 8.7V20a1.6 1.6 0 0 1-1.6 1.6H7.6A1.6 1.6 0 0 1 6 20V5.4A1.6 1.6 0 0 1 7.6 3.8H7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M14.2 4V8.6h4.6M8.8 13.2l2 2 4.4-4.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <path d="M7 4h7.2L19 8.7V20a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 20V5.5A1.5 1.5 0 0 1 7.5 4H7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14.2 4.2V8.6h4.4M9 12.5h6M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="relative isolate scroll-mt-24 overflow-hidden bg-brand-wash py-20 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-[-8%] h-72 w-72 rounded-full bg-brand/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-18%] left-[-6%] h-64 w-64 rounded-full bg-brand-bright/10 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-screen-xl px-6">
        <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold tracking-[0.22em] text-brand uppercase shadow-[0_8px_24px_-16px_rgba(0,36,90,0.4)] ring-1 ring-[#d5e3f6]">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          How it works
        </p>
        <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-[-0.03em] text-[#00245A] sm:text-4xl">
          Three steps, then a clearer report
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#59677c]">
          No long forms. Pick a product, enquire, and we share the details.
        </p>

        <ol className="relative mt-14 grid gap-5 md:grid-cols-3">
          <div aria-hidden="true" className="pointer-events-none absolute top-[3.25rem] right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-[#00B2FC] via-[#004FDE] to-[#00245A] md:block sm:top-[7rem]"
          />

          {steps.map((step, index) => (
            <li key={step.n} className="relative">
              <article className="group flex h-full flex-col items-center rounded-[1.75rem] bg-white p-6 text-center shadow-[0_24px_48px_-36px_rgba(0,36,90,0.4)] ring-1 ring-[#d5e3f6] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_56px_-32px_rgba(0,36,90,0.38)] hover:ring-brand-ring sm:p-7">
                <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-white to-brand-soft text-brand shadow-[0_12px_24px_-16px_rgba(0,79,223,0.85)] ring-1 ring-[#dbe8f8] transition group-hover:text-brand-navy">
                  <StepIcon name={step.icon} />
                  <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white shadow-[0_8px_16px_-8px_rgba(0,79,223,0.9)]">
                    {String(index + 1)}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-semibold tracking-tight text-[#00245A]">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#59677c]">{step.body}</p>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export default HowItWorks
