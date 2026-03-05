import { Ban, Check } from "lucide-react";
import type { OrderStatus } from "@/server/types";

const STEPS = [
	{ status: "pending", label: "Placed", hint: "Awaiting payment" },
	{ status: "paid", label: "Paid", hint: "Payment received" },
	{ status: "shipped", label: "Shipped", hint: "On its way" },
] as const;

const REACHED: Record<OrderStatus, number> = {
	pending: 0,
	paid: 1,
	shipped: 2,
	cancelled: 0,
};

export const OrderProgress = ({ status }: { status: OrderStatus }) => {
	if (status === "cancelled") {
		return (
			<div className="flex items-center gap-3 rounded-sm border bg-muted/50 px-4 py-3.5">
				<Ban
					className="size-4 shrink-0 text-muted-foreground"
					strokeWidth={1.75}
				/>
				<div>
					<p className="font-medium text-sm">Cancelled</p>
					<p className="text-muted-foreground text-sm">
						Every book was returned to stock.
					</p>
				</div>
			</div>
		);
	}

	const reached = REACHED[status];

	return (
		<ol className="flex items-start">
			{STEPS.map((step, index) => {
				const done = index <= reached;
				const current = index === reached;

				return (
					<li key={step.status} className="flex flex-1 items-start gap-3">
						<div className="flex flex-col items-center">
							<span
								className={`grid size-7 shrink-0 place-items-center rounded-full border text-[11px] tabular-nums ${
									done
										? "border-primary bg-primary text-primary-foreground"
										: "border-border text-muted-foreground"
								}`}
							>
								{done ? (
									<Check className="size-3.5" strokeWidth={2.5} />
								) : (
									index + 1
								)}
							</span>
						</div>

						<div className="min-w-0 flex-1 pt-0.5">
							<p
								className={`text-sm ${current ? "font-medium" : done ? "" : "text-muted-foreground"}`}
							>
								{step.label}
							</p>
							<p className="mt-0.5 text-muted-foreground text-xs">
								{step.hint}
							</p>

							{index < STEPS.length - 1 ? (
								<span
									className={`mt-3 mr-4 block h-px ${index < reached ? "bg-primary" : "bg-border"}`}
								/>
							) : null}
						</div>
					</li>
				);
			})}
		</ol>
	);
};
