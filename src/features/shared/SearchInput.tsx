import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

const DEBOUNCE_MS = 350;

type Props = {
	value: string;
	placeholder: string;
	onChange: (value: string | undefined) => void;
};

export const SearchInput = ({ value, placeholder, onChange }: Props) => {
	const [draft, setDraft] = useState(value);
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

	useEffect(() => {
		setDraft((current) => (current.trim() === value ? current : value));
	}, [value]);

	useEffect(() => () => clearTimeout(timer.current), []);

	const commit = (next: string) => onChange(next.trim() || undefined);

	const schedule = (next: string) => {
		setDraft(next);

		clearTimeout(timer.current);
		timer.current = setTimeout(() => commit(next), DEBOUNCE_MS);
	};

	const flush = () => {
		clearTimeout(timer.current);
		commit(draft);
	};

	return (
		<form
			className="relative w-full sm:max-w-md sm:flex-1"
			onSubmit={(event) => {
				event.preventDefault();
				flush();
			}}
		>
			<Search
				className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-muted-foreground"
				strokeWidth={1.75}
			/>

			<Input
				name="search"
				type="search"
				value={draft}
				placeholder={placeholder}
				onChange={(event) => schedule(event.target.value)}
				className="h-11 rounded-full bg-card pr-4 pl-11 text-[15px]"
			/>
		</form>
	);
};
