import { useForm } from "@tanstack/react-form";
import {
	createFileRoute,
	Link,
	redirect,
	useRouter,
} from "@tanstack/react-router";
import { useState } from "react";
import { FormError } from "@/features/auth/FormError";
import { FormField } from "@/features/auth/FormField";
import { signupSchema } from "@/schemas/auth";
import { getSessionUserFn, signupFn } from "@/server/auth";

export const Route = createFileRoute("/signup")({
	ssr: true,
	beforeLoad: async () => {
		if (await getSessionUserFn()) {
			throw redirect({ to: "/account" });
		}
	},
	component: SignupPage,
});

function SignupPage() {
	const router = useRouter();
	const [error, setError] = useState<string>();
	const [submitting, setSubmitting] = useState(false);

	const form = useForm({
		defaultValues: { name: "", email: "", password: "" },
		onSubmit: async ({ value }) => {
			setError(undefined);
			setSubmitting(true);
			try {
				await signupFn({ data: value });
				await router.invalidate();
				router.navigate({ to: "/account" });
			} catch (cause) {
				setError(
					cause instanceof Error
						? cause.message
						: "Could not create your account.",
				);
			} finally {
				setSubmitting(false);
			}
		},
	});

	return (
		<div className="mx-auto max-w-sm">
			<h1 className="font-semibold text-2xl tracking-tight">
				Create an account
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
					name="name"
					validators={{ onBlur: signupSchema.shape.name }}
				>
					{(field) => (
						<FormField
							label="Name"
							name="name"
							autoComplete="name"
							value={field.state.value}
							errors={field.state.meta.errors}
							onChange={field.handleChange}
							onBlur={field.handleBlur}
						/>
					)}
				</form.Field>

				<form.Field
					name="email"
					validators={{ onBlur: signupSchema.shape.email }}
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
					validators={{ onBlur: signupSchema.shape.password }}
				>
					{(field) => (
						<FormField
							label="Password"
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
					disabled={submitting}
					className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm disabled:opacity-60"
				>
					{submitting ? "Creating…" : "Create account"}
				</button>
			</form>

			<p className="mt-6 text-muted-foreground text-sm">
				Already have an account?{" "}
				<Link to="/login" className="hover:text-foreground">
					Sign in
				</Link>
			</p>
		</div>
	);
}
