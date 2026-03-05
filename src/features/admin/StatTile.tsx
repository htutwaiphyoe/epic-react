import type { LucideIcon } from "lucide-react";

type Props = {
	label: string;
	value: string;
	hint?: string;
	icon: LucideIcon;
};

export const StatTile = ({ label, value, hint, icon: Icon }: Props) => (
	<div data-testid="stat-tile" className="rounded-sm border bg-card px-5 py-5">
		<div className="flex min-h-8 items-start gap-2.5">
			<Icon
				className="mt-0.5 size-4 shrink-0 text-muted-foreground"
				strokeWidth={1.75}
			/>
			<span className="text-muted-foreground text-xs uppercase tracking-[0.14em]">
				{label}
			</span>
		</div>

		<p
			data-testid="stat-value"
			className="mt-3 font-serif text-3xl tabular-nums"
		>
			{value}
		</p>

		{hint && <p className="mt-1 text-muted-foreground text-sm">{hint}</p>}
	</div>
);
