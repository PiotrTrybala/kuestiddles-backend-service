import { Hono } from "hono";
import { sql } from "drizzle-orm";

import { assets } from "../database/schema/kuestiddles";
import { database } from "../database/db";

export const assetsRouter = new Hono();

assetsRouter.get("/list", async (c) => {

    const res1 = sql`SELECT now()`;
    console.log('Test result 1:', res1);
    const res2 = await database.select().from(assets).then((value) => value);
    console.log("Test result 2:", res2);

    // console.log(result);
    // const result = await database.select().from(assets).limit(100);

    // console.log(result);

    return c.json({ placeholder: true });
});

assetsRouter.get("/:id", (c) => {



    return c.json({ placeholder: true });
});

assetsRouter.post("/upload", (c) => {
    return c.json({ placeholder: true });
});

assetsRouter.delete("/:id", (c) => {
    return c.json({ placeholder: true });
});