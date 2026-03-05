import { z } from "zod";

export const ratingSchema = z
	.number()
	.int("Rating must be a whole number")
	.min(1, "Pick a rating from 1 to 5")
	.max(5, "Pick a rating from 1 to 5");

export const commentSchema = z
	.string()
	.trim()
	.max(1000, "Comment must be at most 1000 characters");

export const reviewsSearchSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	sortBy: z.enum(["createdAt", "rating"]).default("createdAt"),
	orderBy: z.enum(["asc", "desc"]).default("desc"),
});

export const createReviewSchema = z.object({
	bookId: z.uuid(),
	rating: ratingSchema,
	comment: commentSchema.optional(),
});

export const updateReviewSchema = z.object({
	reviewId: z.uuid(),
	rating: ratingSchema,
	comment: commentSchema.optional(),
});

export const deleteReviewSchema = z.object({ reviewId: z.uuid() });
