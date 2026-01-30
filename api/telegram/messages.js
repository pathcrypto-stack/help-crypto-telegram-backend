import { Redis } from "@upstash/redis";

export const config = { runtime: "nodejs" };

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const KEY_MESSAGES = "help_crypto:messages";

export default async function handler(req, res) {
  // CORS básico (pra funcionar com Lovable em outro domínio)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "GET") return res.status(405).json({ messages: [] });

  try {
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const after = Number(req.query.after || 0);

    // pega os últimos "limit" itens
    const raw = await redis.lrange(KEY_MESSAGES, -limit, -1);

    const messages = raw
      .map((s) => {
        try {
          return JSON.parse(s);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .filter((m) => typeof m.message_id === "number")
      .filter((m) => (after ? m.message_id > after : true));

    return res.status(200).json({ messages });
  } catch (err) {
    console.error("messages error:", err);
    return res.status(500).json({ messages: [] });
  }
}
