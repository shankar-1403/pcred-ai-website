import LegalPage from '../components/LegalPage'
import { COMPANY, CONTACT_SENTENCE, companyLines } from '../lib/company'

const sections = [
  {
    heading: 'Digital delivery only',
    body: [
      `We do not sell or ship physical goods. Everything bought on ${COMPANY.website} is delivered online, anywhere in India, at no delivery charge.`,
    ],
  },
  {
    heading: 'Scheme reports',
    body: [
      'Your Udyam Scheme Report opens on screen as soon as your payment is confirmed, usually within a minute, and the PDF downloads to your device. You can download the PDF again from the report page.',
      'If the report does not open after you have paid, contact us with your payment details and we will send it to you.',
    ],
  },
  {
    heading: 'Advisory bundles and services',
    body: [
      'Bundles and services are delivered online, by email, WhatsApp or online meetings. We tell you the expected timeline when you order. Work that depends on government portals, banks or documents from you can take longer, and those delays are outside our control.',
    ],
  },
  {
    heading: 'Delivery problems',
    body: [`If something has not reached you, ${CONTACT_SENTENCE}.`],
  },
  {
    heading: 'Company information',
    body: [companyLines()],
  },
]

function Shipping() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Shipping & Delivery Policy"
      updated="3 November 2026"
      intro={`How reports and services bought on ${COMPANY.website} are delivered to you.`}
      sections={sections}
    />
  )
}

export default Shipping
