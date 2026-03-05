import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { toDay } from "@/lib/day";
import { formatMoney, sumMoney } from "@/lib/money";
import type { OverviewReport } from "@/server/types";

const config = {
	revenue: { label: "Revenue", color: "var(--color-foreground)" },
} satisfies ChartConfig;

const shortDay = (value: string) =>
	toDay(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });

type Props = { trend: OverviewReport["trend"] };

export const RevenueChart = ({ trend }: Props) => {
	const points = trend.map((point) => ({
		day: point.day,
		revenue: Number(point.revenue),
		orders: point.orders,
	}));

	const total = sumMoney(trend.map((point) => point.revenue));
	const busiest = Math.max(...points.map((point) => point.revenue));

	return (
		<section className="min-w-0 rounded-sm border bg-card px-5 py-5">
			<div className="flex flex-wrap items-baseline justify-between gap-2">
				<p className="text-muted-foreground text-xs uppercase tracking-[0.14em]">
					Revenue, last 30 days
				</p>
				<p className="text-muted-foreground text-sm">
					{formatMoney(total)} settled
				</p>
			</div>

			{busiest === 0 ? (
				<p className="py-14 text-center text-muted-foreground text-sm">
					No settled revenue in the last 30 days.
				</p>
			) : (
				<ChartContainer config={config} className="mt-5 h-56 w-full">
					<AreaChart data={points} margin={{ left: 4, right: 4, top: 4 }}>
						<defs>
							<linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="0%"
									stopColor="var(--color-revenue)"
									stopOpacity={0.18}
								/>
								<stop
									offset="100%"
									stopColor="var(--color-revenue)"
									stopOpacity={0}
								/>
							</linearGradient>
						</defs>

						<CartesianGrid vertical={false} strokeOpacity={0.4} />

						<XAxis
							dataKey="day"
							tickLine={false}
							axisLine={false}
							tickMargin={10}
							minTickGap={24}
							tickFormatter={shortDay}
						/>

						<YAxis
							width={52}
							tickLine={false}
							axisLine={false}
							tickFormatter={(value: number) => `$${value}`}
						/>

						<ChartTooltip
							content={
								<ChartTooltipContent
									labelFormatter={(_, payload) =>
										shortDay(String(payload?.[0]?.payload?.day ?? ""))
									}
									formatter={(value) => formatMoney(String(value))}
								/>
							}
						/>

						<Area
							dataKey="revenue"
							type="monotone"
							stroke="var(--color-revenue)"
							strokeWidth={2}
							fill="url(#revenueFill)"
						/>
					</AreaChart>
				</ChartContainer>
			)}
		</section>
	);
};
