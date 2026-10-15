import { useEffect, useRef, useState } from 'react';
import { CERTIFICATE_PRICE_INR, UDYAM_NUMBER_PRICE_INR } from '../../../functions/udyam/src/udyam/prices.js';
import { checkUdyamNumber } from '../../../functions/udyam/src/udyam/validate.js';

const CLIENT_TIMEOUT_MS = 30_000;
const SHOW_REFERENCE = new Set(['SERVICE_UNAVAILABLE', 'UPSTREAM_ERROR', 'BAD_RESPONSE', 'TIMEOUT', 'NETWORK_ERROR', 'INTERNAL_ERROR']);
const PHONE = /^[6-9]\d{9}$/;

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

/**
 * Card 1: certificate PDF or Udyam number, then mobile OTP, then women's ownership.
 * `start` is what the home banner handed over ({ method: 'number', udyam } or { method: 'pdf', file }),
 * so the visitor continues from there instead of entering it again.
 */
export default function UdyamVerification({ start, stage = 'start', onStep, onRead, onVerified, onCached, onReset }) {
    const [method, setMethod] = useState(null);
    const [step, setStep] = useState('choose');
    const [value, setValue] = useState('');
    const [extracted, setExtracted] = useState(null);
    const [reading, setReading] = useState(false);
    const [progress, setProgress] = useState('');
    const [phone, setPhone] = useState('');
    const [challenge, setChallenge] = useState('');
    const [otp, setOtp] = useState('');
    const [devCode, setDevCode] = useState('');
    const [proof, setProof] = useState('');
    const [women, setWomen] = useState(null);
    const [phase, setPhase] = useState('idle');
    const [fieldError, setFieldError] = useState('');
    const [message, setMessage] = useState('');
    const [reference, setReference] = useState('');
    const inputRef = useRef(null);
    const abortRef = useRef(null);
    const requestSeq = useRef(0);
    const busy = useRef(false);
    const leadLookup = useRef(null);
    const started = useRef(false);

    function clearStatus() {
        setPhase('idle');
        setFieldError('');
        setMessage('');
        setReference('');
    }

    function pick(next) {
        requestSeq.current += 1;
        abortRef.current?.abort('reset');
        abortRef.current = null;
        busy.current = false;
        setMethod(next);
        setStep('details');
        setExtracted(null);
        setReading(false);
        setProgress('');
        setChallenge('');
        setOtp('');
        setDevCode('');
        setProof('');
        setWomen(null);
        clearStatus();
        onReset();
    }

    function reset() {
        requestSeq.current += 1;
        abortRef.current?.abort('reset');
        abortRef.current = null;
        busy.current = false;
        setMethod(null);
        setStep('choose');
        setValue('');
        setExtracted(null);
        setReading(false);
        setProgress('');
        setPhone('');
        setChallenge('');
        setOtp('');
        setDevCode('');
        setProof('');
        setWomen(null);
        clearStatus();
        onReset();
    }

    async function reuseIfSaved(udyam) {
        if (leadLookup.current?.udyam === udyam)
            return leadLookup.current.promise;
        const seq = ++requestSeq.current;
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setPhase('loading');
        busy.current = true;
        const promise = (async () => {
            const timer = setTimeout(() => ctrl.abort('timeout'), CLIENT_TIMEOUT_MS);
            try {
                const { payload } = await postJson('/api/udyam/lead', { udyam }, ctrl.signal);
                if (seq !== requestSeq.current)
                    return true;
                if (payload?.ok && payload.cached && payload.data) {
                    setPhase('success');
                    setStep('done');
                    setFieldError('');
                    setMessage(`Saved report: ${payload.data.enterprise_name || payload.data.udyam_number}`);
                    onCached?.({ data: payload.data, women: payload.women, source: payload.source });
                    return true;
                }
                setPhase('idle');
                return false;
            }
            catch {
                if (seq !== requestSeq.current)
                    return true;
                setPhase('idle');
                return false;
            }
            finally {
                clearTimeout(timer);
                if (seq === requestSeq.current) {
                    busy.current = false;
                    abortRef.current = null;
                }
                if (leadLookup.current?.seq === seq)
                    leadLookup.current = null;
            }
        })();
        leadLookup.current = { udyam, seq, promise };
        return promise;
    }

    async function continueNumber(e, typed = value) {
        e?.preventDefault();
        const check = checkUdyamNumber(typed);
        if (!check.ok) {
            setFieldError(check.message);
            setPhase('idle');
            inputRef.current?.focus();
            return;
        }
        setValue(check.value);
        clearStatus();
        const reused = await reuseIfSaved(check.value);
        if (!reused)
            setStep('otp');
    }

    async function continueCertificate(e) {
        e.preventDefault();
        if (!extracted?.udyam_number) {
            setFieldError('Upload the Udyam certificate PDF first.');
            return;
        }
        if (!extracted.enterprise_name || extracted.enterprise_name.length < 2) {
            setFieldError('We found the Udyam number but not the business name. Upload a clearer PDF, or enter the number instead.');
            return;
        }
        clearStatus();
        const reused = await reuseIfSaved(extracted.udyam_number);
        if (!reused)
            setStep('otp');
    }

    async function onFile(e) {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (file)
            await readFile(file);
    }

    async function readFile(file) {
        const seq = ++requestSeq.current;
        let lookupNumber = '';
        setExtracted(null);
        setReading(true);
        setProgress('Opening the certificate…');
        clearStatus();
        try {
            const { readUdyamCertificate } = await import('../lib/read-certificate');
            const record = await readUdyamCertificate(file, (msg) => {
                if (seq === requestSeq.current)
                    setProgress(msg);
            });
            if (seq !== requestSeq.current)
                return;
            setExtracted(record);
            if (record.udyam_number)
                onRead?.(record);
            if (!record.enterprise_name || record.enterprise_name.length < 2)
                setFieldError('We found the Udyam number but not the business name. Upload a clearer PDF, or enter the number instead.');
            if (record.udyam_number)
                lookupNumber = record.udyam_number;
        }
        catch (err) {
            if (seq !== requestSeq.current)
                return;
            setFieldError(err instanceof Error ? err.message : 'Could not read that PDF.');
        }
        finally {
            if (seq === requestSeq.current)
                setReading(false);
        }
        if (lookupNumber && seq === requestSeq.current)
            await reuseIfSaved(lookupNumber);
    }

    async function sendOtp(e) {
        e.preventDefault();
        if (busy.current)
            return;
        const mobile = phone.replace(/\D/g, '').slice(0, 10);
        if (!PHONE.test(mobile)) {
            setFieldError('Enter a 10-digit Indian mobile number.');
            return;
        }
        setPhone(mobile);
        clearStatus();
        setPhase('loading');
        busy.current = true;
        const seq = ++requestSeq.current;
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        const timer = setTimeout(() => ctrl.abort('timeout'), CLIENT_TIMEOUT_MS);
        try {
            const { res, payload } = await postJson('/api/udyam/otp/send', { phone: mobile }, ctrl.signal);
            if (seq !== requestSeq.current)
                return;
            if (payload?.ok && payload.challenge) {
                setChallenge(payload.challenge);
                setDevCode(typeof payload.dev_code === 'string' ? payload.dev_code : '');
                setOtp('');
                setProof('');
                setPhase('idle');
            }
            else {
                setPhase('error');
                setMessage(payload?.error?.message || (res.status === 429
                    ? 'Too many requests right now. Please wait a minute and try again.'
                    : 'The verification code could not be sent. Please try again.'));
            }
        }
        catch {
            if (seq !== requestSeq.current)
                return;
            setPhase('error');
            setMessage(ctrl.signal.aborted
                ? 'Sending the code took too long. Please try again.'
                : 'We could not reach the server. Check your internet connection and try again.');
        }
        finally {
            clearTimeout(timer);
            if (seq === requestSeq.current) {
                busy.current = false;
                abortRef.current = null;
            }
        }
    }

    async function confirmOtp(e) {
        e.preventDefault();
        if (busy.current)
            return;
        const code = otp.replace(/\D/g, '').slice(0, 6);
        if (!challenge) {
            setFieldError('Send a code to your mobile first.');
            return;
        }
        if (!/^\d{6}$/.test(code)) {
            setFieldError('Enter the 6-digit code.');
            return;
        }
        clearStatus();
        setPhase('loading');
        busy.current = true;
        const seq = ++requestSeq.current;
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        const timer = setTimeout(() => ctrl.abort('timeout'), CLIENT_TIMEOUT_MS);
        try {
            const { payload } = await postJson('/api/udyam/otp/verify', { phone, otp: code, challenge }, ctrl.signal);
            if (seq !== requestSeq.current)
                return;
            if (payload?.ok && payload.proof) {
                setProof(payload.proof);
                setPhase('idle');
                setStep('women');
            }
            else {
                setPhase('error');
                setMessage(payload?.error?.message || 'That code could not be checked. Please try again.');
            }
        }
        catch {
            if (seq !== requestSeq.current)
                return;
            setPhase('error');
            setMessage(ctrl.signal.aborted
                ? 'Checking the code took too long. Please try again.'
                : 'We could not reach the server. Check your internet connection and try again.');
        }
        finally {
            clearTimeout(timer);
            if (seq === requestSeq.current) {
                busy.current = false;
                abortRef.current = null;
            }
        }
    }

    async function finish(e) {
        e.preventDefault();
        if (busy.current)
            return;
        if (women !== true && women !== false) {
            setFieldError('Choose whether women hold 51% or less.');
            return;
        }
        clearStatus();
        setPhase('loading');
        busy.current = true;
        const seq = ++requestSeq.current;
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        const timer = setTimeout(() => ctrl.abort('timeout'), CLIENT_TIMEOUT_MS);
        const url = method === 'pdf' ? '/api/udyam/certificate' : '/api/udyam/verify';
        const body = method === 'pdf'
            ? { proof, record: extracted, women }
            : { udyam: value, proof, women };
        try {
            const { res, payload } = await postJson(url, body, ctrl.signal);
            if (seq !== requestSeq.current)
                return;
            if (payload?.ok && payload.cached && payload.data) {
                setPhase('success');
                setStep('done');
                setMessage(`Saved report: ${payload.data.enterprise_name || payload.data.udyam_number}`);
                onCached?.({ data: payload.data, women: payload.women, source: payload.source });
            }
            else if (payload?.ok && payload.preview && payload.sealed && payload.price) {
                setPhase('success');
                setStep('done');
                setMessage(`Details fetched: ${payload.preview.enterprise_name || payload.preview.udyam_number}`);
                onVerified({
                    preview: payload.preview,
                    sealed: payload.sealed,
                    price: payload.price,
                    phone,
                    women,
                    source: method === 'pdf' ? 'cert' : 'udyam',
                    // The certificate's own details, so the Details card stays filled after a refresh
                    ...(method === 'pdf' ? { details: extracted } : {}),
                });
            }
            else if (payload && !payload.ok && payload.error?.message) {
                setPhase('error');
                setMessage(payload.error.message);
                setReference(payload.error.reference && SHOW_REFERENCE.has(payload.error.code) ? payload.error.reference : '');
            }
            else {
                setPhase('error');
                setMessage(res.status === 429
                    ? 'Too many verification requests right now. Please wait a minute and try again.'
                    : 'Something went wrong while verifying. Please try again.');
            }
        }
        catch {
            if (seq !== requestSeq.current)
                return;
            setPhase('error');
            setMessage(ctrl.signal.aborted
                ? 'The verification took too long. Please try again.'
                : 'We could not reach the server. Check your internet connection and try again.');
        }
        finally {
            clearTimeout(timer);
            if (seq === requestSeq.current) {
                busy.current = false;
                abortRef.current = null;
            }
        }
    }

    // The page's progress bar follows this card's step
    useEffect(() => {
        onStep?.(step);
    }, [step, onStep]);

    // Continue from the banner once: open the chosen method and run its first step
    useEffect(() => {
        if (!start || started.current)
            return;
        started.current = true;
        pick(start.method);
        if (start.method === 'number') {
            setValue(start.udyam);
            continueNumber(null, start.udyam);
        }
        else if (start.file) {
            readFile(start.file);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [start]);

    const loading = phase === 'loading';
    const describedBy = ['udyam-help', fieldError ? 'udyam-error' : ''].filter(Boolean).join(' ');

    return (<div className="card uv" id="card-udyam">
      <div className="card__head">
        <span className="card__num">1</span>
        <div>
          <h2>{stage === 'report' ? 'Start a new report' : stage === 'pay' ? 'Details ready' : 'Start your report'}</h2>
          <p className="card__sub card__sub--tight">{stage === 'report'
            ? 'Check another business with Reset.'
            : stage === 'pay'
                ? 'Complete the payment to open your report.'
                : 'Choose how to share your Udyam details.'}</p>
        </div>
      </div>
      {/* <p className="card__sub">Enter an Udyam number (₹{UDYAM_NUMBER_PRICE_INR}) or upload the certificate (₹{CERTIFICATE_PRICE_INR}). A report saved in the last 90 days opens again without a new lookup.</p> */}


      {step === 'choose' || step === 'details' ? (<div className="uv-opts" role="group" aria-label="How to start">
        <button type="button" className="uv-opt" id="method-number" aria-pressed={method === 'number'} onClick={() => pick('number')}>
          <span className="uv-opt__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="12" rx="3" stroke="currentColor" strokeWidth="1.7"/><path d="M7 10h4M7 14h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
          </span>
          <span className="uv-opt__text">
            <strong>Udyam number</strong>
            <span>We fetch the official record after your mobile is verified.</span>
          </span>
          <span className="uv-opt__price">₹{UDYAM_NUMBER_PRICE_INR}</span>
        </button>
        <button type="button" className="uv-opt" id="method-pdf" aria-pressed={method === 'pdf'} onClick={() => pick('pdf')}>
          <span className="uv-opt__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none"><path d="M7 3h7l5 5v13H7z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M14 3v5h5M10 13h6M10 17h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
          <span className="uv-opt__text">
            <strong>Upload certificate</strong>
            <span>The PDF is read on this device, then you verify your mobile.</span>
          </span>
          <span className="uv-opt__price">₹{CERTIFICATE_PRICE_INR}</span>
        </button>
      </div>) : null}

      {step === 'details' && method === 'number' ? (<form className="uv__form" onSubmit={continueNumber} noValidate>
        <label className="uv__label" htmlFor="udyam-number">Udyam Registration Number</label>
        <input ref={inputRef} id="udyam-number" name="udyam" className="uv__input" type="text" inputMode="text" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={40} placeholder="UDYAM-XX-00-0000000" value={value} onChange={(e) => {
            setValue(e.target.value.toUpperCase());
            if (fieldError)
                setFieldError('');
        }} aria-invalid={fieldError ? true : undefined} aria-describedby={describedBy}/>
        <p className="uv__help" id="udyam-help">
          Format <span className="uv__code">UDYAM-XX-00-0000000</span>, for example <span className="uv__code">UDYAM-MH-26-0012345</span>.
        </p>
        {fieldError ? <p className="uv__field-error" id="udyam-error" role="alert">{fieldError}</p> : null}
        <div className="uv__actions">
          <button className="btn" type="submit" id="udyam-continue">Continue</button>
          <button className="btn btn--ghost" type="button" onClick={reset} id="udyam-reset">Reset</button>
        </div>
      </form>) : null}

      {step === 'details' && method === 'pdf' ? (<form className="uv__form" onSubmit={continueCertificate} noValidate>
        <label className="uv__label" htmlFor="certificate-file">Udyam certificate (PDF)</label>
        <input id="certificate-file" className="uv__input uv__file" type="file" accept="application/pdf,.pdf" onChange={onFile} disabled={reading}/>
        <p className="uv__help" id="udyam-help">The PDF stays on this device. We read the Udyam number, business name and other printed details.</p>
        {reading ? <p className="uv__msg uv__msg--info"><span className="spinner spinner--ink" aria-hidden="true"/>{progress || 'Reading the certificate…'}</p> : null}
        {extracted?.udyam_number ? (<p className="uv-readline">
            <strong>{extracted.enterprise_name || 'Certificate read'}</strong>
            <span>{extracted.udyam_number} · details filled in below</span>
          </p>) : null}
        {fieldError ? <p className="uv__field-error" id="udyam-error" role="alert">{fieldError}</p> : null}
        <div className="uv__actions">
          <button className="btn" type="submit" id="certificate-continue" disabled={reading || !extracted}>Continue</button>
          <button className="btn btn--ghost" type="button" onClick={reset} id="udyam-reset">Reset</button>
        </div>
      </form>) : null}

      {step === 'otp' ? (<form className="uv__form" onSubmit={challenge ? confirmOtp : sendOtp} noValidate aria-busy={loading}>
        <p className="uv__help" id="udyam-chosen">{method === 'number' ? value : extracted?.udyam_number}</p>
        <label className="uv__label" htmlFor="otp-phone">Mobile number</label>
        <input id="otp-phone" name="phone" className="uv__input" type="tel" inputMode="numeric" autoComplete="tel" maxLength={10} placeholder="10-digit mobile number" value={phone} onChange={(e) => {
            setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
            setChallenge('');
            setDevCode('');
            setProof('');
            if (fieldError)
                setFieldError('');
        }} disabled={loading}/>
        <p className="uv__help">We send a 6-digit code to this number. Cashfree also uses it for the payment.</p>
        {challenge ? (<>
          <label className="uv__label" htmlFor="otp-code">One-time code</label>
          <input id="otp-code" name="otp" className="uv__input" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} disabled={loading}/>
          {devCode ? <p className="uv__help">Local testing code: <span className="uv__code">{devCode}</span></p> : null}
        </>) : null}
        {fieldError ? <p className="uv__field-error" id="udyam-error" role="alert">{fieldError}</p> : null}
        <div className="uv__actions">
          {challenge
            ? <button className="btn" type="submit" id="otp-confirm" disabled={loading}>{loading ? 'Checking…' : 'Verify code'}</button>
            : <button className="btn" type="submit" id="otp-send" disabled={loading}>{loading ? 'Sending…' : 'Send code'}</button>}
          {challenge ? <button className="btn btn--ghost" type="button" onClick={sendOtp} disabled={loading}>Send a new code</button> : null}
          <button className="btn btn--ghost" type="button" onClick={() => { clearStatus(); setStep('details'); }} disabled={loading}>Back</button>
          <button className="btn btn--ghost" type="button" onClick={reset} id="udyam-reset">Reset</button>
        </div>
      </form>) : null}

      {step === 'women' ? (<form className="uv__form" id="uv-women-form" onSubmit={finish} noValidate aria-busy={loading}>
        <div className="q__label" id="q-women">Do women hold 51% of this business, or less?</div>
        <div className="uv-own" role="group" aria-labelledby="q-women">
          <button type="button" className="chip" id="women-51" aria-pressed={women === true} onClick={() => { setWomen(true); setFieldError(''); }}>Women hold 51% or more</button>
          <button type="button" className="chip" id="women-less" aria-pressed={women === false} onClick={() => { setWomen(false); setFieldError(''); }}>Less than 51%</button>
        </div>
        {fieldError ? <p className="uv__field-error" id="udyam-error" role="alert">{fieldError}</p> : null}
        <div className="uv__actions">
          <button className="btn" type="submit" id="udyam-fetch" disabled={loading}>
            {loading
                ? (<><span className="spinner" aria-hidden="true"/>{method === 'pdf' ? 'Preparing…' : 'Verifying…'}</>)
                : (method === 'pdf' ? 'Continue to payment' : 'Fetch Udyam record')}
          </button>
          <button className="btn btn--ghost" type="button" onClick={() => { clearStatus(); setStep('otp'); }} disabled={loading}>Back</button>
          <button className="btn btn--ghost" type="button" onClick={reset} id="udyam-reset">Reset</button>
        </div>
      </form>) : null}

      {step === 'done' ? (<div className="uv__actions">
        <button className="btn btn--ghost" type="button" onClick={reset} id="udyam-reset">Reset</button>
      </div>) : null}

      <div className="uv__status" role="status" aria-live="polite">
        {loading && step === 'women' ? <p className="uv__msg uv__msg--info"><span className="spinner spinner--ink" aria-hidden="true"/>{method === 'pdf' ? 'Preparing your report preview…' : 'Checking the Udyam record…'}</p> : null}
        {phase === 'success' ? (<p className="uv__msg uv__msg--ok">
            <span>{message}</span>
            {message.startsWith('Saved report') ? <a href="#report">See the report</a> : <a href="#udyam-preview">Pay to view the full report</a>}
          </p>) : null}
        {phase === 'error' ? (<p className="uv__msg uv__msg--err">
            <span>{message}</span>
            {reference ? <span className="uv__ref">Reference: {reference}</span> : null}
          </p>) : null}
      </div>
      <p className="uv__note">
        {method === 'pdf'
            ? 'The certificate is read in your browser. Payment opens in Cashfree, and the scheme report stays hidden until the payment succeeds.'
            : 'Your number is sent securely to our server, which checks it with Cashfree’s Udyam verification service after your mobile is verified.'}
      </p>
    </div>);
}