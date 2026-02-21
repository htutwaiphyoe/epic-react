import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FormError } from "@/features/auth/FormError";
import { FormField } from "@/features/auth/FormField";
import { forgotPasswordSchema } from "@/schemas/auth";
import { forgotPasswordFn } from "@/server/auth";

export const Route = createFileRoute("/forgot-password")({
	ssr: true,
	component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
	const [error, setError] = useState<string>();
	const [sent, setSent] = useState<string>();

	const form = useForm({
		defaultValues: { email: "" },
		onSubmit: async ({ value }) => {
			setError(undefined);
			try {
				setSent(await forgotPasswordFn({ data: value }));
			} catch (cause) {
				setError(
					cause instanceof Error ? cause.message : "Could not send the email.",
				);
			}
		},
	});

	return (
		<div className="mx-auto max-w-sm">
			<h1 className="font-semibold text-2xl tracking-tight">Reset password</h1>

			{sent ? (
				<p className="mt-6 text-muted-foreground">{sent}</p>
			) : (
				<form
					className="mt-8 flex flex-col gap-5"
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

					<button
						type="submit"
						className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm"
					>
						Send reset link
					</button>
				</form>
			)}

			<p className="mt-6 text-muted-foreground text-sm">
				<Link to="/login" className="hover:text-foreground">
					Back to sign in
				</Link>
			</p>
		</div>
	);
}
