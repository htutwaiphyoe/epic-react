import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil, Plus } from "lucide-react";
import { AuthorPortrait } from "@/features/authors/AuthorPortrait";
import { Pagination } from "@/features/shared/Pagination";
import { authorsSearchSchema } from "@/schemas/catalog";
import { getAuthorsFn } from "@/server/authors";

export const Route = createFileRoute("/admin/authors/")({
	validateSearch: authorsSearchSchema,
	loaderDeps: ({ search }) => search,
	loader: ({ deps }) => getAuthorsFn({ data: deps }),
	component: AdminAuthorsPage,
});

function AdminAuthorsPage() {
	const { authors, pagination } = Route.useLoaderData();
	const { user } = Route.useRouteContext();

	const canEdit = (createdBy: string | null) =>
		user?.role === "admin" || (Boolean(user) && createdBy === user.id);

	return (
		<>
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
						{pagination.total} authors
					</p>
					<h1 className="mt-3 text-4xl leading-[1.1]">Authors</h1>
				</div>

				<Link
					to="/admin/authors/new"
					className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 font-medium text-primary-foreground text-sm transition-opacity hover:opacity-90"
				>
					<Plus className="size-4" strokeWidth={2} />
					New author
				</Link>
			</header>

			<div className="mt-8 divide-y border-t border-b">
				{authors.map((author) => (
					<div key={author.id} className="flex items-center gap-4 py-4">
						<div className="w-10 shrink-0 self-start overflow-hidden rounded-sm ring-1 ring-black/10">
							<AuthorPortrait name={author.name} photoUrl={author.photoUrl} />
						</div>

						<div className="min-w-0 flex-1">
							<p className="truncate font-medium">{author.name}</p>
							<p className="mt-1 truncate text-muted-foreground text-sm">
								{author.email}
							</p>
						</div>

						{canEdit(author.createdBy) ? (
							<Link
								to="/admin/authors/$authorId"
								params={{ authorId: author.id }}
								className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
							>
								<Pencil className="size-3.5" strokeWidth={1.75} />
								Edit
							</Link>
						) : (
							<span className="shrink-0 text-muted-foreground text-xs uppercase tracking-[0.1em]">
								Not yours
							</span>
						)}
					</div>
				))}
			</div>

			<Pagination pagination={pagination} noun="author" />
		</>
	);
}
