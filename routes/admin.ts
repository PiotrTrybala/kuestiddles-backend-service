import { Hono } from "hono";
import { assetsRouter } from "./assets";

export const admin = new Hono();

admin.route("/assets", assetsRouter);