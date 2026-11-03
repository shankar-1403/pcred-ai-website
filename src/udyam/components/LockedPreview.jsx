import { useState } from 'react';

const SDK_URL = 'https://sdk.cashfree.com/js/v3/cashfree.js';

function loadCashfree() {
    if (typeof window.Cashfree === 'function')
        return Promise.resolve(window.Cashfree);
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${SDK_URL}"]`);
        const finish = () => (typeof window.Cashfree === 'function' ? resolve(window.Cashfree) : reject(new Error('sdk')));
        if (existing) {
            existing.addEventListener('load', finish, { once: true });
            existing.addEventListener('error', () => reject(new Error('sdk')), { once: true });
            return;
        }
        const script = document.createElement('script');
        script.src = SDK_URL;
        script.async = true;
        script.onload = finish;
        script.onerror = () => reject(new Error('sdk'));
        document.head.appendChild(script);
    });
}

async function postJson(url, body) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
    });
    let payload = null;
    try {
        payload = await res.json();
    }
    catch {
        payload = null;
    }
    return { res, payload };
}

function rupees(amount) {
    const n = Number(amount);
    if (!Number.isFinite(n))
        return '';
    return `₹${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

/**
 * Right-hand confirmation: the fetched business is readable, the rest of the report is blurred
 * until Cashfree confirms payment. The full record never arrives in the browser before that.
 */
function LockIcon() {
    return (<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="ud-tease__lock-icon"><rect x="5" y="10.5" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>);
}

/** What the paid report holds: the same tally as its cover, and the top benefits with names locked. */
function Teaser({ teaser }) {
    const total = teaser.strong + teaser.check;
    const more = Math.max(0, total - teaser.top.length);
    return (<div className="ud-tease">
      <div className="ud-tease__cover">
        <p className="ud-tease__eyebrow">Inside your scheme report</p>
        <div className="ud-tease__tally">
          <div><b>{teaser.strong}</b><span><i className="ud-tease__dot ud-tease__dot--yes"/>Strong matches</span></div>
          <div><b>{teaser.check}</b><span><i className="ud-tease__dot ud-tease__dot--check"/>Worth checking</span></div>
        </div>
        {teaser.state > 0 && teaser.stateName ? <p className="ud-tease__note">Includes {teaser.state} from {teaser.stateName}’s own MSME policy.</p> : null}
      </div>
      {teaser.top.length ? (<ul className="ud-tease__list" aria-label="Top benefits in your report">
          {teaser.top.map((item, i) => (<li key={i} className="ud-tease__item">
              <span className={`ud-tease__badge ud-tease__badge--${item.yes ? 'yes' : 'check'}`}>{item.yes ? 'Strong match' : 'Worth checking'}</span>
              <p className="ud-tease__headline">{item.headline}</p>
              <p className="ud-tease__locked"><LockIcon /><span className="ud-tease__mask" aria-hidden="true"/><span className="sr">Scheme name</span> unlocks after payment</p>
            </li>))}
        </ul>) : null}
      {more > 0 ? <p className="ud-tease__more">+ {more} more {more === 1 ? 'scheme' : 'schemes'}, with how to apply and the documents needed, in the full report.</p> : null}
    </div>);
}

export default function LockedPreview({ pack, teaser, onPaid }) {
    const preview = pack.preview;
    const priceLabel = rupees(pack.price?.amount);
    const fromCertificate = pack.source === 'cert';
    // The mobile comes from the contact step when it is on; payment no longer asks for it
    const phone = typeof pack.phone === 'string' ? pack.phone.replace(/\D/g, '').slice(0, 10) : '';
    const [phase, setPhase] = useState('idle');
    const [message, setMessage] = useState('');
    const [couponInput, setCouponInput] = useState('');
    const [coupon, setCoupon] = useState(null); // { code, amount, discount } once applied
    const [couponState, setCouponState] = useState({ phase: 'idle', message: '' });
    const payable = coupon ? coupon.amount : pack.price?.amount;
    const payLabel = rupees(payable);
    const rows = [
        ['Enterprise type', preview.enterprise_type],
        ['Activity', preview.major_activity],
        ['Organisation', preview.organization_type],
        ['District', preview.district],
        ['State', preview.state],
    ].filter(([, value]) => typeof value === 'string' && value.trim());

    async function applyCouponCode() {
        const code = couponInput.replace(/\s+/g, '').toUpperCase();
        if (!code || couponState.phase === 'checking')
            return;
        setCouponState({ phase: 'checking', message: '' });
        try {
            const checked = await postJson('/api/udyam/coupon', { sealed: pack.sealed, coupon: code });
            if (!checked.payload?.ok) {
                setCoupon(null);
                setCouponState({ phase: 'error', message: checked.payload?.error?.message || 'This coupon code is not valid.' });
                return;
            }
            setCoupon({ code, amount: checked.payload.price.amount, discount: checked.payload.price.discount });
            setCouponState({ phase: 'idle', message: '' });
        }
        catch {
            setCouponState({ phase: 'error', message: 'The coupon could not be checked. Check your connection and try again.' });
        }
    }

    function removeCoupon() {
        setCoupon(null);
        setCouponInput('');
        setCouponState({ phase: 'idle', message: '' });
    }

    async function pay(e) {
        e.preventDefault();
        if (phase === 'paying')
            return;
        setPhase('paying');
        setMessage('');
        try {
            const started = await postJson('/api/udyam/checkout', { sealed: pack.sealed, ...(/^[6-9]\d{9}$/.test(phone) ? { phone } : {}), ...(coupon ? { coupon: coupon.code } : {}) });
            if (started.payload?.ok && started.payload.free && started.payload.data) {
                setPhase('idle');
                onPaid(started.payload.data);
                return;
            }
            if (!started.payload?.ok || !started.payload.payment_session_id || !started.payload.order_id) {
                setPhase('error');
                setMessage(started.payload?.error?.message || 'Payment could not be started. Please try again.');
                return;
            }
            const Cashfree = await loadCashfree();
            const cashfree = Cashfree({ mode: 'production' });
            const result = await cashfree.checkout({
                paymentSessionId: started.payload.payment_session_id,
                redirectTarget: '_modal',
            });
            if (result?.error) {
                setPhase('error');
                setMessage(result.error.message || 'Payment was not completed.');
                return;
            }
            if (result?.redirect)
                return;
            const opened = await postJson('/api/udyam/unlock', { order_id: started.payload.order_id, sealed: pack.sealed });
            if (opened.payload?.ok && opened.payload.data) {
                setPhase('idle');
                onPaid(opened.payload.data);
                return;
            }
            setPhase('error');
            setMessage(opened.payload?.error?.message || 'Payment could not be confirmed. Please try again.');
        }
        catch {
            setPhase('error');
            setMessage('Payment could not be opened. Check your connection and try again.');
        }
    }

    const paying = phase === 'paying';
    return (<section className="ud ud-lock" id="udyam-preview" aria-labelledby="udyam-preview-title">
      <header className="ud__head">
        <div className="ud__heading">
          <p className="ud__eyebrow">{fromCertificate ? 'Read from your certificate' : 'Udyam record fetched'}</p>
          <h2 className="ud__title" id="udyam-preview-title">{preview.enterprise_name || preview.udyam_number}</h2>
          <p className="ud__meta">
            {preview.udyam_number ? <span className="ud__urn">{preview.udyam_number}</span> : null}
            <span className="ud__tag">Awaiting payment</span>
          </p>
        </div>
      </header>
      <p className="ud-lock__lead">{fromCertificate
            ? `This is what we read from your certificate. Pay ${priceLabel} to open the full scheme report.`
            : `This is your fetched record. Pay ${priceLabel} to open the full details and download the scheme report.`}</p>
      <div className="ud-lock__sheet">
        <dl className="ud-lock__clear">
          {rows.map(([label, value]) => (<div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>))}
        </dl>
        <div className="ud-lock__blur" aria-hidden="true">
          <p>Registered address</p>
          <span className="ud-lock__bar"/>
          <span className="ud-lock__bar ud-lock__bar--short"/>
          <p>How to apply and documents</p>
          <span className="ud-lock__bar"/>
          <span className="ud-lock__bar ud-lock__bar--mid"/>
        </div>
      </div>
      {teaser ? <Teaser teaser={teaser}/> : null}
      <form className="ud-lock__pay" onSubmit={pay} noValidate>
        <label className="uv__label" htmlFor="pay-coupon">Coupon code (optional)</label>
        {coupon ? (<p className="uv__msg" role="status">
            <strong>{coupon.code}</strong> applied: {rupees(coupon.discount)} off{' '}
            <button type="button" className="ud-lock__coupon-remove" onClick={removeCoupon} disabled={paying}>Remove</button>
          </p>) : (<div className="ud-lock__coupon">
            <input id="pay-coupon" name="coupon" className="uv__input" type="text" autoComplete="off" autoCapitalize="characters" maxLength={20} placeholder="Enter code" value={couponInput} onChange={(e) => setCouponInput(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())} onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    applyCouponCode();
                }
            }} disabled={paying}/>
            <button type="button" className="btn btn--ghost" onClick={applyCouponCode} disabled={paying || !couponInput || couponState.phase === 'checking'}>
              {couponState.phase === 'checking' ? 'Checking…' : 'Apply'}
            </button>
          </div>)}
        {couponState.phase === 'error' ? <p className="uv__msg uv__msg--err" role="alert">{couponState.message}</p> : null}
        <button className="btn" type="submit" id="pay-preview" disabled={paying}>
          {paying ? (<><span className="spinner" aria-hidden="true"/>{payable === 0 ? 'Opening report…' : 'Opening payment…'}</>)
            : payable === 0 ? 'Open the free report' : coupon ? `Pay ${payLabel} (was ${priceLabel}) to view and download` : `Pay ${priceLabel} to view and download`}
        </button>
        {message ? <p className="uv__msg uv__msg--err" role="alert">{message}</p> : null}
        <p className="ud-lock__note">{fromCertificate
            ? 'Payment opens in Cashfree. The scheme report stays hidden until the payment succeeds.'
            : 'Payment opens in Cashfree. The full record and the PDF stay hidden until the payment succeeds.'}</p>
      </form>
    </section>);
}

/** Called after Cashfree redirects back to this site with ?order_id=. */
export async function unlockPaidOrder(orderId, sealed) {
    const opened = await postJson('/api/udyam/unlock', { order_id: orderId, sealed });
    if (opened.payload?.ok && opened.payload.data)
        return opened.payload.data;
    const error = new Error(opened.payload?.error?.message || 'Payment could not be confirmed.');
    error.code = opened.payload?.error?.code || 'UNLOCK_FAILED';
    throw error;
}
