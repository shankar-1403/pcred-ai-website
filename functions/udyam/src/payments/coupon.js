import { ServerValue } from 'firebase-admin/database';
import { CERTIFICATE_PRICE_INR } from './price.js';
import { database } from '../leads/store.js';

/** Coupon codes are stored under `coupons/<CODE>`: 3–20 capital letters and digits. */
export const COUPON_CODE = /^[A-Z0-9]{3,20}$/;

/** Cashfree does not accept orders below ₹1, so a partial discount never takes the price lower. */
export const MIN_PAYABLE_INR = 1;

export function cleanCouponCode(value) {
    return typeof value === 'string' ? value.replace(/\s+/g, '').toUpperCase() : '';
}

/** Which report a sealed price belongs to. */
export function sourceForAmount(amount) {
    return amount === CERTIFICATE_PRICE_INR ? 'certificate' : 'udyam_number';
}

/**
 * The price after the coupon, or why the coupon does not apply.
 * `coupon` is the stored record plus `used` (paid orders so far).
 */
export function applyCoupon(coupon, { amount, now = Date.now() }) {
    const invalid = (message) => ({ ok: false, message });
    if (!coupon || coupon.active !== true)
        return invalid('This coupon code is not valid.');
    if (typeof coupon.expiresAt === 'number' && now > coupon.expiresAt)
        return invalid('This coupon code has expired.');
    if (Number.isInteger(coupon.maxUses) && coupon.maxUses > 0 && (coupon.used ?? 0) >= coupon.maxUses)
        return invalid('This coupon code has been fully used.');
    const appliesTo = coupon.appliesTo ?? 'all';
    if (appliesTo !== 'all' && appliesTo !== sourceForAmount(amount)) {
        return invalid(appliesTo === 'certificate'
            ? 'This coupon works only for the certificate upload report.'
            : 'This coupon works only for the Udyam number report.');
    }
    const value = Number(coupon.value);
    if (!(value > 0))
        return invalid('This coupon code is not valid.');
    const off = coupon.kind === 'flat' ? Math.round(value) : Math.round((amount * Math.min(value, 100)) / 100);
    // 100% off (or a flat amount covering the price) makes the report free: no Cashfree order at all
    const left = amount - off;
    const payable = left <= 0 ? 0 : Math.max(MIN_PAYABLE_INR, left);
    return { ok: true, amount: payable, discount: amount - payable };
}

/** Reads a coupon and how many paid orders used it. Null when there is no such code. */
export function realtimeCouponLookup() {
    return async (code) => {
        const [coupon, used] = await Promise.all([
            database().ref(`coupons/${code}`).get(),
            database().ref(`couponRedemptions/${code}`).get(),
        ]);
        if (!coupon.exists())
            return null;
        return { ...coupon.val(), used: used.exists() ? used.numChildren() : 0 };
    };
}

/** Counts one paid order against the coupon. Keyed by order, so unlocking twice counts once. */
export function realtimeCouponRedemption() {
    return async (code, orderId, amount) => {
        await database().ref(`couponRedemptions/${code}/${orderId}`).set({ amount, at: ServerValue.TIMESTAMP });
    };
}
