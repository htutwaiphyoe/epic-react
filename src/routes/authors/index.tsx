import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthorPortrait } from "@/features/authors/AuthorPortrait";
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
			<header className="pb-8">
				<h1 className="text-4xl">Authors</h1>
				<p className="mt-2 text-muted-foreground">
					World champions, trainers and storytellers — {pagination.total} of
					them, in their own words.
				</p>
			</header>

			<div className="rule-above flex items-center justify-end py-4">
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
				<div className="rounded-sm border border-dashed py-24 text-center">
					<p className="font-serif text-lg">No authors yet</p>
				</div>
			) : (
				<div
					data-testid="author-grid"
					className="grid grid-cols-2 gap-x-6 gap-y-9 pt-9 sm:grid-cols-3 lg:grid-cols-5"
				>
					{authors.map((author) => (
						<Link
							key={author.id}
							to="/authors/$authorId"
							params={{ authorId: author.id }}
							className="group block"
						>
							<div className="overflow-hidden rounded-sm ring-1 ring-black/5 transition-transform duration-200 group-hover:-translate-y-0.5">
								<AuthorPortrait name={author.name} photoUrl={author.photoUrl} />
							</div>

							<h2 className="mt-3 font-serif text-[17px] leading-snug underline-offset-2 group-hover:underline">
								{author.name}
							</h2>

							<p className="mt-0.5 text-muted-foreground text-sm tabular-nums">
								{[author.nationality, author.birthDate?.slice(0, 4)]
									.filter(Boolean)
									.join(" · ")}
							</p>
						</Link>
					))}
				</div>
			)}

			<Pagination pagination={pagination} noun="author" />
		</>
	);
}
