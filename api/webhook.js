import { Redis } from "@upstash/redis";

export const config = { runtime: "nodejs" };

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const KEY_MESSAGES = "help_crypto:messages";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).end();
  }

  try {
    const body = req.body;

    if (!body.message) {
      return res.status(200).end();
    }

    const msg = body.message;

    const data = {
      message_id: msg.message_id,
      username: msg.from?.username || msg.from?.first_name || "Membro",
      text: msg.text || "",
      date: msg.date * 1000,
      is_admin: false,
    };

    await redis.rpush(KEY_MESSAGES, JSON.stringify(data));

    return res.status(200).end();
  } catch (e) {
    console.error(e);
    return res.status(200).end();
  }
}
