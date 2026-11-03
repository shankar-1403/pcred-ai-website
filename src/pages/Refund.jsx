import LegalPage from '../components/LegalPage'
import { COMPANY, CONTACT_SENTENCE, companyLines } from '../lib/company'

const sections = [
  {
    heading: 'Scheme reports',
    body: [
      'The Udyam Scheme Report is a digital report. It is prepared and shown to you as soon as your payment is confirmed, so it cannot be cancelled or refunded once it has been delivered.',
    ],
  },
  {
    heading: 'When we refund a report payment',
    body: [
      [
        'You were charged but the report did not open.',
        'You were charged twice for the same report.',
        'Money left your account but the payment shows as failed.',
      ],
      'In these cases we refund the amount to your original payment method within 5–7 working days of confirming the problem. Your bank may take a few more days to show it in your account.',
    ],
  },
  {
    heading: 'Advisory bundles and services',
    body: [
      'You may cancel a bundle or service before work starts for a full refund. Once work has started, any refund will reflect the work already done and any government or third-party fees already paid on your behalf.',
    ],
  },
  {
    heading: 'Failed payments',
    body: [
      'If a payment fails but money is taken from your account, it is normally returned automatically by your bank or our payment partner, Cashfree. If it has not come back, contact us and we will help.',
    ],
  },
  {
    heading: 'How to ask for a refund',
    body: [
      `To ask for a refund or cancel a service, ${CONTACT_SENTENCE}. Share the payment date, amount, the payment reference (or order ID) and your Udyam number, so we can find your payment quickly.`,
    ],
  },
  {
    heading: 'Company information',
    body: [companyLines()],
  },
]

function Refund() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Refund & Cancellation Policy"
      updated="3 November 2026"
      intro={`This policy explains when payments made on ${COMPANY.website} can be cancelled or refunded, and how to ask for a refund.`}
      sections={sections}
    />
  )
}

export default Refund
