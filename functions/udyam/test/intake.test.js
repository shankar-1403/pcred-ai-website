import { afterEach, describe, expect, it } from 'vitest';
import { handleCertificateRequest, handleOtpSendRequest, handleOtpVerifyRequest } from '../src/intake/handler.js';
import { checkOtp, issueOtp } from '../src/intake/otp.js';
import { openRecord } from '../src/payments/seal.js';
import { parseCertificateText } from '../src/udyam/parse-certificate.js';

const SECRET = 'test-seal-secret';
const allow = { check: () => ({ allowed: true, retryAfterSeconds: 0 }) };
const NOW = 1_000_000;

function request(path, body) {
    return {
        method: 'POST',
        path,
        url: path,
        headers: new Headers({
            'content-type': 'application/json',
            origin: 'https://pcred-udyam-system.web.app',
            'x-forwarded-host': 'pcred-udyam-system.web.app',
        }),
        rawBody: JSON.stringify(body),
    };
}

const deps = { loadSealSecret: () => SECRET, paymentEnabled: true, limiter: allow, now: () => NOW };

const CERT = `
UDYAM REGISTRATION NUMBER
UDYAM-MH-26-0012345
NAME OF ENTERPRISE
SHREE GANESH ENGINEERING WORKS
TYPE OF ENTERPRISE
MICRO
MAJOR ACTIVITY
MANUFACTURING
OFFICIAL ADDRESS OF ENTERPRISE
Road/Street/Lane BHOSARI MIDC ROAD
District PUNE
State MAHARASHTRA
`;

afterEach(() => {
    delete process.env.OTP_DEV_ECHO;
    delete process.env.FAST2SMS_API_KEY;
    delete process.env.FUNCTIONS_EMULATOR;
});

describe('mobile OTP', () => {
    it('rejects a wrong code and an expired code', () => {
        const issued = issueOtp('9876543210', SECRET, NOW);
        const wrong = issued.otp === '000000' ? '111111' : '000000';
        expect(checkOtp('9876543210', wrong, issued.challenge, SECRET, NOW).reason).toBe('mismatch');
        expect(checkOtp('9876543210', issued.otp, issued.challenge, SECRET, NOW + 6 * 60 * 1000).reason).toBe('expired');
        expect(checkOtp('9876543210', issued.otp, issued.challenge, SECRET, NOW).ok).toBe(true);
        expect(issued.challenge).not.toContain(issued.otp);
    });
    it('does not return a code unless local echo is on', async () => {
        const hidden = await handleOtpSendRequest(request('/api/udyam/otp/send', { phone: '9876543210' }), deps);
        expect(hidden.status).toBe(503);
        expect(JSON.stringify(hidden.body)).not.toMatch(/\d{6}/);
        process.env.OTP_DEV_ECHO = '1';
        const sent = await handleOtpSendRequest(request('/api/udyam/otp/send', { phone: '9876543210' }), deps);
        expect(sent.status).toBe(200);
        expect(sent.body.dev_code).toMatch(/^\d{6}$/);
        const verified = await handleOtpVerifyRequest(request('/api/udyam/otp/verify', {
            phone: '9876543210',
            otp: sent.body.dev_code,
            challenge: sent.body.challenge,
        }), deps);
        expect(verified.body.ok).toBe(true);
        expect(verified.body.proof).toBeTruthy();
    });
    it('sends the code through Fast2SMS and does not return it', async () => {
        process.env.FAST2SMS_API_KEY = 'fast2sms-test-key';
        const calls = [];
        const fetchImpl = async (url, init) => {
            calls.push({ url, init });
            return new Response(JSON.stringify({ return: true, request_id: 'req_1', message: ['SMS sent successfully.'] }), { status: 200 });
        };
        const sent = await handleOtpSendRequest(request('/api/udyam/otp/send', { phone: '9876543210' }), { ...deps, fetchImpl });
        expect(sent.status).toBe(200);
        expect(sent.body.dev_code).toBeUndefined();
        expect(sent.body.challenge).toBeTruthy();
        expect(JSON.stringify(sent.body)).not.toMatch(/\d{6}/);
        const body = JSON.parse(calls[0].init.body);
        expect(calls[0].url).toBe('https://www.fast2sms.com/dev/bulkV2');
        expect(calls[0].init.headers.authorization).toBe('fast2sms-test-key');
        expect(body).toEqual({ route: 'otp', variables_values: expect.stringMatching(/^\d{6}$/), numbers: '9876543210', flash: '0' });
        const verified = await handleOtpVerifyRequest(request('/api/udyam/otp/verify', {
            phone: '9876543210',
            otp: body.variables_values,
            challenge: sent.body.challenge,
        }), deps);
        expect(verified.body.ok).toBe(true);
    });
    it('does not accept the code when Fast2SMS rejects the send', async () => {
        process.env.FAST2SMS_API_KEY = 'fast2sms-test-key';
        const fetchImpl = async () => new Response(JSON.stringify({ return: false, status_code: 412, message: 'Invalid Authentication' }), { status: 200 });
        const sent = await handleOtpSendRequest(request('/api/udyam/otp/send', { phone: '9876543210' }), { ...deps, fetchImpl });
        expect(sent.status).toBe(503);
        expect(sent.body.ok).toBe(false);
        expect(JSON.stringify(sent.body)).not.toMatch(/\d{6}/);
    });
});

describe('certificate seal', () => {
    it('seals the read fields and keeps the address out of the preview', async () => {
        process.env.OTP_DEV_ECHO = '1';
        const sent = await handleOtpSendRequest(request('/api/udyam/otp/send', { phone: '9876543210' }), deps);
        const verified = await handleOtpVerifyRequest(request('/api/udyam/otp/verify', {
            phone: '9876543210',
            otp: sent.body.dev_code,
            challenge: sent.body.challenge,
        }), deps);
        const res = await handleCertificateRequest(request('/api/udyam/certificate', {
            proof: verified.body.proof,
            record: parseCertificateText(CERT),
        }), deps);
        expect(res.status).toBe(200);
        expect(res.body.preview.enterprise_name).toBe('SHREE GANESH ENGINEERING WORKS');
        expect(JSON.stringify(res.body.preview)).not.toContain('BHOSARI');
        const opened = openRecord(res.body.sealed, SECRET, NOW);
        expect(opened.record.split_address.street).toBe('BHOSARI MIDC ROAD');
        expect(opened.record.enterprise_type).toBe('Micro');
    });
    it('refuses a certificate when the mobile code was not verified (OTP on)', async () => {
        const res = await handleCertificateRequest(request('/api/udyam/certificate', {
            proof: '',
            record: parseCertificateText(CERT),
        }), { ...deps, otpEnabled: true });
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('OTP_REQUIRED');
    });
    it('accepts a certificate with an entered mobile number when OTP is off', async () => {
        const saved = [];
        const res = await handleCertificateRequest(request('/api/udyam/certificate', {
            phone: '9876543210',
            record: parseCertificateText(CERT),
        }), { ...deps, otpEnabled: false, saveLead: async (lead) => saved.push(lead) });
        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
        expect(saved[0].phone).toBe('9876543210');
    });
    it('accepts a certificate with no mobile number when OTP is off', async () => {
        const saved = [];
        const res = await handleCertificateRequest(request('/api/udyam/certificate', {
            record: parseCertificateText(CERT),
        }), { ...deps, otpEnabled: false, saveLead: async (lead) => saved.push(lead) });
        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
        expect(saved[0].phone).toBe('');
    });
});

describe('payment switched off', () => {
    it('returns the certificate record itself, with no seal or price', async () => {
        const res = await handleCertificateRequest(request('/api/udyam/certificate', {
            record: parseCertificateText(CERT),
        }), { ...deps, otpEnabled: false, paymentEnabled: false, saveLead: async () => {} });
        expect(res.status).toBe(200);
        expect(res.body.data.enterprise_name).toBe('SHREE GANESH ENGINEERING WORKS');
        expect(res.body.sealed).toBeUndefined();
        expect(res.body.price).toBeUndefined();
    });
});

describe('certificate application details', () => {
    it('keeps the turnover, employment and owner details, and drops anything malformed', async () => {
        const record = {
            ...parseCertificateText(CERT),
            financial_years: [
                { financial_year: '2023-24', enterprise_type: 'Micro', wdv: '100.00', exclusion: '0.00', net_investment: '100.00', total_turnover: '2751151.00', export_turnover: '0.00', net_turnover: '2751151.00', itr_filed: 'Yes' },
                { financial_year: 'last year', total_turnover: '<script>' },
            ],
            employment: { male: '7', female: '5', other: '0', total: 'twelve' },
            owner_gender: 'Female',
            has_gstin: 'Maybe',
            classification_history: [{ classification_year: '2024-25', enterprise_type: 'Small', classification_date: '2024-04-27' }],
            dic: 'PUNE (MAHARASHTRA)',
        };
        const res = await handleCertificateRequest(request('/api/udyam/certificate', { record }), {
            ...deps, otpEnabled: false, paymentEnabled: false, saveLead: async () => {},
        });
        const data = res.body.data;
        expect(data.financial_years).toHaveLength(1);
        expect(data.financial_years[0].total_turnover).toBe('2751151.00');
        expect(data.employment).toEqual({ male: '7', female: '5', other: '0', total: '' });
        expect(data.owner_gender).toBe('Female');
        expect(data.has_gstin).toBe('');
        expect(data.classification_history[0]).toMatchObject({ classification_year: '2024-25', enterprise_type: 'Small', classification_date: '2024-04-27' });
        expect(data.dic).toBe('PUNE (MAHARASHTRA)');
    });
});
