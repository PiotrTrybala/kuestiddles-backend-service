import type { AppEnv } from "@/config/app";
import { Hono } from "hono";
import { uploadsRouter } from "./uploads";

export const organizationsRouter = new Hono<AppEnv>();

const organization = organizationsRouter.basePath("/:organizationSlug");

organization.route("/uploads", uploadsRouter);