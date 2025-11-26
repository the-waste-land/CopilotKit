# Implementation Plan

- [x] 1. Add FileMessageInput to GraphQL schema (runtime package)
  - [x] 1.1 Add FileMessageInput class to message.input.ts
    - Add @InputType decorated class with mimeType, bytes, fileName, parentMessageId, role fields
    - _Requirements: 2.1_
  - [x] 1.2 Add fileMessage field to MessageInput class
    - Add optional fileMessage field of type FileMessageInput
    - _Requirements: 2.2_

- [x] 2. Add FileMessage to runtime converted types
  - [x] 2.1 Add FileMessage type to MessageType union
    - Update MessageType to include "FileMessage"
    - _Requirements: 4.1_
  - [x] 2.2 Add isFileMessage() method to Message base class
    - Add type guard method that returns this is FileMessage
    - _Requirements: 4.1, 4.2_
  - [x] 2.3 Add FileMessage class to converted/index.ts
    - Create FileMessage class extending Message with mimeType, bytes, fileName, role fields
    - _Requirements: 2.3_
  - [x] 2.4 Write property test for isFileMessage type guard
    - **Property 4: FileMessage type guard correctness**
    - **Validates: Requirements 4.2, 4.3**

- [x] 3. Add FileMessage to runtime-client-gql package
  - [x] 3.1 Update MessageType union in types.ts
    - Add "FileMessage" to MessageType union
    - _Requirements: 4.1_
  - [x] 3.2 Add isFileMessage() method to Message class
    - Add type guard method
    - _Requirements: 4.1, 4.2_
  - [x] 3.3 Add FileMessage class to types.ts
    - Create FileMessage class with mimeType, bytes, fileName, role, parentMessageId
    - Export FileMessage from the module
    - _Requirements: 1.3, 1.4_
  - [x] 3.4 Write property test for FileMessage structure
    - **Property 3: FileMessage contains all required fields**
    - **Validates: Requirements 1.3, 1.4**

- [x] 4. Regenerate GraphQL types
  - [x] 4.1 Run GraphQL codegen to update generated types
    - Execute the codegen script to regenerate @generated/graphql types
    - _Requirements: 2.1, 2.2_

- [x] 5. Add FileMessage support to LangGraph integration
  - [x] 5.1 Update copilotkitMessagesToLangChain function
    - Add FileMessage handling in remote-lg-action.ts
    - Convert FileMessage to LangGraph platform message format
    - _Requirements: 2.3_
  - [x] 5.2 Update BaseLangGraphPlatformMessage type (if needed)
    - Ensure type supports FileMessage fields (mimeType, bytes, fileName)
    - _Requirements: 2.3_

- [x] 6. Update Chat.tsx to use FileMessage for non-image files
  - [x] 6.1 Add isImageMimeType helper function
    - Create function that returns true for MIME types starting with "image/"
    - _Requirements: 1.1, 1.2_
  - [x] 6.2 Update sendMessage to route files to correct message type
    - Use ImageMessage for image files, FileMessage for other files
    - _Requirements: 1.1, 1.2_
  - [x] 6.3 Write property test for file type routing
    - **Property 1: Non-image files create FileMessage**
    - **Property 2: Image files create ImageMessage**
    - **Validates: Requirements 1.1, 1.2**

- [x] 7. Create RenderFileMessage component
  - [x] 7.1 Create RenderFileMessage.tsx in messages folder
    - Create component that renders file attachment UI with icon and filename
    - Support xlsx and PDF file icons
    - _Requirements: 3.1, 3.3_
  - [x] 7.2 Add getFileIcon helper function
    - Return appropriate icon based on MIME type
    - _Requirements: 3.3_
  - [x] 7.3 Write property test for file icon selection
    - **Property 5: File icon selection based on MIME type**
    - **Validates: Requirements 3.3**

- [x] 8. Update Messages.tsx to render FileMessage
  - [x] 8.1 Import RenderFileMessage component
    - Add import for the new component
    - _Requirements: 3.1_
  - [x] 8.2 Add FileMessage rendering logic
    - Check isFileMessage() and render with RenderFileMessage
    - _Requirements: 3.1_

- [x] 9. Update CopilotChat props for RenderFileMessage
  - [x] 9.1 Add RenderFileMessage prop to CopilotChatProps
    - Add optional RenderFileMessage component prop
    - _Requirements: 3.1_
  - [x] 9.2 Pass RenderFileMessage to Messages component
    - Wire up the prop through the component tree
    - _Requirements: 3.1_

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Clean up RenderImageMessage
  - [x] 11.1 Remove non-image file handling from RenderImageMessage
    - RenderImageMessage should only handle image files now
    - _Requirements: 3.2_
  - [x] 11.2 Remove isImageFormat helper and file icon logic
    - These are now handled by RenderFileMessage
    - _Requirements: 3.2_

- [x] 12. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
