import { useEffect } from 'react'
import { useLocation } from 'react-router'

const WAIT_FOR_TARGET_MS = 3000

// The router does not manage scrolling, so this does:
// - links with a hash (e.g. /#categories) scroll to that section, waiting for it to render,
//   since sections like Categories appear only after their data loads;
// - moving to a different page starts at the top.
function ScrollManager() {
  const { pathname, hash, key } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
      return undefined
    }

    const id = decodeURIComponent(hash.slice(1))
    const scroll = () => {
      const target = document.getElementById(id)
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return Boolean(target)
    }
    if (scroll()) return undefined

    const observer = new MutationObserver(() => {
      if (scroll()) observer.disconnect()
    })
    observer.observe(document.body, { childList: true, subtree: true })
    const timeout = window.setTimeout(() => observer.disconnect(), WAIT_FOR_TARGET_MS)
    return () => {
      observer.disconnect()
      window.clearTimeout(timeout)
    }
    // `key` re-runs this when the same link is followed again
  }, [pathname, hash, key])

  return null
}

export default ScrollManager
