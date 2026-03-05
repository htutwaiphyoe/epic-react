import { defineConfig } from "@playwright/test";

const PORT = 4173;
const baseURL = `http://localhost:${PORT}`;
const SESSION_FILE = "e2e/.session.json";
const ADMIN_SESSION_FILE = "e2e/.admin-session.json";

export default defineConfig({
	testDir: "./e2e",
	forbidOnly: !!process.env.CI,
	expect: { timeout: 10_000 },
	use: { baseURL },
	projects: [
		{ name: "setup", testMatch: /auth\.setup\.ts/ },
		{
			name: "anonymous",
			testMatch: /auth\.spec\.ts|catalog\.spec\.ts/,
		},
		{
			name: "admin",
			testMatch: /admin\.spec\.ts/,
			dependencies: ["setup"],
			use: { storageState: ADMIN_SESSION_FILE },
			fullyParallel: false,
			workers: 1,
		},
		{
			name: "signed-in",
			testMatch: /cart\.spec\.ts/,
			dependencies: ["setup"],
			use: { storageState: SESSION_FILE },
			fullyParallel: false,
			workers: 1,
		},
	],
	webServer: {
		command: `bun run build && bun run preview --port ${PORT}`,
		url: baseURL,
		reuseExistingServer: false,
		timeout: 180_000,
	},
});
