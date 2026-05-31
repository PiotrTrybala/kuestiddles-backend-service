import { REDIS_URL } from "@/globals";
import { RedisClient } from "bun";

export const redis = new RedisClient(REDIS_URL);