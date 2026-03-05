import { Link } from "@tanstack/react-router";
import type { Pagination as PaginationData } from "@/server/types";

const active =
	"rounded-sm border px-3 py-1.5 text-sm transition-colors hover:bg-muted";
const inert =
	"rounded-sm border border-transparent px-3 py-1.5 text-muted-foreground/50 text-sm";

type Props = {
	pagination: PaginationData;
	noun?: string;
};

export const Pagination = ({ pagination, noun = "title" }: Props) => {
	const { page, totalPages, total } = pagination;

	if (totalPages <= 1) {
		return (
			<p className="mt-14 text-center text-muted-foreground text-sm">
				{total} {total === 1 ? noun : `${noun}s`}
			</p>
		);
	}

	return (
		<nav className="mt-14 flex items-center justify-center gap-3">
			{page > 1 ? (
				<Link
					to="."
					search={(prev) => ({ ...prev, page: page - 1 })}
					className={active}
				>
					Previous
				</Link>
			) : (
				<span className={inert}>Previous</span>
			)}

			<span className="px-2 text-muted-foreground text-sm tabular-nums">
				{page} / {totalPages}
			</span>

			{page < totalPages ? (
				<Link
					to="."
					search={(prev) => ({ ...prev, page: page + 1 })}
					className={active}
				>
					Next
				</Link>
			) : (
				<span className={inert}>Next</span>
			)}
		</nav>
	);
};
