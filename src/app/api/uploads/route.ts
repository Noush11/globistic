import { NextRequest } from "next/server";
import { z } from "zod";
import { presignUpload } from "@/lib/s3";
import { isS3Configured } from "@/lib/env";
import { ok, fail, handleError } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { rateLimit, clientKey } from "@/lib/rate-limit";

const schema = z.object({
  contentType: z.enum([
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/svg+xml",
    "image/webp"
  ]),
  folder: z.string().max(40).optional()
});

// Returns a presigned S3 URL the browser can PUT the file to directly.
export async function POST(req: NextRequest) {
  try {
    const limit = rateLimit(clientKey(req, "upload"), 30, 60_000);
    if (!limit.success) return fail("Too many uploads. Please slow down.", 429);

    // Uploads are allowed for guests (guest checkout) but rate-limited.
    await getUserFromRequest(req);

    const { contentType, folder } = schema.parse(await req.json());

    if (!isS3Configured()) {
      // Signal the client to fall back to a local data URL.
      return fail("Cloud storage is not configured.", 503);
    }

    const result = await presignUpload(contentType, folder || "artwork");
    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}
