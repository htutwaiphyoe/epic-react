import type { OrderStatus } from "@/server/types";

const STYLES: Record<OrderStatus, string> = {
	pending: "border-amber-600/30 bg-amber-500/10 text-amber-700",
	paid: "border-emerald-600/30 bg-emerald-500/10 text-emerald-700",
	shipped: "border-sky-600/30 bg-sky-500/10 text-sky-700",
	cancelled: "border-border bg-muted text-muted-foreground",
};

export const OrderStatusBadge = ({ status }: { status: OrderStatus }) => (
	<span
		className={`inline-block rounded-full border px-2.5 py-0.5 text-xs uppercase tracking-[0.1em] ${STYLES[status]}`}
	>
		{status}
	</span>
);
