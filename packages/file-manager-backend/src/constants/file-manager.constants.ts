/**
 * @fileoverview Constants for the FileManager module
 * @packageDocumentation
 */

/**
 * Injection token for FileManager module options
 */
export const FILE_MANAGER_OPTIONS = "FILE_MANAGER_OPTIONS";

/**
 * Default configuration values
 */
export const FILE_MANAGER_DEFAULTS = {
  /** Default max file size: 10MB */
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  /** Default public subdirectory */
  PUBLIC_DIR: "public",
  /** Default private subdirectory */
  PRIVATE_DIR: "private",
  /** Default retention period in days */
  RETENTION_DAYS: 30,
  /** Default cleanup cron expression (daily at 3 AM) */
  CLEANUP_CRON: "0 3 * * *",
  /** Default visibility */
  IS_PUBLIC: false,
  /** Default extract image dimensions */
  EXTRACT_IMAGE_DIMENSIONS: true,
  /** Default validate magic bytes */
  VALIDATE_MAGIC_BYTES: true,
} as const;

/**
 * Suggested file permissions for RBAC integration
 * Use these with your auth system (e.g., @sottosviluppo/auth-backend)
 *
 * @example
 * ```typescript
 * // In your controller
 * @RequirePermissions(FILE_PERMISSIONS.UPLOAD)
 * @Post()
 * uploadFile() { }
 * ```
 */
export const FILE_PERMISSIONS = {
  /** Permission to upload files */
  UPLOAD: "files:upload",
  /** Permission to read own files */
  READ: "files:read",
  /** Permission to read all files (admin) */
  READ_ALL: "files:read-all",
  /** Permission to update own files */
  UPDATE: "files:update",
  /** Permission to update any file (admin) */
  UPDATE_ALL: "files:update-all",
  /** Permission to delete own files */
  DELETE: "files:delete",
  /** Permission to delete any file (admin) */
  DELETE_ALL: "files:delete-all",
  /** Permission to change file visibility */
  MANAGE_PUBLIC: "files:manage-public",
} as const;

/**
 * Magic bytes signatures for file type validation
 * Used to verify actual file content matches claimed MIME type
 */
export const MAGIC_BYTES: Record<
  string,
  { bytes: number[]; offset?: number }[]
> = {
  // ===== IMAGES =====
  "image/jpeg": [{ bytes: [0xff, 0xd8, 0xff] }],
  "image/png": [{ bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  "image/gif": [
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }, // GIF87a
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }, // GIF89a
  ],
  "image/webp": [
    { bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF (WebP container)
  ],
  "image/bmp": [
    { bytes: [0x42, 0x4d] }, // BM
  ],
  "image/tiff": [
    { bytes: [0x49, 0x49, 0x2a, 0x00] }, // Little endian
    { bytes: [0x4d, 0x4d, 0x00, 0x2a] }, // Big endian
  ],
  "image/x-icon": [
    { bytes: [0x00, 0x00, 0x01, 0x00] }, // ICO
    { bytes: [0x00, 0x00, 0x02, 0x00] }, // CUR
  ],
  "image/svg+xml": [
    { bytes: [0x3c, 0x3f, 0x78, 0x6d, 0x6c] }, // <?xml
    { bytes: [0x3c, 0x73, 0x76, 0x67] }, // <svg
  ],
  "image/avif": [
    { bytes: [0x00, 0x00, 0x00], offset: 0 }, // ftyp at offset 4
  ],
  "image/heic": [
    { bytes: [0x00, 0x00, 0x00], offset: 0 }, // ftyp at offset 4
  ],

  // ===== DOCUMENTS =====
  "application/pdf": [
    { bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] }, // %PDF-
  ],
  "application/msword": [
    { bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }, // OLE Compound
  ],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    { bytes: [0x50, 0x4b, 0x03, 0x04] }, // ZIP (DOCX)
  ],
  "application/vnd.ms-excel": [
    { bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }, // OLE Compound
  ],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    { bytes: [0x50, 0x4b, 0x03, 0x04] }, // ZIP (XLSX)
  ],
  "application/vnd.ms-powerpoint": [
    { bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }, // OLE Compound
  ],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [
    { bytes: [0x50, 0x4b, 0x03, 0x04] }, // ZIP (PPTX)
  ],
  "application/rtf": [
    { bytes: [0x7b, 0x5c, 0x72, 0x74, 0x66] }, // {\rtf
  ],
  "application/vnd.oasis.opendocument.text": [
    { bytes: [0x50, 0x4b, 0x03, 0x04] }, // ZIP (ODT)
  ],
  "application/vnd.oasis.opendocument.spreadsheet": [
    { bytes: [0x50, 0x4b, 0x03, 0x04] }, // ZIP (ODS)
  ],
  "application/vnd.oasis.opendocument.presentation": [
    { bytes: [0x50, 0x4b, 0x03, 0x04] }, // ZIP (ODP)
  ],
  "application/epub+zip": [
    { bytes: [0x50, 0x4b, 0x03, 0x04] }, // ZIP (EPUB)
  ],

  // ===== ARCHIVES =====
  "application/zip": [
    { bytes: [0x50, 0x4b, 0x03, 0x04] },
    { bytes: [0x50, 0x4b, 0x05, 0x06] }, // Empty archive
    { bytes: [0x50, 0x4b, 0x07, 0x08] }, // Spanned archive
  ],
  "application/x-rar-compressed": [
    { bytes: [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07] }, // Rar!
  ],
  "application/vnd.rar": [
    { bytes: [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07] }, // Rar!
  ],
  "application/gzip": [{ bytes: [0x1f, 0x8b] }],
  "application/x-gzip": [{ bytes: [0x1f, 0x8b] }],
  "application/x-7z-compressed": [
    { bytes: [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c] },
  ],
  "application/x-tar": [
    { bytes: [0x75, 0x73, 0x74, 0x61, 0x72], offset: 257 }, // ustar
  ],
  "application/x-bzip2": [
    { bytes: [0x42, 0x5a, 0x68] }, // BZh
  ],
  "application/x-xz": [{ bytes: [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00] }],

  // ===== VIDEO =====
  "video/mp4": [
    { bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // ftyp
  ],
  "video/webm": [{ bytes: [0x1a, 0x45, 0xdf, 0xa3] }],
  "video/x-msvideo": [
    { bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF (AVI)
  ],
  "video/quicktime": [
    { bytes: [0x66, 0x74, 0x79, 0x70, 0x71, 0x74], offset: 4 }, // ftypqt
    { bytes: [0x6d, 0x6f, 0x6f, 0x76] }, // moov
  ],
  "video/x-matroska": [{ bytes: [0x1a, 0x45, 0xdf, 0xa3] }],
  "video/x-flv": [
    { bytes: [0x46, 0x4c, 0x56] }, // FLV
  ],
  "video/mpeg": [
    { bytes: [0x00, 0x00, 0x01, 0xba] }, // MPEG PS
    { bytes: [0x00, 0x00, 0x01, 0xb3] }, // MPEG VS
  ],
  "video/3gpp": [
    { bytes: [0x66, 0x74, 0x79, 0x70, 0x33, 0x67], offset: 4 }, // ftyp3g
  ],
  "video/x-ms-wmv": [
    { bytes: [0x30, 0x26, 0xb2, 0x75, 0x8e, 0x66, 0xcf, 0x11] },
  ],

  // ===== AUDIO =====
  "audio/mpeg": [
    { bytes: [0xff, 0xfb] }, // MP3
    { bytes: [0xff, 0xfa] },
    { bytes: [0xff, 0xf3] },
    { bytes: [0xff, 0xf2] },
    { bytes: [0x49, 0x44, 0x33] }, // ID3
  ],
  "audio/mp3": [
    { bytes: [0xff, 0xfb] },
    { bytes: [0x49, 0x44, 0x33] }, // ID3
  ],
  "audio/wav": [
    { bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF
  ],
  "audio/x-wav": [
    { bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF
  ],
  "audio/ogg": [
    { bytes: [0x4f, 0x67, 0x67, 0x53] }, // OggS
  ],
  "audio/webm": [{ bytes: [0x1a, 0x45, 0xdf, 0xa3] }],
  "audio/flac": [
    { bytes: [0x66, 0x4c, 0x61, 0x43] }, // fLaC
  ],
  "audio/aac": [{ bytes: [0xff, 0xf1] }, { bytes: [0xff, 0xf9] }],
  "audio/mp4": [
    { bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // ftyp (M4A)
  ],
  "audio/x-ms-wma": [
    { bytes: [0x30, 0x26, 0xb2, 0x75, 0x8e, 0x66, 0xcf, 0x11] },
  ],
  "audio/midi": [
    { bytes: [0x4d, 0x54, 0x68, 0x64] }, // MThd
  ],
  "audio/x-midi": [
    { bytes: [0x4d, 0x54, 0x68, 0x64] }, // MThd
  ],

  // ===== FONTS =====
  "font/woff": [
    { bytes: [0x77, 0x4f, 0x46, 0x46] }, // wOFF
  ],
  "font/woff2": [
    { bytes: [0x77, 0x4f, 0x46, 0x32] }, // wOF2
  ],
  "font/ttf": [{ bytes: [0x00, 0x01, 0x00, 0x00] }],
  "font/otf": [
    { bytes: [0x4f, 0x54, 0x54, 0x4f] }, // OTTO
  ],
  "application/font-woff": [{ bytes: [0x77, 0x4f, 0x46, 0x46] }],
  "application/font-woff2": [{ bytes: [0x77, 0x4f, 0x46, 0x32] }],

  // ===== DATA/TEXT =====
  "application/json": [
    { bytes: [0x7b] }, // {
    { bytes: [0x5b] }, // [
  ],
  "application/xml": [
    { bytes: [0x3c, 0x3f, 0x78, 0x6d, 0x6c] }, // <?xml
  ],
  "text/xml": [
    { bytes: [0x3c, 0x3f, 0x78, 0x6d, 0x6c] }, // <?xml
  ],
  "text/html": [
    { bytes: [0x3c, 0x21, 0x44, 0x4f, 0x43, 0x54, 0x59, 0x50, 0x45] }, // <!DOCTYPE
    { bytes: [0x3c, 0x68, 0x74, 0x6d, 0x6c] }, // <html
  ],
  "application/wasm": [
    { bytes: [0x00, 0x61, 0x73, 0x6d] }, // \0asm
  ],

  // ===== EXECUTABLES (for reference, usually blocked) =====
  "application/x-msdownload": [
    { bytes: [0x4d, 0x5a] }, // MZ (EXE)
  ],
  "application/x-executable": [
    { bytes: [0x7f, 0x45, 0x4c, 0x46] }, // ELF
  ],
  "application/x-mach-binary": [
    { bytes: [0xfe, 0xed, 0xfa, 0xce] }, // Mach-O 32-bit
    { bytes: [0xfe, 0xed, 0xfa, 0xcf] }, // Mach-O 64-bit
    { bytes: [0xca, 0xfe, 0xba, 0xbe] }, // Mach-O Universal
  ],

  // ===== OTHER =====
  "application/x-sqlite3": [
    { bytes: [0x53, 0x51, 0x4c, 0x69, 0x74, 0x65] }, // SQLite
  ],
  "application/x-shockwave-flash": [
    { bytes: [0x46, 0x57, 0x53] }, // FWS
    { bytes: [0x43, 0x57, 0x53] }, // CWS (compressed)
  ],
  "application/postscript": [
    { bytes: [0x25, 0x21, 0x50, 0x53] }, // %!PS
  ],
};

/**
 * MIME type categories for convenience
 */
export const MIME_CATEGORIES = {
  IMAGE: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/tiff",
    "image/svg+xml",
    "image/x-icon",
    "image/avif",
    "image/heic",
  ],
  DOCUMENT: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/rtf",
    "application/vnd.oasis.opendocument.text",
    "application/vnd.oasis.opendocument.spreadsheet",
    "application/vnd.oasis.opendocument.presentation",
  ],
  VIDEO: [
    "video/mp4",
    "video/webm",
    "video/x-msvideo",
    "video/quicktime",
    "video/x-matroska",
    "video/mpeg",
    "video/3gpp",
  ],
  AUDIO: [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/ogg",
    "audio/webm",
    "audio/flac",
    "audio/aac",
    "audio/mp4",
  ],
  ARCHIVE: [
    "application/zip",
    "application/x-rar-compressed",
    "application/vnd.rar",
    "application/gzip",
    "application/x-7z-compressed",
    "application/x-tar",
    "application/x-bzip2",
  ],
  FONT: ["font/woff", "font/woff2", "font/ttf", "font/otf"],
} as const;

/**
 * Human-readable size units
 */
export const SIZE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

/**
 * Formats bytes to human-readable string
 *
 * @param {number} bytes - Size in bytes
 * @param {number} [decimals=2] - Number of decimal places
 * @returns {string} Formatted size string
 *
 * @example
 * ```typescript
 * formatBytes(1024)       // '1 KB'
 * formatBytes(1536, 1)    // '1.5 KB'
 * formatBytes(1048576)    // '1 MB'
 * formatBytes(0)          // '0 B'
 * ```
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${SIZE_UNITS[i]}`;
}
