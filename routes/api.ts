import { Hono } from "hono";
import { admin } from "./admin";

import { assetsRouter } from "./assets";

export const api = new Hono().basePath("/v1");

api.route("/admin", admin);
api.route("/assets", assetsRouter);