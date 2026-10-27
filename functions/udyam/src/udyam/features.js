/**
 * Switches shared by the website and the udyamVerify function.
 *
 * OTP_ENABLED: when true, the visitor verifies their mobile with a one-time code (Fast2SMS)
 * before the record is fetched, and the certificate route refuses requests without that proof.
 * When false, the mobile number is collected but not verified. Turn it back on here, then
 * rebuild and deploy both: npm run build && firebase deploy --only functions:udyamVerify,hosting
 */
export const OTP_ENABLED = true;

/**
 * PAYMENT_ENABLED: when true, the fetched record is sealed and the report opens only after a
 * Cashfree payment. When false, the report opens straight after the record is fetched (no
 * payment step). Turn it back on here once Cashfree payments are activated, then rebuild and
 * deploy both: npm run build && firebase deploy --only functions:udyamVerify,hosting
 */
export const PAYMENT_ENABLED = false;
