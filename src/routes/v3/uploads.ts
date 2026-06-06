import type { AppEnv } from "@/config/app";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";

export const uploadsRouter = new Hono<AppEnv>();