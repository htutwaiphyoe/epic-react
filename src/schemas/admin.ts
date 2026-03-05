import { z } from "zod";

const optionalText = (max: number, label: string) =>
	z
		.string()
		.trim()
		.max(max, `${label} must be at most ${max} characters`)
		.optional()
		.or(z.literal("").transform(() => undefined));

const optionalUrl = (label: string) =>
	z
		.union([z.literal(""), z.url(`${label} must be a valid URL`)])
		.optional()
		.transform((value) => (value ? value : undefined));

export const bookFormSchema = z.object({
	title: z
		.string()
		.trim()
		.min(1, "Title is required")
		.max(255, "Title must be at most 255 characters"),
	authorId: z.uuid("Pick an author"),
	isbn: optionalText(20, "ISBN"),
	description: optionalText(1000, "Description"),
	coverUrl: optionalUrl("Cover URL"),
	price: z
		.number("Price is required")
		.min(0, "Price cannot be negative")
		.max(100000, "Price looks wrong"),
	publishedDate: z.iso.date("Use a date like 2026-01-31"),
	stock: z
		.number("Stock is required")
		.int("Stock must be a whole number")
		.min(0, "Stock cannot be negative"),
});

export type BookForm = z.infer<typeof bookFormSchema>;

export const authorFormSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Name is required")
		.max(255, "Name must be at most 255 characters"),
	email: z.email("Email must be a valid email"),
	phone: optionalText(20, "Phone"),
	bio: optionalText(1000, "Bio"),
	nationality: optionalText(100, "Nationality"),
	birthDate: z
		.union([z.literal(""), z.iso.date("Use a date like 1970-01-31")])
		.optional()
		.transform((value) => (value ? value : undefined)),
	photoUrl: optionalUrl("Photo URL"),
});

export type AuthorForm = z.infer<typeof authorFormSchema>;

export const bookIdSchema = z.object({ bookId: z.uuid() });
export const authorIdSchema = z.object({ authorId: z.uuid() });
