import { Link } from "@tanstack/react-router";
import type { Pagination as PaginationData } from "@/server/types";

const linkClass = "text-sm transition-colors hover:text-foreground";
const mutedClass = "text-muted-foreground text-sm";

export const Pagination = ({ pagination }: { pagination: PaginationData }) => {
	const { page, totalPages, total } = pagination;

	if (totalPages <= 1) {
		return <p className={`mt-8 text-center ${mutedClass}`}>{total} total</p>;
	}

	return (
		<nav className="mt-10 flex items-center justify-center gap-6">
			{page > 1 ? (
				<Link
					to="."
					search={(prev) => ({ ...prev, page: page - 1 })}
					className={linkClass}
				>
					‹ Previous
				</Link>
			) : (
				<span className={mutedClass}>‹ Previous</span>
			)}

			<span className={mutedClass}>
				Page {page} of {totalPages} · {total} total
			</span>

			{page < totalPages ? (
				<Link
					to="."
					search={(prev) => ({ ...prev, page: page + 1 })}
					className={linkClass}
				>
					Next ›
				</Link>
			) : (
				<span className={mutedClass}>Next ›</span>
			)}
		</nav>
	);
};
