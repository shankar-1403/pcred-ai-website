import LegalPage from '../components/LegalPage'

const sections = [
  {
    heading: 'About these terms',
    body: [
      'These terms apply when you use this website or buy a report, bundle or service from PCRED. By using the website or placing an order, you agree to them. If you do not agree, please do not use the website.',
    ],
  },
  {
    heading: 'Our services',
    body: [
      'PCRED offers scheme discovery reports, advisory bundles and related services for businesses, such as research reports, financial analysis, registrations and documentation support. Each bundle’s page describes what it includes.',
      'Our reports and advice are for guidance. Whether a scheme, loan, subsidy or registration is granted is decided by the government department, bank or lender concerned. We do not guarantee any approval, amount or timeline.',
    ],
  },
  {
    heading: 'Your information and responsibilities',
    body: [
      [
        'Give accurate and complete information, including your Udyam details and business documents.',
        'Use the website only for lawful purposes and only for businesses you are authorised to act for.',
        'Do not try to copy, disrupt or gain unauthorised access to the website or its data.',
      ],
      'Our reports depend on the information you and public records provide. We are not responsible for results based on information that is wrong or incomplete.',
    ],
  },
  {
    heading: 'Prices and payment',
    body: [
      'Prices are shown in Indian rupees. Where a price says "Price on request", we will quote it before any work starts. Government fees, third-party charges and applicable taxes are extra unless the bundle says otherwise.',
      'Online payments are processed securely by our payment partner. A report or service is delivered once payment is confirmed. Bundle discounts apply only as shown at the time of your order.',
    ],
  },
  {
    heading: 'Delivery',
    body: [
      'Digital reports are made available online or sent to you once ready. Services that need documents, filings or third-party action take longer; we will tell you the expected time when you order. Delays caused by government portals, banks or missing documents are outside our control.',
    ],
  },
  {
    heading: 'Cancellations and refunds',
    body: [
      'Because reports are prepared and delivered digitally, a report cannot be cancelled or refunded once it has been delivered. For other services, you may cancel before work starts for a full refund. Once work has started, any refund will reflect the work already done and fees already paid to third parties.',
      'If a payment fails but money is taken from your account, it is normally returned automatically by your bank or our payment partner. If it is not, message us with the payment details and we will help.',
    ],
  },
  {
    heading: 'Free offers',
    body: [
      'From time to time we may offer something free with a purchase, such as Udyam / MSME registration with a Startup Suite bundle. Offers apply only while shown on the website, cannot be exchanged for cash, and may be changed or withdrawn at any time.',
    ],
  },
  {
    heading: 'Intellectual property',
    body: [
      'The website, our reports, templates and content belong to PCRED. You may use a report you have bought for your own business. You may not resell, republish or share it as your own product.',
    ],
  },
  {
    heading: 'Limitation of liability',
    body: [
      'To the extent the law allows, PCRED is not liable for indirect or consequential losses, or for decisions made by government departments, banks or lenders. Our total liability for any order is limited to the amount you paid for it.',
    ],
  },
  {
    heading: 'Changes, law and contact',
    body: [
      'We may update these terms; the latest version will always be on this page. These terms are governed by the laws of India, and the courts of Mumbai, Maharashtra have jurisdiction.',
      'For any question about these terms, message us on WhatsApp at +91 22 3512 0060.',
    ],
  },
]

function Terms() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms & Conditions"
      updated="28 October 2026"
      intro="Please read these terms before using this website or ordering a report, bundle or service from PCRED."
      sections={sections}
    />
  )
}

export default Terms
