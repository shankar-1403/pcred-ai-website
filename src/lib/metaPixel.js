// Meta Pixel helpers. Every event fired here is also sent by the server (Conversions API) with the
// same event id, so Meta counts it once. The Pixel itself is loaded in index.html.

function cookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ''
}

// The ad click id: from the Pixel's _fbc cookie, or built from ?fbclid= if the cookie is not set yet
function clickId() {
  const fromCookie = cookie('_fbc')
  if (fromCookie) return fromCookie
  try {
    const fbclid = new URLSearchParams(window.location.search).get('fbclid')
    if (fbclid) {
      const value = `fb.1.${Date.now()}.${fbclid}`
      sessionStorage.setItem('pcred_fbc', value)
      return value
    }
    return sessionStorage.getItem('pcred_fbc') || ''
  } catch {
    return ''
  }
}

// Remember an ad click from the landing page, even after the app changes the address
clickId()

export function newEventId(prefix) {
  const random = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '').slice(0, 16) : Math.random().toString(36).slice(2, 18)
  return `${prefix}_${random}`
}

/** Sent to our server as `meta` in the request body, so the server event matches this browser. */
export function metaFields(eventId) {
  return {
    ...(eventId ? { event_id: eventId } : {}),
    fbp: cookie('_fbp'),
    fbc: clickId(),
    url: `${window.location.origin}${window.location.pathname}`,
  }
}

export function track(name, params = {}, eventId) {
  try {
    if (typeof window.fbq === 'function') window.fbq('track', name, params, eventId ? { eventID: eventId } : undefined)
  } catch {
    // The Pixel never blocks the page
  }
}

export const REPORT_PARAMS = { content_name: 'Udyam scheme report', content_category: 'scheme_report', content_type: 'product' }

/** AddPaymentInfo + Purchase for a paid report order, once per order in this browser. */
export function trackPaidOrder(payment) {
  if (!payment?.order_id) return
  const key = `pcred_purchase_${payment.order_id}`
  try {
    if (localStorage.getItem(key)) return
    localStorage.setItem(key, '1')
  } catch {
    // Storage blocked: Meta still deduplicates by event id
  }
  const params = { ...REPORT_PARAMS, value: payment.amount, currency: payment.currency || 'INR', num_items: 1 }
  track('AddPaymentInfo', params, `api_${payment.order_id}`)
  track('Purchase', params, `purchase_${payment.order_id}`)
}
