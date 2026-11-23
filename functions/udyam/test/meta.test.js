import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { META_PIXEL_ID, metaContext, sendMetaEvents, userData } from '../src/meta/capi.js';
import { handleCheckoutRequest, handleUnlockRequest } from '../src/payments/handler.js';
import { sealHash, sealRecord } from '../src/payments/seal.js';
import { UDYAM_NUMBER_PRICE_INR } from '../src/payments/price.js';

const record = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fixtures/udyam-success.normalized.json'), 'utf8'));
const SECRET = 'test-seal-secret';
const sha = (v) => createHash('sha256').update(v).digest('hex');
const FBP = 'fb.1.1732370000000.1234567890';
const FBC = 'fb.1.1732370000000.IwAR0abcdefghijklmnop';

function request(path, body) {
    return {
        method: 'POST', path, url: path,
        headers: new Headers({
            'content-type': 'application/json',
            origin: 'https://pcred.ai',
            'x-forwarded-host': 'pcred.ai',
            'fastly-client-ip': '203.0.113.7',
            'user-agent': 'Mozilla/5.0 test',
        }),
        rawBody: JSON.stringify(body),
    };
}

const baseDeps = {
    loadSealSecret: () => SECRET, paymentEnabled: true,
    loadPgConfig: () => ({ clientId: 'pg_id', clientSecret: 'pg_secret' }),
    loadMetaConfig: () => ({ token: 'meta_token', testCode: '' }),
    limiter: { check: () => ({ allowed: true, retryAfterSeconds: 0 }) },
};

describe('meta conversions api', () => {
    it('keeps only valid Pixel details and this site as the source URL', () => {
        const headers = new Headers({ referer: 'https://evil.example/x' });
        const good = metaContext({ meta: { event_id: 'vc_abc123', fbp: FBP, fbc: FBC, url: 'https://pcred.ai/report?order_id=x' } }, headers);
        expect(good).toEqual({ eventId: 'vc_abc123', fbp: FBP, fbc: FBC, url: 'https://pcred.ai/report' });
        const bad = metaContext({ meta: { event_id: '<script>', fbp: 'nope', fbc: 'x', url: 'https://evil.example/' } }, headers);
        expect(bad).toEqual({ eventId: '', fbp: '', fbc: '', url: 'https://pcred.ai/' });
    });

    it('hashes contact details and never hashes IP or browser', () => {
        const data = userData(new Headers({ 'fastly-client-ip': '203.0.113.7', 'user-agent': 'UA' }), { fbp: FBP, fbc: '' }, {
            name: ' Ravi  Kumar ', email: ' Ravi@Example.com ', phone: '+91 98765 43210',
        });
        expect(data.em).toEqual([sha('ravi@example.com')]);
        expect(data.ph).toEqual([sha('919876543210')]);
        expect(data.fn).toEqual([sha('ravi')]);
        expect(data.ln).toEqual([sha('kumar')]);
        expect(data.country).toEqual([sha('in')]);
        expect(data.client_ip_address).toBe('203.0.113.7');
        expect(data.client_user_agent).toBe('UA');
        expect(data.fbp).toBe(FBP);
        expect(data.fbc).toBeUndefined();
        // The payment placeholder number is not a real customer
        expect(userData(null, {}, { phone: '9999999999' }).ph).toBeUndefined();
    });

    it('does nothing without a token, and never throws when Meta fails', async () => {
        const fetchImpl = vi.fn();
        expect((await sendMetaEvents({ fetchImpl, loadMetaConfig: () => ({ token: '' }) }, null, [{ name: 'Lead', eventId: 'lead_123456' }])).skipped).toBe(true);
        expect(fetchImpl).not.toHaveBeenCalled();
        const failing = vi.fn(async () => { throw new Error('network'); });
        expect((await sendMetaEvents({ fetchImpl: failing, loadMetaConfig: () => ({ token: 't' }) }, null, [{ name: 'Lead', eventId: 'lead_123456' }])).ok).toBe(false);
    });

    it('sends InitiateCheckout at checkout with the order id as event id', async () => {
        const sealed = sealRecord(record, SECRET, Date.now(), UDYAM_NUMBER_PRICE_INR);
        const calls = [];
        const fetchImpl = vi.fn(async (url, init) => {
            calls.push({ url, body: JSON.parse(init.body) });
            return new Response(JSON.stringify(String(url).includes('graph.facebook.com') ? { events_received: 1 } : { payment_session_id: 's1' }), { status: 200 });
        });
        const res = await handleCheckoutRequest(request('/api/udyam/checkout', {
            sealed, phone: '9876543210', email: 'a@b.co', name: 'Asha Rao', meta: { fbp: FBP, url: 'https://pcred.ai/report' },
        }), { ...baseDeps, fetchImpl });
        expect(res.body.ok).toBe(true);
        const meta = calls.find((c) => c.url.includes('graph.facebook.com'));
        expect(meta.url).toContain(`/${META_PIXEL_ID}/events?access_token=meta_token`);
        const [event] = meta.body.data;
        expect(event.event_name).toBe('InitiateCheckout');
        expect(event.event_id).toBe(`ic_${res.body.order_id}`);
        expect(event.custom_data).toMatchObject({ value: 824.82, currency: 'INR' });
        expect(event.user_data.ph).toEqual([sha('919876543210')]);
        expect(event.user_data.fbp).toBe(FBP);
        // Nothing about the business reaches Meta
        expect(JSON.stringify(meta.body)).not.toContain(record.udyam_number);
        expect(JSON.stringify(meta.body)).not.toContain(record.enterprise_name);
    });

    it('sends AddPaymentInfo and Purchase once when the order is paid', async () => {
        const sealed = sealRecord(record, SECRET, Date.now(), UDYAM_NUMBER_PRICE_INR);
        const paid = { order_status: 'PAID', order_amount: 824.82, order_currency: 'INR', order_tags: { seal: sealHash(sealed) } };
        const metaCalls = [];
        const fetchImpl = vi.fn(async (url, init) => {
            if (String(url).includes('graph.facebook.com')) {
                metaCalls.push(JSON.parse(init.body));
                return new Response('{}', { status: 200 });
            }
            return new Response(JSON.stringify(paid), { status: 200 });
        });
        const orderId = 'pcred_pay_0123456789abcdef';
        let stored = { status: 'pending', name: 'Asha Rao', email: 'asha@example.com', phone: '9876543210' };
        const deps = {
            ...baseDeps, fetchImpl,
            findOrder: async () => stored,
            markOrderPaid: async (_id, fields) => { stored = { ...stored, ...fields }; },
        };
        const first = await handleUnlockRequest(request('/api/udyam/unlock', { order_id: orderId, sealed }), deps);
        expect(first.body.payment).toEqual({ order_id: orderId, amount: 824.82, currency: 'INR' });
        expect(metaCalls).toHaveLength(1);
        expect(metaCalls[0].data.map((e) => [e.event_name, e.event_id])).toEqual([
            ['AddPaymentInfo', `api_${orderId}`],
            ['Purchase', `purchase_${orderId}`],
        ]);
        expect(metaCalls[0].data[1].custom_data).toMatchObject({ value: 824.82, currency: 'INR' });
        expect(metaCalls[0].data[1].user_data.em).toEqual([sha('asha@example.com')]);
        // Opening the report again (refresh, return link) does not send a second Purchase
        await handleUnlockRequest(request('/api/udyam/unlock', { order_id: orderId, sealed }), deps);
        expect(metaCalls).toHaveLength(1);
    });
});
