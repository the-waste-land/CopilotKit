import { RenderMessageProps } from "../props";
import { UserMessage as DefaultUserMessage } from "./UserMessage";
import { AssistantMessage as DefaultAssistantMessage } from "./AssistantMessage";

// Helper function to determine if a format is an image
const isImageFormat = (format: string): boolean => {
  // Image formats don't contain "/" (e.g., "png", "jpeg")
  // Non-image formats are full MIME types (e.g., "application/pdf")
  const imageFormats = ["png", "jpeg", "jpg", "gif", "webp", "svg", "bmp", "ico"];
  return imageFormats.includes(format.toLowerCase()) || format.startsWith("image/");
};

// Helper function to get file type label
const getFileTypeLabel = (format: string): string => {
  if (format.includes("spreadsheetml") || format.includes("ms-excel") || format.includes("xlsx")) {
    return "Excel 文件";
  }
  if (format === "application/pdf" || format === "pdf") {
    return "PDF 文件";
  }
  return "文件";
};

// Helper function to get file icon
const getFileIcon = (format: string): string => {
  if (format.includes("spreadsheetml") || format.includes("ms-excel") || format.includes("xlsx")) {
    return "📊";
  }
  if (format === "application/pdf" || format === "pdf" || format.includes("application/pdf")) {
    return "📄";
  }
  return "📎";
};

// Helper function to parse format and extract fileName
// Format can be "mimeType::fileName" for non-image files
const parseFormat = (format: string): { mimeType: string; fileName?: string } => {
  if (format.includes("::")) {
    const [mimeType, fileName] = format.split("::");
    return { mimeType, fileName };
  }
  return { mimeType: format };
};

export function RenderImageMessage({
  UserMessage = DefaultUserMessage,
  AssistantMessage = DefaultAssistantMessage,
  ...props
}: RenderMessageProps) {
  const {
    message,
    inProgress,
    index,
    isCurrentMessage,
    onRegenerate,
    onCopy,
    onThumbsUp,
    onThumbsDown,
  } = props;

  // Debug logging
  console.log("[RenderImageMessage] 渲染消息:", {
    isImageMessage: message.isImageMessage(),
    // @ts-ignore
    format: message.format,
    // @ts-ignore
    bytesLength: message.bytes?.length,
  });

  if (message.isImageMessage()) {
    // @ts-ignore
    const format = message.format;
    const isImage = isImageFormat(format);
    console.log("[RenderImageMessage] 文件格式检查:", {
      format,
      isImage,
    });

    let contentComponent;

    if (isImage) {
      // Render as image
      // @ts-ignore
      const imageData = `data:image/${format};base64,${message.bytes}`;
      console.log("[RenderImageMessage] 渲染为图片");
      contentComponent = (
        <div className="copilotKitImage">
          <img
            src={imageData}
            alt="User uploaded image"
            style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "8px" }}
          />
        </div>
      );
    } else {
      // Parse format to extract mimeType and fileName
      const { mimeType, fileName } = parseFormat(format);
      console.log("[RenderImageMessage] 渲染为文件附件:", { format, mimeType, fileName });

      contentComponent = (
        <div
          className="copilotKitFileAttachment"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 16px",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            border: "1px solid #e0e0e0",
            maxWidth: "300px",
          }}
        >
          <span style={{ fontSize: "28px", flexShrink: 0 }}>{getFileIcon(mimeType)}</span>
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {fileName && (
              <span
                style={{
                  fontWeight: 500,
                  fontSize: "14px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={fileName}
              >
                {fileName}
              </span>
            )}
            <span style={{ fontSize: "12px", color: "#666" }}>
              {getFileTypeLabel(mimeType)}
            </span>
          </div>
        </div>
      );
    }

    // @ts-ignore - role exists on ImageMessage
    const role = message.role;
    // @ts-ignore - bytes exists on ImageMessage
    const bytes = message.bytes;

    if (role === "user") {
      return (
        <UserMessage
          key={index}
          data-message-role="user"
          message=""
          rawData={message}
          subComponent={contentComponent}
        />
      );
    } else if (role === "assistant") {
      return (
        <AssistantMessage
          key={index}
          data-message-role="assistant"
          message=""
          rawData={message}
          subComponent={contentComponent}
          isLoading={inProgress && isCurrentMessage && !bytes}
          isGenerating={inProgress && isCurrentMessage && !!bytes}
          isCurrentMessage={isCurrentMessage}
          onRegenerate={() => onRegenerate?.(message.id)}
          onCopy={onCopy}
          onThumbsUp={onThumbsUp}
          onThumbsDown={onThumbsDown}
        />
      );
    }
  }

  return null;
}
