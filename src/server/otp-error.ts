export class OtpError extends Error {
  constructor(
    public readonly httpStatus: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof OtpError) {
    return Response.json({ ok: false, code: error.code, message: error.message }, { status: error.httpStatus });
  }
  console.error('[otp] Unexpected error', error);
  return Response.json({ ok: false, code: 'server_error', message: 'Something went wrong on the server.' }, { status: 500 });
}
