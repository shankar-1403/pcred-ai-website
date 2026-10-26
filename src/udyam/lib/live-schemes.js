import { db } from '../../lib/firebase';
import statesData from '../data/states.json';
import extrasData from '../data/extras.json';

// The monthly scheme check stores its data in Firebase (schemes/current, written by the
// importSchemes function). The report uses it so new schemes reach visitors without a site
// rebuild. The data bundled with the site is the fallback when Firebase is slow, unreachable,
// or holds something that does not look like a full import.

// About 1 MB of data; read over plain HTTPS (the database's REST address) rather than the
// SDK's WebSocket, which some office and public networks block without falling back
const WAIT_MS = 6000;
// Below these the import is treated as broken (same floors as the importSchemes check)
const MIN = { states: 30, extras: 20 };

const list = (v) => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : []);
// "24 Oct 2026" to a Date, or null
const checkedDate = (s) => { const d = new Date(String(s || '')); return Number.isNaN(d.getTime()) ? null : d; };

// Firebase drops empty lists. Put back every field that is a list in the bundled data.
function listKeys(rows) {
    const keys = new Set();
    for (const row of rows)
        for (const [k, v] of Object.entries(row || {}))
            if (Array.isArray(v)) keys.add(k);
    return keys;
}
const STATE_KEYS = listKeys(statesData.states);
const STATE_ITEM_KEYS = listKeys(statesData.states.flatMap((s) => s.items || []));
const EXTRA_KEYS = listKeys(extrasData.items);

function withLists(row, keys) {
    const out = { ...row };
    for (const k of keys)
        out[k] = list(row[k]);
    return out;
}

function shape(current) {
    const states = list(current?.states)
        .filter((s) => s && s.state && s.code)
        .map((s) => ({ ...withLists(s, STATE_KEYS), items: list(s.items).map((it) => withLists(it, STATE_ITEM_KEYS)) }));
    const extras = list(current?.extras)
        .filter((x) => x && x.id && x.name && x.apply && x.source)
        .map((x) => withLists(x, EXTRA_KEYS));
    if (states.length < MIN.states || extras.length < MIN.extras)
        return null;
    const meta = current.meta || {};
    // Whichever was checked more recently wins: a site rebuilt with newer data than the last
    // import keeps its own copy
    const liveDate = checkedDate(meta.statesChecked), bundledDate = checkedDate(statesData.checked);
    if (liveDate && bundledDate && liveDate < bundledDate)
        return null;
    return {
        states: { checked: meta.statesChecked || statesData.checked, states },
        extras: { checked: meta.extrasChecked || extrasData.checked, items: extras },
        // Central schemes: their rules stay in the report code; status notes, links and
        // sources come from the import
        central: current.central && typeof current.central === 'object' ? current.central : {},
        month: meta.month || '',
    };
}

/** The latest imported scheme data, or null to use the bundled data. Never throws. */
export async function loadLiveSchemes() {
    const base = db?.app?.options?.databaseURL;
    if (!base)
        return null;
    try {
        const res = await fetch(`${base.replace(/\/+$/, '')}/schemes/current.json`, { signal: AbortSignal.timeout(WAIT_MS) });
        if (!res.ok)
            return null;
        const current = await res.json();
        return current ? shape(current) : null;
    }
    catch (err) {
        console.warn('Scheme data from Firebase could not be loaded; using the bundled data', err);
        return null;
    }
}
