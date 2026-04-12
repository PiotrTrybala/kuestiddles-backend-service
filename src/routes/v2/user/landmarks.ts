import { Hono } from "hono";
import type { AppEnv } from "../../config/app";
import { requireOrganization } from "../admin/middleware";
import { checkLandmark, getLandmark, listLandmarks, visitLandmark } from "../../repositories/landmarks";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export const landmarksRouter = new Hono<AppEnv>();

landmarksRouter.use("*", requireOrganization);

landmarksRouter.get("/search", async (c) => {
    const organization = c.get("organization")!;

    const page = Math.max(0, parseInt(c.req.query("page") ?? "0", 10) || 0);
    const pageSize = Math.max(1, parseInt(c.req.query("pageSize") ?? "20", 10) || 20);
    const labels = (c.req.query("labels") || "")
        .split(",")
        .map(l => l.trim())
        .filter(Boolean);

    const name = c.req.query("name")!;

    const { landmarks } = await listLandmarks(organization.id, { page, pageSize, name, labels });

    return c.json({ page, landmarks, });
});

landmarksRouter.get("/:id", async (c) => {
const organization = c.get("organization")!;
    const user = c.get("user")!;

    const id = c.req.param("id");

    const { landmark, error } = await getLandmark(id);

    if (error) {
        return c.json({
            message: error.error,
        }, error.code as ContentfulStatusCode);
    }

    return c.json(landmark);
});

export type LandmarkCheckData = {
    landmarkId: string,
    position: {
        longitude: number,
        latitude: number,
    },
    range: number,
};

landmarksRouter.post("/check", async (c) => {

    const organization = c.get("organization")!;
    const body = await c.req.json<LandmarkCheckData>();

    const { isRange, error } = await checkLandmark(
        body.landmarkId,
        body.position,
        body.range,
    );

    if (error) {
        return c.json({
            message: error.error,
        }, error.code as ContentfulStatusCode);
    }

    return c.json({ isRange });

});

export type LandmarkVisitData = {
    landmarkId: string,
};

landmarksRouter.post("/visit", async (c) => {

    const organization = c.get("organization")!;
    const user = c.get("user")!;
    const body = await c.req.json<LandmarkVisitData>();

    const { success } = await visitLandmark(
        body.landmarkId,
        user.id,
    );

    if (!success) {
        return c.json({
            message: "Failed to visit landmark",
        }, 500);
    }

    return c.json({
        message: "Landmark visited",
    });

});