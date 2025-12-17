import { Injectable, Inject, Logger } from "@nestjs/common";
import type { IFileManagerModuleOptions } from "../interfaces/file-manager-options.interface";
import type { IFileMetadata } from "../entities/file.entity";
import {
  FILE_MANAGER_DEFAULTS,
  FILE_MANAGER_OPTIONS,
} from "../constants/file-manager.constants";

/**
 * Service responsible for extracting metadata from files
 *
 * @export
 * @class MetadataService
 */
@Injectable()
export class MetadataService {
  private readonly logger = new Logger(MetadataService.name);
  private readonly extractImageDimensions: boolean;

  constructor(
    @Inject(FILE_MANAGER_OPTIONS)
    private readonly options: IFileManagerModuleOptions
  ) {
    this.extractImageDimensions =
      options.metadata?.extractImageDimensions ??
      FILE_MANAGER_DEFAULTS.EXTRACT_IMAGE_DIMENSIONS;
  }

  /**
   * Extracts metadata from a file based on its type
   *
   * @param {Buffer} buffer - File content buffer
   * @param {string} mimeType - MIME type of the file
   * @returns {Promise<IFileMetadata | null>} Extracted metadata or null
   * @memberof MetadataService
   */
  async extractMetadata(
    buffer: Buffer,
    mimeType: string
  ): Promise<IFileMetadata | null> {
    try {
      if (mimeType.startsWith("image/") && this.extractImageDimensions) {
        return this.extractImageMetadata(buffer, mimeType);
      }

      return {
        extractedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.warn(`Failed to extract metadata: ${error}`);
      return null;
    }
  }

  /**
   * Extracts metadata from image files
   */
  private extractImageMetadata(
    buffer: Buffer,
    mimeType: string
  ): IFileMetadata {
    const metadata: IFileMetadata = {
      extractedAt: new Date().toISOString(),
      format: mimeType.split("/")[1],
    };

    const dimensions = this.getImageDimensions(buffer, mimeType);
    if (dimensions) {
      metadata.width = dimensions.width;
      metadata.height = dimensions.height;
    }

    return metadata;
  }

  /**
   * Gets image dimensions from buffer without external dependencies
   * Supports JPEG, PNG, GIF, BMP, and WebP
   */
  private getImageDimensions(
    buffer: Buffer,
    mimeType: string
  ): { width: number; height: number } | null {
    try {
      switch (mimeType) {
        case "image/jpeg":
          return this.getJpegDimensions(buffer);
        case "image/png":
          return this.getPngDimensions(buffer);
        case "image/gif":
          return this.getGifDimensions(buffer);
        case "image/bmp":
          return this.getBmpDimensions(buffer);
        case "image/webp":
          return this.getWebpDimensions(buffer);
        default:
          return null;
      }
    } catch {
      return null;
    }
  }

  /**
   * Extracts dimensions from JPEG files
   */
  private getJpegDimensions(
    buffer: Buffer
  ): { width: number; height: number } | null {
    let offset = 2;

    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) {
        return null;
      }

      const marker = buffer[offset + 1];

      // SOF0, SOF1, SOF2 markers contain dimensions
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        const height = buffer.readUInt16BE(offset + 5);
        const width = buffer.readUInt16BE(offset + 7);
        return { width, height };
      }

      if (marker === 0xd8 || marker === 0xd9) {
        offset += 2;
      } else {
        const length = buffer.readUInt16BE(offset + 2);
        offset += 2 + length;
      }
    }

    return null;
  }

  /**
   * Extracts dimensions from PNG files
   */
  private getPngDimensions(
    buffer: Buffer
  ): { width: number; height: number } | null {
    if (buffer.length < 24) return null;

    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);

    return { width, height };
  }

  /**
   * Extracts dimensions from GIF files
   */
  private getGifDimensions(
    buffer: Buffer
  ): { width: number; height: number } | null {
    if (buffer.length < 10) return null;

    const width = buffer.readUInt16LE(6);
    const height = buffer.readUInt16LE(8);

    return { width, height };
  }

  /**
   * Extracts dimensions from BMP files
   */
  private getBmpDimensions(
    buffer: Buffer
  ): { width: number; height: number } | null {
    if (buffer.length < 26) return null;

    const width = buffer.readUInt32LE(18);
    const height = Math.abs(buffer.readInt32LE(22));

    return { width, height };
  }

  /**
   * Extracts dimensions from WebP files
   */
  private getWebpDimensions(
    buffer: Buffer
  ): { width: number; height: number } | null {
    if (buffer.length < 30) return null;

    const chunk = buffer.toString("ascii", 12, 16);

    if (chunk === "VP8 ") {
      // Lossy WebP
      const width = buffer.readUInt16LE(26) & 0x3fff;
      const height = buffer.readUInt16LE(28) & 0x3fff;
      return { width, height };
    } else if (chunk === "VP8L") {
      // Lossless WebP
      const bits = buffer.readUInt32LE(21);
      const width = (bits & 0x3fff) + 1;
      const height = ((bits >> 14) & 0x3fff) + 1;
      return { width, height };
    } else if (chunk === "VP8X") {
      // Extended WebP
      const width = (buffer.readUIntLE(24, 3) & 0xffffff) + 1;
      const height = (buffer.readUIntLE(27, 3) & 0xffffff) + 1;
      return { width, height };
    }

    return null;
  }
}
