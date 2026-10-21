import { UDYAM_PATTERN } from './validate.js';

function section(text, start, end) {
    const m = new RegExp(start, 'i').exec(text);
    if (!m)
        return '';
    const rest = text.slice(m.index + m[0].length);
    const stop = new RegExp(end, 'i').exec(rest);
    return (stop ? rest.slice(0, stop.index) : rest.slice(0, 600)).trim();
}

function firstLine(block) {
    const lines = block.split('\n').map((s) => s.replace(/\s+/g, ' ').trim()).filter((s) => s && !/^(UDYAM|NAME OF|TYPE OF|MAJOR |SOCIAL |SNO\.?\b|S\.?\s*NO\b|CLASSIFICATION )/i.test(s));
    return lines.slice(0, 3).join(' ').slice(0, 160);
}

function labeled(block, label) {
    const m = new RegExp(`${label}\\s*[:.-]?\\s*([^\\n]*)`, 'i').exec(block);
    if (!m)
        return '';
    let value = m[1].trim();
    if (!value) {
        const rest = block.slice(m.index + m[0].length);
        value = rest.split('\n').map((s) => s.trim()).find(Boolean) || '';
    }
    return value.replace(/\s+/g, ' ').slice(0, 80);
}

function word(block, pattern) {
    const m = pattern.exec(block);
    if (!m)
        return '';
    const w = m[1].toLowerCase();
    return w.charAt(0).toUpperCase() + w.slice(1);
}

function dateAfter(text, label) {
    const block = section(text, label, 'DATE OF|NATIONAL INDUSTRY|TYPE OF ORGAN|DIC |NAME OF UNIT|OFFICI?AL ADDRESS');
    const m = /(\d{1,2})\s*[\/.-]\s*(\d{1,2})\s*[\/.-]\s*(\d{4})/.exec(block);
    return m ? `${m[1].padStart(2, '0')}/${m[2].padStart(2, '0')}/${m[3]}` : '';
}

/** Pulls a Udyam number out of OCR text, including a few common misreads (O for 0). */
export function extractUdyamNumber(text) {
    const spaced = String(text || '').toUpperCase().replace(/[‐-―−]/g, '-').replace(/[ \t]+/g, ' ');
    const m = /UDYAM[\s-]*([A-Z0-9]{2})[\s-]*([0-9OIL]{2})[\s-]*([0-9OIL]{7})/.exec(spaced);
    if (!m)
        return '';
    const state = m[1].replace(/0/g, 'O').replace(/1/g, 'I');
    const dist = m[2].replace(/O/g, '0').replace(/I/g, '1').replace(/L/g, '1');
    const serial = m[3].replace(/O/g, '0').replace(/I/g, '1').replace(/L/g, '1');
    const value = `UDYAM-${state}-${dist}-${serial}`;
    return UDYAM_PATTERN.test(value) ? value : '';
}

function nicCodes(text) {
    const block = section(text, 'NATIONAL INDUSTRY CLASSIFICATION', 'DATE OF UDYAM|TYPE OF ORGAN|DIC |DECLARATION');
    const out = [];
    const re = /NIC\s*5\s*Digit\s*(\d{5})\s*([^\n]*)/gi;
    let m;
    while ((m = re.exec(block))) {
        if (out.some((x) => x.nic_5_digit === m[1]))
            continue;
        out.push({
            nic_5_digit: m[1],
            nic_5_description: m[2].replace(/\s+/g, ' ').trim().slice(0, 160),
            activity: '',
        });
    }
    return out.slice(0, 20);
}

/**
 * Reads the fields a Udyam Registration Certificate usually prints.
 * Returns null when no Udyam number is present.
 */
// The name can run into the classification table below it ("… LIMITED * 1 2024-25 Micro 27/04/2024")
function cleanEnterpriseName(value) {
    return String(value || '')
        .replace(/\s*\*?\s*\b\d{1,2}\s+\d{4}\s*[-–]\s*\d{2,4}\b.*$/, '')
        .replace(/\s*\*\s*$/, '')
        .trim();
}

export function parseCertificateText(text) {
    const source = String(text || '').replace(/\r/g, '\n');
    const udyam = extractUdyamNumber(source);
    if (!udyam)
        return null;
    const addressBlock = section(source, 'OFFICI?AL ADDRESS OF ENTERPRISE', 'DATE OF INCORPORATION|DATE OF COMMENCEMENT|DATE OF UDYAM|NATIONAL INDUSTRY');
    const pin = labeled(addressBlock, 'Pin(?:code)?').replace(/\D/g, '').slice(0, 6);
    const orgBlock = section(source, 'TYPE OF ORGANIS(?:ATION|ZATION)', 'DATE OF|NATIONAL INDUSTRY|DIC |OFFICI?AL ADDRESS|NAME OF');
    const orgLine = firstLine(orgBlock);
    const orgFallback = /\b(Proprietary|Partnership|Private Limited Company|Limited Liability Partnership|Hindu Undivided Family|Public Limited Company|Co-operative Society|Society|Trust)\b/i.exec(source);
    const fy = /FY\s*(\d{4}\s*[-–]\s*\d{2,4})/i.exec(source);
    return {
        udyam_number: udyam,
        enterprise_name: cleanEnterpriseName(firstLine(section(source, 'NAME OF ENTERPRISE', 'TYPE OF ENTERPRISE|MAJOR ACTIVITY|SOCIAL CATEGORY|NAME OF UNIT|SNO'))),
        enterprise_type: word(section(source, 'TYPE OF ENTERPRISE', 'MAJOR ACTIVITY|SOCIAL CATEGORY|NAME OF UNIT|OFFICI?AL ADDRESS'), /\b(MICRO|SMALL|MEDIUM)\b/i),
        major_activity: word(section(source, 'MAJOR ACTIVITY', 'SOCIAL CATEGORY|NAME OF UNIT|OFFICI?AL ADDRESS|TYPE OF'), /\b(MANUFACTURING|SERVICES|TRADING)\b/i),
        social_category: (/\b(GENERAL|OBC|SC|ST|SCHEDULED CASTE|SCHEDULED TRIBE)\b/i.exec(section(source, 'SOCIAL CATEGORY', 'NAME OF UNIT|OFFICI?AL ADDRESS|MAJOR ACTIVITY|TYPE OF')) || [])[1]?.toUpperCase() || '',
        organization_type: orgLine || (orgFallback ? orgFallback[1] : ''),
        date_of_incorporation: dateAfter(source, 'DATE OF INCORPORATION'),
        date_of_commencement: dateAfter(source, 'DATE OF COMMENCEMENT'),
        date_of_udyam_registration: dateAfter(source, 'DATE OF UDYAM REGISTRATION'),
        classification_year: fy ? fy[1].replace(/\s+/g, '') : '',
        split_address: {
            flat: labeled(addressBlock, 'Flat\\s*/\\s*Door\\s*/\\s*Block\\s*No\\.?'),
            building: labeled(addressBlock, 'Name of Premises\\s*/\\s*Building'),
            street: labeled(addressBlock, 'Road\\s*/\\s*Street\\s*/\\s*Lane'),
            city: labeled(addressBlock, 'City'),
            district: labeled(addressBlock, 'District'),
            state: labeled(addressBlock, 'State'),
            pincode: pin.length === 6 ? pin : '',
        },
        nic_codes: nicCodes(source),
    };
}

function lineText(line) {
    return (line?.parts || []).map((part) => part.text).join(' ');
}

function titleWord(value) {
    const m = /\b(MICRO|SMALL|MEDIUM|MANUFACTURING|SERVICES|TRADING)\b/i.exec(value || '');
    if (!m)
        return '';
    const w = m[1].toLowerCase();
    return w.charAt(0).toUpperCase() + w.slice(1);
}

/** Puts each value under the header whose left edge is closest on its left. */
function assignColumns(headers, values) {
    const cells = [...headers].sort((a, b) => a.x - b.x).map((header) => ({ ...header, value: '' }));
    for (const value of [...values].sort((a, b) => a.x - b.x)) {
        let index = 0;
        for (let i = 0; i < cells.length; i++) {
            if (value.x + 6 >= cells[i].x)
                index = i;
        }
        if (!cells.length)
            continue;
        cells[index].value = cells[index].value ? `${cells[index].value} ${value.text}` : value.text;
    }
    return cells;
}

/** Text to the right of a label on the same row ("NAME OF ENTERPRISE   M/S EXAMPLE PVT LTD"). */
function sameLineValue(lines, labelTest) {
    for (const line of lines) {
        const index = line.parts.findIndex((part) => labelTest.test(part.text));
        if (index < 0)
            continue;
        const label = line.parts[index];
        const value = line.parts.filter((part) => part.x > label.x && part !== label).map((part) => part.text).join(' ').replace(/\s+/g, ' ').trim();
        if (value)
            return value;
    }
    return '';
}

function columnValue(lines, headerTest) {
    for (let i = 0; i < lines.length - 1; i++) {
        if (!lines[i].parts.some((part) => headerTest.test(part.text)))
            continue;
        const next = lines.slice(i + 1).find((line) => line.parts?.length);
        if (!next)
            return '';
        const cell = assignColumns(lines[i].parts, next.parts).find((item) => headerTest.test(item.text));
        if (cell?.value)
            return cell.value.replace(/\s+/g, ' ').trim();
    }
    return '';
}

function headerKey(text) {
    const t = text.toLowerCase();
    if (/flat\s*\/\s*door/.test(t))
        return 'flat';
    if (/premises|building/.test(t))
        return 'building';
    if (/road\s*\/\s*street|\blane\b/.test(t))
        return 'street';
    if (/^city\b/.test(t))
        return 'city';
    if (/^state\b/.test(t))
        return 'state';
    if (/^district\b/.test(t))
        return 'district';
    if (/^pin/.test(t))
        return 'pincode';
    return '';
}

function addressTable(lines) {
    const index = lines.findIndex((line) => {
        const text = lineText(line);
        return /flat\s*\/\s*door/i.test(text) && /district/i.test(text) && /\bpin/i.test(text);
    });
    if (index < 0)
        return null;
    const next = lines.slice(index + 1).find((line) => line.parts?.length && !/date of|national industry/i.test(lineText(line)));
    if (!next)
        return null;
    const address = {};
    for (const cell of assignColumns(lines[index].parts, next.parts)) {
        const key = headerKey(cell.text);
        if (!key || !cell.value)
            continue;
        address[key] = key === 'pincode' ? cell.value.replace(/\D/g, '').slice(0, 6) : cell.value.replace(/\s+/g, ' ').trim().slice(0, 80);
    }
    return address;
}

function nicTable(lines) {
    const start = lines.findIndex((line) => line.parts.some((part) => /nic\s*5\s*digit/i.test(part.text)));
    if (start < 0)
        return [];
    const out = [];
    for (const line of lines.slice(start + 1, start + 30)) {
        const joined = lineText(line);
        if (/date of udyam|type of organ|declaration/i.test(joined))
            break;
        const cell = assignColumns(lines[start].parts, line.parts).find((item) => /nic\s*5\s*digit/i.test(item.text));
        const match = /(\d{5})\s*[-–:]?\s*(.*)/.exec(cell?.value || '');
        if (!match || out.some((item) => item.nic_5_digit === match[1]))
            continue;
        out.push({
            nic_5_digit: match[1],
            nic_5_description: match[2].replace(/\s+/g, ' ').trim().slice(0, 160),
            activity: '',
        });
    }
    return out.slice(0, 20);
}

const NIC_LEVELS = [
    ['5', /^(\d{5})\b\s*[-–:]?\s*(.*)$/],
    ['4', /^(\d{4})\b\s*[-–:]?\s*(.*)$/],
    ['2', /^(\d{2})\s*[-–:]\s*(.*)$/],
];

/**
 * NIC table where the codes do not line up with their headers (the portal centres headers over
 * left-aligned values) and descriptions wrap onto following lines. A row starts at a 5-digit code;
 * each wrapped line is joined to the column it sits under.
 */
const ACTIVITY_WORD = /^(manufactur\w*|services?|trading)$/i;

function nicRows(lines) {
    let start = lines.findIndex((line) => line.parts.some((part) => /nic\s*5\s*digit/i.test(part.text)));
    if (start < 0) {
        // OCR often loses the shaded header row: start just above the first row that has both a
        // 4-digit and a 5-digit code
        const first = lines.findIndex((line) => line.parts.some((p) => /^\d{5}\b/.test(p.text)) && line.parts.some((p) => /^\d{4}\b(?!\d)/.test(p.text)));
        if (first < 0)
            return [];
        start = first - 1;
    }
    const header = lines[start] || { parts: [] };
    const activityX = header.parts.find((part) => /^activity/i.test(part.text))?.x ?? Infinity;
    // Without a header, the activity is the right-most cell of a row, after the 5-digit code
    const isActivity = (part, row) => ACTIVITY_WORD.test(part.text) && (part.x >= activityX - 15 || (row && row.columns.some((col) => col.level === '5' && part.x > col.x + 30)));
    const out = [];
    let row = null;
    for (const line of lines.slice(start + 1, start + 60)) {
        if (/date of udyam|date of commencement|type of organ|declaration/i.test(lineText(line)))
            break;
        if (line.parts.some((part) => NIC_LEVELS[0][1].test(part.text))) {
            row = { columns: [], activity: '' };
            out.push(row);
            const rest = [];
            for (const part of line.parts) {
                const level = NIC_LEVELS.find(([, re]) => re.test(part.text));
                if (!level) {
                    rest.push(part);
                    continue;
                }
                const m = level[1].exec(part.text);
                row.columns.push({ level: level[0], x: part.x, code: m[1], description: m[2] });
            }
            const activity = rest.find((part) => isActivity(part, row));
            if (activity)
                row.activity = activity.text;
            continue;
        }
        if (!row)
            continue;
        for (const part of line.parts) {
            if (!row.activity && isActivity(part, row)) {
                row.activity = part.text;
                continue;
            }
            const column = row.columns.find((col) => Math.abs(col.x - part.x) <= 8);
            if (column)
                column.description = `${column.description} ${part.text}`;
        }
    }
    const clean = (s) => String(s || '').replace(/\s+/g, ' ').replace(/^[-–:\s]+/, '').trim().slice(0, 160);
    const result = [];
    out.forEach((item, index) => {
        const level = (n) => item.columns.find((col) => col.level === n);
        const five = level('5');
        if (!five || result.some((r) => r.nic_5_digit === five.code))
            return;
        result.push({
            serial_number: String(index + 1),
            nic_2_digit: level('2')?.code || '',
            nic_2_description: clean(level('2')?.description),
            nic_4_digit: level('4')?.code || '',
            nic_4_description: clean(level('4')?.description),
            nic_5_digit: five.code,
            nic_5_description: clean(five.description),
            activity: clean(item.activity),
        });
    });
    return result.slice(0, 20);
}

function gridKey(label) {
    const t = label.toLowerCase();
    if (/flat|door/.test(t))
        return 'flat';
    if (/premises|building/.test(t))
        return 'building';
    if (/village|town/.test(t))
        return 'village';
    if (/road|street|lane/.test(t))
        return 'street';
    if (/^block\b/.test(t))
        return 'block';
    if (/^city\b/.test(t))
        return 'city';
    if (/^state\b/.test(t))
        return 'state';
    if (/^district\b/.test(t))
        return 'district';
    if (/^pin/.test(t))
        return 'pincode';
    if (/^mobile\b/.test(t))
        return 'mobile';
    if (/^e-?mail\b/.test(t))
        return 'email';
    return '';
}

/**
 * Address printed as a two-column label/value grid ("Flat/Door/Block No. | value | Name of
 * Premises/Building | value"), where labels and values may wrap over several lines.
 */
function addressGrid(lines) {
    const start = lines.findIndex((line) => line.parts.some((part) => /flat\s*\/\s*door/i.test(part.text)));
    if (start < 0)
        return null;
    const leftX = lines[start].parts.find((part) => /flat\s*\/\s*door/i.test(part.text)).x;
    // Labels of the second column start further right; find the first one to fix its x
    const rightLabel = lines.slice(Math.max(0, start - 3), start + 30)
        .flatMap((line) => line.parts)
        .find((part) => part.x > leftX + 60 && /^(name of|premises|building|block|city|district|pin)\b/i.test(part.text));
    const rightX = rightLabel ? rightLabel.x : Infinity;
    const region = [];
    for (const line of lines.slice(Math.max(0, start - 3), start + 30)) {
        if (/date of incorporation|date of commencement|national industry/i.test(lineText(line)))
            break;
        region.push(line);
    }
    // Where each value column starts. Labels can wrap sideways ("Village/" then "Town"), so
    // anything left of the value column belongs to the label.
    const parts = region.flatMap((line) => line.parts);
    const valueLeftX = Math.min(...parts.filter((p) => p.x > leftX + 40 && p.x < rightX - 10).map((p) => p.x), Infinity);
    const valueRightX = Math.min(...parts.filter((p) => p.x > rightX + 20).map((p) => p.x), Infinity);
    const labels = [];
    const values = [];
    for (const line of region) {
        for (const part of line.parts) {
            const y = line.y ?? 0;
            if (part.x < leftX - 10)
                continue;
            if (part.x < valueLeftX - 5)
                labels.push({ side: 0, y, text: part.text });
            else if (part.x < rightX - 10)
                values.push({ side: 0, y, text: part.text });
            else if (part.x < valueRightX - 5)
                labels.push({ side: 1, y, text: part.text });
            else
                values.push({ side: 1, y, text: part.text });
        }
    }
    // Label fragments a line apart belong to one wrapped label
    const groups = [];
    for (const side of [0, 1]) {
        let current = null;
        for (const frag of labels.filter((l) => l.side === side)) {
            // Joins a wrapped label ("Name of" / "Premises/" / "Building"), but never two different
            // labels that happen to sit close together on a scan ("Village/Town", "Road/Street/Lane")
            const own = gridKey(frag.text);
            const group = current ? gridKey(current.text) : '';
            if (current && Math.abs(current.last - frag.y) <= 14 && (!own || !group || own === group)) {
                current.text += ` ${frag.text}`;
                current.last = frag.y;
                current.ys.push(frag.y);
            }
            else {
                current = { side, text: frag.text, last: frag.y, ys: [frag.y], values: [] };
                groups.push(current);
            }
        }
    }
    for (const group of groups)
        group.center = group.ys.reduce((a, b) => a + b, 0) / group.ys.length;
    for (const value of values) {
        let best = null;
        for (const group of groups.filter((g) => g.side === value.side)) {
            const distance = Math.abs(group.center - value.y);
            if (distance <= 26 && (!best || distance < best.distance))
                best = { group, distance };
        }
        best?.group.values.push(value.text);
    }
    const address = {};
    for (const group of groups) {
        const key = gridKey(group.text);
        let value = group.values.join(' ').replace(/\s+/g, ' ');
        // The portal sometimes prints the PIN inside another value ("MUMBAI SUBURBAN , Pin 400093")
        const pin = /,?\s*pin\s*[:-]?\s*(\d{6})\b/i.exec(value);
        if (pin) {
            address.pincode = address.pincode || pin[1];
            value = value.replace(pin[0], '');
        }
        value = value.replace(/^[,\s]+|[,\s]+$/g, '').trim();
        if (!key || !value || address[key])
            continue;
        address[key] = key === 'pincode' ? value.replace(/\D/g, '').slice(0, 6) : value.slice(0, 80);
    }
    return Object.keys(address).length ? address : null;
}

/**
 * Same fields as {@link parseCertificateText}, using the PDF's positioned text
 * so table columns (enterprise type, address, NIC) stay attached to their headers.
 */
export function parseCertificateLayout(lines) {
    if (!Array.isArray(lines) || !lines.length)
        return null;
    const parsed = parseCertificateText(lines.map(lineText).join('\n'));
    if (!parsed)
        return null;
    // The name sits on the same row as its label; take that cell only
    const name = sameLineValue(lines, /^name of enterprise/i);
    if (name.length >= 2)
        parsed.enterprise_name = name.slice(0, 160);
    if (!parsed.major_activity) {
        const activity = /\b(manufacturing|services|trading)\b/i.exec(sameLineValue(lines, /^major activity/i));
        if (activity)
            parsed.major_activity = titleWord(activity[1]);
    }
    const type = titleWord(columnValue(lines, /enterprise\s*type/i));
    if (type)
        parsed.enterprise_type = type;
    // Only the year itself; OCR can run the row number into it ("1 2025-26")
    const year = /(\d{4})\s*[-–]\s*(\d{2,4})/.exec(columnValue(lines, /classification\s*year/i));
    if (year && !parsed.classification_year)
        parsed.classification_year = `${year[1]}-${year[2]}`;
    const address = addressTable(lines) || addressGrid(lines);
    if (address)
        parsed.split_address = { ...parsed.split_address, ...address };
    const rows = nicRows(lines);
    const nic = rows.length ? rows : nicTable(lines);
    if (nic.length)
        parsed.nic_codes = nic;
    return parsed;
}
