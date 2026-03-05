import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { AuthorEditor } from "@/features/admin/AuthorEditor";
import { deleteAuthorFn, updateAuthorFn } from "@/server/admin";
import { getAuthorFn } from "@/server/authors";

export const Route = createFileRoute("/admin/authors/$authorId")({
	loader: ({ params }) => getAuthorFn({ data: { authorId: params.authorId } }),
	component: EditAuthorPage,
});

function EditAuthorPage() {
	const author = Route.useLoaderData();
	const router = useRouter();

	const done = async () => {
		await router.invalidate();
		router.navigate({ to: "/admin/authors" });
	};

	return (
		<>
			<Link
				to="/admin/authors"
				className="text-muted-foreground text-sm transition-colors hover:text-foreground"
			>
				← Authors
			</Link>

			<h1 className="mt-8 text-4xl leading-[1.1]">{author.name}</h1>

			<div className="mt-9">
				<AuthorEditor
					submitLabel="Save changes"
					initial={{
						name: author.name,
						email: author.email,
						phone: author.phone ?? "",
						nationality: author.nationality ?? "",
						birthDate: author.birthDate?.slice(0, 10) ?? "",
						photoUrl: author.photoUrl ?? "",
						bio: author.bio ?? "",
					}}
					onSubmit={async (values) => {
						await updateAuthorFn({ data: { authorId: author.id, ...values } });
						await done();
					}}
					onDelete={async () => {
						await deleteAuthorFn({ data: { authorId: author.id } });
						await done();
					}}
				/>
			</div>
		</>
	);
}
