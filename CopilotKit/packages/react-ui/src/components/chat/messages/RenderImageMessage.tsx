import { RenderMessageProps } from "../props";
import { UserMessage as DefaultUserMessage } from "./UserMessage";
import { AssistantMessage as DefaultAssistantMessage } from "./AssistantMessage";

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

  if (message.isImageMessage()) {
    // @ts-ignore - format exists on ImageMessage
    const format = message.format;
    // @ts-ignore - bytes exists on ImageMessage
    const bytes = message.bytes;
    // @ts-ignore - role exists on ImageMessage
    const role = message.role;

    const imageData = `data:image/${format};base64,${bytes}`;

    const contentComponent = (
      <div className="copilotKitImage">
        <img
          src={imageData}
          alt="User uploaded image"
          style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "8px" }}
        />
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
