import { Hono } from "hono";
import type { AppEnv } from "../../config/app";
import { requireOrganization } from "../admin/middleware";

export const landmarksRouter = new Hono<AppEnv>();

landmarksRouter.use("*", requireOrganization);

landmarksRouter.get("/search", async (c) => {
    c.status(200)
});

landmarksRouter.get("/:id", async (c) => {

});

export type LandmarkCheckData = {

};

landmarksRouter.post("/check", async (c) => {

});

landmarksRouter.post("/visit", async (c) => {

});