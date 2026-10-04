import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export function databaseErrorResponse(error: unknown, operation: string) {
  const requestId = randomUUID();
  const failure = error as { name?: string; code?: number; message?: string };
  const unavailable = /Mongo.*(Timeout|Network|ServerSelection)|MongooseServerSelection/.test(failure?.name || "") || failure?.code === 50;
  console.error("Database operation failed", {
    requestId, operation, errorType: failure?.name, code: failure?.code,
    message: failure?.message?.replace(/mongodb(?:\+srv)?:\/\/[^\s]+/g, "[redacted MongoDB URI]").slice(0, 400),
  });
  return NextResponse.json({ success: false, code: unavailable ? "DATABASE_UNAVAILABLE" : "INTERNAL_ERROR", requestId,
    message: unavailable ? "Database temporarily unavailable. Please retry." : "The request could not be completed.",
  }, { status: unavailable ? 503 : 500 });
}
