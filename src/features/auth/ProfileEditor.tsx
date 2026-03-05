import { useState } from "react";
import { Field, inputClass } from "@/features/admin/Field";
import { DatePicker } from "@/features/shared/DatePicker";
import { profileSchema } from "@/schemas/auth";
import type { Profile } from "@/server/types";

type Props = {
	profile: Profile;
	onSave: (values: {
		name: string;
		dob?: string;
		profileUrl?: string;
	}) => Promise<void>;
	onCancel: () => void;
};

export const ProfileEditor = ({ profile, onSave, onCancel }: Props) => {
	const [values, setValues] = useState({
		name: profile.name,
		dob: profile.dob ?? "",
		profileUrl: profile.profileUrl ?? "",
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [message, setMessage] = useState<string>();
	const [pending, setPending] = useState(false);

	const set = (key: keyof typeof values) => (value: string) =>
		setValues((current) => ({ ...current, [key]: value }));

	const submit = async (event: React.FormEvent) => {
		event.preventDefault();
		setMessage(undefined);

		const parsed = profileSchema.safeParse(values);

		if (!parsed.success) {
			const next: Record<string, string> = {};
			for (const issue of parsed.error.issues) {
				const key = String(issue.path[0]);
				next[key] ??= issue.message;
			}
			setErrors(next);
			return;
		}

		setErrors({});
		setPending(true);
		try {
			await onSave(parsed.data);
		} catch (cause) {
			setMessage(
				cause instanceof Error ? cause.message : "Could not save your profile.",
			);
			setPending(false);
		}
	};

	return (
		<form method="post" onSubmit={submit} className="mt-8 max-w-xl">
			{message ? (
				<p
					role="alert"
					className="mb-6 rounded-sm border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-[14px] text-destructive"
				>
					{message}
				</p>
			) : null}

			<div className="grid gap-5">
				<Field label="Name" name="name" error={errors.name}>
					<input
						id="name"
						name="name"
						value={values.name}
						aria-invalid={errors.name ? true : undefined}
						onChange={(event) => set("name")(event.target.value)}
						className={inputClass}
					/>
				</Field>

				<Field
					label="Date of birth"
					name="dob"
					error={errors.dob}
					hint="Optional"
				>
					<DatePicker
						clearable
						id="dob"
						value={values.dob}
						invalid={Boolean(errors.dob)}
						placeholder="Pick your date of birth"
						onChange={set("dob")}
					/>
				</Field>

				<Field
					label="Photo URL"
					name="profileUrl"
					error={errors.profileUrl}
					hint="Optional — falls back to your initial"
				>
					<input
						id="profileUrl"
						name="profileUrl"
						value={values.profileUrl}
						aria-invalid={errors.profileUrl ? true : undefined}
						onChange={(event) => set("profileUrl")(event.target.value)}
						className={inputClass}
					/>
				</Field>

				<p className="text-muted-foreground text-[13px]">
					Your email and password are changed elsewhere — use the password reset
					link to set a new password.
				</p>
			</div>

			<div className="rule-above mt-8 flex items-center gap-4 pt-6">
				<button
					type="submit"
					disabled={pending}
					className="rounded-sm bg-primary px-5 py-2.5 font-medium text-primary-foreground text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
				>
					{pending ? "Saving…" : "Save profile"}
				</button>

				<button
					type="button"
					disabled={pending}
					onClick={onCancel}
					className="text-muted-foreground text-sm transition-colors hover:text-foreground"
				>
					Cancel
				</button>
			</div>
		</form>
	);
};
