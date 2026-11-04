import { describe, expect, it } from 'vitest';
import { applyCoupon, cleanCouponCode } from '../src/payments/coupon.js';
import { handleCheckoutRequest, handleCouponRequest, handleUnlockRequest } from '../src/payments/handler.js';
import { sealHash, sealRecord } from '../src/payments/seal.js';
import { apiRoute } from '../src/server/route.js';
import { withGst } from '../src/payments/price.js';

const SECRET = 'test-seal-secret';
const record = { udyam_number: 'UDYAM-MH-01-0000001', enterprise_name: 'Test' };
const allow = { check: () => ({ allowed: true, retryAfterSeconds: 0 }) };
const coupons = {
    FREE: { kind: 'percent', value: 100, appliesTo: 'all', active: true, used: 0 },
    HALF: { kind: 'percent', value: 50, appliesTo: 'all', active: true, used: 0 },
    CERTONLY: { kind: 'flat', value: 100, appliesTo: 'certificate', active: true, used: 0 },
    ONCE: { kind: 'percent', value: 100, appliesTo: 'all', active: true, maxUses: 1, used: 1 },
    OLD: { kind: 'percent', value: 10, appliesTo: 'all', active: true, expiresAt: 500 },
    OFF: { kind: 'percent', value: 10, appliesTo: 'all', active: false },
};

function request(path, body) {
    return {
        method: 'POST', path, url: path,
        headers: new Headers({ 'content-type': 'application/json', origin: 'https://pcred-udyam-system.web.app', 'x-forwarded-host': 'pcred-udyam-system.web.app' }),
        rawBody: JSON.stringify(body),
    };
}

function makeDeps(extra = {}) {
    const redeemed = [];
    return {
        redeemed,
        loadSealSecret: () => SECRET,
        loadPgConfig: () => ({ clientId: 'pg_id', clientSecret: 'pg_secret' }),
        limiter: allow,
        now: () => 1_000,
        findCoupon: async (code) => coupons[code] ?? null,
        redeemCoupon: async (...args) => { redeemed.push(args); },
        ...extra,
    };
}

describe('coupons', () => {
    it('prices percent, flat, free and refuses bad coupons', () => {
        expect(applyCoupon(coupons.HALF, { amount: 699 })).toEqual({ ok: true, amount: 349, discount: 350 });
        expect(applyCoupon(coupons.FREE, { amount: 699 })).toEqual({ ok: true, amount: 0, discount: 699 });
        expect(applyCoupon(coupons.CERTONLY, { amount: 499 }).amount).toBe(399);
        expect(applyCoupon(coupons.CERTONLY, { amount: 699 }).ok).toBe(false);
        expect(applyCoupon(coupons.ONCE, { amount: 699 }).message).toMatch(/fully used/);
        expect(applyCoupon(coupons.OLD, { amount: 699, now: 1_000 }).message).toMatch(/expired/);
        expect(applyCoupon(coupons.OFF, { amount: 699 }).ok).toBe(false);
        expect(applyCoupon(null, { amount: 699 }).ok).toBe(false);
        expect(applyCoupon({ kind: 'percent', value: 99.9, active: true }, { amount: 699 }).amount).toBe(1);
        expect(cleanCouponCode(' free ')).toBe('FREE');
        expect(withGst(499)).toEqual({ base: 499, gst: 89.82, total: 588.82 });
        expect(withGst(699)).toEqual({ base: 699, gst: 125.82, total: 824.82 });
        expect(withGst(1)).toEqual({ base: 1, gst: 0.18, total: 1.18 });
        expect(apiRoute({ path: '/api/udyam/coupon' })).toBe('coupon');
    });

    it('previews the coupon price', async () => {
        const sealed = sealRecord(record, SECRET, 1_000, 699);
        const res = await handleCouponRequest(request('/api/udyam/coupon', { sealed, coupon: 'half' }), makeDeps());
        expect(res.body.price).toEqual({ amount: 349, original: 699, discount: 350, gst: 62.82, total: 411.82, currency: 'INR' });
        const bad = await handleCouponRequest(request('/api/udyam/coupon', { sealed, coupon: 'NOPE' }), makeDeps());
        expect(bad.status).toBe(400);
    });

    it('opens the report without Cashfree for a 100% coupon and counts the use', async () => {
        const sealed = sealRecord(record, SECRET, 1_000, 699);
        let called = false;
        const deps = makeDeps({ fetchImpl: async () => { called = true; } });
        const res = await handleCheckoutRequest(request('/api/udyam/checkout', { sealed, phone: '9876543210', coupon: 'FREE' }), deps);
        expect(res.body.ok).toBe(true);
        expect(res.body.free).toBe(true);
        expect(res.body.data.udyam_number).toBe(record.udyam_number);
        expect(called).toBe(false);
        expect(deps.redeemed[0][0]).toBe('FREE');
    });

    it('charges the lower amount and unlocks a coupon order', async () => {
        const sealed = sealRecord(record, SECRET, 1_000, 699);
        let sent;
        const deps = makeDeps({
            fetchImpl: async (_url, init) => {
                sent = JSON.parse(init.body);
                return new Response(JSON.stringify({ payment_session_id: 'sess' }), { status: 200 });
            },
        });
        const res = await handleCheckoutRequest(request('/api/udyam/checkout', { sealed, phone: '9876543210', coupon: 'HALF' }), deps);
        expect(res.body.price).toEqual({ amount: 411.82, base: 349, gst: 62.82, currency: 'INR' });
        expect(sent.order_amount).toBe(411.82);
        expect(sent.order_tags).toEqual({ seal: sealHash(sealed), coupon: 'HALF' });

        const order = (tags, amount) => async () => new Response(JSON.stringify({ order_status: 'PAID', order_amount: amount, order_currency: 'INR', order_tags: tags }), { status: 200 });
        const ok = await handleUnlockRequest(request('/api/udyam/unlock', { order_id: 'pcred_pay_0123456789abcdef', sealed }), { ...deps, fetchImpl: order(sent.order_tags, 411.82) });
        expect(ok.body.ok).toBe(true);
        expect(deps.redeemed).toEqual([['HALF', 'pcred_pay_0123456789abcdef', 411.82]]);
        const noTag = await handleUnlockRequest(request('/api/udyam/unlock', { order_id: 'pcred_pay_0123456789abcdef', sealed }), { ...deps, fetchImpl: order({ seal: sealHash(sealed) }, 411.82) });
        expect(noTag.status).toBe(400);
    });
});
