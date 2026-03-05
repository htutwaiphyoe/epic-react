import { z } from "zod";

const paginationFields = {
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	orderBy: z.enum(["asc", "desc"]).default("desc"),
};

export const booksSearchSchema = z.object({
	...paginationFields,
	search: z.string().trim().min(1).optional(),
	sortBy: z
		.enum([
			"title",
			"price",
			"publishedDate",
			"stock",
			"ratingsAverage",
			"ratingsCount",
			"createdAt",
		])
		.default("createdAt"),
});

export type BooksSearch = z.infer<typeof booksSearchSchema>;

export const authorsSearchSchema = z.object({
	...paginationFields,
	sortBy: z
		.enum(["name", "email", "birthDate", "createdAt"])
		.default("createdAt"),
});

export type AuthorsSearch = z.infer<typeof authorsSearchSchema>;

const isCalendarDate = (value: string) => {
	const date = new Date(`${value}T00:00:00.000Z`);

	return (
		!Number.isNaN(date.getTime()) && date.toISOString().startsWith(`${value}T`)
	);
};

const daySchema = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/)
	.refine(isCalendarDate)
	.optional()
	.catch(undefined);

export const ordersSearchSchema = z.object({
	...paginationFields,
	status: z.enum(["pending", "paid", "shipped", "cancelled"]).optional(),
	from: daySchema,
	to: daySchema,
	tz: z.coerce.number().int().min(-840).max(840).optional().catch(undefined),
	sortBy: z.enum(["createdAt", "total", "status"]).default("createdAt"),
});

export type OrdersSearch = z.infer<typeof ordersSearchSchema>;

export const overviewSearchSchema = z.object({
	tz: z.coerce.number().int().min(-840).max(840).optional().catch(undefined),
});

export type OverviewSearch = z.infer<typeof overviewSearchSchema>;

export const consoleReviewsSearchSchema = z.object({
	...paginationFields,
	rating: z.coerce.number().int().min(1).max(5).optional().catch(undefined),
	sortBy: z.enum(["createdAt", "rating"]).default("createdAt"),
});

export type ConsoleReviewsSearch = z.infer<typeof consoleReviewsSearchSchema>;
