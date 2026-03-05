import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export type SortOption<TSort extends string> = {
	value: TSort;
	label: string;
};

type Props<TSort extends string> = {
	options: readonly SortOption<TSort>[];
	sortBy: TSort;
	orderBy: "asc" | "desc";
	onChange: (next: { sortBy?: TSort; orderBy?: "asc" | "desc" }) => void;
};

export const SortSelect = <TSort extends string>({
	options,
	sortBy,
	orderBy,
	onChange,
}: Props<TSort>) => (
	<div className="flex shrink-0 items-center gap-2">
		<span className="text-muted-foreground text-xs uppercase tracking-[0.14em]">
			Sort
		</span>

		<Select
			value={sortBy}
			onValueChange={(value) => onChange({ sortBy: value as TSort })}
		>
			<SelectTrigger aria-label="Sort by" className="w-36 rounded-full">
				<SelectValue />
			</SelectTrigger>

			<SelectContent>
				{options.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>

		<Button
			variant="outline"
			size="icon"
			aria-label={orderBy === "desc" ? "Sort descending" : "Sort ascending"}
			onClick={() => onChange({ orderBy: orderBy === "desc" ? "asc" : "desc" })}
			className="rounded-full"
		>
			{orderBy === "desc" ? (
				<ArrowDown className="size-4" strokeWidth={1.75} />
			) : (
				<ArrowUp className="size-4" strokeWidth={1.75} />
			)}
		</Button>
	</div>
);
