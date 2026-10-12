// One-off script to validate real WhatsApp Cloud API credentials by sending a
// test message — mirrors lib/whatsapp/client.ts#sendText exactly, run
// standalone (no DB, no Next dev server needed) since memory is tight.
//
// Usage: node --env-file=.env.local scripts/send-test-message.mjs <to>

const GRAPH_VERSION = "v21.0";
const to = process.argv[2];
if (!to) {
  console.error("Usage: node --env-file=.env.local scripts/send-test-message.mjs <to>");
  process.exit(1);
}

const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
if (!token || !phoneNumberId) {
  console.error("WHATSAPP_CLOUD_API_TOKEN / WHATSAPP_PHONE_NUMBER_ID not set");
  process.exit(1);
}

const url = `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`;
const res = await fetch(url, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { preview_url: false, body: "Academy Admin test message — WhatsApp Cloud API credentials are working." },
  }),
});
const json = await res.json();
console.log(`HTTP ${res.status}`);
console.log(JSON.stringify(json, null, 2));
process.exitCode = res.ok ? 0 : 1;
