import { afterEach, describe, expect, it } from 'vitest';
import { handleEnquiryRequest, handleOtpSendRequest } from '../src/intake/handler.js';
import { checkOtp, issueOtp } from '../src/intake/otp.js';
import { apiRoute } from '../src/server/route.js';

const SECRET = 'test-seal-secret';
const NOW = 1_800_000_000_000;
const allow = { check: () => ({ allowed: true, retryAfterSeconds: 0 }) };

function request(path, body) {
    return {
        method: 'POST', path, url: path,
        headers: new Headers({ 'content-type': 'application/json', origin: 'https://pcred.ai', 'x-forwarded-host': 'pcred.ai' }),
        rawBody: JSON.stringify(body),
    };
}

function proofFor(phone) {
    const issued = issueOtp(phone, SECRET, NOW);
    return checkOtp(phone, issued.otp, issued.challenge, SECRET, NOW).proof;
}

const order = {
    name: 'Test Buyer', email: 'Buyer@Example.com',
    items: [{ id: 'msme/kyb', name: 'Know Your Business', suitName: 'MSME Advisory Suite', price: 3000 }],
    subtotal: 3000, discountPercent: 0, discount: 0, total: 3000,
};

afterEach(() => { delete process.env.FAST2SMS_API_KEY; });

describe('bundle checkout OTP', () => {
    it('texts the bundle template for checkout codes and the scheme template otherwise', async () => {
        process.env.FAST2SMS_API_KEY = 'fast2sms-test-key';
        const sent = [];
        const fetchImpl = async (_url, init) => {
            sent.push(JSON.parse(init.body));
            return new Response(JSON.stringify({ return: true }), { status: 200 });
        };
        const deps = { loadSealSecret: () => SECRET, limiter: allow, now: () => NOW, fetchImpl };
        await handleOtpSendRequest(request('/api/udyam/otp/send', { phone: '9876543210', purpose: 'bundle' }), deps);
        await handleOtpSendRequest(request('/api/udyam/otp/send', { phone: '9876543210' }), deps);
        expect(sent.map((b) => b.message)).toEqual(['230579', '230575']);
        expect(apiRoute({ path: '/api/udyam/enquiry' })).toBe('enquiry');
    });

    it('saves a verified enquiry with the verified number, and refuses one without a valid proof', async () => {
        const saved = [];
        const deps = { loadSealSecret: () => SECRET, limiter: allow, now: () => NOW, saveEnquiry: async (e) => { saved.push(e); } };
        const ok = await handleEnquiryRequest(request('/api/udyam/enquiry', { ...order, proof: proofFor('9876543210') }), deps);
        expect(ok.body.ok).toBe(true);
        expect(saved[0]).toMatchObject({ name: 'Test Buyer', email: 'buyer@example.com', phone: '+919876543210', uid: 'otp-verified', status: 'new', total: 3000 });
        const noProof = await handleEnquiryRequest(request('/api/udyam/enquiry', order), deps);
        expect(noProof.status).toBe(401);
        const forged = await handleEnquiryRequest(request('/api/udyam/enquiry', { ...order, proof: 'x.y.z' }), deps);
        expect(forged.status).toBe(401);
        const emptyCart = await handleEnquiryRequest(request('/api/udyam/enquiry', { ...order, items: [], proof: proofFor('9876543210') }), deps);
        expect(emptyCart.status).toBe(400);
        expect(saved).toHaveLength(1);
    });
});
