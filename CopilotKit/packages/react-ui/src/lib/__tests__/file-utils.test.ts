import * as fc from "fast-check";
import { isImageMimeType, getFileIcon, getFileTypeLabel } from "../file-utils";

/**
 * **Feature: file-message, Property 5: File icon selection based on MIME type**
 * **Validates: Requirements 3.3**
 *
 * *For any* FileMessage with xlsx MIME type, the rendered icon SHALL be the spreadsheet icon,
 * and for PDF MIME type, the icon SHALL be the document icon.
 */
describe("File Utils Property Tests", () => {
  // Arbitrary for xlsx MIME types
  const xlsxMimeTypeArb = fc.constantFrom(
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/xlsx",
    "application/xls"
  );

  // Arbitrary for PDF MIME types
  const pdfMimeTypeArb = fc.constantFrom("application/pdf", "pdf");

  // Arbitrary for Word document MIME types
  const wordMimeTypeArb = fc.constantFrom(
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/doc"
  );

  // Arbitrary for text MIME types
  const textMimeTypeArb = fc.constantFrom(
    "text/plain",
    "text/csv",
    "text/html",
    "text/xml"
  );

  describe("getFileIcon", () => {
    test("Property 5: xlsx MIME types return spreadsheet icon", () => {
      fc.assert(
        fc.property(xlsxMimeTypeArb, (mimeType) => {
          const icon = getFileIcon(mimeType);
          expect(icon).toBe("📊");
        }),
        { numRuns: 100 }
      );
    });

    test("Property 5: PDF MIME types return document icon", () => {
      fc.assert(
        fc.property(pdfMimeTypeArb, (mimeType) => {
          const icon = getFileIcon(mimeType);
          expect(icon).toBe("📄");
        }),
        { numRuns: 100 }
      );
    });

    test("Word document MIME types return word icon", () => {
      fc.assert(
        fc.property(wordMimeTypeArb, (mimeType) => {
          const icon = getFileIcon(mimeType);
          expect(icon).toBe("📝");
        }),
        { numRuns: 100 }
      );
    });

    test("Text MIME types return text icon", () => {
      fc.assert(
        fc.property(textMimeTypeArb, (mimeType) => {
          const icon = getFileIcon(mimeType);
          expect(icon).toBe("📃");
        }),
        { numRuns: 100 }
      );
    });

    test("JSON MIME type returns clipboard icon", () => {
      expect(getFileIcon("application/json")).toBe("📋");
    });

    test("Unknown MIME types return default file icon", () => {
      const unknownMimeTypes = [
        "application/octet-stream",
        "application/zip",
        "audio/mp3",
        "video/mp4",
      ];
      unknownMimeTypes.forEach((mimeType) => {
        expect(getFileIcon(mimeType)).toBe("📎");
      });
    });
  });

  describe("getFileTypeLabel", () => {
    test("xlsx MIME types return 'Excel File' label", () => {
      fc.assert(
        fc.property(xlsxMimeTypeArb, (mimeType) => {
          const label = getFileTypeLabel(mimeType);
          expect(label).toBe("Excel File");
        }),
        { numRuns: 100 }
      );
    });

    test("PDF MIME types return 'PDF File' label", () => {
      fc.assert(
        fc.property(pdfMimeTypeArb, (mimeType) => {
          const label = getFileTypeLabel(mimeType);
          expect(label).toBe("PDF File");
        }),
        { numRuns: 100 }
      );
    });

    test("Word document MIME types return 'Word Document' label", () => {
      fc.assert(
        fc.property(wordMimeTypeArb, (mimeType) => {
          const label = getFileTypeLabel(mimeType);
          expect(label).toBe("Word Document");
        }),
        { numRuns: 100 }
      );
    });

    test("text/plain returns 'Text File' label", () => {
      expect(getFileTypeLabel("text/plain")).toBe("Text File");
    });

    test("text/csv returns 'CSV File' label", () => {
      expect(getFileTypeLabel("text/csv")).toBe("CSV File");
    });

    test("JSON MIME type returns 'JSON File' label", () => {
      expect(getFileTypeLabel("application/json")).toBe("JSON File");
    });

    test("Unknown MIME types return 'File' label", () => {
      const unknownMimeTypes = [
        "application/octet-stream",
        "application/zip",
        "audio/mp3",
        "video/mp4",
      ];
      unknownMimeTypes.forEach((mimeType) => {
        expect(getFileTypeLabel(mimeType)).toBe("File");
      });
    });
  });

  describe("isImageMimeType", () => {
    test("Image MIME types return true", () => {
      const imageMimeTypes = [
        "image/png",
        "image/jpeg",
        "image/gif",
        "image/webp",
        "image/svg+xml",
      ];
      imageMimeTypes.forEach((mimeType) => {
        expect(isImageMimeType(mimeType)).toBe(true);
      });
    });

    test("Non-image MIME types return false", () => {
      const nonImageMimeTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
        "application/json",
      ];
      nonImageMimeTypes.forEach((mimeType) => {
        expect(isImageMimeType(mimeType)).toBe(false);
      });
    });
  });
});
