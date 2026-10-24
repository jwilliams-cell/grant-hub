import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

// Hosted on Vercel, request bodies are capped at 4.5 MB, so the browser sends the contract
// straight to private Blob storage and the server reads it from there. The middleware's
// password check covers this route too.
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("contracts/")) throw new Error("Uploads go in contracts/ only.");
        return {
          allowedContentTypes: ["application/pdf"],
          maximumSizeInBytes: 30 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
