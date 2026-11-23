import { createHash, randomBytes } from 'node:crypto';
import { clientIp } from '../server/request.js';
import { logEvent } from '../server/log.js';

/**
 * Meta Conversions API: sends the same events the browser Pixel sends, from this server, with the
 * same event_id so Meta counts each one once (browser + server deduplication).
 *
 * Access token: Events Manager → dataset → Settings → Conversions API → Generate access token, then
 *   firebase functions:secrets:set META_CAPI_TOKEN
 * Test events (optional): put META_TEST_EVENT_CODE=TEST12345 in functions/.env, deploy, check
 * Events Manager → Test events, then remove the line and deploy again.
 *
 * Only contact details are sent, always SHA-256 hashed. Udyam numbers, business names and report
 * contents are never sent to Meta.
 */
export const META_PIXEL_ID = '1675587630733457';
export const GRAPH_VERSION = 'v24.0';
const TIMEOUT_MS = 2500;
const SITE_ORIGINS = ['https://pcred.ai', 'https://www.pcred.ai', 'https://pcred-ai-website.web.app', 'https://pcred-ai-website.firebaseapp.com'];
const EVENT_ID = /^[A-Za-z0-9_.:-]{6,80}$/;
const FBP = /^fb\.\d\.\d{10,16}\.\d{1,25}$/;
const FBC = /^fb\.\d\.\d{10,16}\.[A-Za-z0-9_-]{10,500}$/;
const PHONE = /^[6-9]\d{9}$/;
const PLACEHOLDER_PHONE = '9999999999';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sha256 = (value) => createHash('sha256').update(value, 'utf8').digest('hex');
const str = (value, max = 500) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

export function newEventId(prefix) {
    return `${prefix}_${randomBytes(8).toString('hex')}`;
}

/** The browser's Pixel details sent in the request body as `meta` (event id, _fbp, _fbc, page URL). */
export function metaContext(body, headers) {
    const meta = body && typeof body.meta === 'object' && body.meta !== null ? body.meta : {};
    const eventId = str(meta.event_id, 80);
    const fbp = str(meta.fbp, 100);
    const fbc = str(meta.fbc, 600);
    return {
        eventId: EVENT_ID.test(eventId) ? eventId : '',
        fbp: FBP.test(fbp) ? fbp : '',
        fbc: FBC.test(fbc) ? fbc : '',
        url: siteUrl(str(meta.url, 1000) || headers?.get('referer') || ''),
    };
}

// Only this site's own pages are reported as the event's source
function siteUrl(value) {
    try {
        const url = new URL(value);
        if (SITE_ORIGINS.includes(url.origin))
            return `${url.origin}${url.pathname}`;
    }
    catch {
        // fall through
    }
    return 'https://pcred.ai/';
}

function phoneDigits(value) {
    let digits = typeof value === 'string' ? value.replace(/\D/g, '') : '';
    if (digits.length === 12 && digits.startsWith('91'))
        digits = digits.slice(2);
    return PHONE.test(digits) && digits !== PLACEHOLDER_PHONE ? digits : '';
}

const nameKey = (value) => value.toLowerCase().normalize('NFKC').replace(/[^\p{L}]/gu, '');

/** Meta's user_data: contact details hashed, plus the visitor's IP, browser and Pixel cookies (not hashed). */
export function userData(headers, ctx, contact = {}) {
    const data = { country: [sha256('in')] };
    const email = str(contact.email, 200).toLowerCase();
    if (EMAIL.test(email))
        data.em = [sha256(email)];
    const phone = phoneDigits(contact.phone);
    if (phone) {
        data.ph = [sha256(`91${phone}`)];
        data.external_id = [sha256(`91${phone}`)];
    }
    const parts = str(contact.name, 100).split(/\s+/).map(nameKey).filter(Boolean);
    if (parts.length) {
        data.fn = [sha256(parts[0])];
        if (parts.length > 1)
            data.ln = [sha256(parts[parts.length - 1])];
    }
    const ip = headers ? clientIp(headers) : '';
    if (ip && ip !== 'unknown')
        data.client_ip_address = ip;
    const ua = headers?.get('user-agent');
    if (ua)
        data.client_user_agent = ua.slice(0, 500);
    if (ctx?.fbp)
        data.fbp = ctx.fbp;
    if (ctx?.fbc)
        data.fbc = ctx.fbc;
    return data;
}

/**
 * Sends events to Meta. Never throws and never blocks the visitor for long: a Meta problem is
 * logged and the request carries on. Each event: { name, eventId, ctx, user, custom }.
 */
export async function sendMetaEvents(deps, headers, events) {
    let config;
    try {
        config = deps.loadMetaConfig?.();
    }
    catch {
        config = null;
    }
    const token = config?.token?.trim();
    if (!token || !events.length)
        return { ok: false, skipped: true };
    const now = Math.floor((deps.now?.() ?? Date.now()) / 1000);
    const payload = {
        data: events.map((e) => ({
            event_name: e.name,
            event_time: now,
            event_id: e.eventId,
            action_source: 'website',
            event_source_url: e.ctx?.url || 'https://pcred.ai/',
            user_data: userData(headers, e.ctx, e.user),
            ...(e.custom ? { custom_data: e.custom } : {}),
        })),
        ...(config.testCode ? { test_event_code: config.testCode } : {}),
    };
    const fetchImpl = deps.fetchImpl ?? fetch;
    const names = events.map((e) => e.name).join(',');
    try {
        const res = await fetchImpl(`https://graph.facebook.com/${GRAPH_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!res.ok) {
            const reply = await res.json().catch(() => null);
            logEvent('warn', 'meta_capi', { outcome: 'rejected', events: names, http: res.status, message: str(reply?.error?.message, 200) });
            return { ok: false };
        }
        logEvent('info', 'meta_capi', { outcome: 'sent', events: names, test: Boolean(config.testCode) });
        return { ok: true };
    }
    catch (e) {
        logEvent('warn', 'meta_capi', { outcome: 'error', events: names, detail: e instanceof Error ? e.name : 'unknown' });
        return { ok: false };
    }
}

export const REPORT_CONTENT = { content_name: 'Udyam scheme report', content_category: 'scheme_report', content_type: 'product' };
