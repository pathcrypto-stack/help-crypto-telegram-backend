export const config = { runtime: "nodejs" };

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.HELP_CRYPTO_CHAT_ID;

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") return res.status(405).json({ ok: false });

  try {
    if (!BOT_TOKEN) return res.status(500).json({ ok: false, error: "Missing TELEGRAM_BOT_TOKEN" });
    if (!CHAT_ID) return res.status(500).json({ ok: false, error: "Missing HELP_CRYPTO_CHAT_ID" });

    const text = String(req.body?.text || "").trim();
    if (!text) return res.status(400).json({ ok: false, error: "Missing text" });

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    const tgRes = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        disable_web_page_preview: true,
      }),
    });

    const payload = await tgRes.json().catch(() => null);

    if (!tgRes.ok || !payload?.ok) {
      console.error("telegram send failed:", payload);
      return res.status(500).json({ ok: false, error: "Telegram send failed", details: payload });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("send error:", err);
    return res.status(500).json({ ok: false });
  }
}
