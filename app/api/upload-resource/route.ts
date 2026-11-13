import { put, del } from "@vercel/blob";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Vercel Blob File Upload Endpoint
 * Receives FormData with file and uploads directly to Vercel Blob with public access.
 * Up to 50MB PDFs, DOCX, EPUB, etc.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Yükləmək üçün fayl tapılmadı." },
        { status: 400 }
      );
    }

    // Check file size (e.g. 50MB maximum limit)
    const MAX_SIZE_MB = 50;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `Fayl həcmi maksimum ${MAX_SIZE_MB}MB ola bilər.` },
        { status: 400 }
      );
    }

    // Sanitize filename and create structured path
    const rawName = file.name || "e-resurs";
    const cleanName = rawName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `e-library/${Date.now()}_${cleanName}`;

    // Upload to Vercel Blob (automatically utilizes process.env.BLOB_READ_WRITE_TOKEN)
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: true,
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      pathname: blob.pathname,
      contentType: blob.contentType,
      size: file.size,
    });
  } catch (error: any) {
    console.error("Vercel Blob upload error:", error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Fayl Vercel Blob yaddaşına yüklənə bilmədi. Zəhmət olmasa BLOB_READ_WRITE_TOKEN parametrlərini yoxlayın.",
      },
      { status: 500 }
    );
  }
}

/**
 * Vercel Blob File Deletion Endpoint
 * Deletes a file from Vercel Blob given its public URL
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
