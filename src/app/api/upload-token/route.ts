import { NextRequest, NextResponse } from "next/server";
import { requireAuth, getClientIdentifier } from "@/lib/auth";
import { checkRateLimit, incrementRateLimit } from "@/lib/rate-limit";
import { getSignedUploadUrl } from "@/lib/aws";

const MAX_IMAGES_PER_UPLOAD = parseInt(
  process.env.MAX_IMAGES_PER_UPLOAD || "10"
);
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || "5");
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

export async function POST(request: NextRequest) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          remaining: rateLimit.remaining,
          resetTime: rateLimit.resetTime,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { filename, contentType, size } = body || {};

    if (!filename || typeof filename !== "string") {
      return NextResponse.json(
        { error: "filename is required" },
        { status: 400 }
      );
    }

    if (!contentType || typeof contentType !== "string") {
      return NextResponse.json(
        { error: "contentType is required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images are allowed." },
        { status: 400 }
      );
    }

    if (typeof size === "number" && size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.` },
        { status: 400 }
      );
    }

    const uploadUrl = await getSignedUploadUrl(filename, contentType, 900);

    // Count this as reserving one upload token
    incrementRateLimit(clientId, 1);

    return NextResponse.json({ uploadUrl });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 }
    );
  }
}
