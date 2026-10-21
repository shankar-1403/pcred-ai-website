import { getApps, initializeApp } from 'firebase-admin/app';
import { getDatabase, ServerValue } from 'firebase-admin/database';
import { maskUdyamNumber } from '../udyam/validate.js';
import { logEvent } from '../server/log.js';

const PHONE = /^[6-9]\d{9}$/;
let db = null;

function text(v) {
    return typeof v === 'string' ? v : '';
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The visitor's name, trimmed to a sane length, or '' when missing. */
export function cleanName(value) {
    return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, 100) : '';
}

/** A plausible email address, lower-cased, or '' when missing or malformed. */
export function cleanEmail(value) {
    const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
    return email.length <= 200 && EMAIL.test(email) ? email : '';
}

/** Lead fields for the Firebase console, plus the full Udyam record under `details`. */
export function leadDocument(record, extra = {}) {
    const address = record?.split_address && typeof record.split_address === 'object' ? record.split_address : {};
    const phone = typeof extra.phone === 'string' ? extra.phone.replace(/\s+/g, '') : '';
    return {
        status: 'active',
        source: extra.source === 'certificate' ? 'certificate' : 'udyam_number',
        name: cleanName(extra.name),
        email: cleanEmail(extra.email),
        phone: PHONE.test(phone) ? phone : '',
        women_hold_51: extra.women === true ? true : extra.women === false ? false : null,
        udyam_number: text(record?.udyam_number),
        enterprise_name: text(record?.enterprise_name),
        organization_type: text(record?.organization_type),
        major_activity: text(record?.major_activity),
        social_category: text(record?.social_category),
        enterprise_type: text(record?.enterprise_type),
        date_of_incorporation: text(record?.date_of_incorporation),
        date_of_commencement: text(record?.date_of_commencement),
        date_of_udyam_registration: text(record?.date_of_udyam_registration),
        classification_year: text(record?.classification_year),
        district: text(address.district),
        state: text(address.state),
        city: text(address.city),
        pincode: text(address.pincode),
        details: record,
    };
}

/** Writes one lead per successful Udyam lookup. The Admin SDK bypasses client security rules. */
export function realtimeLeadStore() {
    return async (lead) => {
        await leadsRef().push({
            ...jsonValue(lead),
            created_at: ServerValue.TIMESTAMP,
        });
    };
}

export const LEAD_ACTIVE_MS = 90 * 24 * 60 * 60 * 1000;

/** Epoch millis, a Date, or a `{ seconds }` timestamp. Realtime Database stores `created_at` as millis. */
export function leadCreatedMs(value) {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (value instanceof Date)
        return value.getTime();
    if (value && typeof value.toDate === 'function') {
        const date = value.toDate();
        return date instanceof Date ? date.getTime() : null;
    }
    if (value && typeof value.seconds === 'number')
        return value.seconds * 1000;
    if (value && typeof value._seconds === 'number')
        return value._seconds * 1000;
    return null;
}

/** `active` for 90 days after it was saved. `inactive` stays inactive. A missing time is not reusable. */
export function leadState(lead, now = Date.now()) {
    if (!lead || lead.status === 'inactive')
        return 'inactive';
    const created = leadCreatedMs(lead.created_at);
    if (created == null)
        return 'inactive';
    return now - created < LEAD_ACTIVE_MS ? 'active' : 'expired';
}

/**
 * The record kept with a saved lead, so a repeat visitor is not charged a second Cashfree lookup.
 * It is only ever sealed again for payment: a saved lead never opens the report by itself.
 */
export function savedRecordFromLead(lead) {
    if (!lead?.details || typeof lead.details !== 'object')
        return null;
    const women = lead.women_hold_51 === true ? true : lead.women_hold_51 === false ? false : null;
    return {
        record: lead.details,
        women,
        source: lead.source === 'certificate' ? 'certificate' : 'udyam_number',
    };
}

/** Looks up a saved lead's record. Null when there is none, or the lookup failed (fetch again). */
export async function savedLeadRecord(findLead, udyam, now = Date.now()) {
    if (typeof findLead !== 'function')
        return null;
    try {
        const lead = await findLead(udyam, now);
        return savedRecordFromLead(lead);
    }
    catch (e) {
        logEvent('error', 'udyam_lead', {
            outcome: 'error',
            reason: 'lookup_failed',
            udyam: maskUdyamNumber(text(udyam)),
            detail: e instanceof Error ? e.name : 'unknown',
        });
        return null;
    }
}

function databaseUrl() {
    if (process.env.FIREBASE_DATABASE_URL)
        return process.env.FIREBASE_DATABASE_URL;
    const raw = process.env.FIREBASE_CONFIG;
    if (!raw)
        return '';
    try {
        const parsed = JSON.parse(raw);
        return typeof parsed.databaseURL === 'string' ? parsed.databaseURL : '';
    }
    catch {
        return '';
    }
}

/** Drops `undefined`, which Realtime Database rejects. */
function jsonValue(value) {
    if (Array.isArray(value))
        return value.map((item) => jsonValue(item));
    if (value && typeof value === 'object') {
        const out = {};
        for (const [key, item] of Object.entries(value)) {
            if (item !== undefined)
                out[key] = jsonValue(item);
        }
        return out;
    }
    return value;
}

function database() {
    if (!db) {
        if (!getApps().length) {
            const url = databaseUrl();
            initializeApp(url ? { databaseURL: url } : undefined);
        }
        db = getDatabase();
    }
    return db;
}

function leadsRef() {
    return database().ref('leads');
}

async function markInactive(keys) {
    for (let i = 0; i < keys.length; i += 200) {
        const updates = {};
        for (const key of keys.slice(i, i + 200)) {
            updates[`${key}/status`] = 'inactive';
            updates[`${key}/deactivated_at`] = ServerValue.TIMESTAMP;
        }
        await leadsRef().update(updates);
    }
}

/** Active lead for this Udyam number, or null. Leads older than 90 days are marked inactive. */
export function realtimeLeadLookup() {
    return async (udyam, now = Date.now()) => {
        const snap = await leadsRef().orderByChild('udyam_number').equalTo(udyam).get();
        let best = null;
        let bestAt = 0;
        const expired = [];
        snap.forEach((child) => {
            const data = child.val();
            const state = leadState(data, now);
            if (state === 'expired')
                expired.push(child.key);
            else if (state === 'active') {
                const created = leadCreatedMs(data.created_at) ?? 0;
                if (!best || created > bestAt) {
                    best = data;
                    bestAt = created;
                }
            }
        });
        if (expired.length)
            await markInactive(expired);
        return best;
    };
}

/** Marks every lead older than 90 days inactive. Used by the daily schedule. */
export async function deactivateExpiredLeads(now = Date.now()) {
    const cutoff = now - LEAD_ACTIVE_MS;
    const snap = await leadsRef().orderByChild('created_at').endAt(cutoff).get();
    const expired = [];
    snap.forEach((child) => {
        if (child.val()?.status !== 'inactive' && child.key)
            expired.push(child.key);
    });
    await markInactive(expired);
    return expired.length;
}

/** Saves the lead when a store is configured. A database error does not block the visitor. */
export async function rememberLead(saveLead, record, extra) {
    if (typeof saveLead !== 'function' || !record)
        return;
    try {
        await saveLead(leadDocument(record, extra));
        logEvent('info', 'udyam_lead', {
            outcome: 'stored',
            source: extra?.source === 'certificate' ? 'certificate' : 'udyam_number',
            udyam: maskUdyamNumber(text(record.udyam_number)),
        });
    }
    catch (e) {
        logEvent('error', 'udyam_lead', {
            outcome: 'error',
            reason: 'store_failed',
            detail: e instanceof Error ? e.name : 'unknown',
        });
    }
}
