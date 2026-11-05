const FAST2SMS_URL = 'https://www.fast2sms.com/dev/bulkV2';

// DLT-registered OTP SMS: Airtel DLT entity 1001541785771070335, header PCREDV, template
// 1077393250108498985 ("Your OTP to access your Scheme Report on Pcred is {#var#}. ...").
// Fast2SMS knows that template by its own message ID.
export const DLT_SENDER_ID = 'PCREDV';
export const DLT_MESSAGE_ID = '230575';
// Bundle checkout: template 1077147120108194663 ("Your OTP to confirm your PCRED bundle enquiry is {#var#}. ...")
export const BUNDLE_MESSAGE_ID = '230579';

function detailOf(body) {
    const raw = Array.isArray(body?.message) ? body.message.join(' ') : typeof body?.message === 'string' ? body.message : '';
    return raw.replace(/\d{4,}/g, '####').slice(0, 80);
}

/** Sends the 6-digit code through Fast2SMS's DLT route, using the approved PCREDV template. */
export async function sendFast2Sms({ apiKey, phone, otp, messageId = DLT_MESSAGE_ID, fetchImpl = fetch }) {
    let res;
    try {
        res = await fetchImpl(FAST2SMS_URL, {
            method: 'POST',
            headers: {
                authorization: apiKey,
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                route: 'dlt',
                sender_id: DLT_SENDER_ID,
                message: messageId,
                variables_values: otp,
                numbers: phone,
                flash: '0',
            }),
            signal: AbortSignal.timeout(10_000),
        });
    }
    catch {
        return { ok: false, reason: 'sms_failed' };
    }
    let body = null;
    try {
        body = await res.json();
    }
    catch {
        body = null;
    }
    if (!res.ok || !body || body.return !== true)
        return { ok: false, reason: 'sms_rejected', detail: detailOf(body) };
    return { ok: true };
}
