import { createServerFn } from "@tanstack/react-start";
import {
	addCartItemSchema,
	checkoutSchema,
	removeCartItemSchema,
	updateCartItemSchema,
} from "@/schemas/cart";
import { authedRequest } from "./authed";
import type { CartResponse, OrderResponse } from "./types";

export const getCartFn = createServerFn({ method: "GET" }).handler(async () => {
	const body = await authedRequest<CartResponse>("/cart");
	return body.cart;
});

export const addCartItemFn = createServerFn({ method: "POST" })
	.validator(addCartItemSchema)
	.handler(async ({ data }) => {
		const body = await authedRequest<CartResponse>("/cart/items", {
			method: "POST",
			body: data,
		});
		return body.cart;
	});

export const updateCartItemFn = createServerFn({ method: "POST" })
	.validator(updateCartItemSchema)
	.handler(async ({ data }) => {
		const body = await authedRequest<CartResponse>(
			`/cart/items/${data.itemId}`,
			{
				method: "PATCH",
				body: { quantity: data.quantity },
			},
		);
		return body.cart;
	});

export const removeCartItemFn = createServerFn({ method: "POST" })
	.validator(removeCartItemSchema)
	.handler(async ({ data }) => {
		const body = await authedRequest<CartResponse>(
			`/cart/items/${data.itemId}`,
			{
				method: "DELETE",
			},
		);
		return body.cart;
	});

export const clearCartFn = createServerFn({ method: "POST" }).handler(
	async () => {
		const body = await authedRequest<CartResponse>("/cart", {
			method: "DELETE",
		});
		return body.cart;
	},
);

export const checkoutFn = createServerFn({ method: "POST" })
	.validator(checkoutSchema)
	.handler(async ({ data }) => {
		const body = await authedRequest<OrderResponse>("/cart/checkout", {
			method: "POST",
			body: data,
		});
		return body.order;
	});
