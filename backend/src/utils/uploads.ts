/**
 * Customer file uploads (warranty invoices, service-request photos). Files arrive as base64 inside the JSON body,
 * are checked by their bytes (not the declared type or name) and are stored under backend/uploads, which is
 * git-ignored and never served publicly. Only the storage key and metadata go into MySQL.
 */
import { createHash, randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BusinessRuleError } from "./errors.js";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const uploadsDir = path.resolve(backendRoot, process.env.UPLOADS_DIR ?? "uploads");

const FILE_TYPES: Record<string, { ext: string; magic: (b: Buffer) => boolean }> = {
  "application/pdf": { ext: "pdf", magic: (b) => b.subarray(0, 5).toString("latin1") === "%PDF-" },
  "image/jpeg": { ext: "jpg", magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { ext: "png", magic: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
};

export interface UploadBody {
  fileName: string;
  contentType: string;
  dataBase64: string;
}

/** A validated upload, ready to be written by a repository. */
export interface UploadFile {
  originalFileName: string;
  mimeType: string;
  ext: string;
  buffer: Buffer;
  sizeBytes: number;
  checksumSha256: string;
}

/** JSON Schema for an UploadBody; `maxBytes` is the decoded size limit. */
export function uploadSchema(contentTypes: string[], maxBytes: number) {
  return {
    type: "object",
    required: ["fileName", "contentType", "dataBase64"],
    additionalProperties: false,
    properties: {
      fileName: { type: "string", minLength: 1, maxLength: 255 },
      contentType: { type: "string", enum: contentTypes },
      dataBase64: { type: "string", minLength: 8, maxLength: Math.ceil(maxBytes / 3) * 4 },
    },
  } as const;
}

export function decodeUpload(upload: UploadBody, label: string, maxBytes: number): UploadFile {
  const type = FILE_TYPES[upload.contentType];
  if (!type) throw new BusinessRuleError(`${label}: this file type is not accepted.`);
  const buffer = Buffer.from(upload.dataBase64, "base64");
  if (buffer.length === 0 || buffer.length > maxBytes) {
    throw new BusinessRuleError(`${label} must be ${Math.round(maxBytes / 1024 / 1024)} MB or smaller.`);
  }
  if (!type.magic(buffer)) throw new BusinessRuleError(`${label} is not a valid ${type.ext.toUpperCase()} file.`);
  return {
    originalFileName: path.basename(upload.fileName).slice(0, 255),
    mimeType: upload.contentType,
    ext: type.ext,
    buffer,
    sizeBytes: buffer.length,
    checksumSha256: createHash("sha256").update(buffer).digest("hex"),
  };
}

/** Writes the file under uploads/<folder>/ and returns its storage key (path relative to uploadsDir). */
export async function storeUpload(folder: string, file: UploadFile): Promise<string> {
  const key = `${folder}/${randomBytes(16).toString("hex")}.${file.ext}`;
  await mkdir(path.join(uploadsDir, folder), { recursive: true });
  await writeFile(path.join(uploadsDir, key), file.buffer, { flag: "wx" });
  return key;
}

/** Best-effort cleanup when the database write that referenced the file fails. */
export async function removeUpload(key: string): Promise<void> {
  await unlink(path.join(uploadsDir, key)).catch(() => undefined);
}
