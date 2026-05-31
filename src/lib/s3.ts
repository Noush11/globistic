import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import { env, isS3Configured } from "./env";

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: env.aws.region,
      credentials: {
        accessKeyId: env.aws.accessKeyId,
        secretAccessKey: env.aws.secretAccessKey
      }
    });
  }
  return client;
}

export function publicUrlFor(key: string): string {
  if (env.aws.publicUrl) return `${env.aws.publicUrl.replace(/\/$/, "")}/${key}`;
  return `https://${env.aws.bucket}.s3.${env.aws.region}.amazonaws.com/${key}`;
}

export interface UploadResult {
  key: string;
  url: string;
}

// Upload a buffer/blob directly (server-side).
export async function uploadObject(
  buffer: Buffer | Uint8Array,
  contentType: string,
  folder = "uploads"
): Promise<UploadResult> {
  if (!isS3Configured()) {
    throw new Error("S3 is not configured. Set AWS_* environment variables.");
  }
  const ext = contentType.split("/")[1]?.replace("+xml", "") || "bin";
  const key = `${folder}/${new Date().toISOString().slice(0, 10)}/${nanoid()}.${ext}`;
  await getClient().send(
    new PutObjectCommand({
      Bucket: env.aws.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable"
    })
  );
  return { key, url: publicUrlFor(key) };
}

export async function deleteObject(key: string): Promise<void> {
  if (!isS3Configured()) return;
  await getClient().send(
    new DeleteObjectCommand({ Bucket: env.aws.bucket, Key: key })
  );
}

// Generate a presigned PUT URL so the browser can upload directly to S3.
export async function presignUpload(
  contentType: string,
  folder = "uploads"
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  if (!isS3Configured()) {
    throw new Error("S3 is not configured. Set AWS_* environment variables.");
  }
  const ext = contentType.split("/")[1]?.replace("+xml", "") || "bin";
  const key = `${folder}/${new Date().toISOString().slice(0, 10)}/${nanoid()}.${ext}`;
  const uploadUrl = await getSignedUrl(
    getClient(),
    new PutObjectCommand({ Bucket: env.aws.bucket, Key: key, ContentType: contentType }),
    { expiresIn: 300 }
  );
  return { uploadUrl, key, publicUrl: publicUrlFor(key) };
}

export async function presignDownload(key: string): Promise<string> {
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: env.aws.bucket, Key: key }),
    { expiresIn: 300 }
  );
}
