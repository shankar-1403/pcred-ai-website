# Udyam Scheme Report (moved from pcred-udyam-system)

The Udyam number lookup and the certificate upload from the separate **pcred-udyam-system** project now
run inside this website. The home banner starts the flow and `/report` finishes it:

```
Banner (Home)                     /report                                         udyamVerify (Cloud Function, asia-south1)
  Udyam number ₹699  ──navigate──►  saved report? → mobile OTP → women's ownership   POST /api/udyam/lead · otp/send · otp/verify
  Certificate PDF ₹499              → locked preview → Cashfree payment → report      POST /api/udyam/verify (Cashfree Udyam lookup)
                                                                                      POST /api/udyam/certificate (sealed, no lookup)
                                                                                      POST /api/udyam/checkout · unlock (Cashfree PG)
```

* A **Udyam number** is looked up with the Cashfree Verification Suite after the mobile is verified.
* A **certificate PDF** is read in the browser (pdf.js, then Tesseract OCR for scans). The file is never uploaded.
* The full record stays encrypted ("sealed") until Cashfree reports the order as paid. Payment returns to
  `/report?order_id=...`.
* Every fetched record is saved under `leads/` in the Realtime Database. The same Udyam number opens the saved
  report for 90 days without another paid lookup, and `deactivateLeads` (daily) marks older leads inactive.

## Where the code is

| Path | What it is |
| --- | --- |
| `functions/udyam/` | The backend, copied unchanged except the payment return URL (`/report`) and the fallback domain. `functions/index.js` re-exports `udyamVerify` and `deactivateLeads`. |
| `functions/udyam/test/` | 80 unit tests (Vitest). `cd functions && npm test` runs them with the scheme-sync tests. |
| `src/pages/Report.jsx` | The `/report` page (lazy-loaded, with its fonts and styles). |
| `src/udyam/components/` | The page shell and progress steps (`ReportApp`), verification card, "What your report shows" panel, locked preview and payment, and Udyam details. |
| `src/udyam/report/engine.js` | The scheme rules, report and PDF export (unchanged apart from remount support). |
| `src/udyam/styles/report.css`, `report-theme.css` | The report's styles scoped to `.udyam-app`, and the website theme and page layout on top of them. |
| `public/ocr/`, `public/brand/` | Tesseract files (served locally) and the logos used in the PDF. |

Validation, prices and certificate parsing are shared by both sides: the front end imports them
straight from `functions/udyam/src/udyam`. Prices: `functions/udyam/src/payments/price.js`.

## Setup in the pcred-ai-website project

1. **Secrets.** The same values as in the pcred-udyam-system project:
   ```
   firebase functions:secrets:set CASHFREE_CLIENT_ID
   firebase functions:secrets:set CASHFREE_CLIENT_SECRET
   firebase functions:secrets:set CASHFREE_PUBLIC_KEY --data-file cashfree_public_key.pem
   firebase functions:secrets:set CASHFREE_PG_CLIENT_ID
   firebase functions:secrets:set CASHFREE_PG_CLIENT_SECRET
   firebase functions:secrets:set FAST2SMS_API_KEY
   ```
   To copy one across without displaying it:
   `firebase functions:secrets:access CASHFREE_CLIENT_ID --project pcred-udyam-system | firebase functions:secrets:set CASHFREE_CLIENT_ID --project pcred-ai-website --data-file -`
2. **Cashfree Payment Gateway:** whitelist the website's domain (Developers → Whitelisting) so the payment
   return to `https://<site>/report` is accepted.
3. **Deploy:** `npm run build && firebase deploy --only functions,database,hosting`
4. **Test** on the live site with a real Udyam number. Each lookup and payment is real and billed.

## Local development

`npm run dev` proxies `/api/udyam/*` to the functions emulator
(`firebase emulators:start --only functions,database`, which needs Java 21 for the database emulator).
Put dummy or real values in `functions/.secret.local` (git-ignored). The emulator returns the OTP in the
response, so no SMS is sent.
