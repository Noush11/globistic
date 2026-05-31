import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "./guard";

// Standard JSON helpers for API route handlers.

export function ok<T>(data: T, init?: number | ResponseInit) {
  const responseInit = typeof init === "number" ? { status: init } : init;
  return NextResponse.json({ success: true, data }, responseInit);
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: false, error: message, ...extra }, { status });
}

export function unauthorized(message = "Authentication required") {
  return fail(message, 401);
}

export function forbidden(message = "You do not have permission to do that") {
  return fail(message, 403);
}

export function notFound(message = "Not found") {
  return fail(message, 404);
}

// Wrap a handler so thrown ZodErrors / unexpected errors become clean JSON.
export function handleError(error: unknown) {
  if (error instanceof HttpError) {
    return fail(error.message, error.status);
  }
  if (error instanceof ZodError) {
    return fail("Validation failed", 422, {
      issues: error.issues.map((i) => ({ path: i.path.join("."), message: i.message }))
    });
  }
  console.error("[api] Unhandled error:", error);
  const message =
    error instanceof Error && process.env.NODE_ENV !== "production"
      ? error.message
      : "Something went wrong";
  return fail(message, 500);
}
