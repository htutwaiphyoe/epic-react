import { useEffect, useState } from "react";

export const useMinWidth = (px: number) => {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		const query = window.matchMedia(`(min-width: ${px}px)`);
		const sync = () => setMatches(query.matches);

		sync();
		query.addEventListener("change", sync);

		return () => query.removeEventListener("change", sync);
	}, [px]);

	return matches;
};
