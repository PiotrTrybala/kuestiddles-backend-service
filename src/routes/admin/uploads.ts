import { Hono } from "hono";
import type { AppEnv } from "../../config/app";
import { requireOrganization } from "./middleware";

export const uploadsRouter = new Hono<AppEnv>();

uploadsRouter.use("*", requireOrganization);

uploadsRouter.get("/", async (c) => {

});

uploadsRouter.get("/:uploadId", async (c) => {

});

uploadsRouter.post("/", async (c) => {

});

uploadsRouter.delete("/:uploadId", async (c) => {

});