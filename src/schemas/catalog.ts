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
		.enum(["title", "price", "publishedDate", "stock", "createdAt"])
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
