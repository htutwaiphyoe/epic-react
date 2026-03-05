import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Ban } from "lucide-react";
import { useState } from "react";
import { BookCover } from "@/features/books/BookCover";
import { formatAddress } from "@/features/cart/AddressForm";
import { OrderProgress } from "@/features/orders/OrderProgress";
import { OrderStatusBadge } from "@/features/orders/OrderStatusBadge";
import { formatMoney, multiplyMoney } from "@/lib/money";
import { cancelOrderFn, getOrderFn } from "@/server/orders";

export const Route = createFileRoute("/_authed/account/orders/$orderId")({
	loader: ({ params }) => getOrderFn({ data: { orderId: params.orderId } }),
	component: OrderDetailPage,
});

const countBooks = (items: { quantity: number }[]) => {
	const total = items.reduce((sum, item) => sum + item.quantity, 0);
	return `${total} ${total === 1 ? "book" : "books"}`;
};

const formatDateTime = (value: string) =>
	new Date(value).toLocaleString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});

function OrderDetailPage() {
	const order = Route.useLoaderData();
	const router = useRouter();
	const [error, setError] = useState<string>();
	const [busy, setBusy] = useState(false);

	const cancel = async () => {
		setError(undefined);
		setBusy(true);
		try {
			await cancelOrderFn({ data: { orderId: order.id } });
			await router.invalidate();
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : "Could not cancel the order.",
			);
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="mx-auto max-w-5xl pb-16">
			<Link
				to="/account/orders"
				search={{ page: 1, limit: 20, sortBy: "createdAt", orderBy: "desc" }}
				className="text-muted-foreground text-sm transition-colors hover:text-foreground"
			>
				← All orders
			</Link>

			<header className="mt-8 flex flex-wrap items-start justify-between gap-4">
				<div>
					<p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
						Order #{order.id.slice(0, 8)}
					</p>
					<h1 className="mt-3 text-4xl leading-[1.1]">
						{countBooks(order.items)}
					</h1>
					<p className="mt-2 text-muted-foreground text-sm">
						Placed {formatDateTime(order.createdAt)}
					</p>
				</div>

				<OrderStatusBadge status={order.status} />
			</header>

			<div className="mt-9">
				<OrderProgress status={order.status} />
			</div>

			{error ? (
				<p
					role="alert"
					className="mt-6 rounded-sm border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-[14px] text-destructive"
				>
					{error}
				</p>
			) : null}

			<div className="mt-10 grid gap-12 lg:grid-cols-[1fr_18rem] lg:items-start">
				<div className="divide-y border-t border-b">
					{order.items.map((item) => (
						<div key={item.id} className="flex gap-5 py-5">
							<div className="w-14 shrink-0 self-start overflow-hidden rounded-sm ring-1 ring-black/10">
								<BookCover
									title={item.title}
									seed={item.bookId ?? item.id}
									coverUrl={item.coverUrl}
								/>
							</div>

							<div className="min-w-0 flex-1">
								{item.bookId ? (
									<Link
										to="/books/$bookId"
										params={{ bookId: item.bookId }}
										className="font-medium underline-offset-2 hover:underline"
									>
										{item.title}
									</Link>
								) : (
									<span className="font-medium">{item.title}</span>
								)}

								<p className="mt-1.5 text-muted-foreground text-sm tabular-nums">
									{formatMoney(item.price)} × {item.quantity}
								</p>
							</div>

							<p className="shrink-0 self-start font-medium tabular-nums">
								{formatMoney(multiplyMoney(item.price, item.quantity))}
							</p>
						</div>
					))}
				</div>

				<aside className="rounded-sm border bg-card p-6 lg:sticky lg:top-24">
					<p className="text-muted-foreground text-xs uppercase tracking-[0.14em]">
						{order.status === "paid" || order.status === "shipped"
							? "Total paid"
							: "Order total"}
					</p>

					<p className="mt-2 font-serif text-3xl tabular-nums">
						{formatMoney(order.total)}
					</p>

					<dl className="mt-5 space-y-2 text-sm">
						<div className="flex justify-between">
							<dt className="text-muted-foreground">Books</dt>
							<dd className="tabular-nums">{countBooks(order.items)}</dd>
						</div>
						<div className="flex justify-between">
							<dt className="text-muted-foreground">Status</dt>
							<dd className="capitalize">{order.status}</dd>
						</div>
					</dl>

					{order.status === "pending" ? (
						<>
							<button
								type="button"
								disabled={busy}
								onClick={cancel}
								className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-sm border px-4 py-2.5 text-sm transition-colors hover:bg-muted disabled:opacity-50"
							>
								{busy ? null : <Ban className="size-4" strokeWidth={1.75} />}
								{busy ? "Cancelling…" : "Cancel order"}
							</button>
							<p className="mt-3 text-muted-foreground text-xs">
								Cancelling returns every book to stock. Only pending orders can
								be cancelled.
							</p>
						</>
					) : null}

					{order.shippingAddress ? (
						<div className="rule-above mt-6 pt-5">
							<p className="text-muted-foreground text-xs uppercase tracking-[0.14em]">
								Delivering to
							</p>
							<p className="mt-2 font-medium text-sm">
								{order.shippingAddress.recipient}
							</p>
							<p className="text-muted-foreground text-sm">
								{order.shippingAddress.phone}
							</p>
							{formatAddress(order.shippingAddress).map((line) => (
								<p key={line} className="text-muted-foreground text-sm">
									{line}
								</p>
							))}
						</div>
					) : null}
				</aside>
			</div>
		</div>
	);
}
