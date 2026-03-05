import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { useMinWidth } from "@/lib/media";
import { formatMoney } from "@/lib/money";
import type { OverviewReport } from "@/server/types";

const config = {
	units: { label: "Copies sold", color: "var(--color-foreground)" },
} satisfies ChartConfig;

const clip = (title: string, limit: number) =>
	title.length > limit ? `${title.slice(0, limit - 1)}…` : title;

type Props = { titles: OverviewReport["topTitles"] };

export const TopTitlesChart = ({ titles }: Props) => {
	const wide = useMinWidth(640);

	return (
		<section className="min-w-0 rounded-sm border bg-card px-5 py-5">
			<p className="text-muted-foreground text-xs uppercase tracking-[0.14em]">
				Best sellers
			</p>

			{titles.length === 0 ? (
				<p className="py-14 text-center text-muted-foreground text-sm">
					No settled sales yet.
				</p>
			) : (
				<ChartContainer config={config} className="mt-5 h-56 w-full">
					<BarChart
						layout="vertical"
						data={titles.map((title) => ({
							...title,
							short: clip(title.title, wide ? 30 : 24),
						}))}
						margin={{ left: 4, right: 12 }}
					>
						<CartesianGrid horizontal={false} strokeOpacity={0.4} />

						<XAxis type="number" hide />

						<YAxis
							type="category"
							dataKey="short"
							width={wide ? 190 : 150}
							tickLine={false}
							axisLine={false}
							tick={{ fontSize: 12 }}
						/>

						<ChartTooltip
							content={
								<ChartTooltipContent
									labelFormatter={(_, payload) =>
										String(payload?.[0]?.payload?.title ?? "")
									}
									formatter={(value, _name, item) =>
										`${value} sold · ${formatMoney(String(item?.payload?.revenue ?? "0"))}`
									}
								/>
							}
						/>

						<Bar
							dataKey="units"
							fill="var(--color-units)"
							radius={[0, 3, 3, 0]}
							maxBarSize={22}
						/>
					</BarChart>
				</ChartContainer>
			)}
		</section>
	);
};
