import { Redis } from "@upstash/redis";

export const config = { runtime: "nodejs" };

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const KEY_MESSAGES = "help_crypto:messages";

// Opcional: limitar tamanho da lista pra não crescer infinito
const MAX_MESSAGES = 500;

export default async function handler(req, res) {
  // Telegram chama via POST
  if (req.method !== "POST") return res.status(200).end();

  try {
    const body = req.body;

    // update pode vir em vários formatos (message, edited_message, channel_post)
    const msg =
      body?.message ||
      body?.edited_message ||
      body?.channel_post ||
      body?.edited_channel_post;

    if (!msg) return res.status(200).end();

    // só salva texto (evita lixo)
    const text = typeof msg.text === "string" ? msg.text : "";
    if (!text.trim()) return res.status(200).end();

    const data = {
      message_id: Number(msg.message_id),
      username: msg.from?.username || msg.from?.first_name || "Membro",
      text,
      date: (Number(msg.date) || Math.floor(Date.now() / 1000)) * 1000, // ms
      is_admin: false, // se quiser detectar admin depois, dá pra melhorar
    };

    await redis.rpush(KEY_MESSAGES, JSON.stringify(data));

    // corta lista pra manter últimos MAX_MESSAGES
    const len = await redis.llen(KEY_MESSAGES);
    if (typeof len === "number" && len > MAX_MESSAGES) {
      await redis.ltrim(KEY_MESSAGES, -MAX_MESSAGES, -1);
    }

    return res.status(200).end();
  } catch (err) {
    console.error("webhook error:", err);
    // Telegram espera 200 mesmo se falhar, pra não reenviar em loop
    return res.status(200).end();
  }
}
