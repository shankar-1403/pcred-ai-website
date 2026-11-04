/** Udyam-number lookup. The official record is fetched from Cashfree, then the visitor pays. */
export const UDYAM_NUMBER_PRICE_INR = 699;
/** Certificate upload. The PDF is read on the device, then the visitor pays. */
export const CERTIFICATE_PRICE_INR = 499;

export function priceForSource(source) {
    return source === 'certificate' ? CERTIFICATE_PRICE_INR : UDYAM_NUMBER_PRICE_INR;
}

export function isReportPrice(amount) {
    return amount === UDYAM_NUMBER_PRICE_INR || amount === CERTIFICATE_PRICE_INR;
}

/** Report prices are before GST; 18% GST is added on top of the price (after any coupon). */
export const GST_RATE = 0.18;
const paise = (n) => Math.round(n * 100) / 100;

/** { base, gst, total } in rupees, rounded to the paisa. */
export function withGst(base) {
    const gst = paise(base * GST_RATE);
    return { base, gst, total: paise(base + gst) };
}
