import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getProfileFn, logoutFn } from "@/server/auth";

export const Route = createFileRoute("/_authed/account")({
	loader: () => getProfileFn(),
	component: AccountPage,
});

function AccountPage() {
	const router = useRouter();
	const user = Route.useLoaderData();

	const facts = [
		{ label: "Name", value: user.name },
		{ label: "Email", value: user.email },
		{ label: "Role", value: user.role },
	];

	return (
		<div className="max-w-lg">
			<h1 className="font-semibold text-2xl tracking-tight">Account</h1>

			<dl className="mt-8 divide-y rounded-lg border">
				{facts.map((fact) => (
					<div
						key={fact.label}
						className="flex items-baseline justify-between px-5 py-4"
					>
						<dt className="text-muted-foreground text-sm">{fact.label}</dt>
						<dd className="font-medium">{fact.value}</dd>
					</div>
				))}
			</dl>

			<button
				type="button"
				onClick={async () => {
					await logoutFn();
					await router.invalidate();
					router.navigate({ to: "/" });
				}}
				className="mt-8 rounded-md border px-4 py-2 font-medium text-sm transition-colors hover:bg-muted"
			>
				Sign out
			</button>
		</div>
	);
}
