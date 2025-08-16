import { NextResponse } from "next/server";

export function successResponse<T>(data: T, statusCode = 200) {
  return NextResponse.json({ success: true, data }, { status: statusCode });
}

export function errorResponse(error: string, statusCode = 500) {
  return NextResponse.json({ success: false, error }, { status: statusCode });
}

export function serverErrorResponse(message = "Internal Server Error") {
  return errorResponse(message, 500);
}

export function notFoundResponse(message = "Resource not found") {
  return errorResponse(message, 404);
}

export function unauthorizedResponse(message = "Unauthorized") {
  return errorResponse(message, 401);
}

export function badRequestResponse(message = "Bad request") {
  return errorResponse(message, 400);
}

export function forbiddenResponse(message = "Forbidden") {
  return errorResponse(message, 403);
}
