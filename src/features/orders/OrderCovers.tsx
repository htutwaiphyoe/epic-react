import { BookCover } from "@/features/books/BookCover";
import type { OrderItem } from "@/server/types";

type Props = {
	items: OrderItem[];
	max?: number;
};

export const OrderCovers = ({ items, max = 3 }: Props) => {
	const shown = items.slice(0, max);
	const hidden = items.length - shown.length;

	return (
		<div className="flex shrink-0 items-center">
			{shown.map((item, index) => (
				<div
					key={item.id}
					className="w-11 shrink-0 self-start overflow-hidden rounded-sm ring-1 ring-black/10"
					style={{
						marginLeft: index === 0 ? 0 : -14,
						zIndex: shown.length - index,
					}}
				>
					<BookCover
						title={item.title}
						seed={item.bookId ?? item.id}
						coverUrl={item.coverUrl}
					/>
				</div>
			))}

			{hidden > 0 ? (
				<span className="ml-2 text-muted-foreground text-xs tabular-nums">
					+{hidden}
				</span>
			) : null}
		</div>
	);
};
