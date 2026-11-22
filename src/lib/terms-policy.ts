export const TERMS_LINK_PATH = "/terms";

/** Only new registrations need the Terms and Conditions tick; signing in does not. */
export function requiresTermsAcceptance(mode: "signin" | "signup") {
  return mode === "signup";
}

/** Metadata stamp kept with the account so the owner can show agreement was given. */
export function termsAcceptanceStamp(accepted: boolean, at = new Date()) {
  return accepted ? { terms_accepted_at: at.toISOString() } : {};
}
