import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AuthShell } from "@/features/auth/AuthShell";
import { FormError } from "@/features/auth/FormError";
import { FormField } from "@/features/auth/FormField";
import { SubmitButton } from "@/features/auth/SubmitButton";
import { resetPasswordSchema } from "@/schemas/auth";
import { resetPasswordFn } from "@/server/auth";

export const Route = createFileRoute("/reset-password")({
	ssr: true,
	validateSearch: z.object({ token: z.string().optional() }),
	component: ResetPasswordPage,
});

function ResetPasswordPage() {
	const { token } = Route.useSearch();
	const [error, setError] = useState<string>();
	const [submitting, setSubmitting] = useState(false);
	const [done, setDone] = useState(false);

	const form = useForm({
		defaultValues: { password: "" },
		onSubmit: async ({ value }) => {
			setError(undefined);
			setSubmitting(true);
			try {
				await resetPasswordFn({
					data: { token: token ?? "", password: value.password },
				});
				setDone(true);
			} catch (cause) {
				setError(
					cause instanceof Error
						? cause.message
						: "Could not reset your password.",
				);
			} finally {
				setSubmitting(false);
			}
		},
	});

	if (!token) {
		return (
			<AuthShell
				eyebrow="Reset password"
				title="This link is incomplete."
				description="The link is missing its token, so we cannot tell which account to reset. Request a fresh one and it will work."
				footer={
					<Link
						to="/forgot-password"
						className="underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
					>
						Request a new link
					</Link>
				}
			>
				{null}
			</AuthShell>
		);
	}

	if (done) {
		return (
			<AuthShell
				eyebrow="Reset password"
				title="Password updated."
				description="Every other session has been signed out. Use your new password from here on."
				footer={
					<Link
						to="/login"
						className="underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
					>
						Sign in
					</Link>
				}
			>
				{null}
			</AuthShell>
		);
	}

	return (
		<AuthShell
			eyebrow="Reset password"
			title="Choose a new password."
			description="Pick something at least eight characters long."
			footer={
				<Link
					to="/login"
					className="text-muted-foreground transition-colors hover:text-foreground"
				>
					← Back to sign in
				</Link>
			}
		>
			<form
				method="post"
				className="flex flex-col gap-5"
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

				<SubmitButton
					label="Reset password"
					pendingLabel="Saving…"
					pending={submitting}
				/>
			</form>
		</AuthShell>
	);
}
