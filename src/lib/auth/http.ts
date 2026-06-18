import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export class AuthHttpError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof AuthHttpError) {
    return jsonError(error.message, error.status);
  }
  if (error instanceof ZodError) {
    return jsonError('Invalid request.', 400);
  }
  console.error('[auth]', error);
  return jsonError('Something went wrong. Please try again.', 500);
}
