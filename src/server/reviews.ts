import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { consoleReviewsSearchSchema } from "@/schemas/catalog";
import {
	createReviewSchema,
	deleteReviewSchema,
	reviewsSearchSchema,
	updateReviewSchema,
} from "@/schemas/reviews";
import { requestApi } from "./api-client";
import { authedRequest } from "./authed";
import { readSession } from "./session";
import type {
	ConsoleReviewsResponse,
	ReviewEligibilityResponse,
	ReviewResponse,
	ReviewsResponse,
} from "./types";

export const getBookReviewsFn = createServerFn({ method: "GET" })
	.validator(reviewsSearchSchema.extend({ bookId: z.uuid() }))
	.handler(async ({ data }) => {
		const { bookId, ...query } = data;
		const body = await requestApi<ReviewsResponse>(`/books/${bookId}/reviews`, {
			query,
		});

		return { reviews: body.reviews, pagination: body.pagination };
	});

export const getReviewEligibilityFn = createServerFn({ method: "GET" })
	.validator(z.object({ bookId: z.uuid() }))
	.handler(async ({ data }) => {
		const session = await readSession();

		if (!session.user || session.user.role === "admin") {
			return null;
		}

		const body = await authedRequest<ReviewEligibilityResponse>(
			`/books/${data.bookId}/reviews/eligibility`,
		);

		return body.eligibility;
	});

export const createReviewFn = createServerFn({ method: "POST" })
	.validator(createReviewSchema)
	.handler(async ({ data }) => {
		const { bookId, ...body } = data;
		const response = await authedRequest<ReviewResponse>(
			`/books/${bookId}/reviews`,
			{ method: "POST", body },
		);

		return response.review;
	});

export const updateReviewFn = createServerFn({ method: "POST" })
	.validator(updateReviewSchema)
	.handler(async ({ data }) => {
		const { reviewId, ...body } = data;
		const response = await authedRequest<ReviewResponse>(
			`/reviews/${reviewId}`,
			{ method: "PATCH", body },
		);

		return response.review;
	});

export const deleteReviewFn = createServerFn({ method: "POST" })
	.validator(deleteReviewSchema)
	.handler(async ({ data }) => {
		await authedRequest(`/reviews/${data.reviewId}`, { method: "DELETE" });

		return { deleted: true };
	});

export const getConsoleReviewsFn = createServerFn({ method: "GET" })
	.validator(consoleReviewsSearchSchema)
	.handler(async ({ data }) => {
		const body = await authedRequest<ConsoleReviewsResponse>("/reviews", {
			query: data,
		});

		return { reviews: body.reviews, pagination: body.pagination };
	});
