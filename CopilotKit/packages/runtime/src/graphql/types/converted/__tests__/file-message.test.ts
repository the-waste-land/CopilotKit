import * as fc from "fast-check";
import {
  Message,
  FileMessage,
  TextMessage,
  ImageMessage,
  ActionExecutionMessage,
  ResultMessage,
  AgentStateMessage,
  MessageType,
} from "../index";
import { MessageRole } from "../../enums";

/**
 * **Feature: file-message, Property 4: FileMessage type guard correctness**
 * **Validates: Requirements 4.2, 4.3**
 *
 * *For any* FileMessage instance, calling isFileMessage() SHALL return true,
 * and for any non-FileMessage instance, isFileMessage() SHALL return false.
 */
describe("FileMessage type guard", () => {
  // Arbitrary for generating valid FileMessage instances
  const fileMessageArbitrary = fc.record({
    id: fc.uuid(),
    createdAt: fc.date(),
    mimeType: fc.oneof(
      fc.constant("application/pdf"),
      fc.constant("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
      fc.constant("application/vnd.ms-excel"),
      fc.constant("text/plain"),
      fc.constant("application/json"),
      fc.stringMatching(/^application\/[a-z0-9-]+$/)
    ),
    bytes: fc.base64String({ minLength: 1 }),
    fileName: fc.stringMatching(/^[a-zA-Z0-9_-]+\.[a-z]{2,4}$/),
    role: fc.constantFrom("user" as MessageRole, "assistant" as MessageRole),
    parentMessageId: fc.option(fc.uuid(), { nil: undefined }),
  });

  // Arbitrary for generating non-FileMessage instances
  const textMessageArbitrary = fc.record({
    id: fc.uuid(),
    createdAt: fc.date(),
    content: fc.string({ minLength: 1 }),
    role: fc.constantFrom("user" as MessageRole, "assistant" as MessageRole),
    parentMessageId: fc.option(fc.uuid(), { nil: undefined }),
  });

  const imageMessageArbitrary = fc.record({
    id: fc.uuid(),
    createdAt: fc.date(),
    format: fc.constantFrom("png", "jpeg", "gif", "webp"),
    bytes: fc.base64String({ minLength: 1 }),
    role: fc.constantFrom("user" as MessageRole, "assistant" as MessageRole),
    parentMessageId: fc.option(fc.uuid(), { nil: undefined }),
  });

  describe("Property 4: FileMessage type guard correctness", () => {
    it("should return true for any FileMessage instance", () => {
      fc.assert(
        fc.property(fileMessageArbitrary, (data) => {
          const fileMessage = Object.assign(new FileMessage(), {
            ...data,
            type: "FileMessage" as MessageType,
          });

          expect(fileMessage.isFileMessage()).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("should return false for any TextMessage instance", () => {
      fc.assert(
        fc.property(textMessageArbitrary, (data) => {
          const textMessage = Object.assign(new TextMessage(), {
            ...data,
            type: "TextMessage" as MessageType,
          });

          expect(textMessage.isFileMessage()).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("should return false for any ImageMessage instance", () => {
      fc.assert(
        fc.property(imageMessageArbitrary, (data) => {
          const imageMessage = Object.assign(new ImageMessage(), {
            ...data,
            type: "ImageMessage" as MessageType,
          });

          expect(imageMessage.isFileMessage()).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("should correctly narrow type when isFileMessage() returns true", () => {
      fc.assert(
        fc.property(fileMessageArbitrary, (data) => {
          const message: Message = Object.assign(new FileMessage(), {
            ...data,
            type: "FileMessage" as MessageType,
          });

          if (message.isFileMessage()) {
            // TypeScript should narrow the type to FileMessage
            expect(message.mimeType).toBe(data.mimeType);
            expect(message.bytes).toBe(data.bytes);
            expect(message.fileName).toBe(data.fileName);
          } else {
            fail("isFileMessage() should return true for FileMessage instances");
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should distinguish FileMessage from all other message types", () => {
      const allMessageTypesArbitrary = fc.oneof(
        fileMessageArbitrary.map((data) =>
          Object.assign(new FileMessage(), { ...data, type: "FileMessage" as MessageType })
        ),
        textMessageArbitrary.map((data) =>
          Object.assign(new TextMessage(), { ...data, type: "TextMessage" as MessageType })
        ),
        imageMessageArbitrary.map((data) =>
          Object.assign(new ImageMessage(), { ...data, type: "ImageMessage" as MessageType })
        )
      );

      fc.assert(
        fc.property(allMessageTypesArbitrary, (message) => {
          const isFile = message.isFileMessage();
          const expectedIsFile = message.type === "FileMessage";

          expect(isFile).toBe(expectedIsFile);
        }),
        { numRuns: 100 }
      );
    });
  });
});
