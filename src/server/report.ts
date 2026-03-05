import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authedRequest } from "./authed";
import { readSession } from "./session";
import type { ReportResponse } from "./types";

export const getOverviewReportFn = createServerFn({ method: "GET" })
	.validator(z.object({ tz: z.number().int().optional() }))
	.handler(async ({ data }) => {
		const session = await readSession();

		if (session.user?.role !== "admin") {
			return null;
		}

		const body = await authedRequest<ReportResponse>("/report", {
			query: { tzOffset: data.tz },
		});

		return body.report;
	});
