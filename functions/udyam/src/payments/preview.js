/**
 * Fields the visitor may see before paying. Enough to confirm the right business was fetched.
 * Address, phone, email, certificate and the scheme report stay inside the seal.
 */
export function publicPreview(record) {
    const address = record?.split_address && typeof record.split_address === 'object' ? record.split_address : {};
    const text = (v) => (typeof v === 'string' ? v : '');
    return {
        enterprise_name: text(record?.enterprise_name),
        udyam_number: text(record?.udyam_number),
        enterprise_type: text(record?.enterprise_type),
        major_activity: text(record?.major_activity),
        organization_type: text(record?.organization_type),
        district: text(address.district) || text(address.city),
        state: text(address.state),
    };
}

/**
 * What the scheme rules read from a record, so the page can count the matching schemes before
 * payment. No street address, unit names, certificate link or Cashfree references: only the
 * category, activity, dates, NIC codes, place (state, district, city, PIN) and filed figures.
 */
export function matchProfile(record) {
    const text = (v) => (typeof v === 'string' ? v : '');
    const list = (v) => (Array.isArray(v) ? v.filter((x) => x && typeof x === 'object') : []);
    const place = (a) => ({ state: text(a?.state), district: text(a?.district), city: text(a?.city), pincode: text(a?.pincode) });
    const address = record?.split_address && typeof record.split_address === 'object' ? record.split_address : {};
    return {
        udyam_number: text(record?.udyam_number),
        enterprise_name: text(record?.enterprise_name),
        organization_type: text(record?.organization_type),
        major_activity: text(record?.major_activity),
        social_category: text(record?.social_category),
        enterprise_type: text(record?.enterprise_type),
        classification_year: text(record?.classification_year),
        classification_history: list(record?.classification_history).map((h) => ({
            classification_year: text(h.classification_year), enterprise_type: text(h.enterprise_type), classification_date: text(h.classification_date),
        })),
        date_of_incorporation: text(record?.date_of_incorporation),
        date_of_commencement: text(record?.date_of_commencement),
        date_of_udyam_registration: text(record?.date_of_udyam_registration),
        split_address: place(address),
        unit_locations: list(record?.unit_locations).map(place),
        nic_codes: list(record?.nic_codes).map((n) => ({ nic_5_digit: text(n.nic_5_digit), nic_5_description: text(n.nic_5_description), activity: text(n.activity) })),
        dic: text(record?.dic),
        msme_di: text(record?.msme_di),
        financial_years: list(record?.financial_years),
        employment: record?.employment && typeof record.employment === 'object' ? record.employment : {},
        owner_gender: text(record?.owner_gender),
        specially_abled: text(record?.specially_abled),
        has_gstin: text(record?.has_gstin),
        iec_status: text(record?.iec_status),
        iec_registration_date: text(record?.iec_registration_date),
    };
}
