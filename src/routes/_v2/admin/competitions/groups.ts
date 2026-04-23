import { Hono } from "hono";
import { type AppEnv } from "../../../config/app";

export const groupsRouter = new Hono<AppEnv>();