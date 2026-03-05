import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Package } from "lucide-react";
import { OrderCovers } from "@/features/orders/OrderCovers";
import { OrderStatusBadge } from "@/features/orders/OrderStatusBadge";
import { Pagination } from "@/features/shared/Pagination";
import { formatMoney } from "@/lib/money";
import { ordersSearchSchema } from "@/schemas/catalog";
import { getOrdersFn } from "@/server/orders";

export const Route = createFileRoute("/_authed/account/orders/")({
	validateSearch: ordersSearchSchema,
	loaderDeps: ({ search }) => search,
	loader: ({ deps }) => getOrdersFn({ data: deps }),
	component: OrdersPage,
});

const summarise = (items: { title: string }[]) => {
	const [first] = items;

	if (!first) return "No books";
	if (items.length === 1) return first.title;

	return `${first.title} + ${items.length - 1} more`;
};

const countBooks = (items: { quantity: number }[]) => {
	const total = items.reduce((sum, item) => sum + item.quantity, 0);
	return `${total} ${total === 1 ? "book" : "books"}`;
};

const formatDate = (value: string) =>
	new Date(value).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});

function OrdersPage() {
	const { orders, pagination } = Route.useLoaderData();

	return (
		<div className="mx-auto max-w-2xl pb-16">
			<Link
				to="/account"
				className="text-muted-foreground text-sm transition-colors hover:text-foreground"
			>
				← Account
			</Link>

			<header className="mt-8">
				<p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
					{pagination.total} {pagination.total === 1 ? "order" : "orders"}
				</p>
				<h1 className="mt-3 text-4xl leading-[1.1]">Orders</h1>
			</header>

			{orders.length === 0 ? (
				<div className="mt-10 rounded-sm border border-dashed py-20 text-center">
					<Package
						className="mx-auto size-7 text-muted-foreground"
						strokeWidth={1.5}
					/>
					<p className="mt-4 font-serif text-lg">No orders yet</p>
					<Link
						to="/books"
						className="mt-4 inline-block text-sm underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
					>
						Browse the catalog
					</Link>
				</div>
			) : (
				<div className="mt-6 divide-y border-t border-b">
					{orders.map((order) => (
						<Link
							key={order.id}
							to="/account/orders/$orderId"
							params={{ orderId: order.id }}
							className="group flex items-center gap-5 py-5 transition-colors hover:bg-muted/40"
						>
							<OrderCovers items={order.items} />

							<div className="min-w-0 flex-1">
								<p className="truncate font-medium">{summarise(order.items)}</p>
								<p className="mt-1 text-muted-foreground text-sm">
									{formatDate(order.createdAt)} · {countBooks(order.items)}
								</p>
							</div>

							<div className="shrink-0 text-right">
								<p className="font-medium tabular-nums">
									{formatMoney(order.total)}
								</p>
								<div className="mt-1.5">
									<OrderStatusBadge status={order.status} />
								</div>
							</div>

							<ChevronRight
								className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
								strokeWidth={1.75}
							/>
						</Link>
					))}
				</div>
			)}

			<Pagination pagination={pagination} noun="order" />
		</div>
	);
}
