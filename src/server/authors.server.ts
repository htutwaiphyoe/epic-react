import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authorsSearchSchema } from "@/schemas/catalog";
import { requestApi } from "./api-client";
import type { AuthorResponse, AuthorsResponse } from "./types";

export const getAuthorsFn = createServerFn({ method: "GET" })
	.validator(authorsSearchSchema)
	.handler(async ({ data }) => {
		const body = await requestApi<AuthorsResponse>("/authors", { query: data });
		return { authors: body.authors, pagination: body.pagination };
	});

export const getAuthorFn = createServerFn({ method: "GET" })
	.validator(z.object({ authorId: z.uuid() }))
	.handler(async ({ data }) => {
		const body = await requestApi<AuthorResponse>(`/authors/${data.authorId}`);
		return body.author;
	});
