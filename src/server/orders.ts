import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ordersSearchSchema } from "@/schemas/catalog";
import { authedRequest } from "./authed";
import type { OrderResponse, OrdersResponse } from "./types";

export const getOrdersFn = createServerFn({ method: "GET" })
	.validator(ordersSearchSchema)
	.handler(async ({ data }) => {
		const { tz, ...filters } = data;

		const body = await authedRequest<OrdersResponse>("/orders", {
			query: { ...filters, tzOffset: tz },
		});

		return { orders: body.orders, pagination: body.pagination };
	});

export const getOrderFn = createServerFn({ method: "GET" })
	.validator(z.object({ orderId: z.uuid() }))
	.handler(async ({ data }) => {
		const body = await authedRequest<OrderResponse>(`/orders/${data.orderId}`);
		return body.order;
	});

export const cancelOrderFn = createServerFn({ method: "POST" })
	.validator(z.object({ orderId: z.uuid() }))
	.handler(async ({ data }) => {
		const body = await authedRequest<OrderResponse>(
			`/orders/${data.orderId}/cancel`,
			{ method: "PATCH" },
		);
		return body.order;
	});
