// `/:id{${UUID_PATTERN}}`

import type { AppEnv } from "@/config/app";
import { Hono } from "hono";

// Competition router - /competitions

export const competitionsRouter = new Hono<AppEnv>();

// Group router - /competitions/:competitionId/groups

// Invites router - /competitions/:competitionId/invites