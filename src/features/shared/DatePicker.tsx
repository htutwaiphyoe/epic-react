import { CalendarIcon, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { formatDay, isDay, toDay, toValue } from "@/lib/day";

type Props = {
	id: string;
	value: string;
	onChange: (value: string) => void;
	earliestYear?: number;
	allowFuture?: boolean;
	invalid?: boolean;
	disabled?: boolean;
	clearable?: boolean;
	placeholder?: string;
};

export const DatePicker = ({
	id,
	value,
	onChange,
	earliestYear = 1900,
	allowFuture,
	invalid,
	disabled,
	clearable,
	placeholder = "Pick a date",
}: Props) => {
	const [open, setOpen] = useState(false);

	const selected = isDay(value) ? toDay(value) : undefined;

	const today = new Date();
	const latest = allowFuture
		? new Date(today.getFullYear() + 5, 11, 31)
		: today;

	const commit = (next: string) => {
		onChange(next);
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					id={id}
					variant="outline"
					disabled={disabled}
					aria-invalid={invalid ? true : undefined}
					className={`h-auto w-full justify-between rounded-sm border bg-card px-3.5 py-2.5 font-normal text-[15px] hover:bg-card ${
						selected ? "" : "text-muted-foreground"
					}`}
				>
					{selected ? formatDay(value) : placeholder}
					<CalendarIcon
						className="size-4 shrink-0 text-muted-foreground"
						strokeWidth={1.75}
					/>
				</Button>
			</PopoverTrigger>

			<PopoverContent
				align="start"
				className="max-h-[70vh] w-auto max-w-[calc(100vw-2rem)] overflow-y-auto p-0"
			>
				<Calendar
					mode="single"
					captionLayout="dropdown"
					startMonth={new Date(earliestYear, 0, 1)}
					endMonth={latest}
					disabled={allowFuture ? undefined : { after: today }}
					selected={selected}
					defaultMonth={selected}
					onSelect={(next) => next && commit(toValue(next))}
				/>

				{clearable && selected && (
					<div className="border-t p-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => commit("")}
							className="w-full rounded-sm font-normal text-muted-foreground hover:text-foreground"
						>
							<X className="size-3.5" strokeWidth={1.75} />
							Clear
						</Button>
					</div>
				)}
			</PopoverContent>
		</Popover>
	);
};
