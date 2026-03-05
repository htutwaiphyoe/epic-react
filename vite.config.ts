import tailwindcss from "@tailwindcss/vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	optimizeDeps: {
		include: [
			"recharts",
			"@tanstack/router-core",
			"@tanstack/router-core/isServer",
			"@tanstack/router-core/ssr/client",
			"seroval",
		],
	},
	plugins: [tailwindcss(), tanstackStart(), viteReact()],
});

export default config;
