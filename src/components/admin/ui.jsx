export const inputClass =
  'w-full rounded-xl border border-[#00245A]/12 bg-white px-3.5 py-2.5 text-sm text-[#00245A] outline-none transition placeholder:text-[#00245A]/35 focus:border-[#00B2FC] focus:ring-4 focus:ring-[#00B2FC]/15 disabled:bg-[#F4F9FF] disabled:text-[#00245A]/50'

export function Field({ label, htmlFor, hint, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-[#00245A]">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1.5 text-xs text-[#00245A]/50">{hint}</p> : null}
    </div>
  )
}

const buttonTones = {
  primary: 'bg-[#00245A] text-white hover:bg-[#003BD9]',
  secondary: 'bg-[#EAF6FF] text-[#00245A] hover:bg-[#D9EEFF]',
  danger: 'bg-[#FDECEA] text-[#C2261C] hover:bg-[#FAD6D2]',
  ghost: 'text-[#00245A]/70 hover:bg-[#EAF6FF] hover:text-[#00245A]',
}

export function Button({ tone = 'primary', className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00B2FC] disabled:cursor-not-allowed disabled:opacity-50 ${buttonTones[tone]} ${className}`}
      {...props}
    />
  )
}

export function MoveButtons({ onUp, onDown, label, disabledUp, disabledDown }) {
  return (
    <span className="flex flex-col">
      <button
        type="button"
        onClick={onUp}
        disabled={disabledUp}
        className="flex h-5 w-6 cursor-pointer items-center justify-center rounded text-[#00245A]/50 hover:bg-[#EAF6FF] hover:text-[#00245A] disabled:cursor-not-allowed disabled:opacity-25"
      >
        <span className="sr-only">Move {label} up</span>
        <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5">
          <path d="m4 10 4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onDown}
        disabled={disabledDown}
        className="flex h-5 w-6 cursor-pointer items-center justify-center rounded text-[#00245A]/50 hover:bg-[#EAF6FF] hover:text-[#00245A] disabled:cursor-not-allowed disabled:opacity-25"
      >
        <span className="sr-only">Move {label} down</span>
        <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5">
          <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </span>
  )
}

export function Notice({ tone = 'info', children }) {
  const tones = {
    info: 'border-[#00B2FC]/30 bg-[#EAF6FF] text-[#00245A]',
    success: 'border-[#25D366]/40 bg-[#E6FAF0] text-[#128C4A]',
    error: 'border-[#C2261C]/30 bg-[#FDECEA] text-[#C2261C]',
  }
  return <p role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>{children}</p>
}
