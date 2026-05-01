import fs from 'node:fs';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { ENV } from '../config/env';
import { ApiError } from './ApiError';

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

export const saveBase64ToFile = (base64String: string): string => {
  // If it's not a data URL, return as-is (likely a regular URL like YouTube/Vimeo)
  if (!base64String?.startsWith('data:')) return base64String;

  // Fixed regex: proper character class with hyphen at end or escaped
  // Matches: data:image/jpeg;base64,<base64data>
  const matches = new RegExp(/^data:([A-Za-z+/\\-]+);base64,(.+)$/).exec(base64String);
  
  // If it starts with "data:" but doesn't match the base64 pattern, return as-is
  // This allows for regular URLs or other formats to pass through
  if (!matches?.[2]) {
    // Only throw if it's clearly a malformed data URL (starts with data: but is incomplete)
    if (base64String.startsWith('data:') && !base64String.includes(';base64,')) {
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

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), ENV.UPLOAD_PATH);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Generate filename with appropriate extension
  const extension = mimeType.split('/')[1] || 'bin';
  const filename = `${(uuidv4 as () => string)()}.${extension}`;
  const filePath = path.join(uploadsDir, filename);

  // Write file to disk
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

