// The legal entity that owns and operates pcred.ai, shown in the footer, Contact and the legal
// pages. It must match the company on the Cashfree account. Leave gstin or email empty to hide them.
export const COMPANY = {
  name: 'PCRED VENTURE PRIVATE LIMITED',
  gstin: '',
  address: 'Lodha Supremus, 520, Off Mahakali Caves Road, Chakala Industrial Area (MIDC), Andheri East, Mumbai, Maharashtra - 400093, India',
  phone: '+91 22 3512 0060',
  email: '',
  website: 'pcred.ai',
}

// One line per detail, for the "Company information" sections of the legal pages
export function companyLines() {
  return [
    COMPANY.name,
    COMPANY.gstin ? `GSTIN: ${COMPANY.gstin}` : '',
    `Address: ${COMPANY.address}`,
    `Phone and WhatsApp: ${COMPANY.phone}`,
    COMPANY.email ? `Email: ${COMPANY.email}` : '',
  ].filter(Boolean)
}

// How to reach us, in one sentence, for the legal pages
export const CONTACT_SENTENCE = COMPANY.email
  ? `message us on WhatsApp at ${COMPANY.phone} or email ${COMPANY.email}`
  : `message us on WhatsApp at ${COMPANY.phone}`
