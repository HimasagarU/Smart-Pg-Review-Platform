import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getS3Client() {
  return new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: false,
  });
}

export async function getUploadUrl(key: string, contentType: string) {
  const s3 = getS3Client();
  const cmd = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 15 });
  return url;
}

export async function uploadBufferToR2(key: string, buffer: Buffer, contentType: string) {
  const s3 = getS3Client();
  const cmd = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });
  await s3.send(cmd);
}

export async function downloadFromR2(key: string): Promise<Buffer> {
  const s3 = getS3Client();
  const cmd = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
  });
  const res = await s3.send(cmd);
  const stream = res.Body as any;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export function getPublicUrl(key: string): string {
  // R2 public URL (if public access enabled) or presigned read URL
  return `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}/${key}`;
}
