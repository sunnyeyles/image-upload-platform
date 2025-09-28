import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const UPLOAD_PASSWORD = process.env.UPLOAD_PASSWORD || "8!6G#";

export async function verifyPassword(password: string): Promise<boolean> {
  return password === UPLOAD_PASSWORD;
}

export function requireAuth(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return NextResponse.json(
      { error: "Authentication required" },
      {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Upload Area"' },
      }
    );
  }

  const credentials = Buffer.from(authHeader.slice(6), "base64").toString();
  const [username, password] = credentials.split(":");

  if (password !== UPLOAD_PASSWORD) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  return null; // Authentication successful
}

export function getClientIdentifier(request: NextRequest): string {
  // Use IP address as identifier for rate limiting
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "unknown";
  return ip;
}
