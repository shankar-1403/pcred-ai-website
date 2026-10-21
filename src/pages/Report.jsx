import { Component, useEffect } from 'react'
// Styles for the Udyam Scheme Report load only with this page (it is lazy-loaded). The page uses
// the site font; IBM Plex Mono is kept for numbers and codes.
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/ibm-plex-mono/600.css'
import '../udyam/styles/report.css'
import '../udyam/styles/report-theme.css'
import ReportApp from '../udyam/components/ReportApp'

// If anything in the report throws, show a way back instead of a blank page
class ReportErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.error('The report page failed', error)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center text-[#00245A]">
        <h1 className="text-2xl font-semibold tracking-tight">Something went wrong showing your report</h1>
        <p className="mt-3 text-sm text-[#00245A]/65">Your details are safe. Reload the page to try again.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex cursor-pointer items-center rounded-full bg-[#00245A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#003BD9]"
        >
          Reload
        </button>
      </div>
    )
  }
}

// Udyam number lookup or certificate upload → mobile OTP → payment → scheme report.
// Moved here from the separate pcred-udyam-system site; the API is the udyamVerify function.
function Report() {
  useEffect(() => {
    const previous = document.title
    document.title = 'Udyam Scheme Report · PCRED'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <main className="udyam-app">
      <ReportErrorBoundary>
        <ReportApp />
      </ReportErrorBoundary>
    </main>
  )
}

export default Report
