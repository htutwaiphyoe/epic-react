import { CalendarRange, X } from "lucide-react";
import { useState } from "react";
import type { DateRange as CalendarRangeValue } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { formatDay, startOfMonth, toDay, toValue } from "@/lib/day";
import { useMinWidth } from "@/lib/media";

export type DateRange = { from?: string; to?: string };

export const formatRange = ({ from, to }: DateRange) => {
	if (from && to) {
		return from === to
			? formatDay(from)
			: `${formatDay(from)} – ${formatDay(to)}`;
	}

	if (from) {
		return `from ${formatDay(from)}`;
	}

	return to ? `until ${formatDay(to)}` : undefined;
};

const shiftDays = (days: number) => {
	const date = new Date();

	date.setDate(date.getDate() + days);

	return date;
};

const monthsAgo = (months: number) => {
	const date = new Date();

	date.setDate(1);
	date.setMonth(date.getMonth() - months);

	return date;
};

const PRESETS = [
	{ label: "Today", range: () => ({ from: new Date(), to: new Date() }) },
	{
		label: "Last 7 days",
		range: () => ({ from: shiftDays(-6), to: new Date() }),
	},
	{
		label: "Last 30 days",
		range: () => ({ from: shiftDays(-29), to: new Date() }),
	},
	{
		label: "This month",
		range: () => {
			const now = new Date();

			return {
				from: new Date(now.getFullYear(), now.getMonth(), 1),
				to: now,
			};
		},
	},
] as const;

type Props = {
	range: DateRange;
	onChange: (range: DateRange) => void;
};

export const DateRangeFilter = ({ range, onChange }: Props) => {
	const [open, setOpen] = useState(false);
	// two months only fit side by side; the calendar itself stacks them below md
	const months = useMinWidth(768) ? 2 : 1;

	const selected: CalendarRangeValue | undefined = range.from
		? { from: toDay(range.from), to: range.to ? toDay(range.to) : undefined }
		: undefined;

	const active = Boolean(range.from || range.to);

	// never spend a pane on a month that is entirely in the future
	const anchorMonth = () => {
		if (!selected?.from) {
			return months === 2 ? monthsAgo(1) : new Date();
		}

		const isThisMonth =
			startOfMonth(selected.from).getTime() ===
			startOfMonth(new Date()).getTime();

		return months === 2 && isThisMonth ? monthsAgo(1) : selected.from;
	};

	const apply = (next: { from: Date; to: Date }) => {
		onChange({ from: toValue(next.from), to: toValue(next.to) });
		setOpen(false);
	};

	return (
		<div className="flex items-center gap-1">
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className={`rounded-full font-normal ${active ? "" : "text-muted-foreground"}`}
					>
						<CalendarRange className="size-4" strokeWidth={1.75} />
						{formatRange(range) ?? "Any date"}
					</Button>
				</PopoverTrigger>

				<PopoverContent
					align="end"
					className="max-h-[70vh] w-auto max-w-[calc(100vw-2rem)] overflow-y-auto p-0"
				>
					<div className="flex flex-wrap justify-center gap-1.5 border-b p-3">
						{PRESETS.map((preset) => (
							<Button
								key={preset.label}
								variant="ghost"
								size="sm"
								onClick={() => apply(preset.range())}
								className="rounded-full font-normal text-muted-foreground hover:text-foreground"
							>
								{preset.label}
							</Button>
						))}
					</div>

					<Calendar
						mode="range"
						numberOfMonths={months}
						showOutsideDays={false}
						selected={selected}
						defaultMonth={anchorMonth()}
						disabled={{ after: new Date() }}
						onSelect={(next) =>
							onChange({
								from: next?.from ? toValue(next.from) : undefined,
								to: next?.to ? toValue(next.to) : undefined,
							})
						}
					/>
				</PopoverContent>
			</Popover>

			{active && (
				<Button
					variant="ghost"
					size="icon"
					aria-label="Clear the date range"
					onClick={() => onChange({ from: undefined, to: undefined })}
					className="rounded-full text-muted-foreground hover:text-foreground"
				>
					<X className="size-4" strokeWidth={1.75} />
				</Button>
			)}
		</div>
	);
};
