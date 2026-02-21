import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { FormError } from "@/features/auth/FormError";
import { FormField } from "@/features/auth/FormField";
import { resetPasswordSchema } from "@/schemas/auth";
import { resetPasswordFn } from "@/server/auth";

export const Route = createFileRoute("/reset-password")({
	ssr: true,
	validateSearch: z.object({ token: z.string().optional() }),
	component: ResetPasswordPage,
});

function ResetPasswordPage() {
	const router = useRouter();
	const { token } = Route.useSearch();
	const [error, setError] = useState<string>();

	const form = useForm({
		defaultValues: { password: "" },
		onSubmit: async ({ value }) => {
			setError(undefined);
			try {
				await resetPasswordFn({
					data: { token: token ?? "", password: value.password },
				});
				router.navigate({ to: "/login" });
			} catch (cause) {
				setError(
					cause instanceof Error
						? cause.message
						: "Could not reset your password.",
				);
			}
		},
	});

	if (!token) {
		return (
			<div className="mx-auto max-w-sm">
				<h1 className="font-semibold text-2xl tracking-tight">
					Reset password
				</h1>
				<p className="mt-3 text-muted-foreground">
					This link is missing its token. Request a new one.
				</p>
				<Link
					to="/forgot-password"
					className="mt-6 inline-block text-muted-foreground text-sm hover:text-foreground"
				>
					Request a new link
				</Link>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-sm">
			<h1 className="font-semibold text-2xl tracking-tight">
				Choose a new password
			</h1>

			<form
				className="mt-8 flex flex-col gap-5"
				onSubmit={(event) => {
					event.preventDefault();
					form.handleSubmit();
				}}
			>
				<FormError message={error} />

				<form.Field
					name="password"
					validators={{ onBlur: resetPasswordSchema.shape.password }}
				>
					{(field) => (
						<FormField
							label="New password"
							name="password"
							type="password"
							autoComplete="new-password"
							value={field.state.value}
							errors={field.state.meta.errors}
							onChange={field.handleChange}
							onBlur={field.handleBlur}
						/>
					)}
				</form.Field>

				<button
					type="submit"
					className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm"
				>
					Reset password
				</button>
			</form>
		</div>
	);
}
