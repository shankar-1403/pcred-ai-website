import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { handleCheckoutRequest, handleUnlockRequest, orderDocument } from '../src/payments/handler.js';
import { sealHash, sealRecord } from '../src/payments/seal.js';
import { CERTIFICATE_PRICE_INR, UDYAM_NUMBER_PRICE_INR } from '../src/payments/price.js';

const record = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fixtures/udyam-success.normalized.json'), 'utf8'));
const SECRET = 'test-seal-secret';
const allow = { check: () => ({ allowed: true, retryAfterSeconds: 0 }) };
const ORDER = 'pcred_pay_0123456789abcdef';

function request(path, body) {
    return {
        method: 'POST', path, url: path,
        headers: new Headers({ 'content-type': 'application/json', origin: 'https://pcred-udyam-system.web.app', 'x-forwarded-host': 'pcred-udyam-system.web.app' }),
        rawBody: JSON.stringify(body),
    };
}

function deps(extra = {}) {
    return {
        loadSealSecret: () => SECRET, paymentEnabled: true, limiter: allow,
        loadPgConfig: () => ({ clientId: 'pg_id', clientSecret: 'pg_secret' }),
        ...extra,
    };
}

describe('report orders for the CMS', () => {
    it('describes who bought which report, and which kind', () => {
        const doc = orderDocument(record, UDYAM_NUMBER_PRICE_INR, { name: '  Ravi  Kumar ', email: 'RAVI@Example.com', phone: '98765 43210' });
        expect(doc).toEqual({
            source: 'udyam_number', name: 'Ravi Kumar', email: 'ravi@example.com', phone: '9876543210',
            udyam_number: record.udyam_number, enterprise_name: record.enterprise_name, price: UDYAM_NUMBER_PRICE_INR,
        });
        expect(orderDocument(record, CERTIFICATE_PRICE_INR, { phone: '123', email: 'nope' })).toMatchObject({ source: 'certificate', phone: '', email: '' });
    });

    it('saves a pending order at checkout with the buyer, then marks it paid at unlock', async () => {
        const saveOrder = vi.fn(async () => {});
        const markOrderPaid = vi.fn(async () => {});
        const sealed = sealRecord(record, SECRET, Date.now(), UDYAM_NUMBER_PRICE_INR);
        const started = await handleCheckoutRequest(
            request('/api/udyam/checkout', { sealed, phone: '9876543210', name: 'Ravi', email: 'ravi@example.com' }),
            deps({ saveOrder, fetchImpl: vi.fn(async () => new Response(JSON.stringify({ payment_session_id: 's1' }), { status: 200 })) }),
        );
        expect(started.status).toBe(200);
        const [orderId, saved] = saveOrder.mock.calls[0];
        expect(orderId).toBe(started.body.order_id);
        expect(saved).toMatchObject({ status: 'pending', name: 'Ravi', email: 'ravi@example.com', phone: '9876543210', udyam_number: record.udyam_number, price: 699, total: 824.82, coupon: '' });

        const paid = { order_status: 'PAID', order_amount: 824.82, order_currency: 'INR', order_tags: { seal: sealHash(sealed) } };
        const res = await handleUnlockRequest(request('/api/udyam/unlock', { order_id: ORDER, sealed }), deps({ markOrderPaid, fetchImpl: vi.fn(async () => new Response(JSON.stringify(paid), { status: 200 })) }));
        expect(res.status).toBe(200);
        expect(markOrderPaid).toHaveBeenCalledWith(ORDER, expect.objectContaining({ status: 'paid', amount_paid: 824.82, udyam_number: record.udyam_number, price: 699 }));
        expect(markOrderPaid.mock.calls[0][1]).not.toHaveProperty('name');
    });

    it('records a 100% coupon as a free order, and a save failure never blocks the report', async () => {
        const sealed = sealRecord(record, SECRET, Date.now(), CERTIFICATE_PRICE_INR);
        const saveOrder = vi.fn(async () => {});
        const coupon = { kind: 'percent', value: 100, appliesTo: 'all', active: true };
        const free = await handleCheckoutRequest(request('/api/udyam/checkout', { sealed, coupon: 'FREE100', name: 'Asha' }), deps({ saveOrder, findCoupon: async () => coupon, redeemCoupon: async () => {} }));
        expect(free.body.free).toBe(true);
        expect(saveOrder.mock.calls[0][1]).toMatchObject({ status: 'free', source: 'certificate', coupon: 'FREE100', total: 0, amount_paid: 0, name: 'Asha' });

        const broken = await handleCheckoutRequest(request('/api/udyam/checkout', { sealed, coupon: 'FREE100' }), deps({ saveOrder: async () => { throw new Error('db down'); }, findCoupon: async () => coupon, redeemCoupon: async () => {} }));
        expect(broken.status).toBe(200);
        expect(broken.body.free).toBe(true);
    });
});
