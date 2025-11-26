import * as fc from "fast-check";
import { FileMessage, Message, TextMessage, ImageMessage, Role } from "../client/types";
import { MessageRole } from "../graphql/@generated/graphql";

/**
 * **Feature: file-message, Property 3: FileMessage contains all required fields**
 * **Validates: Requirements 1.3, 1.4**
 *
 * *For any* FileMessage created from a file upload, the message SHALL contain
 * non-empty mimeType matching the original file's MIME type, non-empty bytes,
 * and non-empty fileName.
 */
describe("FileMessage Property Tests", () => {
  // Arbitrary for generating non-empty strings (for required fields)
  const nonEmptyString = fc.string({ minLength: 1, maxLength: 100 });

  // Arbitrary for generating valid MIME types
  const mimeTypeArb = fc.oneof(
    fc.constant("application/pdf"),
    fc.constant("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
    fc.constant("application/vnd.ms-excel"),
    fc.constant("text/plain"),
    fc.constant("application/json"),
    fc.constant("application/xml"),
    // Generate arbitrary MIME types in format "type/subtype"
    fc.tuple(
      fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 1, maxLength: 20 }),
      fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-+.'.split('')), { minLength: 1, maxLength: 30 })
    ).map(([type, subtype]) => `${type}/${subtype}`)
  );

  // Arbitrary for generating base64-encoded bytes (non-empty)
  const base64BytesArb = fc.base64String({ minLength: 4, maxLength: 1000 });

  // Arbitrary for generating file names
  const fileNameArb = fc.tuple(
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789_-'.split('')), { minLength: 1, maxLength: 50 }),
    fc.constantFrom('.pdf', '.xlsx', '.xls', '.txt', '.json', '.xml', '.doc', '.docx')
  ).map(([name, ext]) => `${name}${ext}`);

  // Arbitrary for MessageRole
  const roleArb = fc.constantFrom(MessageRole.User, MessageRole.Assistant);

  // Arbitrary for optional parentMessageId
  const parentMessageIdArb = fc.option(fc.uuid(), { nil: undefined });

  // Combined arbitrary for FileMessage constructor options
  const fileMessagePropsArb = fc.record({
    mimeType: mimeTypeArb,
    bytes: base64BytesArb,
    fileName: fileNameArb,
    role: roleArb,
    parentMessageId: parentMessageIdArb,
  });

  test("Property 3: FileMessage contains all required fields - mimeType, bytes, fileName are non-empty", () => {
    fc.assert(
      fc.property(fileMessagePropsArb, (props) => {
        const fileMessage = new FileMessage(props);

        // Verify all required fields are present and non-empty
        expect(fileMessage.mimeType).toBeDefined();
        expect(fileMessage.mimeType.length).toBeGreaterThan(0);
        expect(fileMessage.mimeType).toBe(props.mimeType);

        expect(fileMessage.bytes).toBeDefined();
        expect(fileMessage.bytes.length).toBeGreaterThan(0);
        expect(fileMessage.bytes).toBe(props.bytes);

        expect(fileMessage.fileName).toBeDefined();
        expect(fileMessage.fileName.length).toBeGreaterThan(0);
        expect(fileMessage.fileName).toBe(props.fileName);

        expect(fileMessage.role).toBeDefined();
        expect(fileMessage.role).toBe(props.role);
      }),
      { numRuns: 100 }
    );
  });

  test("Property 3: FileMessage preserves all input fields exactly", () => {
    fc.assert(
      fc.property(fileMessagePropsArb, (props) => {
        const fileMessage = new FileMessage(props);

        // All fields should match the input exactly
        expect(fileMessage.mimeType).toStrictEqual(props.mimeType);
        expect(fileMessage.bytes).toStrictEqual(props.bytes);
        expect(fileMessage.fileName).toStrictEqual(props.fileName);
        expect(fileMessage.role).toStrictEqual(props.role);
        expect(fileMessage.parentMessageId).toStrictEqual(props.parentMessageId);
      }),
      { numRuns: 100 }
    );
  });

  test("Property 3: FileMessage type is always 'FileMessage'", () => {
    fc.assert(
      fc.property(fileMessagePropsArb, (props) => {
        const fileMessage = new FileMessage(props);
        expect(fileMessage.type).toBe("FileMessage");
      }),
      { numRuns: 100 }
    );
  });

  test("Property 3: FileMessage has auto-generated id, createdAt, and status when not provided", () => {
    fc.assert(
      fc.property(fileMessagePropsArb, (props) => {
        const fileMessage = new FileMessage(props);

        // Auto-generated fields should be present
        expect(fileMessage.id).toBeDefined();
        expect(typeof fileMessage.id).toBe("string");
        expect(fileMessage.id.length).toBeGreaterThan(0);

        expect(fileMessage.createdAt).toBeDefined();
        expect(fileMessage.createdAt instanceof Date).toBe(true);

        expect(fileMessage.status).toBeDefined();
        expect(fileMessage.status.code).toBe("Success");
      }),
      { numRuns: 100 }
    );
  });
});
