import { describe, expect, it } from 'vitest';
import { extractUdyamNumber, parseCertificateLayout, parseCertificateText } from '../src/udyam/parse-certificate.js';

const SAMPLE = `
UDYAM REGISTRATION CERTIFICATE
UDYAM REGISTRATION NUMBER
UDYAM-MH-26-OO12345
NAME OF ENTERPRISE
SHREE GANESH ENGINEERING WORKS
TYPE OF ENTERPRISE
MICRO
( Micro during previous Financial Year FY 2020-21 )
MAJOR ACTIVITY
MANUFACTURING
SOCIAL CATEGORY OF ENTREPRENEUR
OBC
OFFICIAL ADDRESS OF ENTERPRISE
Flat/Door/Block No. SHED NO. 12
Road/Street/Lane BHOSARI MIDC ROAD
City PUNE
State MAHARASHTRA
District PUNE
Pin 411026
DATE OF INCORPORATION
14/03/2017
DATE OF COMMENCEMENT OF PRODUCTION/BUSINESS
01/04/2017
NATIONAL INDUSTRY CLASSIFICATION CODE(S)
Nic 5 Digit 25920 Machining
Nic 5 Digit 28221 Manufacture of machinery
DATE OF UDYAM REGISTRATION
10/02/2021
TYPE OF ORGANISATION
Proprietary
`;

describe('certificate OCR text', () => {
    it('repairs a misread Udyam number', () => {
        expect(extractUdyamNumber('udyam mh 26 0012345')).toBe('UDYAM-MH-26-0012345');
        expect(extractUdyamNumber('no number here')).toBe('');
    });
    it('reads the printed certificate fields', () => {
        const parsed = parseCertificateText(SAMPLE);
        expect(parsed.udyam_number).toBe('UDYAM-MH-26-0012345');
        expect(parsed.enterprise_name).toBe('SHREE GANESH ENGINEERING WORKS');
        expect(parsed.enterprise_type).toBe('Micro');
        expect(parsed.major_activity).toBe('Manufacturing');
        expect(parsed.social_category).toBe('OBC');
        expect(parsed.organization_type).toBe('Proprietary');
        expect(parsed.date_of_incorporation).toBe('14/03/2017');
        expect(parsed.date_of_commencement).toBe('01/04/2017');
        expect(parsed.date_of_udyam_registration).toBe('10/02/2021');
        expect(parsed.classification_year).toBe('2020-21');
        expect(parsed.split_address).toMatchObject({
            flat: 'SHED NO. 12',
            street: 'BHOSARI MIDC ROAD',
            city: 'PUNE',
            state: 'MAHARASHTRA',
            district: 'PUNE',
            pincode: '411026',
        });
        expect(parsed.nic_codes.map((n) => n.nic_5_digit)).toEqual(['25920', '28221']);
    });
    it('returns null when the number is missing', () => {
        expect(parseCertificateText('NAME OF ENTERPRISE\nACME')).toBeNull();
    });
    it('reads the certificate tables from positioned PDF text', () => {
        const parsed = parseCertificateLayout([
            { parts: [{ x: 40, text: 'UDYAM REGISTRATION NUMBER' }] },
            { parts: [{ x: 40, text: 'UDYAM-MH-18-0245006' }] },
            { parts: [{ x: 40, text: 'NAME OF ENTERPRISE' }] },
            { parts: [{ x: 40, text: 'M/S PCRED VENTURE PRIVATE LIMITED' }] },
            { parts: [{ x: 40, text: 'TYPE OF ENTERPRISE' }] },
            { parts: [{ x: 40, text: 'SNo.' }, { x: 80, text: 'Classification Year' }, { x: 180, text: 'Enterprise Type' }, { x: 300, text: 'Classification Date' }] },
            { parts: [{ x: 40, text: '1' }, { x: 80, text: '2024-25' }, { x: 180, text: 'Micro' }, { x: 300, text: '26/06/2020' }] },
            { parts: [{ x: 40, text: 'MAJOR ACTIVITY' }] },
            { parts: [{ x: 40, text: 'Services' }] },
            { parts: [{ x: 40, text: 'SOCIAL CATEGORY OF ENTREPRENEUR' }] },
            { parts: [{ x: 40, text: 'General' }] },
            { parts: [{ x: 40, text: 'OFFICIAL ADDRESS OF ENTERPRISE' }] },
            { parts: [{ x: 40, text: 'Flat/Door/Block No.' }, { x: 150, text: 'Name of Premises/Building' }, { x: 280, text: 'City' }, { x: 340, text: 'State' }, { x: 430, text: 'District' }, { x: 510, text: 'Pin' }] },
            { parts: [{ x: 40, text: 'OFFICE 4' }, { x: 150, text: 'ABC TOWER' }, { x: 280, text: 'PUNE' }, { x: 340, text: 'MAHARASHTRA' }, { x: 430, text: 'PUNE' }, { x: 510, text: '411001' }] },
            { parts: [{ x: 40, text: 'DATE OF INCORPORATION' }] },
            { parts: [{ x: 40, text: '01/04/2019' }] },
            { parts: [{ x: 40, text: 'DATE OF COMMENCEMENT OF PRODUCTION/BUSINESS' }] },
            { parts: [{ x: 40, text: '01/05/2019' }] },
            { parts: [{ x: 40, text: 'NATIONAL INDUSTRY CLASSIFICATION CODE(S)' }] },
            { parts: [{ x: 40, text: 'SNo.' }, { x: 80, text: 'Nic 2 Digit' }, { x: 220, text: 'Nic 4 Digit' }, { x: 360, text: 'Nic 5 Digit' }, { x: 520, text: 'Activity' }] },
            { parts: [{ x: 40, text: '1' }, { x: 80, text: '62 - Computer programming' }, { x: 220, text: '6201 - Computer programming' }, { x: 360, text: '62013 - Computer programming activities' }, { x: 520, text: 'Services' }] },
            { parts: [{ x: 40, text: 'DATE OF UDYAM REGISTRATION' }] },
            { parts: [{ x: 40, text: '26/06/2020' }] },
            { parts: [{ x: 40, text: 'TYPE OF ORGANISATION' }] },
            { parts: [{ x: 40, text: 'Private Limited Company' }] },
        ]);
        expect(parsed.enterprise_name).toBe('M/S PCRED VENTURE PRIVATE LIMITED');
        expect(parsed.udyam_number).toBe('UDYAM-MH-18-0245006');
        expect(parsed.enterprise_type).toBe('Micro');
        expect(parsed.major_activity).toBe('Services');
        expect(parsed.social_category).toBe('GENERAL');
        expect(parsed.organization_type).toBe('Private Limited Company');
        expect(parsed.classification_year).toBe('2024-25');
        expect(parsed.date_of_incorporation).toBe('01/04/2019');
        expect(parsed.date_of_commencement).toBe('01/05/2019');
        expect(parsed.date_of_udyam_registration).toBe('26/06/2020');
        expect(parsed.split_address).toMatchObject({
            flat: 'OFFICE 4',
            building: 'ABC TOWER',
            city: 'PUNE',
            state: 'MAHARASHTRA',
            district: 'PUNE',
            pincode: '411001',
        });
        expect(parsed.nic_codes[0]).toMatchObject({
            nic_5_digit: '62013',
            nic_5_description: 'Computer programming activities',
        });
    });

    // What OCR gives for a scanned print certificate: the shaded NIC header is lost, the name row
    // is followed by the classification table, two address labels sit 13pt apart, and the
    // mobile number row comes after the address table.
    it('reads an OCR layout of a scanned print certificate', () => {
        const parsed = parseCertificateLayout([
            { y: 745, parts: [{ x: 54, text: 'UDYAM REGISTRATION NUMBER' }, { x: 335, text: 'UDYAM-MH-17-0000002' }] },
            { y: 718, parts: [{ x: 81, text: 'NAME OF ENTERPRISE' }, { x: 357, text: 'EXAMPLE APPARELS' }] },
            { y: 684, parts: [{ x: 256, text: 'SNo.' }, { x: 284, text: 'Classification Year' }, { x: 377, text: 'Enterprise Type' }, { x: 458, text: 'Classification Date' }] },
            { y: 668, parts: [{ x: 264, text: '1' }, { x: 309, text: '2025-26' }, { x: 400, text: 'Micro' }, { x: 477, text: '01/04/2025' }] },
            { y: 651, parts: [{ x: 78, text: 'TYPE OF ENTERPRISE' }] },
            { y: 581, parts: [{ x: 93, text: 'MAJOR ACTIVITY' }, { x: 332, text: 'MANUFACTURING' }] },
            { y: 451, parts: [{ x: 325, text: '7' }, { x: 402, text: 'Premises/' }, { x: 444, text: 'Sample Heights' }] },
            { y: 447, parts: [{ x: 251, text: 'Flat/Door/Block' }] },
            { y: 441, parts: [{ x: 251, text: 'No.' }] },
            { y: 438, parts: [{ x: 402, text: 'Building' }] },
            { y: 423, parts: [{ x: 283, text: 'Town' }, { x: 324, text: 'Station Area' }, { x: 402, text: 'Block' }, { x: 444, text: 'East Block' }] },
            { y: 419, parts: [{ x: 47, text: 'OFFICAL ADDRESS OF ENTERPRISE' }, { x: 250, text: 'Village/' }] },
            { y: 406, parts: [{ x: 251, text: 'Road/Street/Lane' }, { x: 324, text: 'Market Road' }, { x: 444, text: 'Sample Town' }] },
            { y: 403, parts: [{ x: 402, text: 'City' }] },
            { y: 390, parts: [{ x: 251, text: 'State' }, { x: 324, text: 'MAHARASHTRA' }, { x: 402, text: 'District' }, { x: 444, text: 'PALGHAR,' }, { x: 495, text: 'Pin 401000' }] },
            { y: 373, parts: [{ x: 324, text: '9800000000' }, { x: 444, text: 'owner@example.com' }] },
            { y: 370, parts: [{ x: 251, text: 'Mobile' }, { x: 402, text: 'Email:' }] },
            { y: 343, parts: [{ x: 67, text: 'DATE OF INCORPORATION /' }] },
            { y: 337, parts: [{ x: 376, text: '29/07/2021' }] },
            { y: 248, parts: [{ x: 275, text: '14 -' }, { x: 339, text: '1410 -' }, { x: 411, text: '14104 -' }] },
            { y: 245, parts: [{ x: 490, text: 'Manufacturing' }] },
            { y: 235, parts: [{ x: 275, text: 'Manufacture' }, { x: 339, text: 'Manufacture of' }, { x: 410, text: 'Manufacture of' }] },
            { y: 224, parts: [{ x: 410, text: 'wearing apparel' }] },
            { y: 160, parts: [{ x: 54, text: 'DATE OF UDYAM REGISTRATION' }, { x: 376, text: '30/07/2021' }] },
        ]);
        expect(parsed.enterprise_name).toBe('EXAMPLE APPARELS');
        expect(parsed.enterprise_type).toBe('Micro');
        expect(parsed.major_activity).toBe('Manufacturing');
        expect(parsed.classification_year).toBe('2025-26');
        expect(parsed.split_address).toMatchObject({
            flat: '7',
            building: 'Sample Heights',
            village: 'Station Area',
            street: 'Market Road',
            block: 'East Block',
            city: 'Sample Town',
            state: 'MAHARASHTRA',
            district: 'PALGHAR',
            pincode: '401000',
        });
        expect(parsed.nic_codes).toEqual([
            expect.objectContaining({ nic_2_digit: '14', nic_4_digit: '1410', nic_5_digit: '14104', nic_5_description: 'Manufacture of wearing apparel', activity: 'Manufacturing' }),
        ]);
    });

    it('cuts the classification table off a name read as plain text', () => {
        const parsed = parseCertificateText('UDYAM REGISTRATION NUMBER UDYAM-MH-18-0000003\nNAME OF ENTERPRISE\nM/S EXAMPLE PRIVATE LIMITED * 1 2024-25 Micro 27/04/2024\nTYPE OF ENTERPRISE');
        expect(parsed.enterprise_name).toBe('M/S EXAMPLE PRIVATE LIMITED');
    });

    // Layout of the portal's "Print : Udyam Registration Certificate": headers centred over
    // left-aligned values, wrapped NIC descriptions, and the address as a label/value grid.
    it('reads the print-certificate layout (shifted NIC columns, address grid)', () => {
        const parsed = parseCertificateLayout([
            { y: 760, parts: [{ x: 60, text: 'UDYAM REGISTRATION NUMBER' }, { x: 375, text: 'UDYAM-MH-18-0000001' }] },
            { y: 740, parts: [{ x: 60, text: 'NAME OF ENTERPRISE' }, { x: 375, text: 'M/S EXAMPLE TRADERS PRIVATE LIMITED' }] },
            { y: 547, parts: [{ x: 93, text: 'MAJOR ACTIVITY' }, { x: 362, text: 'SERVICES' }] },
            { y: 428, parts: [{ x: 411, text: 'Name of' }] },
            { y: 422, parts: [{ x: 251, text: 'Flat/Door/Block' }, { x: 469, text: 'Example House' }] },
            { y: 417, parts: [{ x: 327, text: 'Unit 4' }, { x: 411, text: 'Premises/' }] },
            { y: 411, parts: [{ x: 251, text: 'No.' }, { x: 469, text: ',Near Station' }] },
            { y: 405, parts: [{ x: 411, text: 'Building' }] },
            { y: 389, parts: [{ x: 251, text: 'Village/Town' }, { x: 327, text: 'Andheri' }, { x: 411, text: 'Block' }, { x: 469, text: 'East' }] },
            { y: 372, parts: [{ x: 327, text: 'Station' }] },
            { y: 366, parts: [{ x: 47, text: 'OFFICAL ADDRESS OF ENTERPRISE' }, { x: 251, text: 'Road/Street/Lane' }, { x: 411, text: 'City' }, { x: 469, text: 'Mumbai' }] },
            { y: 361, parts: [{ x: 327, text: 'Road' }] },
            { y: 345, parts: [{ x: 469, text: 'MUMBAI' }] },
            { y: 333, parts: [{ x: 251, text: 'State' }, { x: 327, text: 'MAHARASHTRA' }, { x: 411, text: 'District' }, { x: 469, text: 'SUBURBAN' }] },
            { y: 322, parts: [{ x: 469, text: ', Pin 400001' }] },
            { y: 306, parts: [{ x: 251, text: 'Mobile' }, { x: 327, text: '9800000000' }, { x: 411, text: 'Email:' }, { x: 469, text: 'a@example.com' }] },
            { y: 237, parts: [{ x: 59, text: 'DATE OF COMMENCEMENT OF' }] },
            { y: 195, parts: [{ x: 251, text: 'SNo.' }, { x: 294, text: 'NIC 2 Digit' }, { x: 374, text: 'NIC 4 Digit' }, { x: 450, text: 'NIC 5 Digit' }, { x: 516, text: 'Activity' }] },
            { y: 179, parts: [{ x: 251, text: '1' }, { x: 275, text: '64 - Financial service' }, { x: 363, text: '6491 - Financial' }, { x: 434, text: '64910 - Financial' }, { x: 516, text: 'Services' }] },
            { y: 168, parts: [{ x: 275, text: 'activities, except' }, { x: 363, text: 'leasing' }, { x: 434, text: 'leasing' }] },
            { y: 150, parts: [{ x: 83, text: 'NATIONAL INDUSTRY' }] },
            { y: 129, parts: [{ x: 251, text: '2' }, { x: 275, text: '66 - Other financial' }, { x: 363, text: '6630 - Fund' }, { x: 434, text: '66309 -' }, { x: 516, text: 'Services' }] },
            { y: 117, parts: [{ x: 275, text: 'activities' }, { x: 363, text: 'management' }, { x: 434, text: 'Management of' }] },
            { y: 106, parts: [{ x: 363, text: 'activities' }, { x: 434, text: 'other investment' }] },
            { y: 95, parts: [{ x: 434, text: 'funds' }] },
            { y: 65, parts: [{ x: 54, text: 'DATE OF UDYAM REGISTRATION' }, { x: 375, text: '09/06/2023' }] },
        ]);
        expect(parsed.nic_codes).toEqual([
            expect.objectContaining({ nic_2_digit: '64', nic_4_digit: '6491', nic_5_digit: '64910', nic_5_description: 'Financial leasing', activity: 'Services' }),
            expect.objectContaining({ nic_2_digit: '66', nic_4_digit: '6630', nic_5_digit: '66309', nic_5_description: 'Management of other investment funds', activity: 'Services' }),
        ]);
        expect(parsed.split_address).toMatchObject({
            flat: 'Unit 4',
            building: 'Example House ,Near Station',
            village: 'Andheri',
            street: 'Station Road',
            city: 'Mumbai',
            state: 'MAHARASHTRA',
            district: 'MUMBAI SUBURBAN',
            pincode: '400001',
        });
    });
});

// The application pages of a full "Print Udyam Application" PDF, with made-up values
const APPLICATION = `
UDYAM REGISTRATION NUMBER UDYAM-MH-18-0000001
NAME OF ENTERPRISE M/S SAMPLE WORKS PRIVATE LIMITED
1 2024-25 Small 27/04/2024
2 2023-24 Micro 09/06/2023
1. District Industries Centre: MUMBAI SUBURBAN ( MAHARASHTRA )
Do you have GSTIN Yes Mobile No. 9000000000
Gender Female Yes
Abled(DIVYANG)
Employment Details
Male Female Other Total
7 5 0 12
1 2023-24 Small 3,50,00,000.00 0.00 35000000.00 120000000.00 2500000.00 117500000.00 Yes I
2 2022-23 Micro 169057.00 0.00 169057.00 2751151.00 0.00 2751151.00 No N
MSME-DFO MUMBAI ( MAHARASHTRA )
IEC Status Active
IEC Registration Date 15/01/2024
`;

describe('application details', () => {
    const r = parseCertificateText(APPLICATION);
    it('reads the classification history with ISO dates', () => {
        expect(r.classification_history).toEqual([
            { serial_number: '1', classification_year: '2024-25', enterprise_type: 'Small', classification_date: '2024-04-27' },
            { serial_number: '2', classification_year: '2023-24', enterprise_type: 'Micro', classification_date: '2023-06-09' },
        ]);
    });
    it('reads investment and turnover by year, without commas', () => {
        expect(r.financial_years[0]).toMatchObject({ financial_year: '2023-24', enterprise_type: 'Small', total_turnover: '120000000.00', export_turnover: '2500000.00', itr_filed: 'Yes' });
        expect(r.financial_years[0].wdv).toBe('35000000.00');
        expect(r.financial_years[1].itr_filed).toBe('No');
    });
    it('reads gender, specially abled, GST, employment, IEC and the offices', () => {
        expect(r).toMatchObject({
            owner_gender: 'Female', specially_abled: 'Yes', has_gstin: 'Yes',
            employment: { male: '7', female: '5', other: '0', total: '12' },
            iec_status: 'Active', iec_registration_date: '15/01/2024',
            dic: 'MUMBAI SUBURBAN (MAHARASHTRA)', msme_di: 'MUMBAI (MAHARASHTRA)',
        });
    });
    it('leaves them empty on a certificate without application pages', () => {
        const plain = parseCertificateText('UDYAM REGISTRATION NUMBER UDYAM-MH-18-0000001\nNAME OF ENTERPRISE SAMPLE');
        expect(plain.financial_years).toEqual([]);
        expect(plain.owner_gender).toBe('');
        expect(plain.employment.total).toBe('');
    });
});
