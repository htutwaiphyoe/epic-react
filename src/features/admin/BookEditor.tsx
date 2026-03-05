import { useState } from "react";
import { DatePicker } from "@/features/shared/DatePicker";
import { type BookForm, bookFormSchema } from "@/schemas/admin";
import type { Author } from "@/server/types";
import { Field, inputClass } from "./Field";
import { FormActions } from "./FormActions";

type Values = {
	title: string;
	authorId: string;
	isbn: string;
	description: string;
	coverUrl: string;
	price: string;
	publishedDate: string;
	stock: string;
};

type Props = {
	authors: Author[];
	initial?: Partial<Values>;
	submitLabel: string;
	onSubmit: (values: BookForm) => Promise<void>;
	onDelete?: () => Promise<void>;
};

const EMPTY: Values = {
	title: "",
	authorId: "",
	isbn: "",
	description: "",
	coverUrl: "",
	price: "",
	publishedDate: "",
	stock: "0",
};

export const BookEditor = ({
	authors,
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

		const parsed = bookFormSchema.safeParse({
			...values,
			price: values.price === "" ? Number.NaN : Number(values.price),
			stock: values.stock === "" ? Number.NaN : Number(values.stock),
		});

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
				cause instanceof Error ? cause.message : "Could not save the book.",
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
				cause instanceof Error ? cause.message : "Could not delete the book.",
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
				<Field label="Title" name="title" error={errors.title}>
					<input
						id="title"
						name="title"
						value={values.title}
						aria-invalid={errors.title ? true : undefined}
						onChange={(event) => set("title")(event.target.value)}
						className={inputClass}
					/>
				</Field>

				<Field label="Author" name="authorId" error={errors.authorId}>
					<select
						id="authorId"
						name="authorId"
						value={values.authorId}
						aria-invalid={errors.authorId ? true : undefined}
						onChange={(event) => set("authorId")(event.target.value)}
						className={inputClass}
					>
						<option value="">Choose an author…</option>
						{authors.map((author) => (
							<option key={author.id} value={author.id}>
								{author.name}
							</option>
						))}
					</select>
				</Field>

				<div className="grid gap-5 sm:grid-cols-3">
					<Field label="Price" name="price" error={errors.price}>
						<input
							id="price"
							name="price"
							type="number"
							step="0.01"
							min="0"
							value={values.price}
							aria-invalid={errors.price ? true : undefined}
							onChange={(event) => set("price")(event.target.value)}
							className={inputClass}
						/>
					</Field>

					<Field label="Stock" name="stock" error={errors.stock}>
						<input
							id="stock"
							name="stock"
							type="number"
							min="0"
							value={values.stock}
							aria-invalid={errors.stock ? true : undefined}
							onChange={(event) => set("stock")(event.target.value)}
							className={inputClass}
						/>
					</Field>

					<Field
						label="Published"
						name="publishedDate"
						error={errors.publishedDate}
					>
						<DatePicker
							allowFuture
							id="publishedDate"
							value={values.publishedDate}
							invalid={Boolean(errors.publishedDate)}
							placeholder="Pick the publication date"
							onChange={set("publishedDate")}
						/>
					</Field>
				</div>

				<Field label="ISBN" name="isbn" error={errors.isbn} hint="Optional">
					<input
						id="isbn"
						name="isbn"
						value={values.isbn}
						aria-invalid={errors.isbn ? true : undefined}
						onChange={(event) => set("isbn")(event.target.value)}
						className={inputClass}
					/>
				</Field>

				<Field
					label="Cover URL"
					name="coverUrl"
					error={errors.coverUrl}
					hint="Optional — falls back to a typographic cover"
				>
					<input
						id="coverUrl"
						name="coverUrl"
						value={values.coverUrl}
						aria-invalid={errors.coverUrl ? true : undefined}
						onChange={(event) => set("coverUrl")(event.target.value)}
						className={inputClass}
					/>
				</Field>

				<Field
					label="Description"
					name="description"
					error={errors.description}
					hint={`${values.description.length}/1000`}
				>
					<textarea
						id="description"
						name="description"
						rows={4}
						maxLength={1000}
						value={values.description}
						aria-invalid={errors.description ? true : undefined}
						onChange={(event) => set("description")(event.target.value)}
						className={`${inputClass} resize-y`}
					/>
				</Field>
			</div>

			<FormActions
				submitLabel={submitLabel}
				pending={pending}
				cancelTo="/admin/books"
				onDelete={onDelete ? remove : undefined}
				deleting={deleting}
			/>
		</form>
	);
};
