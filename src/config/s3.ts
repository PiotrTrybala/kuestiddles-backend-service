import { AWS_ACCESS_KEY_ID, AWS_BUCKET_NAME, AWS_SECRET_ACCESS_KEY } from "@/env";
import { S3Client } from "bun";

export const s3 = new S3Client({
  region: "eu-north-1",
  bucket: AWS_BUCKET_NAME,
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
});
