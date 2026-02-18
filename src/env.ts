import { z } from "zod";

const envSchema = z.object({
	KAWI_API_URL: z
		.url("KAWI_API_URL must be a valid URL")
		.transform((value) => value.replace(/\/$/, "")),
	SESSION_PASSWORD: z
		.string()
		.min(32, "SESSION_PASSWORD must be at least 32 characters"),
});

export type Env = z.infer<typeof envSchema>;

export const parseEnv = (source: Record<string, string | undefined>): Env => {
	const result = envSchema.safeParse(source);

	if (!result.success) {
		const detail = result.error.issues
			.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
			.join("\n  - ");
		throw new Error(`Invalid environment variables:\n  - ${detail}`);
	}

	return result.data;
};

export const getEnv = (): Env => parseEnv(process.env);
