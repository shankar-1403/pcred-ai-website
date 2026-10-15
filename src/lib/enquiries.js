export const ENQUIRY_STATUSES = [
  { id: 'new', label: 'New', tone: 'bg-[#EAF6FF] text-[#003BD9]' },
  { id: 'contacted', label: 'Contacted', tone: 'bg-[#FFF4DB] text-[#9A6400]' },
  { id: 'closed', label: 'Closed', tone: 'bg-[#E6FAF0] text-[#128C4A]' },
]

export function statusMeta(id) {
  return ENQUIRY_STATUSES.find((status) => status.id === id) ?? ENQUIRY_STATUSES[0]
}

// Indian mobile numbers: 10 digits starting 6-9, sent to Firebase as +91XXXXXXXXXX
export const isValidMobile = (digits) => /^[6-9]\d{9}$/.test(digits)
export const toE164 = (digits) => `+91${digits}`
export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)

// Database shape: enquiries/{id} = { name, phone, email, uid, items[], subtotal, discountPercent, discount, total, status, createdAt }
export function normalizeEnquiries(snapshotValue) {
  if (!snapshotValue) return []
  return Object.entries(snapshotValue)
    .map(([id, enquiry]) => ({
      id,
      name: enquiry.name ?? '',
      phone: enquiry.phone ?? '',
      email: enquiry.email ?? '',
      items: Object.values(enquiry.items ?? {}).map((item) => ({
        name: item.name ?? '',
        suitName: item.suitName ?? '',
        price: Number(item.price ?? 0),
      })),
      subtotal: Number(enquiry.subtotal ?? 0),
      discountPercent: Number(enquiry.discountPercent ?? 0),
      discount: Number(enquiry.discount ?? 0),
      total: Number(enquiry.total ?? 0),
      status: enquiry.status ?? 'new',
      createdAt: Number(enquiry.createdAt ?? 0),
    }))
    .sort((a, b) => b.createdAt - a.createdAt)
}

const dateFormat = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })

export function formatDateTime(timestamp) {
  return timestamp ? dateFormat.format(new Date(timestamp)) : '—'
}

// +919876543210 -> +91 98765 43210
export function formatPhone(phone) {
  const match = /^\+91(\d{5})(\d{5})$/.exec(phone)
  return match ? `+91 ${match[1]} ${match[2]}` : phone
}
