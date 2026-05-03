import type { AppEnv } from "@/config/app";
import { Hono } from "hono";

export const usersRouter = new Hono<AppEnv>();
