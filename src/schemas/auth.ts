import { z } from "zod";

const password = z.string().min(8, "Password must be at least 8 characters");

export const signupSchema = z.object({
	name: z
		.string()
		.min(1, "Name is required")
		.max(255, "Name must be at most 255 characters"),
	email: z.email("Email must be a valid email"),
	password,
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
	email: z.email("Email must be a valid email"),
	password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
	email: z.email("Email must be a valid email"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
	token: z.string().min(1, "Token is required"),
	password,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
