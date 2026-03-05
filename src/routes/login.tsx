import { useForm } from "@tanstack/react-form";
import {
	createFileRoute,
	Link,
	redirect,
	useRouter,
} from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AuthShell } from "@/features/auth/AuthShell";
import { FormError } from "@/features/auth/FormError";
import { FormField } from "@/features/auth/FormField";
import { SubmitButton } from "@/features/auth/SubmitButton";
import { loginSchema } from "@/schemas/auth";
import { getSessionUserFn, loginFn } from "@/server/auth";

export const Route = createFileRoute("/login")({
	ssr: true,
	validateSearch: z.object({ redirect: z.string().optional() }),
	beforeLoad: async ({ search }) => {
		if (await getSessionUserFn()) {
			throw redirect({ to: search.redirect ?? "/account" });
		}
	},
	component: LoginPage,
});

function LoginPage() {
	const router = useRouter();
	const search = Route.useSearch();
	const [error, setError] = useState<string>();
	const [submitting, setSubmitting] = useState(false);

	const form = useForm({
		defaultValues: { email: "", password: "" },
		onSubmit: async ({ value }) => {
			setError(undefined);
			setSubmitting(true);
			try {
				await loginFn({ data: value });
				await router.invalidate();
				router.navigate({ to: search.redirect ?? "/account" });
			} catch (cause) {
				setError(
					cause instanceof Error ? cause.message : "Could not sign you in.",
				);
			} finally {
				setSubmitting(false);
			}
		},
	});

	return (
		<AuthShell
			eyebrow="Welcome back"
			title="Sign in."
			description="Your cart, orders and reviews are waiting."
			footer={
				<>
					<Link
						to="/signup"
						className="underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
					>
						Create an account
					</Link>

					<Link
						to="/forgot-password"
						className="text-muted-foreground transition-colors hover:text-foreground"
					>
						Forgot password?
					</Link>
				</>
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
					name="email"
					validators={{ onBlur: loginSchema.shape.email }}
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

				<form.Field
					name="password"
					validators={{ onBlur: loginSchema.shape.password }}
				>
					{(field) => (
						<FormField
							label="Password"
							name="password"
							type="password"
							autoComplete="current-password"
							value={field.state.value}
							errors={field.state.meta.errors}
							onChange={field.handleChange}
							onBlur={field.handleBlur}
						/>
					)}
				</form.Field>

				<SubmitButton
					label="Sign in"
					pendingLabel="Signing in…"
					pending={submitting}
				/>
			</form>
		</AuthShell>
	);
}
