import { MAGIC_BYTES } from "../constants/file-manager.constants";

/**
 * Result of magic bytes validation
 *
 * @export
 * @interface IMagicBytesValidationResult
 */
export interface IMagicBytesValidationResult {
  /** Whether the validation passed */
  valid: boolean;
  /** Detected MIME type based on magic bytes */
  detectedMimeType: string | null;
  /** Human-readable message */
  message: string;
}

/**
 * Validates file content against claimed MIME type using magic bytes
 *
 * @export
 * @param {Buffer} buffer - File content buffer
 * @param {string} claimedMimeType - MIME type claimed by the client
 * @returns {IMagicBytesValidationResult} Validation result
 *
 * @example
 * ```typescript
 * const result = validateMagicBytes(fileBuffer, 'image/jpeg');
 * if (!result.valid) {
 *   throw new BadRequestException(result.message);
 * }
 * ```
 */
export function validateMagicBytes(
  buffer: Buffer,
  claimedMimeType: string
): IMagicBytesValidationResult {
  const detectedMimeType = detectMimeType(buffer);

  // If we can't detect the type, check if we have signatures for the claimed type
  if (!detectedMimeType) {
    const hasSignatures = MAGIC_BYTES[claimedMimeType] !== undefined;

    if (hasSignatures) {
      // We have signatures but couldn't match - suspicious
      return {
        valid: false,
        detectedMimeType: null,
        message: `File content does not match claimed type '${claimedMimeType}'`,
      };
    }

    // No signatures for this type, allow it through
    return {
      valid: true,
      detectedMimeType: null,
      message: "MIME type validation skipped (no signature available)",
    };
  }

  // Check if detected type matches claimed type
  const matches = mimeTypesMatch(claimedMimeType, detectedMimeType);

  return {
    valid: matches,
    detectedMimeType,
    message: matches
      ? "File content matches claimed MIME type"
      : `File content detected as '${detectedMimeType}', but claimed as '${claimedMimeType}'`,
  };
}

/**
 * Detects MIME type from file buffer using magic bytes
 *
 * @export
 * @param {Buffer} buffer - File content buffer
 * @returns {(string | null)} Detected MIME type or null if unknown
 */
export function detectMimeType(buffer: Buffer): string | null {
  if (buffer.length === 0) {
    return null;
  }

  for (const [mimeType, signatures] of Object.entries(MAGIC_BYTES)) {
    for (const signature of signatures) {
      if (matchesSignature(buffer, signature.bytes, signature.offset ?? 0)) {
        return mimeType;
      }
    }
  }

  return null;
}

/**
 * Checks if a buffer matches a signature at a given offset
 */
function matchesSignature(
  buffer: Buffer,
  signature: number[],
  offset: number
): boolean {
  if (buffer.length < offset + signature.length) {
    return false;
  }

  for (let i = 0; i < signature.length; i++) {
    if (buffer[offset + i] !== signature[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Checks if two MIME types are compatible
 * Handles cases where detection might be slightly different
 */
function mimeTypesMatch(claimed: string, detected: string): boolean {
  // Exact match
  if (claimed === detected) {
    return true;
  }

  // Same category check
  const claimedCategory = claimed.split("/")[0];
  const detectedCategory = detected.split("/")[0];

  if (claimedCategory !== detectedCategory) {
    return false;
  }

  // Known compatible types
  const compatibleTypes: Record<string, string[]> = {
    // JPEG variations
    "image/jpeg": ["image/jpg"],
    "image/jpg": ["image/jpeg"],
    // Audio variations
    "audio/mpeg": ["audio/mp3"],
    "audio/mp3": ["audio/mpeg"],
    // Office documents (all ZIP-based, hard to distinguish)
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      "application/zip",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
      "application/zip",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      [
        "application/zip",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
    // ODF documents (also ZIP-based)
    "application/vnd.oasis.opendocument.text": ["application/zip"],
    "application/vnd.oasis.opendocument.spreadsheet": ["application/zip"],
    "application/vnd.oasis.opendocument.presentation": ["application/zip"],
    "application/epub+zip": ["application/zip"],
    // Video containers
    "video/mp4": ["video/quicktime"],
    "video/quicktime": ["video/mp4"],
    // Audio/Video WebM and Matroska
    "audio/webm": ["video/webm", "video/x-matroska"],
    "video/webm": ["audio/webm", "video/x-matroska"],
    "video/x-matroska": ["video/webm", "audio/webm"],
    // GZIP variations
    "application/gzip": ["application/x-gzip"],
    "application/x-gzip": ["application/gzip"],
    // RAR variations
    "application/x-rar-compressed": ["application/vnd.rar"],
    "application/vnd.rar": ["application/x-rar-compressed"],
    // WAV variations
    "audio/wav": ["audio/x-wav"],
    "audio/x-wav": ["audio/wav"],
    // MIDI variations
    "audio/midi": ["audio/x-midi"],
    "audio/x-midi": ["audio/midi"],
  };

  const compatible = compatibleTypes[claimed];
  if (compatible && compatible.includes(detected)) {
    return true;
  }

  return false;
}

/**
 * Gets a list of MIME types that can be validated
 *
 * @export
 * @returns {string[]} Array of supported MIME types
 */
export function getSupportedMimeTypes(): string[] {
  return Object.keys(MAGIC_BYTES);
}

/**
 * Checks if a MIME type can be validated using magic bytes
 *
 * @export
 * @param {string} mimeType - MIME type to check
 * @returns {boolean} True if validation is supported
 */
export function canValidateMimeType(mimeType: string): boolean {
  return MAGIC_BYTES[mimeType] !== undefined;
}
