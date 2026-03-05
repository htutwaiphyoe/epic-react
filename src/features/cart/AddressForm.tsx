import { Field, inputClass } from "@/features/admin/Field";
import type { AddressForm as AddressValues } from "@/schemas/cart";

export type AddressDraft = {
	recipient: string;
	phone: string;
	line1: string;
	line2: string;
	city: string;
	postalCode: string;
	country: string;
};

export const EMPTY_ADDRESS: AddressDraft = {
	recipient: "",
	phone: "",
	line1: "",
	line2: "",
	city: "",
	postalCode: "",
	country: "",
};

export const formatAddress = (address: {
	recipient: string;
	phone: string;
	line1: string;
	line2?: string;
	city: string;
	postalCode?: string;
	country: string;
}) =>
	[
		address.line1,
		address.line2,
		[address.city, address.postalCode].filter(Boolean).join(" "),
		address.country,
	].filter(Boolean) as string[];

type Props = {
	values: AddressDraft;
	errors: Partial<Record<keyof AddressValues, string>>;
	disabled?: boolean;
	onChange: (key: keyof AddressDraft, value: string) => void;
};

export const AddressForm = ({ values, errors, disabled, onChange }: Props) => (
	<div className="grid gap-5">
		<div className="grid gap-5 sm:grid-cols-2">
			<Field label="Recipient" name="recipient" error={errors.recipient}>
				<input
					id="recipient"
					value={values.recipient}
					disabled={disabled}
					autoComplete="name"
					aria-invalid={errors.recipient ? true : undefined}
					onChange={(event) => onChange("recipient", event.target.value)}
					className={inputClass}
				/>
			</Field>

			<Field label="Phone" name="phone" error={errors.phone}>
				<input
					id="phone"
					value={values.phone}
					disabled={disabled}
					autoComplete="tel"
					aria-invalid={errors.phone ? true : undefined}
					onChange={(event) => onChange("phone", event.target.value)}
					className={inputClass}
				/>
			</Field>
		</div>

		<Field label="Street address" name="line1" error={errors.line1}>
			<input
				id="line1"
				value={values.line1}
				disabled={disabled}
				autoComplete="address-line1"
				aria-invalid={errors.line1 ? true : undefined}
				onChange={(event) => onChange("line1", event.target.value)}
				className={inputClass}
			/>
		</Field>

		<Field
			label="Apartment, floor"
			name="line2"
			error={errors.line2}
			hint="Optional"
		>
			<input
				id="line2"
				value={values.line2}
				disabled={disabled}
				autoComplete="address-line2"
				onChange={(event) => onChange("line2", event.target.value)}
				className={inputClass}
			/>
		</Field>

		<div className="grid gap-5 sm:grid-cols-3">
			<Field label="City" name="city" error={errors.city}>
				<input
					id="city"
					value={values.city}
					disabled={disabled}
					autoComplete="address-level2"
					aria-invalid={errors.city ? true : undefined}
					onChange={(event) => onChange("city", event.target.value)}
					className={inputClass}
				/>
			</Field>

			<Field
				label="Postal code"
				name="postalCode"
				error={errors.postalCode}
				hint="Optional"
			>
				<input
					id="postalCode"
					value={values.postalCode}
					disabled={disabled}
					autoComplete="postal-code"
					onChange={(event) => onChange("postalCode", event.target.value)}
					className={inputClass}
				/>
			</Field>

			<Field label="Country" name="country" error={errors.country}>
				<input
					id="country"
					value={values.country}
					disabled={disabled}
					autoComplete="country-name"
					aria-invalid={errors.country ? true : undefined}
					onChange={(event) => onChange("country", event.target.value)}
					className={inputClass}
				/>
			</Field>
		</div>
	</div>
);
