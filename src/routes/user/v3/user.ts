import type { AppEnv } from "@/config/app";
import { Hono } from "hono";

export const userRouter = new Hono<AppEnv>();