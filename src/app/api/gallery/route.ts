import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listObjects, getSignedDownloadUrl } from "@/lib/aws";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authError = requireAuth(request);
    if (authError) return authError;

    // List objects in the uploads folder
    const result = await listObjects("uploads/");

    if (!result.Contents) {
      return NextResponse.json({ images: [] });
    }

    // Generate signed URLs for each image
    const images = await Promise.all(
      result.Contents.map(async (object) => {
        if (!object.Key) return null;

        const signedUrl = await getSignedDownloadUrl(object.Key, 3600); // 1 hour expiry

        return {
          key: object.Key,
          name: object.Key.split("/").pop(),
          size: object.Size,
          lastModified: object.LastModified,
          url: signedUrl,
        };
      })
    );

    // Filter out null values and sort by last modified (newest first)
    const validImages = images
      .filter((img): img is NonNullable<typeof img> => img !== null)
      .sort(
        (a, b) =>
          new Date(b.lastModified!).getTime() -
          new Date(a.lastModified!).getTime()
      );

    return NextResponse.json({ images: validImages });
  } catch (error: any) {
    // Handle specific permission errors gracefully
    if (
      error.name === "AccessDenied" &&
      error.message.includes("s3:ListBucket")
    ) {
      return NextResponse.json({
        images: [],
        message:
          "Gallery view requires additional permissions. Upload functionality is still available.",
      });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
