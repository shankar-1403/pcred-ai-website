import LegalPage from '../components/LegalPage'

const sections = [
  {
    heading: 'Who we are',
    body: [
      'PCRED provides scheme discovery reports, credit and advisory services for Indian businesses through this website. In this policy, "PCRED", "we", "us" and "our" mean the business that operates this website.',
      'If you have a question about this policy or your information, message us on WhatsApp at +91 22 3512 0060.',
    ],
  },
  {
    heading: 'Information we collect',
    body: [
      'We only collect what we need to prepare your report, answer your enquiry or deliver a service you have ordered:',
      [
        'Contact details you give us: your name, business name, mobile number and email address.',
        'Business details: your Udyam registration number, Udyam certificate, and the details it contains (such as enterprise name, category, activity, state, district, NIC codes and date of commencement).',
        'Your answers to our questions, such as ownership details and the kind of help you are looking for.',
        'Order and enquiry details: the bundles you add to your cart or ask about, and the messages you send us.',
        'Payment status from our payment partner. We never see or store your card, UPI or bank login details.',
        'Basic technical information, such as browser type and pages visited, used to keep the website secure and working.',
      ],
    ],
  },
  {
    heading: 'How we use your information',
    body: [
      [
        'To verify your Udyam details and match your business to suitable government schemes, guarantees, subsidies and credit options.',
        'To prepare and deliver the reports and services you request.',
        'To reply to your enquiries on WhatsApp, phone or email.',
        'To process payments and keep records required by law.',
        'To improve our reports, our scheme database and this website.',
        'To prevent fraud and misuse of our services.',
      ],
      'We do not sell your personal information.',
    ],
  },
  {
    heading: 'Who we share it with',
    body: [
      'We share information only where needed to provide our services:',
      [
        'Service providers who run parts of our service, such as cloud hosting and database (Google Firebase), Udyam record verification, payment processing (Cashfree) and WhatsApp messaging.',
        'Banks, lenders or government portals, only when you ask us to help you apply and with your agreement.',
        'Authorities, where the law requires us to.',
      ],
      'Every provider we use may only use your information to do work for us.',
    ],
  },
  {
    heading: 'How long we keep it',
    body: [
      'We keep your information for as long as we need it to provide our services to you, and afterwards for as long as the law requires us to keep business and tax records. When it is no longer needed, we delete it or make it anonymous.',
    ],
  },
  {
    heading: 'How we protect it',
    body: [
      'Your information is stored with access limited to authorised staff, sent over encrypted connections, and protected by access rules on our database. No method of storage or transfer is completely secure, but we take reasonable steps to protect your information.',
    ],
  },
  {
    heading: 'Your rights',
    body: [
      'Under India’s Digital Personal Data Protection Act, 2023 and other applicable law, you can ask us to:',
      [
        'Tell you what personal information we hold about you.',
        'Correct or update information that is wrong or incomplete.',
        'Delete your information, where we are not required to keep it.',
        'Withdraw a consent you have given, for the future.',
      ],
      'To make a request or a complaint, message us on WhatsApp at +91 22 3512 0060. We will respond within a reasonable time.',
    ],
  },
  {
    heading: 'Cookies and local storage',
    body: [
      'This website stores small amounts of data in your browser, for example to remember the bundles in your cart and to keep administrators signed in. We do not use advertising cookies.',
    ],
  },
  {
    heading: 'Changes to this policy',
    body: [
      'We may update this policy from time to time. The latest version will always be on this page, with the date it was last updated at the top.',
    ],
  },
]

function Privacy() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      updated="28 October 2026"
      intro="This policy explains what information PCRED collects when you use this website and our services, how we use it, and the choices you have."
      sections={sections}
    />
  )
}

export default Privacy
