import { CERTIFICATE_PRICE_INR, UDYAM_NUMBER_PRICE_INR } from '../../../functions/udyam/src/udyam/prices.js';

const FEATURES = [
    ['Schemes matched to you', 'Central, state, sector, export and startup schemes, ranked for you.', 'M4 6h16M4 12h10M4 18h7'],
    ['Why each one fits', 'Clear reasons for every match, and what is missing.', 'M5 12.5l4 4 10-10'],
    ['Documents and where to apply', 'The papers to keep ready and who to approach.', 'M7 3h7l5 5v13H7zM14 3v5h5'],
    ['A PDF to keep', 'Share the full report with your banker or CA.', 'M12 4v11m0 0-4-4m4 4 4-4M5 20h14'],
];

// Sample rows for the illustration only
const SAMPLE = [
    ['Credit guarantee for MSE loans', 'Strong match', 'yes'],
    ['State capital subsidy', 'Strong match', 'yes'],
    ['Export credit support', 'Worth checking', 'check'],
];

/** Top of the page before the report is unlocked: the promise, what the report shows, and a sample. */
export default function WhatYouGet() {
    return (<section className="wyg" aria-labelledby="wyg-title">
      <div className="wyg__copy">
        <p className="report-intro__eyebrow"><span>New</span>Scheme Discovery Report</p>
        <h1 id="wyg-title" className="wyg__headline">Find the government schemes <em>your business qualifies for</em></h1>
        <p className="wyg__lead">Share your Udyam details once. Your report shows:</p>
        <ul className="wyg__features">
          {FEATURES.map(([title, text, path]) => (<li key={title}>
              <span className="wyg__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none"><path d={path} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              <span><strong>{title}</strong><small>{text}</small></span>
            </li>))}
        </ul>
        <div className="wyg__foot">
          <dl className="wyg__prices">
            <div><dt>With Udyam number</dt><dd>₹{UDYAM_NUMBER_PRICE_INR}</dd></div>
            <div><dt>With certificate PDF</dt><dd>₹{CERTIFICATE_PRICE_INR}</dd></div>
          </dl>
          <p className="wyg__note">You pay only after we have your details and you have checked them. Rules are checked every month.</p>
        </div>
      </div>

      <div className="wyg__sample" aria-hidden="true">
        <div className="wyg__cover">
          <p className="wyg__eyebrow">Sample report</p>
          <p className="wyg__name">Your Business Name</p>
          <p className="wyg__meta"><span>UDYAM-XX-00-0000000</span><span>Micro</span><span>Manufacturing</span></p>
          <div className="wyg__tally">
            <span><b>12</b>Strong matches</span>
            <span><b>16</b>Worth checking</span>
            <span><b>3</b>Not a fit</span>
          </div>
        </div>
        <ul className="wyg__rows">
          {SAMPLE.map(([name, label, tone]) => (<li key={name}>
              <span className={`wyg__chip wyg__chip--${tone}`}>{label}</span>
              <span className="wyg__row-name">{name}</span>
              <span className="wyg__lines"><i/><i/></span>
            </li>))}
        </ul>
      </div>
    </section>);
}
