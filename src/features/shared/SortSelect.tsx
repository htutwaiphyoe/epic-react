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

const selectClass =
	"rounded-md border bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export const SortSelect = <TSort extends string>({
	options,
	sortBy,
	orderBy,
	onChange,
}: Props<TSort>) => (
	<div className="flex gap-2">
		<label className="sr-only" htmlFor="sortBy">
			Sort by
		</label>
		<select
			id="sortBy"
			value={sortBy}
			onChange={(event) => onChange({ sortBy: event.target.value as TSort })}
			className={selectClass}
		>
			{options.map((option) => (
				<option key={option.value} value={option.value}>
					{option.label}
				</option>
			))}
		</select>

		<label className="sr-only" htmlFor="orderBy">
			Order
		</label>
		<select
			id="orderBy"
			value={orderBy}
			onChange={(event) =>
				onChange({ orderBy: event.target.value as "asc" | "desc" })
			}
			className={selectClass}
		>
			<option value="desc">Descending</option>
			<option value="asc">Ascending</option>
		</select>
	</div>
);
