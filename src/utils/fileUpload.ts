import { v2 as cloudinary } from 'cloudinary';
import fs from 'node:fs';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { ENV } from '../config/env.js';
import { ApiError } from './ApiError.js';

// Valid MIME types for file uploads
const VALID_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

export const saveBase64ToFile = async (
  base64String: string,
): Promise<string> => {
  // If it's not a data URL, return as-is (likely a regular URL like YouTube/Vimeo)
  if (!base64String?.startsWith('data:')) return base64String;

  // Fixed regex: proper character class with hyphen at end or escaped
  // Matches: data:image/jpeg;base64,<base64data>
  const matches = new RegExp(/^data:([A-Za-z+/\\-]+);base64,(.+)$/).exec(
    base64String,
  );

  // If it starts with "data:" but doesn't match the base64 pattern, return as-is
  // This allows for regular URLs or other formats to pass through
  if (!matches?.[2]) {
    // Only throw if it's clearly a malformed data URL (starts with data: but is incomplete)
    if (
      base64String.startsWith('data:') &&
      !base64String.includes(';base64,')
    ) {
      throw new ApiError(400, 'Invalid base64 data URL format');
    }
    // Return as-is if it's some other format
    return base64String;
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  // Validate MIME type
  if (!VALID_MIME_TYPES.has(mimeType)) {
    throw new ApiError(400, `Unsupported file type: ${mimeType}`);
  }

  // Decode base64 to buffer
  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64Data, 'base64');
  } catch {
    throw new ApiError(400, 'Invalid base64 encoding');
  }

  // Validate file size based on MIME type
  let maxSize: number;
  let fileTypeLabel: string;

  if (mimeType.startsWith('image/')) {
    maxSize = ENV.MEDIA_LIMITS.THUMBNAIL;
    fileTypeLabel = 'Image';
  } else if (mimeType.startsWith('video/')) {
    maxSize = ENV.MEDIA_LIMITS.VIDEO;
    fileTypeLabel = 'Video';
  } else {
    maxSize = ENV.MEDIA_LIMITS.AVATAR;
    fileTypeLabel = 'Avatar';
  }

  if (buffer.length > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    const fileSizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
    throw new ApiError(
      413,
      `${fileTypeLabel} file size (${fileSizeMB}MB) exceeds limit (${maxSizeMB}MB)`,
    );
  }

  // Generate filename with appropriate extension
  const extension = mimeType.split('/')[1] || 'bin';
  const filename = `${(uuidv4 as () => string)()}.${extension}`;

  // IF CLOUDINARY CREDENTIALS ARE PROVIDED, UPLOAD TO CLOUDINARY
  if (
    ENV.CLOUDINARY_CLOUD_NAME &&
    ENV.CLOUDINARY_API_KEY &&
    ENV.CLOUDINARY_API_SECRET
  ) {
    cloudinary.config({
      cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
      api_key: ENV.CLOUDINARY_API_KEY,
      api_secret: ENV.CLOUDINARY_API_SECRET,
    });

    try {
      const result = await cloudinary.uploader.upload(base64String, {
        resource_type: 'auto',
        folder: 'lms-uploads',
      });
      return result.secure_url;
    } catch (error) {
      throw new ApiError(
        500,
        `Cloudinary upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // VERCEL SERVERLESS ENVIRONMENT FALLBACK
  if (ENV.IS_VERCEL) {
    // We cannot use local fs. Return the base64 string directly for DB storage if it's small,
    // or log a warning and return it (though storing large base64 in Mongo is an anti-pattern,
    // it prevents complete failure before Cloudinary is configured).
    return base64String;
  }

  // LOCAL DEVELOPMENT - Write file to disk
  const uploadsDir = path.join(process.cwd(), ENV.UPLOAD_PATH);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(uploadsDir, filename);

  try {
    fs.writeFileSync(filePath, buffer);
  } catch (error) {
    throw new ApiError(
      500,
      `Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  return `/${ENV.UPLOAD_PATH}/${filename}`;
};
