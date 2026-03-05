import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/features/auth/AuthShell";
import { FormError } from "@/features/auth/FormError";
import { FormField } from "@/features/auth/FormField";
import { SubmitButton } from "@/features/auth/SubmitButton";
import { forgotPasswordSchema } from "@/schemas/auth";
import { forgotPasswordFn } from "@/server/auth";

export const Route = createFileRoute("/forgot-password")({
	ssr: true,
	component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
	const [error, setError] = useState<string>();
	const [sent, setSent] = useState<string>();
	const [submitting, setSubmitting] = useState(false);

	const form = useForm({
		defaultValues: { email: "" },
		onSubmit: async ({ value }) => {
			setError(undefined);
			setSubmitting(true);
			try {
				setSent(await forgotPasswordFn({ data: value }));
			} catch (cause) {
				setError(
					cause instanceof Error ? cause.message : "Could not send the email.",
				);
			} finally {
				setSubmitting(false);
			}
		},
	});

	return (
		<AuthShell
			eyebrow="Forgot password"
			title={sent ? "Check your inbox." : "Reset your password."}
			description={
				sent
					? undefined
					: "Give us the email on your account and we will send a link to set a new password."
			}
			footer={
				<Link
					to="/login"
					className="text-muted-foreground transition-colors hover:text-foreground"
				>
					← Back to sign in
				</Link>
			}
		>
			{sent ? (
				<p className="rounded-sm border bg-card px-4 py-4 text-[15px] leading-relaxed">
					{sent}
				</p>
			) : (
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
						name="email"
						validators={{ onBlur: forgotPasswordSchema.shape.email }}
					>
						{(field) => (
							<FormField
								label="Email"
								name="email"
								type="email"
								autoComplete="email"
								value={field.state.value}
								errors={field.state.meta.errors}
								onChange={field.handleChange}
								onBlur={field.handleBlur}
							/>
						)}
					</form.Field>

					<SubmitButton
						label="Send reset link"
						pendingLabel="Sending…"
						pending={submitting}
					/>
				</form>
			)}
		</AuthShell>
	);
}
