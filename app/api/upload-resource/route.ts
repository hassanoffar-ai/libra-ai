import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { del } from "@vercel/blob";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Vercel Blob Client Upload Endpoint
 * Handles token generation so client browser uploads files directly to Vercel Blob.
 * Completely bypasses Vercel's 4.5MB Serverless Function payload limit (supports up to 50MB).
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname /*, clientPayload */) => {
        return {
          allowedContentTypes: [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
            "application/epub+zip",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
            "application/octet-stream",
          ],
          maximumSizeInBytes: 50 * 1024 * 1024, // 50MB
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("Vercel Blob client upload completed:", blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    console.error("Vercel Blob client upload token error:", error);
    return NextResponse.json(
      { error: error?.message || "Vercel Blob token xətası" },
      { status: 400 }
    );
  }
}

/**
 * Vercel Blob File Deletion Endpoint
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let fileUrl = searchParams.get("url");

    if (!fileUrl) {
      try {
        const body = await request.json();
        fileUrl = body?.url;
      } catch {}
    }

    if (!fileUrl) {
      return NextResponse.json(
        { error: "Silinəcək faylın URL ünvanı tələb olunur." },
        { status: 400 }
      );
    }

    // Verify it is a Vercel Blob URL before attempting deletion
    if (
      fileUrl.includes("vercel-storage.com") ||
      fileUrl.includes("blob.vercel-storage")
    ) {
      await del(fileUrl);
    }

    return NextResponse.json({ success: true, message: "Fayl Vercel Blob-dan silindi." });
  } catch (error: any) {
    console.error("Vercel Blob deletion error:", error);
    return NextResponse.json(
      { error: error?.message || "Fayl Vercel Blob-dan silinərkən xəta baş verdi." },
      { status: 500 }
    );
  }
}
