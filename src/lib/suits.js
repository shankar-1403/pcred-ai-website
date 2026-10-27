// Product prices are in rupees. Lines marked placeholder still need real prices.

// Starter data: shown while Firebase is not configured, and used by the CMS
// "Import starter data" button to fill an empty database.
export const starterSuits = [
  {
    slug: 'msme-advisory-suite',
    icon: 'building',
    order: 1,
    name: 'MSME Advisory Suite',
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
    slug: 'startup-suite',
    icon: 'rocket',
    order: 2,
    name: 'Startup Suite',
    summary:
      'Startup Suite provides guidance on business registration, funding opportunities, government schemes, and startup growth.',
    layout: 'bento',
    banner: { text: 'FREE Udyam / MSME Registration (worth ₹399) with any Startup Suite bundle or product', enabled: false },
    promo: {
      enabled: true,
      title: 'FREE Udyam / MSME Registration',
      highlight: 'Worth ₹399, on us',
      text: 'With any Startup Suite bundle or product.',
    },
    products: [
      {
        name: 'Startup Advisory Kit',
        price: 0,
        description: 'Research, financial projections and investor-ready documents for an early-stage business, in one engagement.',
        documents: [
          'Market Research Report',
          'Competitor Analysis',
          'SWOT Analysis',
          'CMA / Financial Projection Report',
          'Investor Pitch Deck',
          'Professional Company Profile',
        ],
      },
      {
        name: 'DPIIT Startup Recognition Certificate',
        price: 14599,
        description:
          'Eligibility assessment, documentation support, application filing and tracking, and responses to departmental queries. Government fee: nil.',
        documents: [],
      },
      {
        name: 'Website / Landing Page',
        price: 0,
        description:
          'Responsive landing page designed around your brand and message. Larger websites are quoted on request. Starting price; domain and hosting are extra.',
        documents: [],
      },
      {
        name: 'Logo + Brand Kit',
        price: 0,
        description:
          'Custom logo with usable files for ₹1,499, or logo with a complete brand kit (logo variants, colours, typography and usage guidelines) for ₹3,499.',
        documents: [],
      },
    ],
  },
]
