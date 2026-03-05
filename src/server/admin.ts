import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	authorFormSchema,
	authorIdSchema,
	bookFormSchema,
	bookIdSchema,
} from "@/schemas/admin";
import { authedRequest } from "./authed";
import { readSession } from "./session";
import type { AuthorResponse, BookResponse, OrderResponse } from "./types";

const CAN_MANAGE = ["admin", "publisher"] as const;

const assertManager = async () => {
	const session = await readSession();
	const role = session.user?.role;

	if (!role || !CAN_MANAGE.includes(role as (typeof CAN_MANAGE)[number])) {
		throw new Error("You do not have permission to manage the catalog.");
	}

	return session.user;
};

export const createBookFn = createServerFn({ method: "POST" })
	.validator(bookFormSchema)
	.handler(async ({ data }) => {
		await assertManager();

		const body = await authedRequest<BookResponse>("/books", {
			method: "POST",
			body: data,
		});

		return body.book;
	});

export const updateBookFn = createServerFn({ method: "POST" })
	.validator(bookFormSchema.extend(bookIdSchema.shape))
	.handler(async ({ data }) => {
		await assertManager();

		const { bookId, ...values } = data;
		const body = await authedRequest<BookResponse>(`/books/${bookId}`, {
			method: "PATCH",
			body: values,
		});

		return body.book;
	});

export const deleteBookFn = createServerFn({ method: "POST" })
	.validator(bookIdSchema)
	.handler(async ({ data }) => {
		await assertManager();

		await authedRequest(`/books/${data.bookId}`, { method: "DELETE" });

		return { deleted: true };
	});

export const createAuthorFn = createServerFn({ method: "POST" })
	.validator(authorFormSchema)
	.handler(async ({ data }) => {
		await assertManager();

		const body = await authedRequest<AuthorResponse>("/authors", {
			method: "POST",
			body: data,
		});

		return body.author;
	});

export const updateAuthorFn = createServerFn({ method: "POST" })
	.validator(authorFormSchema.extend(authorIdSchema.shape))
	.handler(async ({ data }) => {
		await assertManager();

		const { authorId, ...values } = data;
		const body = await authedRequest<AuthorResponse>(`/authors/${authorId}`, {
			method: "PATCH",
			body: values,
		});

		return body.author;
	});

export const deleteAuthorFn = createServerFn({ method: "POST" })
	.validator(authorIdSchema)
	.handler(async ({ data }) => {
		await assertManager();

		await authedRequest(`/authors/${data.authorId}`, { method: "DELETE" });

		return { deleted: true };
	});

export const updateOrderStatusFn = createServerFn({ method: "POST" })
	.validator(
		z.object({
			orderId: z.uuid(),
			status: z.enum(["paid", "shipped"]),
		}),
	)
	.handler(async ({ data }) => {
		const session = await readSession();

		if (session.user?.role !== "admin") {
			throw new Error("Only an administrator can change an order's status.");
		}

		const body = await authedRequest<OrderResponse>(
			`/orders/${data.orderId}/status`,
			{ method: "PATCH", body: { status: data.status } },
		);

		return body.order;
	});
