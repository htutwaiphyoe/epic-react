export class ApiClientError extends Error {
	readonly status: number;
	readonly fieldErrors?: Record<string, string>;

	constructor(
		status: number,
		message: string,
		fieldErrors?: Record<string, string>,
	) {
		super(message);
		this.name = "ApiClientError";
		this.status = status;
		this.fieldErrors = fieldErrors;
	}
}

type ValidationIssue = { path: string; message: string };

type ErrorBody = {
	status?: string;
	message?: string;
	errors?: ValidationIssue[];
};

const isErrorBody = (body: unknown): body is ErrorBody =>
	typeof body === "object" && body !== null;

export const normalizeApiError = (
	status: number,
	body: unknown,
): ApiClientError => {
	if (!isErrorBody(body) || typeof body.message !== "string") {
		return new ApiClientError(status, `Request failed with status ${status}.`);
	}

	if (Array.isArray(body.errors) && body.errors.length > 0) {
		const fieldErrors: Record<string, string> = {};

		for (const issue of body.errors) {
			if (!(issue.path in fieldErrors)) {
				fieldErrors[issue.path] = issue.message;
			}
		}

		return new ApiClientError(status, body.message, fieldErrors);
	}

	return new ApiClientError(status, body.message);
};
