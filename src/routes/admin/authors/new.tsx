import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { AuthorEditor } from "@/features/admin/AuthorEditor";
import { createAuthorFn } from "@/server/admin";

export const Route = createFileRoute("/admin/authors/new")({
	component: NewAuthorPage,
});

function NewAuthorPage() {
	const router = useRouter();

	return (
		<>
			<Link
				to="/admin/authors"
				className="text-muted-foreground text-sm transition-colors hover:text-foreground"
			>
				← Authors
			</Link>

			<h1 className="mt-8 text-4xl leading-[1.1]">New author</h1>

			<div className="mt-9">
				<AuthorEditor
					submitLabel="Create author"
					onSubmit={async (values) => {
						await createAuthorFn({ data: values });
						await router.invalidate();
						router.navigate({ to: "/admin/authors" });
					}}
				/>
			</div>
		</>
	);
}
