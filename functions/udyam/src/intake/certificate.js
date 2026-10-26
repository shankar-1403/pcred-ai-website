import { checkUdyamNumber } from '../udyam/validate.js';

const TEXT = 200;

function clip(v) {
    if (typeof v !== 'string')
        return '';
    return v.replace(/\s+/g, ' ').trim().slice(0, TEXT);
}
// These come from the visitor's browser: keep only the shapes the reader produces
const pickOne = (v, allowed) => (allowed.includes(clip(v)) ? clip(v) : '');
const year = (v) => (/^\d{4}-\d{2,4}$/.test(clip(v)) ? clip(v) : '');
const money = (v) => (/^\d{1,13}(\.\d{1,2})?$/.test(clip(v)) ? clip(v) : '');
const count = (v) => (/^\d{1,7}$/.test(clip(v)) ? clip(v) : '');
const ymd = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(clip(v)) ? clip(v) : '');
const dmy = (v) => (/^\d{2}\/\d{2}\/\d{4}$/.test(clip(v)) ? clip(v) : '');
const SIZES = ['Micro', 'Small', 'Medium'];
const list = (v, max) => (Array.isArray(v) ? v.slice(0, max).filter((r) => r && typeof r === 'object') : []);

/**
 * Builds a Cashfree-shaped SUCCESS body from fields read off a certificate.
 * Only known fields are kept.
 */
export function certificateBody(input) {
    if (!input || typeof input !== 'object')
        return { ok: false, message: 'The certificate details are missing.' };
    const check = checkUdyamNumber(typeof input.udyam_number === 'string' ? input.udyam_number : '');
    if (!check.ok)
        return { ok: false, message: 'The certificate did not include a valid Udyam Registration Number.' };
    const name = clip(input.enterprise_name);
    if (name.length < 2)
        return { ok: false, message: 'The certificate did not include a business name. Upload a clearer PDF.' };
    const addr = input.split_address && typeof input.split_address === 'object' ? input.split_address : {};
    const nic = Array.isArray(input.nic_codes) ? input.nic_codes.slice(0, 30) : [];
    return {
        ok: true,
        body: {
            status: 'SUCCESS',
            verification_id: '',
            reference_id: '',
            udyam_number: check.value,
            enterprise_name: name,
            organization_type: clip(input.organization_type),
            major_activity: clip(input.major_activity),
            social_category: clip(input.social_category),
            enterprise_type: clip(input.enterprise_type),
            date_of_incorporation: clip(input.date_of_incorporation),
            date_of_commencement: clip(input.date_of_commencement),
            date_of_udyam_registration: clip(input.date_of_udyam_registration),
            classification_year: clip(input.classification_year),
            classification_date: '',
            udyam_certificate_url: null,
            split_address: {
                flat: clip(addr.flat),
                building: clip(addr.building),
                village: '',
                block: '',
                street: clip(addr.street),
                city: clip(addr.city),
                district: clip(addr.district),
                state: clip(addr.state),
                pincode: clip(addr.pincode).replace(/\D/g, '').slice(0, 6),
                mobile: '',
                email: '',
            },
            unit_locations: [],
            nic_codes: nic.map((n, i) => ({
                serial_number: String(i + 1),
                nic_2_digit: '',
                nic_2_description: '',
                nic_4_digit: '',
                nic_4_description: '',
                nic_5_digit: clip(n && typeof n === 'object' ? n.nic_5_digit : '').replace(/\D/g, '').slice(0, 5),
                nic_5_description: clip(n && typeof n === 'object' ? n.nic_5_description : ''),
                activity: clip(n && typeof n === 'object' ? n.activity : ''),
                date: '',
            })).filter((n) => n.nic_5_digit.length === 5),
            classification_history: list(input.classification_history, 20).map((h, i) => ({
                serial_number: String(i + 1),
                classification_year: year(h.classification_year),
                enterprise_type: pickOne(h.enterprise_type, SIZES),
                classification_date: ymd(h.classification_date),
            })).filter((h) => h.classification_year && h.enterprise_type),
            dic: clip(input.dic).slice(0, 80),
            msme_di: clip(input.msme_di).slice(0, 80),
            financial_years: list(input.financial_years, 10).map((y) => ({
                financial_year: year(y.financial_year),
                enterprise_type: pickOne(y.enterprise_type, SIZES),
                wdv: money(y.wdv),
                exclusion: money(y.exclusion),
                net_investment: money(y.net_investment),
                total_turnover: money(y.total_turnover),
                export_turnover: money(y.export_turnover),
                net_turnover: money(y.net_turnover),
                itr_filed: pickOne(y.itr_filed, ['Yes', 'No']),
            })).filter((y) => y.financial_year),
            employment: (() => {
                const e = input.employment && typeof input.employment === 'object' ? input.employment : {};
                return { male: count(e.male), female: count(e.female), other: count(e.other), total: count(e.total) };
            })(),
            owner_gender: pickOne(input.owner_gender, ['Male', 'Female', 'Other', 'Others', 'Transgender']),
            specially_abled: pickOne(input.specially_abled, ['Yes', 'No']),
            has_gstin: pickOne(input.has_gstin, ['Yes', 'No', 'Exempted']),
            iec_status: pickOne(input.iec_status, ['Active', 'Inactive', 'Cancelled', 'Suspended']),
            iec_registration_date: dmy(input.iec_registration_date),
        },
    };
}
