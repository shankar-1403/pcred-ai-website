import { parseCertificateLayout, parseCertificateText } from '../../../functions/udyam/src/udyam/parse-certificate.js';

const MAX_BYTES = 8 * 1024 * 1024;
// A full "Print Udyam Application" is 4 pages: certificate, then the application details
const MAX_PAGES = 4;

function localAsset(path) {
    return new URL(path, window.location.origin).href;
}

function linesFromItems(items) {
    const buckets = [];
    for (const item of items || []) {
        if (!item || typeof item.str !== 'string')
            continue;
        const text = item.str.replace(/\s+/g, ' ').trim();
        if (!text)
            continue;
        const x = item.transform?.[4] ?? 0;
        const y = item.transform?.[5] ?? 0;
        let bucket = buckets.find((row) => Math.abs(row.y - y) < 2.5);
        if (!bucket) {
            bucket = { y, parts: [] };
            buckets.push(bucket);
        }
        bucket.parts.push({ x, text });
    }
    buckets.sort((a, b) => b.y - a.y);
    for (const bucket of buckets)
        bucket.parts.sort((a, b) => a.x - b.x);
    return buckets;
}

async function linesFromPdf(doc, onProgress) {
    const lines = [];
    const pages = Math.min(doc.numPages, MAX_PAGES);
    for (let i = 1; i <= pages; i++) {
        onProgress?.(`Reading page ${i} of ${pages}…`);
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        lines.push(...linesFromItems(content.items));
    }
    return lines;
}

function hasDetails(record) {
    const address = record?.split_address || {};
    return Boolean(record?.enterprise_type || record?.major_activity || record?.organization_type || record?.social_category || record?.date_of_incorporation || record?.date_of_commencement || record?.date_of_udyam_registration || address.district || address.state || address.city || address.pincode || record?.nic_codes?.length);
}

/**
 * Reads the certificate PDF in the browser. A government certificate already contains text,
 * so that text is used first. A scanned PDF is read with Tesseract. The file is not uploaded.
 */
export async function readUdyamCertificate(file, onProgress) {
    if (!file)
        throw new Error('Choose the Udyam certificate PDF.');
    const name = String(file.name || '').toLowerCase();
    if ((file.type && file.type !== 'application/pdf') || (!file.type && !name.endsWith('.pdf')))
        throw new Error('Upload the Udyam certificate as a PDF.');
    if (file.size > MAX_BYTES)
        throw new Error('That PDF is larger than 8 MB. Upload the certificate only.');
    onProgress?.('Opening the certificate…');
    const pdfjs = await import('pdfjs-dist');
    const workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    const data = new Uint8Array(await file.arrayBuffer());
    let doc;
    try {
        doc = await pdfjs.getDocument({ data }).promise;
    }
    catch {
        throw new Error('This PDF could not be opened. If it is password-protected, upload an unlocked copy.');
    }
    onProgress?.('Reading the certificate…');
    try {
        const laidOut = parseCertificateLayout(await linesFromPdf(doc, onProgress));
        if (laidOut?.udyam_number && laidOut.enterprise_name && laidOut.enterprise_name.length >= 2 && hasDetails(laidOut)) {
            if (typeof doc.destroy === 'function')
                await doc.destroy();
            return laidOut;
        }
    }
    catch {
        /* A scanned certificate has no text layer. OCR below reads the page image. */
    }
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng', 1, {
        workerPath: localAsset('/ocr/worker.min.js'),
        workerBlobURL: false,
        corePath: localAsset('/ocr/tesseract-core-simd-lstm.js'),
        langPath: localAsset('/ocr'),
        logger(m) {
            if (m.status === 'recognizing text' && typeof m.progress === 'number')
                onProgress?.(`Reading the certificate… ${Math.round(m.progress * 100)}%`);
        },
    });
    let text = '';
    const lines = [];
    // Automatic page layout: the default single-block mode scrambles the bordered address table
    await worker.setParameters({ tessedit_pageseg_mode: '3' });
    try {
        const pages = Math.min(doc.numPages, MAX_PAGES);
        for (let i = 1; i <= pages; i++) {
            onProgress?.(`Reading page ${i} of ${pages}…`);
            const page = await doc.getPage(i);
            const viewport = page.getViewport({ scale: OCR_SCALE });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: context, viewport }).promise;
            sharpenForOcr(context, canvas.width, canvas.height);
            const recognized = await worker.recognize(canvas, {}, { text: true, blocks: true });
            text += `\n${recognized.data.text || ''}`;
            lines.push(...linesFromOcr(recognized.data.blocks, viewport.height / OCR_SCALE));
        }
    }
    finally {
        await worker.terminate();
        if (typeof doc.destroy === 'function')
            await doc.destroy();
    }
    // The word positions give the same table layout as a text PDF; plain text fills any gaps
    let laidOut = null;
    try {
        laidOut = parseCertificateLayout(lines);
    }
    catch {
        laidOut = null;
    }
    const record = mergeRecords(laidOut, parseCertificateText(text));
    if (!record)
        throw new Error('Could not find a Udyam Registration Number on this PDF. Upload a clearer certificate, or enter the number instead.');
    return record;
}

// OCR is run on the page drawn at this scale; positions are divided back to PDF points.
// 3x reads the small table text on scanned certificates that 2x misses.
const OCR_SCALE = 3;

/**
 * Greyscale with stretched contrast. Scanned certificates have shaded table headers and a
 * coloured "major activity" banner that OCR misreads in colour.
 */
function sharpenForOcr(context, width, height) {
    const image = context.getImageData(0, 0, width, height);
    const d = image.data;
    for (let i = 0; i < d.length; i += 4) {
        const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const v = g < 150 ? Math.max(0, (g - 60) * 1.6) : Math.min(255, 150 + (g - 150) * 1.8);
        d[i] = d[i + 1] = d[i + 2] = v;
    }
    context.putImageData(image, 0, 0);
}
// Words further apart than this (in points) belong to different table cells
const CELL_GAP = 4.5;
// A table label always starts its own cell, even when OCR places it right after a value
const LABEL_WORD = /^(District|City|Block|State|Mobile|Email:?)$/i;

/**
 * Turns Tesseract's words into the same positioned lines the PDF text layer gives:
 * words on one row are grouped by height, then joined into cells wherever they sit close together.
 */
function linesFromOcr(blocks, pageHeight) {
    const words = [];
    for (const block of blocks || []) {
        for (const paragraph of block.paragraphs || []) {
            for (const line of paragraph.lines || []) {
                for (const word of line.words || []) {
                    // Table borders come through as "|"; they are not text
                    const text = String(word.text || '').replace(/^[|[\]]+|[|[\]]+$/g, '').trim();
                    if (!text || word.confidence < 30)
                        continue;
                    // Lone low-confidence characters are specks on the scan, not text
                    if (text.length === 1 && !/\d/.test(text) && word.confidence < 70)
                        continue;
                    const b = word.bbox;
                    words.push({ text, x0: b.x0 / OCR_SCALE, x1: b.x1 / OCR_SCALE, y: pageHeight - b.y1 / OCR_SCALE });
                }
            }
        }
    }
    const rows = [];
    for (const word of words.sort((a, b) => b.y - a.y)) {
        let row = rows.find((r) => Math.abs(r.y - word.y) < 3);
        if (!row) {
            row = { y: word.y, words: [] };
            rows.push(row);
        }
        row.words.push(word);
    }
    return rows.map((row) => {
        const parts = [];
        for (const word of row.words.sort((a, b) => a.x0 - b.x0)) {
            const last = parts[parts.length - 1];
            if (last && word.x0 - last.x1 < CELL_GAP && !LABEL_WORD.test(word.text)) {
                last.text = `${last.text} ${word.text}`;
                last.x1 = word.x1;
            }
            else {
                parts.push({ x: word.x0, x1: word.x1, text: word.text });
            }
        }
        return { y: row.y, parts: parts.map(({ x, text }) => ({ x, text })) };
    });
}

const filled = (v) => (Array.isArray(v) ? v.length > 0 : v && typeof v === 'object' ? Object.values(v).some(filled) : Boolean(v));

/** Prefers the layout reading; anything it missed comes from the plain-text reading. */
function mergeRecords(primary, fallback) {
    if (!primary?.udyam_number)
        return fallback;
    if (!fallback)
        return primary;
    const out = { ...primary };
    for (const [key, value] of Object.entries(fallback)) {
        if (key === 'split_address') {
            const address = { ...(fallback.split_address || {}) };
            for (const [part, v] of Object.entries(primary.split_address || {}))
                if (filled(v)) address[part] = v;
            out.split_address = address;
        }
        else if (!filled(out[key]) && filled(value)) {
            out[key] = value;
        }
    }
    return out;
}
