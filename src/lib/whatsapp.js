export const WHATSAPP_NUMBER = '912235120060'

export function whatsappHref(text) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}

export function productEnquireHref(productName) {
  return whatsappHref(
    `Hello, I would like to enquire about the ${productName}. Please share the details.`,
  )
}

export const generalEnquireHref = whatsappHref(
  'Hello, I would like to enquire about your credit report products. Please share the details.',
)
