/**
 * Helper function to determine if a MIME type is an image type.
 * @param mimeType - The MIME type to check
 * @returns true if the MIME type starts with "image/"
 */
export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

/**
 * Helper function to get file icon based on MIME type.
 * @param mimeType - The MIME type of the file
 * @returns An emoji icon representing the file type
 */
export function getFileIcon(mimeType: string): string {
  // Excel/Spreadsheet files
  if (
    mimeType.includes("spreadsheetml") ||
    mimeType.includes("ms-excel") ||
    mimeType.includes("xlsx") ||
    mimeType.includes("xls")
  ) {
    return "📊";
  }
  // PDF files
  if (mimeType === "application/pdf" || mimeType.includes("pdf")) {
    return "📄";
  }
  // Word documents
  if (
    mimeType.includes("wordprocessingml") ||
    mimeType.includes("msword") ||
    mimeType.includes("doc")
  ) {
    return "📝";
  }
  // Text files
  if (mimeType.startsWith("text/")) {
    return "📃";
  }
  // JSON files
  if (mimeType === "application/json") {
    return "📋";
  }
  // Default file icon
  return "📎";
}

/**
 * Helper function to get file type label based on MIME type.
 * @param mimeType - The MIME type of the file
 * @returns A human-readable label for the file type
 */
export function getFileTypeLabel(mimeType: string): string {
  // Excel/Spreadsheet files
  if (
    mimeType.includes("spreadsheetml") ||
    mimeType.includes("ms-excel") ||
    mimeType.includes("xlsx") ||
    mimeType.includes("xls")
  ) {
    return "Excel File";
  }
  // PDF files
  if (mimeType === "application/pdf" || mimeType.includes("pdf")) {
    return "PDF File";
  }
  // Word documents
  if (
    mimeType.includes("wordprocessingml") ||
    mimeType.includes("msword") ||
    mimeType.includes("doc")
  ) {
    return "Word Document";
  }
  // Text files
  if (mimeType.startsWith("text/plain")) {
    return "Text File";
  }
  if (mimeType.startsWith("text/csv")) {
    return "CSV File";
  }
  if (mimeType.startsWith("text/")) {
    return "Text File";
  }
  // JSON files
  if (mimeType === "application/json") {
    return "JSON File";
  }
  // Default
  return "File";
}
