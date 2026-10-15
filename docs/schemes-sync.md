# Scheme data sync (Scheme Report → Firebase)

The monthly **"Monthly scheme rule check"** routine (1st of the month, 08:52 IST) re-verifies the
Udyam Scheme Report artifact (https://claude.ai/artifact/HDXhXEeU3ARSkPzkNsDRMB) and republishes it.
Its last step sends the report's data to the `importSchemes` Cloud Function, which stores it in the
Realtime Database:

```
schemes/current            latest data (read by the CMS Schemes page; public read)
  meta                     statesChecked, extrasChecked, centralVerified, counts, month, importedAt, source
  central/{id}             21 central MSME schemes (the report's SCHEMES array)
  states/{code}            36 states and UTs (the report's data-states block)
  extras/{id}              ~63 sector, export and startup schemes (the data-extras block)
  watch[]                  announced / not-yet-launched schemes (the WATCH array)
schemes/history/{YYYY-MM}  full copy of each month's import
schemes/months/{YYYY-MM}   small index: counts, importedAt, statesChecked
```

Nobody can write `schemes/` through the database rules; only the function (Admin SDK) does.

## Pieces

| File | What it does |
| --- | --- |
| `functions/index.js` | `importSchemes` HTTPS function (asia-south1). Checks the `x-import-key` header, validates, writes current + history + months in one update. |
| `functions/schemes.js` | Validation: minimum counts, required fields, Firebase-safe keys, 2 MB limit, refuses a >25% shrink of any collection unless `force: true`. Tests: `cd functions && npm test`. |
| `scripts/schemes/build-payload.mjs` | Extracts the payload from the report HTML. |
| `scripts/schemes/import.mjs` | Builds and sends it (`--dry-run` to only check). |
| `src/components/admin/SchemesPanel.jsx` | CMS page at `/admin/schemes`. |

## One-time setup

1. **Blaze plan.** Cloud Functions need it (Firebase console › Usage and billing). Also needed for SMS OTP.
2. **Create the import key** — any long random string, kept private. Store it as a function secret:
   ```
   firebase functions:secrets:set SCHEMES_IMPORT_KEY
   ```
3. **Deploy the function and rules:**
   ```
   firebase deploy --only functions,database
   ```
4. **First import** from the current report (download its HTML, or use a saved copy):
   ```
   SCHEMES_IMPORT_KEY=<the key> node scripts/schemes/import.mjs <scheme-report.html>
   ```
   Then open `/admin/schemes` in the CMS.
5. **Add the step below to the routine** at claude.ai, replacing `<SCHEMES_IMPORT_KEY>` with the key.

## Step to add to the routine (after step 6, before the report to Rohan)

```text
7. Sync the data to the PCRED website database. Do this only if step 6 published successfully, using the exact edited file you published.
a. Save the script below as build-payload.mjs and run: node build-payload.mjs <edited file> --out payload.json
   It prints the counts (expect about 21 central, 36 states, 63 extras). If it throws, report the error to Rohan and skip the rest of this step.
b. Send it:
   node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('payload.json','utf8'));fetch('https://asia-south1-pcred-ai-website.cloudfunctions.net/importSchemes',{method:'POST',headers:{'content-type':'application/json','x-import-key':'<SCHEMES_IMPORT_KEY>'},body:JSON.stringify(p)}).then(r=>r.json()).then(j=>console.log(JSON.stringify(j)))"
c. A reply with "ok": true means it was stored; include the month and counts in your report.
   If the reply lists errors (for example a collection that would shrink by more than 25%), do not retry with force. Tell Rohan the errors so he can decide.
   Never print the import key in your report.

build-payload.mjs:
<paste the contents of scripts/schemes/build-payload.mjs here>
```

The routine then renumbers its final "Report to Rohan" step to 8.

## Changing the report's data format

If the report's data blocks change shape, update `build-payload.mjs` (and the copy in the routine)
and the validation in `functions/schemes.js`, then redeploy the function.
