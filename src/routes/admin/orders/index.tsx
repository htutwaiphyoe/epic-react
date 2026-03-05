import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { DateRangeFilter, formatRange } from "@/features/admin/DateRangeFilter";
import { OrderCovers } from "@/features/orders/OrderCovers";
import { OrderStatusBadge } from "@/features/orders/OrderStatusBadge";
import { Pagination } from "@/features/shared/Pagination";
import { formatMoney } from "@/lib/money";
import { ordersSearchSchema } from "@/schemas/catalog";
import { getOrdersFn } from "@/server/orders";

const STATUSES = ["pending", "paid", "shipped", "cancelled"] as const;

export const Route = createFileRoute("/admin/orders/")({
	validateSearch: ordersSearchSchema,
	beforeLoad: ({ context }) => {
		if (context.user?.role !== "admin") {
			throw redirect({ to: "/admin" });
		}
	},
	loaderDeps: ({ search }) => search,
	loader: ({ deps }) => getOrdersFn({ data: deps }),
	component: AdminOrdersPage,
});

const formatDate = (value: string) =>
	new Date(value).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});

function AdminOrdersPage() {
	const { orders, pagination } = Route.useLoaderData();
	const search = Route.useSearch();
	const navigate = Route.useNavigate();

	const setStatus = (status?: (typeof STATUSES)[number]) =>
		navigate({ search: (prev) => ({ ...prev, status, page: 1 }) });

	const rangeLabel = formatRange(search);

	return (
		<>
			<header>
				<p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
					{pagination.total} {pagination.total === 1 ? "order" : "orders"}
					{search.status ? ` · ${search.status}` : ""}
					{rangeLabel ? ` · ${rangeLabel}` : ""}
				</p>
				<h1 className="mt-3 text-4xl leading-[1.1]">Orders</h1>
			</header>

			<div className="mt-7 flex flex-wrap items-center justify-between gap-4">
				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						onClick={() => setStatus(undefined)}
						className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors hover:bg-muted ${
							search.status ? "text-muted-foreground" : "bg-muted"
						}`}
					>
						All
					</button>

					{STATUSES.map((status) => (
						<button
							key={status}
							type="button"
							onClick={() => setStatus(status)}
							className={`rounded-full border px-3.5 py-1.5 text-sm capitalize transition-colors hover:bg-muted ${
								search.status === status ? "bg-muted" : "text-muted-foreground"
							}`}
						>
							{status}
						</button>
					))}
				</div>

				<DateRangeFilter
					range={search}
					onChange={(range) =>
						navigate({
							search: (prev) => ({
								...prev,
								...range,
								tz:
									range.from || range.to
										? new Date().getTimezoneOffset()
										: undefined,
								page: 1,
							}),
						})
					}
				/>
			</div>

			{orders.length === 0 ? (
				<div className="mt-8 rounded-sm border border-dashed py-16 text-center">
					<p className="font-serif text-lg">No orders here</p>
				</div>
			) : (
				<div className="mt-6 divide-y border-t border-b">
					{orders.map((order) => (
						<Link
							key={order.id}
							to="/admin/orders/$orderId"
							params={{ orderId: order.id }}
							className="group flex items-center gap-4 py-4 transition-colors hover:bg-muted/40"
						>
							<OrderCovers items={order.items} max={2} />

							<div className="min-w-0 flex-1">
								<p className="truncate font-medium">{order.customer.name}</p>
								<p className="mt-1 truncate text-muted-foreground text-sm">
									{formatDate(order.createdAt)} · #{order.id.slice(0, 8)}
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
		</>
	);
}
