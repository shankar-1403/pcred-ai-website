/**
 * PCRED: copies leads + report orders from Firebase into one Google Sheet table, on a timer.
 * One row per Udyam number. The tab is rebuilt on every run, so it always matches Firebase.
 * Needs appsscript.json with the scopes listed in the setup steps.
 */

const DB_URL = 'https://pcred-ai-website-default-rtdb.asia-southeast1.firebasedatabase.app';
const SHEET_NAME = 'Leads & Orders';
const EVERY_MINUTES = 30; // 1, 5, 10, 15 or 30

const HEADERS = [
  'First seen', 'Last updated', 'Udyam number', 'Enterprise', 'Name', 'Phone', 'Email',
  'Source', 'State', 'District', 'Activity', 'Size',
  'Report status', 'Order ID', 'Price (₹, before GST)', 'Coupon', 'Total with GST (₹)', 'Amount paid (₹)', 'Paid at',
];

const STATUS = { pending: 'Payment started', paid: 'Paid', free: 'Free (coupon)' };
const RANK = { 'Lead only': 0, 'Payment started': 1, 'Free (coupon)': 2, 'Paid': 3 };

/** Run once by hand: creates the timer. */
function setupTrigger() {
  ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('syncLeadsAndOrders').timeBased().everyMinutes(EVERY_MINUTES).create();
  syncLeadsAndOrders();
}

function syncLeadsAndOrders() {
  const leads = read('leads');
  const orders = read('orders');
  const rows = {};

  const row = (key) => rows[key] || (rows[key] = {
    first: null, last: null, udyam: '', enterprise: '', name: '', phone: '', email: '',
    source: '', state: '', district: '', activity: '', size: '',
    status: 'Lead only', orderId: '', price: '', coupon: '', total: '', paid: '', paidAt: null,
  });
  const fill = (r, k, v) => { if (v !== undefined && v !== null && v !== '') r[k] = v; };
  const seen = (r, ms) => {
    if (!ms) return;
    const d = new Date(ms);
    if (!r.first || d < r.first) r.first = d;
    if (!r.last || d > r.last) r.last = d;
  };

  // Leads, oldest first, so the newest form fill wins
  Object.values(leads).sort((a, b) => (a.created_at || 0) - (b.created_at || 0)).forEach((l) => {
    const key = l.udyam_number || 'lead';
    const r = row(key);
    seen(r, l.created_at);
    fill(r, 'udyam', l.udyam_number); fill(r, 'enterprise', l.enterprise_name);
    fill(r, 'name', l.name); fill(r, 'phone', l.phone); fill(r, 'email', l.email);
    fill(r, 'source', l.source === 'certificate' ? 'Certificate' : 'Udyam number');
    fill(r, 'state', l.state); fill(r, 'district', l.district);
    fill(r, 'activity', l.major_activity); fill(r, 'size', l.enterprise_type);
  });

  // Orders: the best outcome per business is shown (Paid > Free > Payment started)
  Object.entries(orders).sort((a, b) => (a[1].created_at || 0) - (b[1].created_at || 0)).forEach(([id, o]) => {
    const r = row(o.udyam_number || id);
    seen(r, o.created_at); seen(r, o.paid_at);
    fill(r, 'udyam', o.udyam_number); fill(r, 'enterprise', o.enterprise_name);
    fill(r, 'name', o.name); fill(r, 'phone', o.phone); fill(r, 'email', o.email);
    const status = STATUS[o.status] || o.status || '';
    if ((RANK[status] ?? 0) >= (RANK[r.status] ?? 0)) {
      r.status = status; r.orderId = id;
      r.price = o.price ?? ''; r.coupon = o.coupon || ''; r.total = o.total ?? '';
      r.paid = o.amount_paid ?? ''; r.paidAt = o.paid_at ? new Date(o.paid_at) : null;
    }
  });

  const values = Object.values(rows)
    .sort((a, b) => (b.last || 0) - (a.last || 0))
    .map((r) => [r.first || '', r.last || '', r.udyam, r.enterprise, r.name, r.phone, r.email,
      r.source, r.state, r.district, r.activity, r.size,
      r.status, r.orderId, r.price, r.coupon, r.total, r.paid, r.paidAt || '']);

  const book = SpreadsheetApp.getActiveSpreadsheet();
  const s = book.getSheetByName(SHEET_NAME) || book.insertSheet(SHEET_NAME);
  s.clearContents();
  s.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  s.setFrozenRows(1);
  if (values.length) {
    s.getRange(2, 6, values.length, 1).setNumberFormat('@'); // phone as text
    s.getRange(2, 1, values.length, HEADERS.length).setValues(values);
    s.getRange(2, 1, values.length, 2).setNumberFormat('dd mmm yyyy, hh:mm');
    s.getRange(2, 19, values.length, 1).setNumberFormat('dd mmm yyyy, hh:mm');
  }
}

/** Reads one Firebase node as the Google account running the script (must be on the Firebase project). */
function read(path) {
  const res = UrlFetchApp.fetch(`${DB_URL}/${path}.json`, {
    headers: { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` },
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) throw new Error(`Firebase ${path}: ${res.getResponseCode()} ${res.getContentText()}`);
  return JSON.parse(res.getContentText()) || {};
}
