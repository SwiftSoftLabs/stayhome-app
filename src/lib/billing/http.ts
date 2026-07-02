import { NextResponse } from 'next/server';

export function billingJsonError(code: string, message: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}
