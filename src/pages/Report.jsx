import { useEffect } from 'react'
// Styles for the Udyam Scheme Report load only with this page (it is lazy-loaded). The page uses
// the site font; IBM Plex Mono is kept for numbers and codes.
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/ibm-plex-mono/600.css'
import '../udyam/styles/report.css'
import '../udyam/styles/report-theme.css'
import ReportApp from '../udyam/components/ReportApp'

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
      <ReportApp />
    </main>
  )
}

export default Report
