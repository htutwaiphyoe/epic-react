import { useState } from "react";
import { DatePicker } from "@/features/shared/DatePicker";
import { type AuthorForm, authorFormSchema } from "@/schemas/admin";
import { Field, inputClass } from "./Field";
import { FormActions } from "./FormActions";

type Values = {
	name: string;
	email: string;
	phone: string;
	nationality: string;
	birthDate: string;
	photoUrl: string;
	bio: string;
};

type Props = {
	initial?: Partial<Values>;
	submitLabel: string;
	onSubmit: (values: AuthorForm) => Promise<void>;
	onDelete?: () => Promise<void>;
};

const EMPTY: Values = {
	name: "",
	email: "",
	phone: "",
	nationality: "",
	birthDate: "",
	photoUrl: "",
	bio: "",
};

export const AuthorEditor = ({
	initial,
	submitLabel,
	onSubmit,
	onDelete,
}: Props) => {
	const [values, setValues] = useState<Values>({ ...EMPTY, ...initial });
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [message, setMessage] = useState<string>();
	const [pending, setPending] = useState(false);
	const [deleting, setDeleting] = useState(false);

	const set = (key: keyof Values) => (value: string) =>
		setValues((current) => ({ ...current, [key]: value }));

	const submit = async (event: React.FormEvent) => {
		event.preventDefault();
		setMessage(undefined);

		const parsed = authorFormSchema.safeParse(values);

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
			await onSubmit(parsed.data);
		} catch (cause) {
			setMessage(
				cause instanceof Error ? cause.message : "Could not save the author.",
			);
		} finally {
			setPending(false);
		}
	};

	const remove = async () => {
		if (!onDelete) return;

		setMessage(undefined);
		setDeleting(true);
		try {
			await onDelete();
		} catch (cause) {
			setMessage(
				cause instanceof Error ? cause.message : "Could not delete the author.",
			);
			setDeleting(false);
		}
	};

	return (
		<form method="post" onSubmit={submit} className="max-w-2xl">
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

				<div className="grid gap-5 sm:grid-cols-2">
					<Field label="Email" name="email" error={errors.email}>
						<input
							id="email"
							name="email"
							type="email"
							value={values.email}
							aria-invalid={errors.email ? true : undefined}
							onChange={(event) => set("email")(event.target.value)}
							className={inputClass}
						/>
					</Field>

					<Field
						label="Phone"
						name="phone"
						error={errors.phone}
						hint="Optional"
					>
						<input
							id="phone"
							name="phone"
							value={values.phone}
							aria-invalid={errors.phone ? true : undefined}
							onChange={(event) => set("phone")(event.target.value)}
							className={inputClass}
						/>
					</Field>
				</div>

				<div className="grid gap-5 sm:grid-cols-2">
					<Field
						label="Nationality"
						name="nationality"
						error={errors.nationality}
						hint="Optional"
					>
						<input
							id="nationality"
							name="nationality"
							value={values.nationality}
							aria-invalid={errors.nationality ? true : undefined}
							onChange={(event) => set("nationality")(event.target.value)}
							className={inputClass}
						/>
					</Field>

					<Field
						label="Born"
						name="birthDate"
						error={errors.birthDate}
						hint="Optional"
					>
						<DatePicker
							clearable
							id="birthDate"
							value={values.birthDate}
							invalid={Boolean(errors.birthDate)}
							placeholder="Pick a birth date"
							onChange={set("birthDate")}
						/>
					</Field>
				</div>

				<Field
					label="Photo URL"
					name="photoUrl"
					error={errors.photoUrl}
					hint="Optional — falls back to initials"
				>
					<input
						id="photoUrl"
						name="photoUrl"
						value={values.photoUrl}
						aria-invalid={errors.photoUrl ? true : undefined}
						onChange={(event) => set("photoUrl")(event.target.value)}
						className={inputClass}
					/>
				</Field>

				<Field
					label="Bio"
					name="bio"
					error={errors.bio}
					hint={`${values.bio.length}/1000`}
				>
					<textarea
						id="bio"
						name="bio"
						rows={4}
						maxLength={1000}
						value={values.bio}
						aria-invalid={errors.bio ? true : undefined}
						onChange={(event) => set("bio")(event.target.value)}
						className={`${inputClass} resize-y`}
					/>
				</Field>
			</div>

			<FormActions
				submitLabel={submitLabel}
				pending={pending}
				cancelTo="/admin/authors"
				onDelete={onDelete ? remove : undefined}
				deleting={deleting}
			/>
		</form>
	);
};
