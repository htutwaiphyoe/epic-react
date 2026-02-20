import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { booksSearchSchema } from "@/schemas/catalog";
import { requestApi } from "./api-client";
import type { BookResponse, BooksResponse } from "./types";

export const getBooksFn = createServerFn({ method: "GET" })
	.validator(booksSearchSchema)
	.handler(async ({ data }) => {
		const body = await requestApi<BooksResponse>("/books", { query: data });
		return { books: body.books, pagination: body.pagination };
	});

export const getBookFn = createServerFn({ method: "GET" })
	.validator(z.object({ bookId: z.uuid() }))
	.handler(async ({ data }) => {
		const body = await requestApi<BookResponse>(`/books/${data.bookId}`);
		return body.book;
	});

export const getBooksByAuthorFn = createServerFn({ method: "GET" })
	.validator(booksSearchSchema.extend({ authorId: z.uuid() }))
	.handler(async ({ data }) => {
		const { authorId, ...query } = data;
		const body = await requestApi<BooksResponse>(`/authors/${authorId}/books`, {
			query,
		});
		return { books: body.books, pagination: body.pagination };
	});
