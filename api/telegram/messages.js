import { Redis } from "@upstash/redis";

export const config = { runtime: "nodejs" };

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const KEY_MESSAGES = "help_crypto:messages";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ messages: [] });

  const limit = Math.min(Number(req.query.limit || 50), 200);
  const after = Number(req.query.after || 0);

  const raw = await redis.lrange(KEY_MESSAGES, -limit, -1);
  const messages = raw
    .map((s) => {
      try { return JSON.parse(s); } catch { return null; }
    })
    .filter(Boolean)
    .filter((m) => typeof m.message_id === "number")
    .filter((m) => (after ? m.message_id > after : true));

  return res.status(200).json({ messages });
}
