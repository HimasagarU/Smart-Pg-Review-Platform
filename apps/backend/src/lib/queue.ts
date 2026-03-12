import { Queue } from "bullmq";

let verificationQueue: Queue | null = null;

function getRedisConnection() {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  const url = new URL(redisUrl);

  return {
    host: url.hostname,
    port: parseInt(url.port || "6379"),
    password: url.password || undefined,
    username: url.username !== "default" ? url.username : undefined,
    tls: url.protocol === "rediss:" ? {} : undefined,
  };
}

function getQueue(): Queue {
  if (!verificationQueue) {
    verificationQueue = new Queue("verification", {
      connection: getRedisConnection(),
    });
  }
  return verificationQueue;
}

export async function queueReviewForVerification(reviewId: string) {
  try {
    const queue = getQueue();
    await queue.add("verify-review", { reviewId });
  } catch (err) {
    console.warn("⚠️  Redis/Queue unavailable, review needs manual moderation:", (err as Error).message);
  }
}

export { getQueue };
