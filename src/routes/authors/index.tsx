import { createFileRoute, Link } from "@tanstack/react-router";
import { Pagination } from "@/features/shared/Pagination";
import type { SortOption } from "@/features/shared/SortSelect";
import { SortSelect } from "@/features/shared/SortSelect";
import { type AuthorsSearch, authorsSearchSchema } from "@/schemas/catalog";
import { getAuthorsFn } from "@/server/authors";

const SORT_OPTIONS: readonly SortOption<AuthorsSearch["sortBy"]>[] = [
	{ value: "createdAt", label: "Newest" },
	{ value: "name", label: "Name" },
	{ value: "birthDate", label: "Born" },
	{ value: "email", label: "Email" },
];

export const Route = createFileRoute("/authors/")({
	ssr: true,
	validateSearch: authorsSearchSchema,
	loaderDeps: ({ search }) => search,
	loader: ({ deps }) => getAuthorsFn({ data: deps }),
	component: AuthorsPage,
});

function AuthorsPage() {
	const { authors, pagination } = Route.useLoaderData();
	const search = Route.useSearch();
	const navigate = Route.useNavigate();

	return (
		<>
			<div className="mb-8 flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">Authors</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						{pagination.total} in the catalog
					</p>
				</div>

				<SortSelect
					options={SORT_OPTIONS}
					sortBy={search.sortBy}
					orderBy={search.orderBy}
					onChange={(next) =>
						navigate({ search: (prev) => ({ ...prev, ...next, page: 1 }) })
					}
				/>
			</div>

			{authors.length === 0 ? (
				<p className="py-20 text-center text-muted-foreground">
					No authors yet.
				</p>
			) : (
				<ul className="divide-y rounded-lg border">
					{authors.map((author) => (
						<li key={author.id}>
							<Link
								to="/authors/$authorId"
								params={{ authorId: author.id }}
								className="flex items-baseline justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
							>
								<span className="font-medium">{author.name}</span>
								<span className="text-muted-foreground text-sm">
									{[author.nationality, author.birthDate?.slice(0, 4)]
										.filter(Boolean)
										.join(" · ")}
								</span>
							</Link>
						</li>
					))}
				</ul>
			)}

			<Pagination pagination={pagination} />
		</>
	);
}
