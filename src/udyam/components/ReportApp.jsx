import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import UdyamVerification from './UdyamVerification';
import UdyamDetails from './UdyamDetails';
import LockedPreview, { unlockPaidOrder } from './LockedPreview';
import { DETAILS_CARD_HTML, QUESTIONS_CARD_HTML } from './legacy-markup';
import { PAYMENT_ENABLED } from '../../../functions/udyam/src/udyam/features.js';
import { loadLiveSchemes } from '../lib/live-schemes';

const PREVIEW_KEY = 'pcred_udyam_preview';

// The page walks the visitor through four stages. Only what matters for the current stage is shown.
// With payment switched off (features.js) the Payment step is left out
const STAGES = [
    ['Your details', 'Udyam number or certificate'],
    ...(PAYMENT_ENABLED ? [['Payment', 'Secure, by Cashfree']] : []),
    ['Your report', 'Schemes matched to you'],
];


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
const OWNERSHIP_OPTIONS = [[true, 'Yes, 51% or more'], [false, 'No, less than 51%']];

// The "Tailor your report" card in the first step: only the ownership question. The help,
// credit and other questions (QuestionsCard) stay hidden until the report opens.
// The answer goes with the record fetch.
function OwnershipCard({ value, alert, fromRecord, onChange }) {
    return (<div className={`ownership${alert ? ' ownership--alert' : ''}`} id="card-ownership">
      <div className="card__head">
        <span className="card__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="16" cy="7" r="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="10" cy="17" r="2" stroke="currentColor" strokeWidth="1.8"/></svg>
        </span>
        <div>
          <h2>Tailor your report</h2>
          <p className="card__sub card__sub--tight">One quick question so the schemes fit the business.</p>
        </div>
      </div>
      <div className="q">
        <div className="q__label" id="ownership-q">Do women hold 51% or more of the business?</div>
        <div className="q__hint">{fromRecord ? 'Filled from your Udyam record: the proprietor is a woman.' : 'Some schemes give women-owned businesses extra support.'}</div>
        <div className="ownership__options" role="group" aria-labelledby="ownership-q">
          {OWNERSHIP_OPTIONS.map(([option, label]) => (<button key={label} type="button" aria-pressed={value === option} onClick={() => onChange(option)} className="ownership__option">
              {label}
            </button>))}
        </div>
        {alert ? <p className="ownership__alert" role="alert">Answer this to continue.</p> : null}
      </div>
    </div>);
}

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
    // Women's ownership, asked below the Business details card before mobile verification
    const [women, setWomen] = useState(null);
    // Set when the uploaded Udyam PDF names a woman proprietor
    const [womenFromRecord, setWomenFromRecord] = useState(false);
    const [ownershipAlert, setOwnershipAlert] = useState(false);
    const needOwnership = useCallback(() => {
        setOwnershipAlert(true);
        document.getElementById('card-ownership')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, []);
    const answerOwnership = useCallback((value) => {
        setWomen(value);
        setOwnershipAlert(false);
    }, []);
    const [verifyStep, setVerifyStep] = useState('choose');
    const engine = useRef(null);
    const queued = useRef(null);
    const applyRecord = useCallback((r, extra = {}) => {
        // Every report opened here is new (fetched or just paid for), so its PDF downloads too
        const opts = { source: extra.source, women: extra.women, autoDownload: true };
        if (engine.current)
            engine.current.applyUdyam(r, opts);
        else
            queued.current = { record: r, ...opts };
    }, []);
    useEffect(() => {
        let active = true;
        // The latest monthly scheme import from Firebase; the bundled data if it is slow or missing
        Promise.all([import('../report/engine'), loadLiveSchemes()])
            .then(([{ initReport }, live]) => {
            if (!active)
                return;
            const api = initReport(live);
            engine.current = api;
            const q = queued.current;
            queued.current = null;
            if (q) {
                if (q.record)
                    api.applyUdyam(q.record, { source: q.source, women: q.women, autoDownload: q.autoDownload });
                else if (q.details)
                    api.showDetails(q.details, { source: q.source ?? 'cert' });
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
    const showDetails = useCallback((details, source = 'cert') => {
        setHasDetails(true);
        // A woman proprietor owns the whole business, so the ownership answer is known; for
        // firms and companies the owner's gender does not settle the 51% question
        if (String(details?.owner_gender).toLowerCase() === 'female' && /propriet/i.test(String(details?.organization_type))) {
            setWomen((current) => (current === null ? true : current));
            setWomenFromRecord(true);
        }
        if (engine.current)
            engine.current.showDetails(details, { source });
        else
            queued.current = { details, source };
    }, []);
    useEffect(() => {
        const orderId = new URLSearchParams(window.location.search).get('order_id');
        // A new number or certificate from the banner starts over at "Your details": an older
        // unpaid preview kept in this tab must not jump the visitor to payment
        if (start && !orderId) {
            sessionStorage.removeItem(PREVIEW_KEY);
            return;
        }
        const pack = readStoredPreview();
        if (!pack)
            return;
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
    }, [applyRecord, navigate, showDetails, start]);
    // Payment switched off: the fetched record opens the report straight away
    const handleReport = useCallback((hit) => {
        sessionStorage.removeItem(PREVIEW_KEY);
        setReturnError('');
        setPreviewPack(null);
        setRecord(hit.data);
        applyRecord(hit.data, { source: hit.source, women: hit.women });
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

    // start → verify → pay → report
    const stage = record ? 'report' : previewPack ? 'pay' : verifyStep === 'otp' || verifyStep === 'women' ? 'verify' : 'start';
    // Mobile verification happens in a pop-up within "Your details", so it has no step of its own
    const current = { start: 0, verify: 0, pay: 1, report: STAGES.length - 1 }[stage];
    // The details card sits beside the start card from the beginning; at payment only when filled
    const showDetailsCard = stage !== 'pay' || hasDetails;
    const firstStep = stage === 'start' || stage === 'verify';

    return (<div className={`app app--${stage}`}>
      {/* The page opens straight on the steps; the heading is for screen readers */}
      <h1 className="sr">Udyam Scheme Discovery Report</h1>
      <Stepper current={current}/>
      <div className="flow">
        <aside className="flow__side" aria-label="Your details">
          <div className="flow__verify">
            <UdyamVerification start={start} stage={stage} women={women} onNeedOwnership={needOwnership} onStep={setVerifyStep} onRead={showDetails} onVerified={handleVerified} onReport={handleReport}/>
          </div>
          <div className="flow__details" hidden={!showDetailsCard || undefined}>
            <DetailsCard />
          </div>
          {/* In the first step this is one card: ownership, then what help and how much credit, so
              the report opens already tailored. Beside the report it is the engine's card alone. */}
          <div className={`flow__questions${firstStep ? ' card card--merged' : ''}`} hidden={stage === 'pay' || undefined}>
            {firstStep ? <OwnershipCard value={women} alert={ownershipAlert} fromRecord={womenFromRecord && women === true} onChange={answerOwnership}/> : null}
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
    </div>);
}
