export class ApiClientError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status = 500, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

export function mapErrorToResponse(error: unknown): {
  message: string;
  status: number;
  details?: unknown;
} {
  if (error instanceof ApiClientError) {
    return {
      message: error.message,
      status: error.status,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return { message: error.message, status: 500 };
  }

  return { message: "Unexpected error", status: 500 };
}
