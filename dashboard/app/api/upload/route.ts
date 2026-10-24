import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

// Hosted on Vercel, request bodies are capped at 4.5 MB, so the browser sends the contract
// straight to private Blob storage and the server reads it from there. The middleware's
// password check covers this route too. Presigned uploads work with both kinds of store
// connection: the newer BLOB_STORE_ID one and the older BLOB_READ_WRITE_TOKEN one.
const PATHNAME = /^contracts\/[0-9a-f-]{36}\.pdf$/;
const PDF = ["application/pdf"];
const MAX_BYTES = 30 * 1024 * 1024;

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadPresignedBody;
  try {
    const result = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname) => {
        if (!PATHNAME.test(pathname)) throw new Error("Uploads go in contracts/ only.");
        const token = await issueSignedToken({
          pathname,
          operations: ["put"],
          allowedContentTypes: PDF,
          maximumSizeInBytes: MAX_BYTES,
          validUntil: Date.now() + 15 * 60 * 1000,
        });
        return { token, urlOptions: { allowedContentTypes: PDF, maximumSizeInBytes: MAX_BYTES, allowOverwrite: false } };
      },
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
