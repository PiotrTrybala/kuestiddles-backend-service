import { REDIS_URL } from "@/env";
import { RedisClient } from "bun";

export const redis = new RedisClient(REDIS_URL);