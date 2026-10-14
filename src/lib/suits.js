// Product prices are in rupees. Lines marked placeholder still need real prices.

export const suits = [
  {
    slug: 'msme-advisory-suit',
    name: 'MSME Advisory Suit',
    summary: 'Scheme, credit, and compliance products for an existing small business.',
    products: [
      {
        name: 'Scheme Discovery Report',
        price: 499,
        description: 'Which government schemes fit the business, ranked before the paperwork.',
        points: ['Udyam check', 'Scheme fit', 'Eligibility first'],
      },
      {
        name: 'CGTMSE Advisory',
        price: 2999, // placeholder
        description: 'Guidance for collateral-free credit under the CGTMSE guarantee.',
        points: ['Guarantee cover', 'Lender fit', 'Document list'],
      },
      {
        name: 'MSME Credit Advisory',
        price: 2499, // placeholder
        description: 'A clear path for working capital or a term loan against the business file.',
        points: ['Working capital', 'Term loan', 'Lender shortlist'],
      },
      {
        name: 'Compliance Health Check',
        price: 1499, // placeholder
        description: 'The gaps that stall an application, flagged before a lender sees the file.',
        points: ['Registration', 'Filings', 'Fix list'],
      },
    ],
  },
  {
    slug: 'startup-suit',
    name: 'Startup Suit',
    summary: 'Scheme, guarantee, and structuring products for a new company.',
    products: [
      {
        name: 'Startup Scheme Report',
        price: 499, // placeholder
        description: 'Schemes built for a new company, matched to stage and sector.',
        points: ['Stage match', 'Sector fit', 'Eligibility first'],
      },
      {
        name: 'CGSS Advisory',
        price: 2999, // placeholder
        description: 'How the startup credit guarantee can support a loan without heavy collateral.',
        points: ['Guarantee cover', 'Eligibility', 'Lender path'],
      },
      {
        name: 'Funding Readiness',
        price: 1999, // placeholder
        description: 'What a lender or investor will ask for, set out before the first meeting.',
        points: ['Numbers', 'Documents', 'Open questions'],
      },
      {
        name: 'Business Structuring',
        price: 2499, // placeholder
        description: 'Entity and ownership choices that keep a funding round straightforward.',
        points: ['Entity type', 'Ownership', 'Next filing'],
      },
    ],
  },
]

export function findSuit(slug) {
  return suits.find((suit) => suit.slug === slug)
}
