import { Hono } from "hono";

export const landmarksRouter = new Hono();

landmarksRouter.get("/list", async (c) => {
    return c.json({ message: true });
});

landmarksRouter.get("/:id", async (c) => {
    return c.json({ message: true });
});

landmarksRouter.post("/", async (c) => {
    return c.json({ message: true });
});

landmarksRouter.patch("/", async (c) => {
    return c.json({ message: true });
});

landmarksRouter.delete("/:id", async (c) => {
    return c.json({ message: true });
});