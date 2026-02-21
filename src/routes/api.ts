import { Hono } from "hono";

import { admin } from "./admin/admin";
import { user } from "./user/user";

export const api = new Hono().basePath("/v1");

api.route("/admin", admin);
api.route("/user", user);