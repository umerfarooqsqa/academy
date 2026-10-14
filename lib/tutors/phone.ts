// Phone-number comparison for matching a typed WhatsApp number to a stored
// Tutor.whatsappId (2026-10-14, the /opportunities "I'm interested" flow).
// whatsappId is stored exactly as entered — "0300 1234567" from the website,
// "923001234567" from the WhatsApp webhook — so compare on the last 10
// digits only (the Pakistani mobile number without its 0 / 92 prefix).

export function phoneKey(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : null;
}

export function samePhone(a: string, b: string): boolean {
  const ka = phoneKey(a);
  return ka != null && ka === phoneKey(b);
}
