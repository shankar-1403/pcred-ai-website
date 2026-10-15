import { useEffect, useRef } from 'react'

// Native <dialog> opened with showModal(): the browser keeps focus inside, closes on Esc,
// and makes the page behind inert. Render it only while it should be open.
function Modal({ label, onClose, children }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return undefined
    dialog.showModal()
    // Start typing straight away: focus the first editable field rather than the close button
    dialog.querySelector('input:not([disabled]):not([type=radio]), select, textarea')?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      if (dialog.open) dialog.close()
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      onCancel={(event) => {
        // Esc: let React unmount the dialog instead of the browser closing it underneath us
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        // Clicks on the dialog element itself (not its content) land on the backdrop
        if (event.target === event.currentTarget) onClose()
      }}
      className="m-auto max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-visible bg-transparent p-0 text-[#00245A] backdrop:bg-[#00245A]/45 backdrop:backdrop-blur-sm"
    >
      <div className="relative max-h-[calc(100svh-2rem)] overflow-y-auto rounded-[1.75rem] bg-white shadow-[0_40px_100px_-30px_rgba(0,36,90,0.6)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#F4F9FF] text-[#00245A]/70 transition hover:bg-[#EAF6FF] hover:text-[#00245A] focus-visible:outline-2 focus-visible:outline-[#00B2FC]"
        >
          <span className="sr-only">Close</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        {children}
      </div>
    </dialog>
  )
}

export default Modal
