import * as fc from "fast-check";
import { isImageMimeType } from "../../../lib/file-utils";

/**
 * **Feature: file-message, Property 1: Non-image files create FileMessage**
 * **Feature: file-message, Property 2: Image files create ImageMessage**
 * **Validates: Requirements 1.1, 1.2**
 *
 * These property tests verify that:
 * - *For any* file with a non-image MIME type (not starting with "image/"),
 *   uploading it SHALL result in a FileMessage being created, not an ImageMessage.
 * - *For any* file with an image MIME type (starting with "image/"),
 *   uploading it SHALL result in an ImageMessage being created, not a FileMessage.
 */
describe("File Type Routing Property Tests", () => {
  // Arbitrary for generating image MIME types
  const imageMimeTypeArb = fc.oneof(
    fc.constant("image/png"),
    fc.constant("image/jpeg"),
    fc.constant("image/gif"),
    fc.constant("image/webp"),
    fc.constant("image/svg+xml"),
    fc.constant("image/bmp"),
    fc.constant("image/tiff"),
    // Generate arbitrary image MIME types
    fc
      .stringOf(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789-+.".split("")), {
        minLength: 1,
        maxLength: 20,
      })
      .map((subtype) => `image/${subtype}`)
  );

  // Arbitrary for generating non-image MIME types
  const nonImageMimeTypeArb = fc.oneof(
    fc.constant("application/pdf"),
    fc.constant("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
    fc.constant("application/vnd.ms-excel"),
    fc.constant("text/plain"),
    fc.constant("application/json"),
    fc.constant("application/xml"),
    fc.constant("text/csv"),
    fc.constant("application/zip"),
    fc.constant("application/msword"),
    fc.constant("application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    // Generate arbitrary non-image MIME types (excluding "image/")
    fc
      .tuple(
        fc.constantFrom("application", "text", "audio", "video", "font", "model", "multipart"),
        fc.stringOf(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789-+.".split("")), {
          minLength: 1,
          maxLength: 30,
        })
      )
      .map(([type, subtype]) => `${type}/${subtype}`)
  );

  describe("isImageMimeType helper function", () => {
    test("Property 1: Non-image MIME types return false", () => {
      fc.assert(
        fc.property(nonImageMimeTypeArb, (mimeType) => {
          expect(isImageMimeType(mimeType)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    test("Property 2: Image MIME types return true", () => {
      fc.assert(
        fc.property(imageMimeTypeArb, (mimeType) => {
          expect(isImageMimeType(mimeType)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    test("Property 1 & 2: isImageMimeType is consistent with 'image/' prefix check", () => {
      // Combined test: for any MIME type, isImageMimeType should return true
      // if and only if the MIME type starts with "image/"
      const anyMimeTypeArb = fc.oneof(imageMimeTypeArb, nonImageMimeTypeArb);

      fc.assert(
        fc.property(anyMimeTypeArb, (mimeType) => {
          const result = isImageMimeType(mimeType);
          const expectedResult = mimeType.startsWith("image/");
          expect(result).toBe(expectedResult);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("File routing logic", () => {
    // Simulate the routing logic from Chat.tsx
    const routeFile = (
      contentType: string
    ): "ImageMessage" | "FileMessage" => {
      if (isImageMimeType(contentType)) {
        return "ImageMessage";
      } else {
        return "FileMessage";
      }
    };

    test("Property 1: Non-image files are routed to FileMessage", () => {
      fc.assert(
        fc.property(nonImageMimeTypeArb, (mimeType) => {
          const messageType = routeFile(mimeType);
          expect(messageType).toBe("FileMessage");
        }),
        { numRuns: 100 }
      );
    });

    test("Property 2: Image files are routed to ImageMessage", () => {
      fc.assert(
        fc.property(imageMimeTypeArb, (mimeType) => {
          const messageType = routeFile(mimeType);
          expect(messageType).toBe("ImageMessage");
        }),
        { numRuns: 100 }
      );
    });
  });
});
