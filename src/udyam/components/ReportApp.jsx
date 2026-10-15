import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import UdyamVerification from './UdyamVerification';
import UdyamDetails from './UdyamDetails';
import LockedPreview, { unlockPaidOrder } from './LockedPreview';
import WhatYouGet from './WhatYouGet';
import { DETAILS_CARD_HTML, QUESTIONS_CARD_HTML } from './legacy-markup';

const PREVIEW_KEY = 'pcred_udyam_preview';

// The page walks the visitor through four stages. Only what matters for the current stage is shown.
const STAGES = [
    ['Your details', 'Udyam number or certificate'],
    ['Verify mobile', 'One-time code by SMS'],
    ['Payment', 'Secure, by Cashfree'],
    ['Your report', 'Schemes matched to you'],
];

const Intro = memo(function Intro() {
    return (<header className="report-intro">
      <p className="report-intro__eyebrow"><span>New</span>Scheme Discovery Report</p>
      <h1 className="report-intro__title">Find the government schemes <em>your business qualifies for</em></h1>
      <p className="report-intro__sub">Share your Udyam details once. We match central, state, sector and export schemes to your business and explain each one.</p>
    </header>);
});

function Stepper({ current }) {
    return (<ol className="stepper" aria-label="Progress">
      {STAGES.map(([title, detail], index) => {
            const state = index < current ? 'done' : index === current ? 'current' : 'todo';
            return (<li key={title} className={`stepper__step is-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="stepper__dot" aria-hidden="true">{state === 'done' ? '✓' : index + 1}</span>
            <span className="stepper__text">
              <strong>{title}</strong>
              <small>{detail}</small>
            </span>
          </li>);
        })}
    </ol>);
}

// The report engine (src/udyam/report/engine.js) owns the markup in the memoised blocks below:
// it fills fields, wires buttons and renders the report by element id. React renders those
// blocks once and never re-renders them; they are shown or hidden around them, never unmounted.
const DetailsCard = memo(function DetailsCard() {
    return <div className="card" id="card-details" dangerouslySetInnerHTML={{ __html: DETAILS_CARD_HTML }}/>;
});
const QuestionsCard = memo(function QuestionsCard() {
    return <div className="card" id="card-questions" dangerouslySetInnerHTML={{ __html: QUESTIONS_CARD_HTML }}/>;
});
const ReportSection = memo(function ReportSection() {
    return (<section className="report" id="report" aria-live="polite" aria-label="Scheme report" dangerouslySetInnerHTML={{ __html: '<p class="report__loading">Preparing the scheme report…</p>' }}/>);
});

function readStoredPreview() {
    try {
        const raw = sessionStorage.getItem(PREVIEW_KEY);
        const pack = raw ? JSON.parse(raw) : null;
        if (pack?.preview && pack?.sealed && pack?.price)
            return pack;
    }
    catch { /* ignore a broken stored preview */ }
    return null;
}
// What the home banner handed over: { udyam } or { certificate: File }
function bannerStart(state) {
    if (typeof state?.udyam === 'string' && state.udyam)
        return { method: 'number', udyam: state.udyam };
    if (typeof File !== 'undefined' && state?.certificate instanceof File)
        return { method: 'pdf', file: state.certificate };
    return null;
}
export default function ReportApp() {
    const location = useLocation();
    const navigate = useNavigate();
    const [start] = useState(() => bannerStart(location.state));
    const [record, setRecord] = useState(null);
    const [previewPack, setPreviewPack] = useState(null);
    const [returnError, setReturnError] = useState('');
    const [hasDetails, setHasDetails] = useState(false);
    const [verifyStep, setVerifyStep] = useState('choose');
    const engine = useRef(null);
    const queued = useRef(null);
    const applyRecord = useCallback((r, extra = {}) => {
        const opts = { source: extra.source, women: extra.women };
        if (engine.current)
            engine.current.applyUdyam(r, opts);
        else
            queued.current = { record: r, source: opts.source, women: opts.women };
    }, []);
    useEffect(() => {
        let active = true;
        import('../report/engine')
            .then(({ initReport }) => {
            if (!active)
                return;
            const api = initReport();
            engine.current = api;
            const q = queued.current;
            queued.current = null;
            if (q) {
                if (q.record)
                    api.applyUdyam(q.record, { source: q.source, women: q.women });
                else if (q.details)
                    api.showDetails(q.details, { source: 'cert' });
                else
                    api.resetToSample();
            }
        })
            .catch((err) => console.error('The scheme report could not be loaded', err));
        return () => {
            active = false;
        };
    }, []);
    // The banner's hand-off is used once; drop it so a refresh starts clean
    useEffect(() => {
        if (start)
            navigate('/report', { replace: true, state: null });
    }, [start, navigate]);
    // Certificate details (read on this device) go into the Details card before payment
    const showDetails = useCallback((details) => {
        setHasDetails(true);
        if (engine.current)
            engine.current.showDetails(details, { source: 'cert' });
        else
            queued.current = { details };
    }, []);
    useEffect(() => {
        const pack = readStoredPreview();
        if (!pack)
            return;
        const orderId = new URLSearchParams(window.location.search).get('order_id');
        if (!orderId) {
            setPreviewPack(pack);
            if (pack.details)
                showDetails(pack.details);
            return;
        }
        let active = true;
        unlockPaidOrder(orderId, pack.sealed)
            .then((r) => {
            if (!active)
                return;
            sessionStorage.removeItem(PREVIEW_KEY);
            navigate('/report', { replace: true });
            setRecord(r);
            applyRecord(r, pack);
        })
            .catch((err) => {
            if (!active)
                return;
            setPreviewPack(pack);
            if (pack.details)
                showDetails(pack.details);
            setReturnError(err instanceof Error ? err.message : 'Payment could not be confirmed.');
        });
        return () => {
            active = false;
        };
    }, [applyRecord, navigate, showDetails]);
    const handleCached = useCallback((hit) => {
        sessionStorage.removeItem(PREVIEW_KEY);
        setReturnError('');
        setPreviewPack(null);
        setRecord(hit.data);
        applyRecord(hit.data, {
            source: hit.source === 'certificate' ? 'cert' : 'udyam',
            women: hit.women,
        });
    }, [applyRecord]);
    const handleVerified = useCallback((pack) => {
        setRecord(null);
        setReturnError('');
        setPreviewPack(pack);
        try {
            sessionStorage.setItem(PREVIEW_KEY, JSON.stringify(pack));
        }
        catch { /* the preview still works until the page is refreshed */ }
        if (pack.details)
            showDetails(pack.details);
        else if (engine.current)
            engine.current.resetToSample();
        else
            queued.current = { record: null };
    }, [showDetails]);
    const handlePaid = useCallback((r) => {
        const extra = { source: previewPack?.source, women: previewPack?.women };
        sessionStorage.removeItem(PREVIEW_KEY);
        setReturnError('');
        setPreviewPack(null);
        setRecord(r);
        applyRecord(r, extra);
    }, [applyRecord, previewPack]);
    const handleReset = useCallback(() => {
        sessionStorage.removeItem(PREVIEW_KEY);
        setRecord(null);
        setPreviewPack(null);
        setReturnError('');
        setHasDetails(false);
        if (engine.current)
            engine.current.resetToSample();
        else
            queued.current = { record: null };
    }, []);

    // start → verify → pay → report
    const stage = record ? 'report' : previewPack ? 'pay' : verifyStep === 'otp' || verifyStep === 'women' ? 'verify' : 'start';
    const current = { start: 0, verify: 1, pay: 2, report: 3 }[stage];
    // The details card sits beside the start card from the beginning; at payment only when filled
    const showDetailsCard = stage !== 'pay' || hasDetails;
    const starting = stage === 'start' || stage === 'verify';

    return (<div className={`app app--${stage}`}>
      {starting ? <WhatYouGet /> : stage === 'pay' ? <Intro /> : null}
      <Stepper current={current}/>
      <div className="flow">
        <aside className="flow__side" aria-label="Your details">
          <div className="flow__verify">
            <UdyamVerification start={start} stage={stage} onStep={setVerifyStep} onRead={showDetails} onVerified={handleVerified} onCached={handleCached} onReset={handleReset}/>
          </div>
          <div className="flow__details" hidden={!showDetailsCard || undefined}>
            <DetailsCard />
          </div>
          <div className="flow__questions" hidden={stage !== 'report' || undefined}>
            <QuestionsCard />
          </div>
        </aside>
        <div className="flow__main">
          {stage === 'pay' ? <LockedPreview pack={previewPack} onPaid={handlePaid}/> : null}
          {stage === 'pay' && returnError ? <p className="uv__msg uv__msg--err" role="alert">{returnError}</p> : null}
          <div hidden={stage !== 'report' || undefined}>
            <ReportSection />
          </div>
          {record ? <UdyamDetails key={record.verification_id || record.udyam_number} record={record}/> : null}
        </div>
      </div>
      <p className="report-foot">An independent PCRED tool, not affiliated with the Ministry of MSME or any government body. Check every scheme with the bank or agency before you apply.</p>
    </div>);
}
