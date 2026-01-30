import { Redis } from "@upstash/redis";

export const config = { runtime: "nodejs" };

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const KEY_MESSAGES = "help_crypto:messages";
const KEY_CHAT_ID = "help_crypto:chat_id";

export default async function handler(req, res) {
  const update = req.body;

  if (!update?.message) return res.status(200).end();

  const msg = update.message;

  const chatId = msg.chat.id;
  await redis.set(KEY_CHAT_ID, chatId);

  const data = {
    message_id: msg.message_id,
    username: msg.from.username || msg.from.first_name || "Membro",
    text: msg.text || "",
    date: msg.date * 1000,
    is_admin: false,
  };

  await redis.rpush(KEY_MESSAGES, JSON.stringify(data));

  return res.status(200).end();
}
