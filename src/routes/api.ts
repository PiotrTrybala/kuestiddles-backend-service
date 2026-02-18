import { Hono } from "hono";

import { admin } from "./admin/admin";
import { user } from "./user/user";

import { assetsRouter } from "./assets";

export const api = new Hono().basePath("/v1");

api.route("/admin", admin);
api.route("/user", user);

api.route("/assets", assetsRouter);