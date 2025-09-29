import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { list } from "@vercel/blob";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authError = requireAuth(request);
    if (authError) return authError;

    // List blobs in the uploads folder
    const { blobs } = await list({
      prefix: "uploads/",
    });

    if (!blobs || blobs.length === 0) {
      return NextResponse.json({ images: [] });
    }

    // Transform blobs to image format
    const images = blobs.map((blob) => ({
      key: blob.pathname,
      name: blob.pathname.split("/").pop(),
      size: blob.size,
      lastModified: blob.uploadedAt,
      url: blob.url,
    }));

    // Sort by last modified (newest first)
    const sortedImages = images.sort(
      (a, b) =>
        new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );

    return NextResponse.json({ images: sortedImages });
  } catch (error: any) {
    console.error("Gallery error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

