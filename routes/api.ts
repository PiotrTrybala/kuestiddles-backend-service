import { Hono } from "hono";
import { admin } from "./admin";

export const api = new Hono().basePath("/v1");

api.route("/admin", admin);