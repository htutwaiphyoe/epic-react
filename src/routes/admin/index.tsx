import {
	createFileRoute,
	Link,
	retainSearchParams,
} from "@tanstack/react-router";
import {
	BookText,
	CircleDollarSign,
	Clock,
	Package,
	TrendingUp,
	UserRound,
	Users,
} from "lucide-react";
import { useEffect } from "react";
import { RevenueChart } from "@/features/admin/RevenueChart";
import { StatTile } from "@/features/admin/StatTile";
import { TopTitlesChart } from "@/features/admin/TopTitlesChart";
import { OrderStatusBadge } from "@/features/orders/OrderStatusBadge";
import { formatMoney } from "@/lib/money";
import { overviewSearchSchema } from "@/schemas/catalog";
import { getAuthorsFn } from "@/server/authors";
import { getBooksFn } from "@/server/books";
import { getOverviewReportFn } from "@/server/report";
import type { OrderStatus } from "@/server/types";

export const Route = createFileRoute("/admin/")({
	validateSearch: overviewSearchSchema,
	search: { middlewares: [retainSearchParams(["tz"])] },
	loaderDeps: ({ search }) => search,
	loader: async ({ deps, context }) => {
		if (context.user?.role === "admin") {
			return {
				report: await getOverviewReportFn({ data: { tz: deps.tz } }),
				books: null,
				authors: null,
			};
		}

		const [books, authors] = await Promise.all([
			getBooksFn({
				data: { page: 1, limit: 1, sortBy: "createdAt", orderBy: "desc" },
			}),
			getAuthorsFn({
				data: { page: 1, limit: 1, sortBy: "createdAt", orderBy: "desc" },
			}),
		]);

		return {
			report: null,
			books: books.pagination.total,
			authors: authors.pagination.total,
		};
	},
	component: OverviewPage,
});

const STATUSES: OrderStatus[] = ["pending", "paid", "shipped", "cancelled"];

const plural = (count: number, noun: string) =>
	`${count} ${count === 1 ? noun : `${noun}s`}`;

function OverviewPage() {
	const { report, books, authors } = Route.useLoaderData();
	const search = Route.useSearch();
	const navigate = Route.useNavigate();

	// the loader runs on the server, so the browser has to say which day is "today"
	useEffect(() => {
		if (search.tz === undefined) {
			navigate({
				search: (prev) => ({ ...prev, tz: new Date().getTimezoneOffset() }),
				replace: true,
				resetScroll: false,
			});
		}
	}, [search.tz, navigate]);

	const catalogCards = [
		{
			to: "/admin/books" as const,
			label: "Books",
			count: report ? report.catalog.books.total : (books ?? 0),
			icon: BookText,
			hint: report
				? report.catalog.books.outOfStock > 0
					? `${plural(report.catalog.books.outOfStock, "title")} out of stock`
					: "Every title in stock"
				: "Add, edit and retire titles",
		},
		{
			to: "/admin/authors" as const,
			label: "Authors",
			count: report ? report.catalog.authors.total : (authors ?? 0),
			icon: Users,
			hint: report
				? `${report.catalog.authors.addedSince} added this month`
				: "Keep author records current",
		},
		...(report
			? [
					{
						to: "/admin/orders" as const,
						label: "Orders",
						count: report.orders.placed,
						icon: Package,
						hint:
							report.orders.awaiting.orders > 0
								? `${report.orders.awaiting.orders} awaiting payment`
								: "Nothing awaiting payment",
					},
				]
			: []),
	];

	return (
		<>
			<header>
				<p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
					{report ? "Report" : "Catalog"}
				</p>
				<h1 className="mt-3 text-4xl leading-[1.1]">Overview</h1>
			</header>

			{report && (
				<>
					<div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<StatTile
							icon={CircleDollarSign}
							label="Revenue today"
							value={formatMoney(report.orders.today.revenue)}
							hint={`${plural(report.orders.today.orders, "order")} settled`}
						/>
						<StatTile
							icon={TrendingUp}
							label="This month"
							value={formatMoney(report.orders.month.revenue)}
							hint={`${plural(report.orders.month.orders, "order")} settled`}
						/>
						<StatTile
							icon={Clock}
							label="Awaiting payment"
							value={formatMoney(report.orders.awaiting.value)}
							hint={`across ${plural(report.orders.awaiting.orders, "order")}`}
						/>
						<StatTile
							icon={UserRound}
							label="Customers"
							value={String(report.customers.total)}
							hint={`${report.customers.joinedSince} new this month`}
						/>
					</div>

					<div className="mt-4">
						<RevenueChart trend={report.trend} />
					</div>

					<div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
						<TopTitlesChart titles={report.topTitles} />

						<section className="flex min-w-0 flex-col rounded-sm border bg-card px-5 py-5">
							<div className="flex flex-wrap items-baseline justify-between gap-2">
								<p className="text-muted-foreground text-xs uppercase tracking-[0.14em]">
									Orders by status
								</p>
								<p className="text-muted-foreground text-sm">
									{formatMoney(report.orders.allTime.revenue)} collected all
									time
								</p>
							</div>

							<div className="mt-4 flex flex-1 flex-wrap content-center gap-x-8 gap-y-5">
								{STATUSES.map((status) => (
									<Link
										key={status}
										to="/admin/orders"
										search={{
											page: 1,
											limit: 20,
											sortBy: "createdAt",
											orderBy: "desc",
											status,
										}}
										className="group"
									>
										<p className="font-serif text-2xl tabular-nums">
											{report.orders.byStatus[status]}
										</p>
										<div className="mt-1.5 transition-opacity group-hover:opacity-70">
											<OrderStatusBadge status={status} />
										</div>
									</Link>
								))}
							</div>
						</section>
					</div>
				</>
			)}

			<div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{catalogCards.map((card) => (
					<Link
						key={card.label}
						to={card.to}
						className="rounded-sm border bg-card px-5 py-5 transition-colors hover:bg-muted"
					>
						<div className="flex items-center gap-2.5">
							<card.icon
								className="size-4 text-muted-foreground"
								strokeWidth={1.75}
							/>
							<span className="text-muted-foreground text-xs uppercase tracking-[0.14em]">
								{card.label}
							</span>
						</div>

						<p className="mt-3 font-serif text-3xl tabular-nums">
							{card.count}
						</p>
						<p className="mt-1 text-muted-foreground text-sm">{card.hint}</p>
					</Link>
				))}
			</div>
		</>
	);
}
