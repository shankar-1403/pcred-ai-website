import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import { checkUdyamNumber } from '../../../functions/udyam/src/udyam/validate.js';
import { OTP_ENABLED, PAYMENT_ENABLED } from '../../../functions/udyam/src/udyam/features.js';

// With OTP off there is no pop-up: Continue fetches the record and moves on to payment
const CONTINUE_LABEL = OTP_ENABLED ? 'Verify mobile to continue' : 'Continue';
const NEXT_STEP = OTP_ENABLED ? 'verify your mobile' : 'continue';

const CLIENT_TIMEOUT_MS = 30_000;
const SHOW_REFERENCE = new Set(['SERVICE_UNAVAILABLE', 'UPSTREAM_ERROR', 'BAD_RESPONSE', 'TIMEOUT', 'NETWORK_ERROR', 'INTERNAL_ERROR']);
const PHONE = /^[6-9]\d{9}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function postJson(url, body, signal) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
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

const fieldClass = 'w-full rounded-xl border-2 border-[#CDE6FB] bg-[#F4F9FF] px-3.5 py-2.5 text-sm text-[#00245A] outline-none transition placeholder:text-[#00245A]/40 focus:border-[#00B2FC] focus:bg-white focus:ring-4 focus:ring-[#00B2FC]/15 disabled:opacity-60';

/**
 * Native <dialog> rendered outside the report's scoped styles. The browser keeps focus inside,
 * closes it on Esc and makes the page behind inert.
 */
function Dialog({ label, onClose, children }) {
    const ref = useRef(null);
    useEffect(() => {
        const dialog = ref.current;
        if (!dialog)
            return undefined;
        dialog.showModal();
        dialog.querySelector('input:not([disabled])')?.focus();
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
            if (dialog.open)
                dialog.close();
        };
    }, []);
    return createPortal(<dialog ref={ref} aria-label={label} onCancel={(event) => {
            event.preventDefault();
            onClose();
        }} onClick={(event) => {
            if (event.target === event.currentTarget)
                onClose();
        }} className="m-auto max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-visible bg-transparent p-0 font-sans text-[#00245A] backdrop:bg-[#00245A]/50 backdrop:backdrop-blur-sm">
      <div className="relative max-h-[calc(100svh-2rem)] overflow-y-auto rounded-[1.75rem] bg-white shadow-[0_40px_100px_-30px_rgba(0,36,90,0.6)]">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#F4F9FF] text-[#00245A]/70 transition hover:bg-[#EAF6FF] hover:text-[#00245A] focus-visible:outline-2 focus-visible:outline-[#00B2FC]">
          <span className="sr-only">Close</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        {children}
      </div>
    </dialog>, document.body);
}

function Spinner({ light = false }) {
    return <span aria-hidden="true" className={`inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 ${light ? 'border-white/40 border-t-white' : 'border-[#003BD9]/20 border-t-[#003BD9]'}`}/>;
}

/**
 * Picks up what the home banner handed over ({ method: 'number', udyam } or { method: 'pdf', file }),
 * shows its progress in a small status card, and verifies the visitor in a pop-up:
 * name, email and mobile, then the one-time code. Women's ownership is asked on the page, below the
 * Business details card (`women`, `onNeedOwnership`), and must be answered before the pop-up opens. The fetched record is then
 * handed to the page for payment.
 */
export default function UdyamVerification({ start, stage = 'start', women = null, onNeedOwnership, onStep, onRead, onVerified, onReport }) {
    const [method, setMethod] = useState(null);
    const [value, setValue] = useState('');
    const [extracted, setExtracted] = useState(null);
    const [reading, setReading] = useState(false);
    const [progress, setProgress] = useState('');
    // idle → checking (saved-report lookup) → ready (needs verification) → done
    const [step, setStep] = useState('idle');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalStep, setModalStep] = useState('form');
    const [form, setForm] = useState({ name: '', email: '', phone: '' });
    // Set when the visitor asked to verify before answering the ownership question
    const [awaitingOwnership, setAwaitingOwnership] = useState(false);
    const answered = women === true || women === false;
    const [challenge, setChallenge] = useState('');
    const [otp, setOtp] = useState('');
    const [devCode, setDevCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [fieldError, setFieldError] = useState('');
    const [error, setError] = useState({ message: '', reference: '' });
    const [doneMessage, setDoneMessage] = useState('');
    // Payment off: the record fetched for a Udyam number, shown in Business details until the
    // visitor answers the ownership question and opens the report
    const [fetched, setFetched] = useState(null);
    const abortRef = useRef(null);
    const requestSeq = useRef(0);
    const busy = useRef(false);
    const started = useRef(false);

    const setField = (key) => (event) => {
        const raw = event.target.value;
        setForm((current) => ({ ...current, [key]: key === 'phone' ? raw.replace(/\D/g, '').slice(0, 10) : raw }));
        if (key === 'phone') {
            setChallenge('');
            setDevCode('');
        }
        setFieldError('');
    };

    function openModal() {
        // Payment off: a typed number is fetched first, before the ownership question
        if (!PAYMENT_ENABLED && method === 'number' && !fetched) {
            setError({ message: '', reference: '' });
            finish('');
            return;
        }
        if (!answered) {
            setAwaitingOwnership(true);
            onNeedOwnership?.();
            return;
        }
        setFieldError('');
        setError({ message: '', reference: '' });
        if (!PAYMENT_ENABLED && fetched) {
            openReport(fetched, 'udyam');
            return;
        }
        if (!OTP_ENABLED) {
            finish('');
            return;
        }
        setModalStep(challenge ? 'code' : 'form');
        setModalOpen(true);
    }

    // Runs one request with a timeout; ignores the answer if a newer request has started
    async function request(url, body) {
        const seq = ++requestSeq.current;
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        busy.current = true;
        setLoading(true);
        const timer = setTimeout(() => ctrl.abort('timeout'), CLIENT_TIMEOUT_MS);
        try {
            const { res, payload } = await postJson(url, body, ctrl.signal);
            return { current: seq === requestSeq.current, res, payload };
        }
        catch {
            return { current: seq === requestSeq.current, failed: true, timedOut: ctrl.signal.aborted };
        }
        finally {
            clearTimeout(timer);
            if (seq === requestSeq.current) {
                busy.current = false;
                abortRef.current = null;
                setLoading(false);
            }
        }
    }

    const networkMessage = (timedOut, what) => (timedOut
        ? `${what} took too long. Please try again.`
        : 'We could not reach the server. Check your internet connection and try again.');

    async function startNumber(typed) {
        const check = checkUdyamNumber(typed);
        setMethod('number');
        if (!check.ok) {
            setError({ message: check.message, reference: '' });
            return;
        }
        setValue(check.value);
        setFetched(null);
        setStep('ready');
        // Payment off: fetch the record now, so Business details fill in straight away
        if (!PAYMENT_ENABLED) {
            finish('', { method: 'number', udyam: check.value });
            return;
        }
        // Opens straight away only when the ownership question is already answered
        if (answered)
            openModal();
    }

    async function readFile(file) {
        setMethod('pdf');
        setFetched(null);
        const seq = ++requestSeq.current;
        setExtracted(null);
        setReading(true);
        setProgress('Opening the certificate…');
        setError({ message: '', reference: '' });
        let record = null;
        try {
            const { readUdyamCertificate } = await import('../lib/read-certificate');
            record = await readUdyamCertificate(file, (msg) => {
                if (seq === requestSeq.current)
                    setProgress(msg);
            });
        }
        catch (err) {
            if (seq === requestSeq.current)
                setError({ message: err instanceof Error ? err.message : 'Could not read that PDF.', reference: '' });
        }
        finally {
            if (seq === requestSeq.current)
                setReading(false);
        }
        if (!record || seq !== requestSeq.current)
            return;
        setExtracted(record);
        if (record.udyam_number)
            onRead?.(record);
        if (!record.enterprise_name || record.enterprise_name.length < 2) {
            setError({ message: 'We found the Udyam number but not the business name. Upload a clearer PDF, or use the Udyam number instead.', reference: '' });
            return;
        }
        // Leaves the visitor to check the details card, then verify from the status card
        setStep('ready');
    }

    async function sendOtp(event) {
        event?.preventDefault();
        if (busy.current)
            return;
        const name = form.name.trim();
        const email = form.email.trim();
        if (name.length < 2)
            return setFieldError('Enter your name.');
        if (!EMAIL.test(email))
            return setFieldError('Enter a valid email address.');
        if (!PHONE.test(form.phone))
            return setFieldError('Enter a 10-digit Indian mobile number.');
        setFieldError('');
        setError({ message: '', reference: '' });
        // Mobile OTP switched off (features.js): go straight to fetching the record
        if (!OTP_ENABLED) {
            await finish('');
            return;
        }
        const { current, res, payload, failed, timedOut } = await request('/api/udyam/otp/send', { phone: form.phone });
        if (!current)
            return;
        if (payload?.ok && payload.challenge) {
            setChallenge(payload.challenge);
            setDevCode(typeof payload.dev_code === 'string' ? payload.dev_code : '');
            setOtp('');
            setModalStep('code');
            return;
        }
        setError({
            message: failed
                ? networkMessage(timedOut, 'Sending the code')
                : payload?.error?.message || (res?.status === 429 ? 'Too many requests right now. Please wait a minute and try again.' : 'The verification code could not be sent. Please try again.'),
            reference: '',
        });
    }

    async function confirmOtp(event) {
        event.preventDefault();
        if (busy.current)
            return;
        const code = otp.replace(/\D/g, '').slice(0, 6);
        if (!/^\d{6}$/.test(code))
            return setFieldError('Enter the 6-digit code.');
        setFieldError('');
        setError({ message: '', reference: '' });
        const verified = await request('/api/udyam/otp/verify', { phone: form.phone, otp: code, challenge });
        if (!verified.current)
            return;
        if (!(verified.payload?.ok && verified.payload.proof)) {
            setError({ message: verified.failed ? networkMessage(verified.timedOut, 'Checking the code') : verified.payload?.error?.message || 'That code could not be checked. Please try again.', reference: '' });
            return;
        }
        await finish(verified.payload.proof);
    }

    // Fetches (number) or seals (certificate) the record, now that the mobile is verified
    function openReport(data, source) {
        setModalOpen(false);
        setStep('done');
        setDoneMessage(`Report ready: ${data.enterprise_name || data.udyam_number}`);
        onReport?.({ data, women, source });
    }

    // `next` carries the method and number when called in the same click that set them
    async function finish(proof, next = {}) {
        const how = next.method ?? method;
        const details = { proof, women, name: form.name.trim(), email: form.email.trim(), phone: form.phone };
        const url = how === 'pdf' ? '/api/udyam/certificate' : '/api/udyam/verify';
        const body = how === 'pdf' ? { ...details, record: extracted } : { ...details, udyam: next.udyam ?? value };
        const { current, res, payload, failed, timedOut } = await request(url, body);
        if (!current)
            return;
        // Payment switched off: the server sends the record itself and the report opens
        if (payload?.ok && payload.data) {
            if (how === 'pdf' || answered) {
                openReport(payload.data, how === 'pdf' ? 'cert' : 'udyam');
                return;
            }
            // Fetched before the ownership question: fill Business details and wait for it
            setFetched(payload.data);
            onRead?.(payload.data, 'udyam');
            return;
        }
        if (payload?.ok && payload.preview && payload.sealed && payload.price) {
            setModalOpen(false);
            setStep('done');
            setDoneMessage(`Details fetched: ${payload.preview.enterprise_name || payload.preview.udyam_number}`);
            onVerified({
                preview: payload.preview,
                sealed: payload.sealed,
                price: payload.price,
                phone: form.phone,
                women,
                source: how === 'pdf' ? 'cert' : 'udyam',
                // The certificate's own details, so the Details card stays filled after a refresh
                ...(how === 'pdf' ? { details: extracted } : {}),
            });
            return;
        }
        setError({
            message: failed
                ? networkMessage(timedOut, 'The verification')
                : payload?.error?.message || (res?.status === 429 ? 'Too many verification requests right now. Please wait a minute and try again.' : 'Something went wrong while verifying. Please try again.'),
            reference: payload?.error?.reference && SHOW_REFERENCE.has(payload.error.code) ? payload.error.reference : '',
        });
    }

    // Answering the ownership question after asking to verify opens the pop-up
    useEffect(() => {
        if (awaitingOwnership && answered) {
            setAwaitingOwnership(false);
            openModal();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [awaitingOwnership, answered]);

    // The page's progress bar follows this flow
    useEffect(() => {
        onStep?.(modalOpen ? 'otp' : step);
    }, [modalOpen, step, onStep]);

    // Continue from the banner once
    useEffect(() => {
        if (!start || started.current)
            return;
        started.current = true;
        if (start.method === 'number')
            startNumber(start.udyam);
        else if (start.file)
            readFile(start.file);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [start]);

    // A number typed into the Business details card's "Udyam number" field starts the same
    // lookup as the home banner: Continue (or the ownership answer) then fetches it from Cashfree
    const [typed, setTyped] = useState('');
    useEffect(() => {
        const onInput = (event) => {
            if (event.target instanceof HTMLInputElement && event.target.id === 'f-urn')
                setTyped(event.target.value);
        };
        document.addEventListener('change', onInput);
        document.addEventListener('input', onInput);
        return () => {
            document.removeEventListener('change', onInput);
            document.removeEventListener('input', onInput);
        };
    }, []);
    useEffect(() => {
        const check = checkUdyamNumber(typed);
        if (!check.ok || check.value === value || busy.current || reading || step === 'done' || stage === 'pay' || stage === 'report')
            return;
        setError({ message: '', reference: '' });
        startNumber(check.value);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [typed]);

    const udyam = method === 'pdf' ? extracted?.udyam_number : value;
    const business = method === 'pdf' ? extracted?.enterprise_name : '';
    const maskedPhone = form.phone ? `+91 ${form.phone.slice(0, 2)}••••••${form.phone.slice(-2)}` : '';

    // ------------------------------------------------------------------ status card
    let body;
    // Back on the page with a payment pending or the report open, without a new hand-off
    const finished = step === 'done' || ((stage === 'pay' || stage === 'report') && !modalOpen);
    if (finished) {
        body = (<>
        {doneMessage ? <p className="uv__msg uv__msg--ok"><span>{doneMessage}</span></p> : null}
        <p className="uv-status__text">{stage === 'report' ? 'Your scheme report is open.' : (PAYMENT_ENABLED ? 'Complete the payment to open your report.' : 'Preparing your report…')}</p>
        <Link to="/" className="btn btn--ghost uv-status__cta">Check another business</Link>
      </>);
    }
    else if (reading) {
        body = <p className="uv-status__line"><Spinner />{progress || 'Reading the certificate…'}</p>;
    }
    else if (error.message && !modalOpen) {
        body = (<>
        <p className="uv__msg uv__msg--err" role="alert"><span>{error.message}</span>{error.reference ? <span className="uv__ref">Reference: {error.reference}</span> : null}</p>
        <div className="uv-status__actions">
          {step === 'ready' ? <button type="button" className="btn" onClick={openModal}>Try again</button> : null}
          <Link to="/" className="btn btn--ghost">Start again</Link>
        </div>
      </>);
    }
    else if (step === 'ready' && loading) {
        body = <p className="uv-status__line"><Spinner />{method === 'pdf' ? 'Preparing your report preview…' : 'Fetching your Udyam record…'}</p>;
    }
    else if (step === 'ready') {
        body = (<>
        <p className="uv-status__text">{method === 'pdf' || fetched ? `We filled in your business details. Check them, answer the ownership question below, then ${NEXT_STEP}.` : `Answer the ownership question below, then ${NEXT_STEP} to fetch your official Udyam record.`}</p>
        <button type="button" className="btn uv-status__cta" onClick={openModal}>{CONTINUE_LABEL}</button>
      </>);
    }
    else {
        body = <p className="uv-status__line"><Spinner />Getting things ready…</p>;
    }

    // Opened directly, with nothing from the home banner and no number typed yet: no status to show
    if (!start && !method && !finished)
        return null;

    return (<div className="card uv uv-status" id="card-udyam">
      <div className="card__head">
        <span className="card__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none"><path d="M6 4.5A1.5 1.5 0 0 1 7.5 3H14l4 4v12.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19.5zM14 3v4h4M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/></svg>
        </span>
        <div className="min-w-0">
          <h2>{udyam ? 'Your Udyam details' : finished ? 'Your report' : 'Start your report'}</h2>
          {udyam ? <p className="card__sub card__sub--tight uv-status__urn">{business ? `${business} · ` : ''}{udyam}</p> : null}
        </div>
      </div>
      <div className="uv-status__body" role="status" aria-live="polite">{body}</div>

      {modalOpen ? (<Dialog label={OTP_ENABLED ? 'Verify your mobile' : 'Your contact details'} onClose={() => setModalOpen(false)}>
          <div className="p-6 sm:p-7">
            {OTP_ENABLED ? (<p className="inline-flex items-center gap-2 rounded-full bg-[#EAF6FF] px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.18em] text-[#003BD9] uppercase">
                Step {modalStep === 'form' ? '1' : '2'} of 2
              </p>) : null}
            <h2 className={`${OTP_ENABLED ? 'mt-3' : ''} pr-10 text-xl font-semibold tracking-tight`}>{modalStep === 'form' ? 'Your contact details' : 'Enter the code'}</h2>
            <p className="mt-1 text-sm text-[#00245A]/60">
              {modalStep !== 'form'
                ? `We sent a 6-digit code to ${maskedPhone}.`
                : OTP_ENABLED
                    ? `We send a one-time code to your mobile${udyam ? ` to fetch the record for ${udyam}` : ''}.`
                    : `We use these for your report and the payment${udyam ? `, then fetch the record for ${udyam}` : ''}.`}
            </p>

            {modalStep === 'form' ? (<form className="mt-5 space-y-3.5" onSubmit={sendOtp} noValidate aria-busy={loading}>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold">Full name</span>
                  <input className={fieldClass} value={form.name} onChange={setField('name')} autoComplete="name" placeholder="Your name" disabled={loading}/>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold">Email ID</span>
                  <input className={fieldClass} type="email" value={form.email} onChange={setField('email')} autoComplete="email" placeholder="you@company.com" disabled={loading}/>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold">Mobile number</span>
                  <span className="flex items-stretch gap-2">
                    <span className="grid place-items-center rounded-xl bg-[#EAF6FF] px-3 text-sm font-semibold text-[#003BD9]">+91</span>
                    <input className={fieldClass} type="tel" inputMode="numeric" value={form.phone} onChange={setField('phone')} autoComplete="tel-national" maxLength={10} placeholder="10-digit mobile number" disabled={loading}/>
                  </span>
                </label>
                {fieldError ? <p className="text-sm font-medium text-[#C2261C]" role="alert">{fieldError}</p> : null}
                {error.message ? <p className="rounded-xl bg-[#FDECEA] px-3 py-2.5 text-sm font-medium text-[#C2261C]" role="alert">{error.message}</p> : null}
                <button type="submit" disabled={loading} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#00245A] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#003BD9] disabled:cursor-progress disabled:opacity-70">
                  {loading ? (<><Spinner light/>{OTP_ENABLED ? 'Sending code…' : 'Fetching your record…'}</>) : OTP_ENABLED ? 'Send verification code' : 'Continue'}
                </button>
                <p className="text-center text-[11.5px] text-[#00245A]/50">Your details are used only for this report and the payment.</p>
              </form>) : (<form className="mt-5 space-y-3.5" onSubmit={confirmOtp} noValidate aria-busy={loading}>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold">6-digit code</span>
                  <input className={`${fieldClass} text-center font-mono text-xl tracking-[0.5em]`} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => {
                    setOtp(event.target.value.replace(/\D/g, '').slice(0, 6));
                    setFieldError('');
                }} placeholder="••••••" disabled={loading}/>
                </label>
                {devCode ? <p className="text-xs text-[#00245A]/55">Local testing code: <span className="font-mono">{devCode}</span></p> : null}
                {fieldError ? <p className="text-sm font-medium text-[#C2261C]" role="alert">{fieldError}</p> : null}
                {error.message ? (<p className="rounded-xl bg-[#FDECEA] px-3 py-2.5 text-sm font-medium text-[#C2261C]" role="alert">
                    {error.message}
                    {error.reference ? <span className="mt-1 block font-mono text-xs opacity-70">Reference: {error.reference}</span> : null}
                  </p>) : null}
                <button type="submit" disabled={loading} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#00245A] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#003BD9] disabled:cursor-progress disabled:opacity-70">
                  {loading ? (<><Spinner light/>Verifying…</>) : 'Verify and continue'}
                </button>
                <div className="flex items-center justify-between text-sm">
                  <button type="button" onClick={() => {
                    setModalStep('form');
                    setFieldError('');
                    setError({ message: '', reference: '' });
                }} disabled={loading} className="cursor-pointer font-semibold text-[#003BD9] hover:text-[#00245A]">Change details</button>
                  <button type="button" onClick={sendOtp} disabled={loading} className="cursor-pointer font-semibold text-[#003BD9] hover:text-[#00245A]">Send a new code</button>
                </div>
              </form>)}
          </div>
        </Dialog>) : null}
    </div>);
}
