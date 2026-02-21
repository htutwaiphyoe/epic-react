import { defineConfig } from "@playwright/test";

const PORT = 4173;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
	testDir: "./e2e",
	forbidOnly: !!process.env.CI,
	expect: { timeout: 10_000 },
	use: { baseURL },
	webServer: {
		command: `bun run build && bun run preview --port ${PORT}`,
		url: baseURL,
		reuseExistingServer: false,
		timeout: 180_000,
	},
});
