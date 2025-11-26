# Requirements Document

## Introduction

This feature adds a new `FileMessage` type to CopilotKit's message system to distinguish between image uploads and file uploads (xlsx, PDF, etc.). Currently, all file uploads use `ImageMessage`, which is semantically incorrect and makes it difficult to handle different file types appropriately on the backend.

## Glossary

- **FileMessage**: A new message type specifically for non-image file uploads (xlsx, PDF, etc.)
- **ImageMessage**: The existing message type for image uploads
- **GraphQL Input**: The type-graphql decorated class that defines the GraphQL schema for message inputs
- **Message Type**: A discriminated union type that identifies different kinds of messages in the chat system
- **MIME Type**: Multipurpose Internet Mail Extensions type, a standard for identifying file formats

## Requirements

### Requirement 1

**User Story:** As a developer, I want a dedicated FileMessage type for non-image files, so that the backend can distinguish between images and documents.

#### Acceptance Criteria

1. WHEN a user uploads a non-image file (xlsx, PDF) THEN the Chat Component SHALL create a FileMessage instead of an ImageMessage
2. WHEN a user uploads an image file THEN the Chat Component SHALL continue to create an ImageMessage
3. WHEN a FileMessage is created THEN the FileMessage SHALL contain the file's MIME type, base64-encoded bytes, and original filename
4. WHEN a FileMessage is serialized for GraphQL THEN the FileMessage SHALL include all required fields (mimeType, bytes, fileName, role)

### Requirement 2

**User Story:** As a developer, I want the FileMessage type to be defined in the GraphQL schema, so that it can be transmitted between client and server.

#### Acceptance Criteria

1. WHEN the GraphQL schema is generated THEN the schema SHALL include a FileMessageInput type with mimeType, bytes, fileName, and role fields
2. WHEN a MessageInput is sent to the server THEN the MessageInput SHALL support an optional fileMessage field
3. WHEN the runtime processes a FileMessage THEN the runtime SHALL correctly parse and convert the FileMessage

### Requirement 3

**User Story:** As a user, I want to see my uploaded files rendered appropriately in the chat, so that I can distinguish between images and documents.

#### Acceptance Criteria

1. WHEN a FileMessage is displayed THEN the Chat Component SHALL render a file attachment UI with icon and filename
2. WHEN an ImageMessage is displayed THEN the Chat Component SHALL render the image preview
3. WHEN rendering a FileMessage THEN the Chat Component SHALL show the appropriate icon based on file type (xlsx, PDF)

### Requirement 4

**User Story:** As a developer, I want the Message class to support type checking for FileMessage, so that I can handle different message types in code.

#### Acceptance Criteria

1. WHEN checking a message type THEN the Message class SHALL provide an isFileMessage() method
2. WHEN isFileMessage() returns true THEN the message SHALL be typed as FileMessage
3. WHEN iterating over messages THEN the code SHALL be able to distinguish FileMessage from ImageMessage using type guards
