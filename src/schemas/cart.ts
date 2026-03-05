import { z } from "zod";

export const MAX_CART_QUANTITY = 99;

const quantitySchema = z
	.number()
	.int("Quantity must be a whole number")
	.min(1, "Quantity must be at least 1")
	.max(MAX_CART_QUANTITY, `Quantity must be at most ${MAX_CART_QUANTITY}`);

export const addCartItemSchema = z.object({
	bookId: z.uuid(),
	quantity: quantitySchema.default(1),
});

export const updateCartItemSchema = z.object({
	itemId: z.uuid(),
	quantity: quantitySchema,
});

export const removeCartItemSchema = z.object({ itemId: z.uuid() });

export const addressSchema = z.object({
	recipient: z.string().trim().min(1, "Who is it for?").max(255),
	phone: z.string().trim().min(1, "A phone number helps delivery").max(30),
	line1: z.string().trim().min(1, "Street address is required").max(255),
	line2: z
		.string()
		.trim()
		.max(255)
		.optional()
		.or(z.literal("").transform(() => undefined)),
	city: z.string().trim().min(1, "City is required").max(120),
	postalCode: z
		.string()
		.trim()
		.max(20)
		.optional()
		.or(z.literal("").transform(() => undefined)),
	country: z.string().trim().min(1, "Country is required").max(120),
});

export type AddressForm = z.infer<typeof addressSchema>;

export const checkoutSchema = z.object({
	address: addressSchema,
	itemIds: z.array(z.uuid()).min(1).optional(),
});
