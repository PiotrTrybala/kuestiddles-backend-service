import type { Serve } from "bun";

function router<W, R extends string>(routes: Serve.Routes<W, R>) {
	return routes;
}