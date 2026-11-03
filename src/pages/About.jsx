import LegalPage from '../components/LegalPage'
import { COMPANY, CONTACT_SENTENCE, companyLines } from '../lib/company'

const sections = [
  {
    heading: 'Who we are',
    body: [
      `PCRED (${COMPANY.website}) is owned and operated by ${COMPANY.name}, a business advisory company based in Mumbai.`,
      'We help Indian micro, small and medium enterprises (MSMEs) find the government schemes, credit guarantees and subsidies they qualify for, and support them in acting on them. For corporate finance and advisory, see pcred.org.',
    ],
  },
  {
    heading: 'What we offer on pcred.ai',
    body: [
      [
        'Udyam Scheme Report: enter your Udyam registration number (₹699) or upload your Udyam certificate (₹499). The report matches your business against central, sector and your state’s own MSME schemes, shows what each one gives and how to apply, and downloads as a PDF.',
        'Advisory bundles for MSMEs and startups, such as registrations, research reports, financial analysis and documentation support. Each bundle’s page lists what it includes and its price.',
      ],
    ],
  },
  {
    heading: 'How the scheme report works',
    body: [
      [
        'Enter your Udyam number or upload your Udyam certificate.',
        'Answer one question about the business’s ownership.',
        'See a preview of your matches, then pay securely through Cashfree.',
        'Your full report opens on screen straight away, and the PDF downloads.',
      ],
    ],
  },
  {
    heading: 'Our approach',
    body: [
      'Our scheme rules are checked against official government sources and updated every month. Reports are guidance: whether a scheme, loan or subsidy is granted is decided by the department, bank or lender concerned.',
    ],
  },
  {
    heading: 'Company information',
    body: [companyLines(), `To reach us, ${CONTACT_SENTENCE}.`],
  },
]

function About() {
  return (
    <LegalPage
      eyebrow="About us"
      title="About PCRED"
      updated="3 November 2026"
      intro={`PCRED helps Indian businesses find and use the government schemes and credit they qualify for. ${COMPANY.website} is owned and operated by ${COMPANY.name}.`}
      sections={sections}
    />
  )
}

export default About
