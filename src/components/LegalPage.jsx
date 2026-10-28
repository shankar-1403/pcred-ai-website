import { useEffect } from 'react'
import { Link } from 'react-router'

// Shared layout for the Privacy Policy and Terms & Conditions pages: title, date, and numbered sections
function LegalPage({ eyebrow, title, updated, intro, sections }) {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [title])

  return (
    <main className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#FFFFFF_0%,#F4F9FF_40%,#EAF6FF_100%)] pt-28 text-[#00245A]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem] bg-[radial-gradient(ellipse_60%_55%_at_30%_0%,rgba(0,178,252,0.18),transparent_70%)]" />
      <div className="mx-auto w-full max-w-3xl px-6 pt-8 pb-24 sm:pt-12">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-[#00245A]/55">
            <li>
              <Link to="/" className="transition hover:text-[#00245A]">Home</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="font-semibold text-[#00245A]">{title}</li>
          </ol>
        </nav>

        <p className="mt-8 font-mono text-[11px] tracking-[0.22em] text-[#003BD9] uppercase">{eyebrow}</p>
        <h1 className="mt-3 text-4xl leading-[1.05] font-semibold tracking-[-0.04em] sm:text-5xl">{title}</h1>
        <p className="mt-3 text-sm text-[#00245A]/55">Last updated: {updated}</p>
        <p className="mt-6 text-base leading-relaxed text-[#00245A]/75">{intro}</p>

        <div className="mt-10 space-y-4">
          {sections.map((section, index) => (
            <section key={section.heading} className="rounded-[1.5rem] border border-white bg-white/85 p-6 shadow-[0_24px_50px_-40px_rgba(0,36,90,0.5)] backdrop-blur sm:p-8">
              <h2 className="flex items-baseline gap-3 text-lg font-semibold tracking-tight sm:text-xl">
                <span className="font-mono text-xs text-[#00B2FC]">{String(index + 1).padStart(2, '0')}</span>
                {section.heading}
              </h2>
              <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-[#00245A]/75">
                {section.body.map((item) =>
                  Array.isArray(item) ? (
                    <ul key={item[0]} className="list-disc space-y-1.5 pl-5 marker:text-[#00B2FC]">
                      {item.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  ) : (
                    <p key={item}>{item}</p>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}

export default LegalPage
