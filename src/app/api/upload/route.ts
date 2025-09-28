import { NextRequest, NextResponse } from "next/server";
import { requireAuth, getClientIdentifier } from "@/lib/auth";
import { checkRateLimit, incrementRateLimit } from "@/lib/rate-limit";
import { uploadToS3 } from "@/lib/aws";

const MAX_IMAGES_PER_UPLOAD = parseInt(
  process.env.MAX_IMAGES_PER_UPLOAD || "150"
);
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || "10");
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Allowed image types
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authError = requireAuth(request);
    if (authError) return authError;

    // Get client identifier for rate limiting
    const clientId = getClientIdentifier(request);

    // Check rate limit
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

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (files.length > MAX_IMAGES_PER_UPLOAD) {
      return NextResponse.json(
        { error: `Maximum ${MAX_IMAGES_PER_UPLOAD} images allowed per upload` },
        { status: 400 }
      );
    }

    if (rateLimit.remaining < files.length) {
      return NextResponse.json(
        {
          error: `Rate limit would be exceeded. You can upload ${rateLimit.remaining} more images today.`,
          remaining: rateLimit.remaining,
          resetTime: rateLimit.resetTime,
        },
        { status: 429 }
      );
    }

    const uploadResults = [];
    const errors = [];

    for (const file of files) {
      try {
        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
          errors.push(
            `${file.name}: Invalid file type. Only images are allowed.`
          );
          continue;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE_BYTES) {
          errors.push(
            `${file.name}: File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`
          );
          continue;
        }

        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Generate unique key preserving folder structure
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const extension = file.name.split(".").pop();

        // Preserve folder structure if file has a path (from folder upload)
        // Add random slug to prevent directory conflicts
        let folderPath = "";
        if (file.webkitRelativePath && file.webkitRelativePath.includes("/")) {
          const pathParts = file.webkitRelativePath.split("/");
          pathParts.pop(); // Remove filename
          // Add random slug to the first folder in the path to prevent conflicts
          if (pathParts.length > 0) {
            const randomSlug = Math.random().toString(36).substring(2, 8);
            pathParts[0] = `${pathParts[0]}-${randomSlug}`;
          }
          folderPath = pathParts.join("/") + "/";
        }

        const key = `uploads/${folderPath}${timestamp}-${randomId}.${extension}`;

        // Upload to S3
        await uploadToS3(buffer, key, file.type);

        uploadResults.push({
          originalName: file.webkitRelativePath || file.name,
          key,
          size: file.size,
          type: file.type,
        });
      } catch (error) {
        errors.push(`${file.name}: Upload failed`);
      }
    }

    // Update rate limit
    incrementRateLimit(clientId, uploadResults.length);

    return NextResponse.json({
      success: true,
      uploaded: uploadResults.length,
      total: files.length,
      results: uploadResults,
      errors: errors.length > 0 ? errors : undefined,
      rateLimit: {
        remaining: rateLimit.remaining - uploadResults.length,
        resetTime: rateLimit.resetTime,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
