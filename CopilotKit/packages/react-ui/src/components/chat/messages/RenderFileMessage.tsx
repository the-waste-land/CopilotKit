import { RenderMessageProps } from "../props";
import { UserMessage as DefaultUserMessage } from "./UserMessage";
import { AssistantMessage as DefaultAssistantMessage } from "./AssistantMessage";
import { getFileIcon, getFileTypeLabel } from "../../../lib/file-utils";

export function RenderFileMessage({
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

  if (message.isFileMessage()) {
    // @ts-ignore - mimeType exists on FileMessage
    const mimeType = message.mimeType;
    // @ts-ignore - fileName exists on FileMessage
    const fileName = message.fileName;
    // @ts-ignore - bytes exists on FileMessage
    const bytes = message.bytes;
    // @ts-ignore - role exists on FileMessage
    const role = message.role;

    const contentComponent = (
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
