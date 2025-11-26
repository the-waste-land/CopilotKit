# Implementation Plan

- [x] 1. Update type definitions and default values
  - [x] 1.1 Rename `ImageUpload` type to `FileUpload` in Chat.tsx
    - Update the type definition to include optional `fileName` field
    - Update all references to use the new type name
    - _Requirements: 4.1_
  - [x] 1.2 Update `inputFileAccept` default value
    - Change default from `"image/*"` to include xlsx and PDF MIME types
    - Default: `"image/*,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/pdf"`
    - _Requirements: 2.2_
  - [ ]* 1.3 Write property test for default accept value
    - **Property 2: Default accept includes all supported types**
    - **Validates: Requirements 2.2**

- [x] 2. Update file upload handler to support all file types
  - [x] 2.1 Rename `handleImageUpload` to `handleFileUpload`
    - Remove the filter that only accepts image files
    - Accept all files that match the inputFileAccept pattern
    - _Requirements: 1.1, 1.2_
  - [x] 2.2 Update file encoding logic
    - Ensure base64 encoding works for xlsx and PDF files
    - Preserve the correct MIME type in contentType field
    - _Requirements: 1.2, 1.3, 4.3_
  - [ ]* 2.3 Write property test for file encoding
    - **Property 3: File encoding produces valid FileUpload structure**
    - **Validates: Requirements 1.2, 1.3, 4.1**

- [x] 3. Update clipboard paste handler
  - [x] 3.1 Extend paste handler to support xlsx and PDF files
    - Update the filter to accept xlsx and PDF MIME types in addition to images
    - _Requirements: 1.2_

- [x] 4. Update upload queue component
  - [x] 4.1 Rename `ImageUploadQueue` to `FileUploadQueue`
    - Update component name and file name
    - Update all imports and references
    - _Requirements: 3.1_
  - [x] 4.2 Update queue display for non-image files
    - Show file type icon or indicator for xlsx and PDF files
    - Display filename if available
    - _Requirements: 3.1_
  - [ ]* 4.3 Write property test for upload queue operations
    - **Property 4: Upload queue contains all added files**
    - **Property 5: Remove operation removes correct file**
    - **Validates: Requirements 3.1, 3.2**

- [x] 5. Update message sending logic
  - [x] 5.1 Ensure files are sent with correct MIME types
    - Verify contentType is preserved when sending to backend
    - _Requirements: 1.4, 4.3_
  - [x] 5.2 Verify queue clearing after send
    - Ensure selectedFiles state is cleared after message is sent
    - _Requirements: 3.3_
  - [ ]* 5.3 Write property tests for send behavior
    - **Property 6: Send clears upload queue**
    - **Property 7: Sent files preserve MIME type**
    - **Validates: Requirements 3.3, 1.4, 4.3**

- [x] 6. Update prop naming for clarity (optional)
  - [x] 6.1 Consider renaming `imageUploadsEnabled` to `fileUploadsEnabled`
    - Maintain backward compatibility with deprecation warning
    - _Requirements: 2.1_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
