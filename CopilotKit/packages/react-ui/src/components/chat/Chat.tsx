/**
 * <br/>
 * <img src="/images/CopilotChat.gif" width="500" />
 *
 * A chatbot panel component for the CopilotKit framework. The component allows for a high degree
 * of customization through various props and custom CSS.
 *
 * ## Install Dependencies
 *
 * This component is part of the [@copilotkit/react-ui](https://npmjs.com/package/@copilotkit/react-ui) package.
 *
 * ```shell npm2yarn \"@copilotkit/react-ui"\
 * npm install @copilotkit/react-core @copilotkit/react-ui
 * ```
 *
 * ## Usage
 *
 * ```tsx
 * import { CopilotChat } from "@copilotkit/react-ui";
 * import "@copilotkit/react-ui/styles.css";
 *
 * <CopilotChat
 *   labels={{
 *     title: "Your Assistant",
 *     initial: "Hi! 👋 How can I assist you today?",
 *   }}
 * />
 * ```
 *
 * ### Look & Feel
 *
 * By default, CopilotKit components do not have any styles. You can import CopilotKit's stylesheet at the root of your project:
 * ```tsx title="YourRootComponent.tsx"
 * ...
 * import "@copilotkit/react-ui/styles.css"; // [!code highlight]
 *
 * export function YourRootComponent() {
 *   return (
 *     <CopilotKit>
 *       ...
 *     </CopilotKit>
 *   );
 * }
 * ```
 * For more information about how to customize the styles, check out the [Customize Look & Feel](/guides/custom-look-and-feel/customize-built-in-ui-components) guide.
 */

import {
  ChatContext,
  ChatContextProvider,
  CopilotChatIcons,
  CopilotChatLabels,
} from "./ChatContext";
import { Messages as DefaultMessages } from "./Messages";
import { Input as DefaultInput } from "./Input";
import { RenderTextMessage as DefaultRenderTextMessage } from "./messages/RenderTextMessage";
import { RenderActionExecutionMessage as DefaultRenderActionExecutionMessage } from "./messages/RenderActionExecutionMessage";
import { RenderResultMessage as DefaultRenderResultMessage } from "./messages/RenderResultMessage";
import { RenderAgentStateMessage as DefaultRenderAgentStateMessage } from "./messages/RenderAgentStateMessage";
import { RenderImageMessage as DefaultRenderImageMessage } from "./messages/RenderImageMessage";
import { RenderFileMessage as DefaultRenderFileMessage } from "./messages/RenderFileMessage";
import { AssistantMessage as DefaultAssistantMessage } from "./messages/AssistantMessage";
import { UserMessage as DefaultUserMessage } from "./messages/UserMessage";
import React, { useEffect, useRef, useState } from "react";
import {
  SystemMessageFunction,
  useCopilotChat,
  useCopilotContext,
  useCopilotMessagesContext,
} from "@copilotkit/react-core";
import { reloadSuggestions } from "./Suggestion";
import { CopilotChatSuggestion } from "../../types/suggestions";
import { Message, Role, TextMessage, ImageMessage, FileMessage } from "@copilotkit/runtime-client-gql";
import { isImageMimeType } from "../../lib/file-utils";
import { randomId } from "@copilotkit/shared";
import {
  AssistantMessageProps,
  ComponentsMap,
  InputProps,
  MessagesProps,
  RenderMessageProps,
  RenderSuggestionsListProps,
  UserMessageProps,
} from "./props";

import { HintFunction, runAgent, stopAgent } from "@copilotkit/react-core";
import { ImageUploadQueue } from "./ImageUploadQueue";
import { Suggestions as DefaultRenderSuggestionsList } from "./Suggestions";
import { ImageCompressionDialog } from "./ImageCompressionDialog";
import {
  convertPngToJpg,
  compressJpgToTarget,
  getImageSizeInKB,
  needsCompression,
} from "../../lib/image-compression";

/**
 * Props for CopilotChat component.
 */
export interface CopilotChatProps {
  /**
   * Custom instructions to be added to the system message. Use this property to
   * provide additional context or guidance to the language model, influencing
   * its responses. These instructions can include specific directions,
   * preferences, or criteria that the model should consider when generating
   * its output, thereby tailoring the conversation more precisely to the
   * user's needs or the application's requirements.
   */
  instructions?: string;

  /**
   * A callback that gets called when the in progress state changes.
   */
  onInProgress?: (inProgress: boolean) => void;

  /**
   * A callback that gets called when a new message it submitted.
   */
  onSubmitMessage?: (message: string) => void | Promise<void>;

  /**
   * A custom stop generation function.
   */
  onStopGeneration?: OnStopGeneration;

  /**
   * A custom reload messages function.
   */
  onReloadMessages?: OnReloadMessages;

  /**
   * A callback function to regenerate the assistant's response
   */
  onRegenerate?: (messageId: string) => void;

  /**
   * A callback function when the message is copied
   */
  onCopy?: (message: string) => void;

  /**
   * A callback function for thumbs up feedback
   */
  onThumbsUp?: (message: TextMessage) => void;

  /**
   * A callback function for thumbs down feedback
   */
  onThumbsDown?: (message: TextMessage) => void;

  /**
   * A list of markdown components to render in assistant message.
   * Useful when you want to render custom elements in the message (e.g a reference tag element)
   */
  markdownTagRenderers?: ComponentsMap;

  /**
   * Icons can be used to set custom icons for the chat window.
   */
  icons?: CopilotChatIcons;

  /**
   * Labels can be used to set custom labels for the chat window.
   */
  labels?: CopilotChatLabels;

  /**
   * Enable file upload button (supports images, xlsx, and PDF files)
   */
  fileUploadsEnabled?: boolean;

  /**
   * @deprecated Use fileUploadsEnabled instead
   * Enable image upload button (image inputs only supported on some models)
   */
  imageUploadsEnabled?: boolean;

  /**
   * The 'accept' attribute for the file input.
   * Defaults to "image/*,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/pdf".
   */
  inputFileAccept?: string;

  /**
   * Image compression configuration for uploaded images.
   * When enabled, PNG images are automatically converted to JPEG and compressed,
   * and large JPEG images will prompt the user for compression confirmation.
   */
  imageCompression?: {
    /**
     * Enable automatic image compression. Defaults to false.
     */
    enabled: boolean;
    /**
     * Target size in KB for PNG to JPEG conversion. Defaults to 200.
     */
    pngTargetSizeKB?: number;
    /**
     * Size threshold in KB for JPEG compression prompt. Defaults to 250.
     */
    jpgTargetSizeKB?: number;
  };

  /**
   * A function that takes in context string and instructions and returns
   * the system message to include in the chat request.
   * Use this to completely override the system message, when providing
   * instructions is not enough.
   */
  makeSystemMessage?: SystemMessageFunction;

  /**
   * A custom assistant message component to use instead of the default.
   */
  AssistantMessage?: React.ComponentType<AssistantMessageProps>;

  /**
   * A custom user message component to use instead of the default.
   */
  UserMessage?: React.ComponentType<UserMessageProps>;

  /**
   * A custom Messages component to use instead of the default.
   */
  Messages?: React.ComponentType<MessagesProps>;

  /**
   * A custom RenderTextMessage component to use instead of the default.
   */
  RenderTextMessage?: React.ComponentType<RenderMessageProps>;

  /**
   * A custom RenderActionExecutionMessage component to use instead of the default.
   */
  RenderActionExecutionMessage?: React.ComponentType<RenderMessageProps>;

  /**
   * A custom RenderAgentStateMessage component to use instead of the default.
   */
  RenderAgentStateMessage?: React.ComponentType<RenderMessageProps>;

  /**
   * A custom RenderResultMessage component to use instead of the default.
   */
  RenderResultMessage?: React.ComponentType<RenderMessageProps>;

  /**
   * A custom RenderImageMessage component to use instead of the default.
   */
  RenderImageMessage?: React.ComponentType<RenderMessageProps>;

  /**
   * A custom RenderFileMessage component to use instead of the default.
   */
  RenderFileMessage?: React.ComponentType<RenderMessageProps>;

  /**
   * A custom suggestions list component to use instead of the default.
   */
  RenderSuggestionsList?: React.ComponentType<RenderSuggestionsListProps>;

  /**
   * A custom Input component to use instead of the default.
   */
  Input?: React.ComponentType<InputProps>;

  /**
   * A class name to apply to the root element.
   */
  className?: string;

  /**
   * Children to render.
   */
  children?: React.ReactNode;

  hideStopButton?: boolean;
}

interface OnStopGenerationArguments {
  /**
   * The name of the currently executing agent.
   */
  currentAgentName: string | undefined;

  /**
   * The messages in the chat.
   */
  messages: Message[];

  /**
   * Set the messages in the chat.
   */
  setMessages: (messages: Message[]) => void;

  /**
   * Stop chat generation.
   */
  stopGeneration: () => void;

  /**
   * Restart the currently executing agent.
   */
  restartCurrentAgent: () => void;

  /**
   * Stop the currently executing agent.
   */
  stopCurrentAgent: () => void;

  /**
   * Run the currently executing agent.
   */
  runCurrentAgent: (hint?: HintFunction) => Promise<void>;

  /**
   * Set the state of the currently executing agent.
   */
  setCurrentAgentState: (state: any) => void;
}

export type OnReloadMessagesArguments = OnStopGenerationArguments & {
  /**
   * The message on which "regenerate" was pressed
   */
  messageId: string;
};

export type OnStopGeneration = (args: OnStopGenerationArguments) => void;

export type OnReloadMessages = (args: OnReloadMessagesArguments) => void;

export type FileUpload = {
  contentType: string;
  bytes: string;
  fileName?: string;
};

/** @deprecated Use FileUpload instead */
export type ImageUpload = FileUpload;

export function CopilotChat({
  instructions,
  onSubmitMessage,
  makeSystemMessage,
  onInProgress,
  onStopGeneration,
  onReloadMessages,
  onRegenerate,
  onCopy,
  onThumbsUp,
  onThumbsDown,
  markdownTagRenderers,
  Messages = DefaultMessages,
  RenderTextMessage = DefaultRenderTextMessage,
  RenderActionExecutionMessage = DefaultRenderActionExecutionMessage,
  RenderAgentStateMessage = DefaultRenderAgentStateMessage,
  RenderResultMessage = DefaultRenderResultMessage,
  RenderImageMessage = DefaultRenderImageMessage,
  RenderFileMessage = DefaultRenderFileMessage,
  RenderSuggestionsList = DefaultRenderSuggestionsList,
  Input = DefaultInput,
  className,
  icons,
  labels,
  AssistantMessage = DefaultAssistantMessage,
  UserMessage = DefaultUserMessage,
  fileUploadsEnabled,
  imageUploadsEnabled,
  inputFileAccept = "image/*,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/pdf",
  imageCompression,
  hideStopButton,
}: CopilotChatProps) {
  // Support both new and deprecated prop names
  const uploadsEnabled = fileUploadsEnabled ?? imageUploadsEnabled;
  const { additionalInstructions, setChatInstructions } = useCopilotContext();
  const [selectedFiles, setSelectedFiles] = useState<Array<FileUpload>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Compression dialog state
  const [showCompressionDialog, setShowCompressionDialog] = useState(false);
  const [pendingCompression, setPendingCompression] = useState<{
    file: File;
    base64: string;
    resolve: (value: FileUpload | null) => void;
  } | null>(null);

  // Handle compression confirmation
  const handleCompressionConfirm = async () => {
    if (!pendingCompression) return;
    
    try {
      const jpgTargetSize = imageCompression?.jpgTargetSizeKB ?? 250;
      const compressedBase64 = await compressJpgToTarget(pendingCompression.base64, jpgTargetSize);
      pendingCompression.resolve({
        contentType: pendingCompression.file.type,
        bytes: compressedBase64,
        fileName: pendingCompression.file.name,
      });
    } catch (error) {
      console.error("[handleCompressionConfirm] 压缩失败:", error);
      pendingCompression.resolve(null);
    } finally {
      setShowCompressionDialog(false);
      setPendingCompression(null);
    }
  };

  // Handle compression cancellation
  const handleCompressionCancel = () => {
    if (pendingCompression) {
      pendingCompression.resolve(null);
    }
    setShowCompressionDialog(false);
    setPendingCompression(null);
  };

  const readFileAsBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = (e.target?.result as string)?.split(",")[1] || "";
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const prepareFileUpload = async (file: File): Promise<FileUpload | null> => {
    const base64String = await readFileAsBase64(file);
    console.log(`[prepareFileUpload] 文件 ${file.name} 读取完成, base64长度:`, base64String.length);

    if (!base64String) {
      return null;
    }

    try {
      let finalBase64 = base64String;
      let finalContentType = file.type;

      const isImage = file.type.startsWith("image/");
      const compressionEnabled = imageCompression?.enabled === true;

      if (isImage && compressionEnabled) {
        const isPng = file.type === "image/png";
        const isJpg = file.type === "image/jpeg" || file.type === "image/jpg";
        const pngTargetSize = imageCompression?.pngTargetSizeKB ?? 200;
        const jpgTargetSize = imageCompression?.jpgTargetSizeKB ?? 250;

        if (isPng) {
          console.log(`[prepareFileUpload] PNG 图片 ${file.name} 正在转换为 JPG...`);
          finalBase64 = await convertPngToJpg(base64String, pngTargetSize);
          finalContentType = "image/jpeg";
          const finalSizeKB = getImageSizeInKB(finalBase64);
          console.log(`[prepareFileUpload] PNG 转换完成，新大小: ${finalSizeKB.toFixed(0)} KB`);
        } else if (isJpg) {
          const sizeKB = getImageSizeInKB(base64String);
          console.log(`[prepareFileUpload] JPG 图片 ${file.name} 大小: ${sizeKB.toFixed(0)} KB`);

          if (needsCompression(base64String, jpgTargetSize)) {
            console.log(
              `[prepareFileUpload] JPG 图片 ${file.name} 超过 ${jpgTargetSize}KB，等待用户确认...`,
            );
            const result = await new Promise<FileUpload | null>((dialogResolve) => {
              setPendingCompression({
                file,
                base64: base64String,
                resolve: dialogResolve,
              });
              setShowCompressionDialog(true);
            });

            if (result === null) {
              console.log(`[prepareFileUpload] 用户取消压缩 ${file.name}`);
              return null;
            }

            finalBase64 = result.bytes;
            const finalSizeKB = getImageSizeInKB(finalBase64);
            console.log(`[prepareFileUpload] JPG 压缩完成，新大小: ${finalSizeKB.toFixed(0)} KB`);
          }
        }
      }

      return {
        contentType: finalContentType,
        bytes: finalBase64,
        fileName: file.name,
      };
    } catch (error) {
      console.error(`[prepareFileUpload] 处理文件 ${file.name} 失败:`, error);
      throw error;
    }
  };

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;

    try {
      const loadedFiles = (await Promise.all(files.map(prepareFileUpload))).filter(
        (f): f is FileUpload => f !== null,
      );
      console.log("[processFiles] 所有文件读取完成:", loadedFiles.length);
      setSelectedFiles((prev) => {
        const newFiles = [...prev, ...loadedFiles];
        console.log("[processFiles] 更新后的文件队列:", newFiles.length);
        return newFiles;
      });
    } catch (error) {
      console.error("[processFiles] 读取文件出错:", error);
    }
  };

  // Clipboard paste handler
  useEffect(() => {
    if (!uploadsEnabled) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (!target.parentElement?.classList.contains("copilotKitInput")) return;

      const items = Array.from(e.clipboardData?.items || []);
      // Support images, xlsx, and PDF files
      const supportedTypes = [
        "image/",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "application/pdf",
      ];
      const fileItems = items.filter((item) =>
        supportedTypes.some((type) => item.type.startsWith(type) || item.type === type),
      );

      if (fileItems.length === 0) return;

      e.preventDefault(); // Prevent default paste behavior for files

      const filePromises: Promise<FileUpload | null>[] = fileItems.map((item) => {
        const file = item.getAsFile();
        if (!file) return Promise.resolve(null);

        return new Promise<FileUpload | null>(async (resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async (e) => {
            const base64String = (e.target?.result as string)?.split(",")[1];
            if (!base64String) {
              resolve(null);
              return;
            }

            try {
              let finalBase64 = base64String;
              let finalContentType = file.type;

              // Check if compression is enabled and if it's an image
              const isImage = file.type.startsWith("image/");
              const compressionEnabled = imageCompression?.enabled === true;
              
              if (isImage && compressionEnabled) {
                const isPng = file.type === "image/png";
                const isJpg = file.type === "image/jpeg" || file.type === "image/jpg";
                const pngTargetSize = imageCompression?.pngTargetSizeKB ?? 200;
                const jpgTargetSize = imageCompression?.jpgTargetSizeKB ?? 250;
                
                if (isPng) {
                  // PNG: Always convert to JPG and compress to target size
                  console.log(`[handlePaste] PNG 图片 ${file.name} 正在转换为 JPG...`);
                  finalBase64 = await convertPngToJpg(base64String, pngTargetSize);
                  finalContentType = "image/jpeg";
                  const finalSizeKB = getImageSizeInKB(finalBase64);
                  console.log(`[handlePaste] PNG 转换完成，新大小: ${finalSizeKB.toFixed(0)} KB`);
                } else if (isJpg) {
                  // JPG: Check size and show dialog if exceeds threshold
                  const sizeKB = getImageSizeInKB(base64String);
                  console.log(`[handlePaste] JPG 图片 ${file.name} 大小: ${sizeKB.toFixed(0)} KB`);
                  
                  if (needsCompression(base64String, jpgTargetSize)) {
                    console.log(`[handlePaste] JPG 图片 ${file.name} 超过 ${jpgTargetSize}KB，等待用户确认...`);
                    // Show dialog and wait for user confirmation
                    const result = await new Promise<FileUpload | null>((dialogResolve) => {
                      setPendingCompression({
                        file,
                        base64: base64String,
                        resolve: dialogResolve,
                      });
                      setShowCompressionDialog(true);
                    });
                    
                    if (result === null) {
                      console.log(`[handlePaste] 用户取消压缩 ${file.name}`);
                      resolve(null);
                      return;
                    }
                    
                    finalBase64 = result.bytes;
                    const finalSizeKB = getImageSizeInKB(finalBase64);
                    console.log(`[handlePaste] JPG 压缩完成，新大小: ${finalSizeKB.toFixed(0)} KB`);
                  }
                }
              }

              resolve({
                contentType: finalContentType,
                bytes: finalBase64,
                fileName: file.name,
              });
            } catch (error) {
              console.error(`[handlePaste] 处理文件 ${file.name} 失败:`, error);
              reject(error);
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      try {
        const loadedFiles = (await Promise.all(filePromises)).filter((f) => f !== null);
        setSelectedFiles((prev) => [...prev, ...loadedFiles]);
      } catch (error) {
        // TODO: Show an error message to the user
        console.error("Error processing pasted files:", error);
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [uploadsEnabled]);

  useEffect(() => {
    if (!additionalInstructions?.length) {
      setChatInstructions(instructions || "");
      return;
    }

    /*
      Will result in a prompt like:

      You are a helpful assistant. 
      Additionally, follow these instructions:
      - Do not answer questions about the weather.
      - Do not answer questions about the stock market."
    */
    const combinedAdditionalInstructions = [
      instructions,
      "Additionally, follow these instructions:",
      ...additionalInstructions.map((instruction) => `- ${instruction}`),
    ];

    console.log("combinedAdditionalInstructions", combinedAdditionalInstructions);

    setChatInstructions(combinedAdditionalInstructions.join("\n") || "");
  }, [instructions, additionalInstructions]);

  const {
    visibleMessages,
    isLoading,
    currentSuggestions,
    sendMessage,
    stopGeneration,
    reloadMessages,
  } = useCopilotChatLogic(
    makeSystemMessage,
    onInProgress,
    onSubmitMessage,
    onStopGeneration,
    onReloadMessages,
  );

  // Wrapper for sendMessage to clear selected files
  const handleSendMessage = (text: string) => {
    const files = selectedFiles;
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    return sendMessage(text, files);
  };

  const chatContext = React.useContext(ChatContext);
  const isVisible = chatContext ? chatContext.open : true;

  const handleRegenerate = (messageId: string) => {
    if (onRegenerate) {
      onRegenerate(messageId);
    }

    reloadMessages(messageId);
  };

  const handleCopy = (message: string) => {
    if (onCopy) {
      onCopy(message);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[handleFileUpload] 触发文件上传");

    if (!event.target.files || event.target.files.length === 0) {
      console.log("[handleFileUpload] 没有选择文件");
      return;
    }

    // Accept all files (filtering is done by the accept attribute on the input)
    const files = Array.from(event.target.files);
    console.log("[handleFileUpload] 选择的文件数量:", files.length);
    files.forEach((file, index) => {
      console.log(`[handleFileUpload] 文件 ${index}:`, {
        name: file.name,
        type: file.type,
        size: file.size,
      });
    });

    if (files.length === 0) return;

    await processFiles(files);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    if (!uploadsEnabled) return;
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!uploadsEnabled) return;
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (!uploadsEnabled) return;
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDropUpload = async (event: React.DragEvent<HTMLDivElement>) => {
    if (!uploadsEnabled) return;
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(event.dataTransfer?.files || []);
    console.log("[handleDropUpload] 拖拽文件数量:", files.length);
    await processFiles(files);
  };

  return (
    <WrappedCopilotChat icons={icons} labels={labels} className={className}>
      <Messages
        AssistantMessage={AssistantMessage}
        UserMessage={UserMessage}
        RenderTextMessage={RenderTextMessage}
        RenderActionExecutionMessage={RenderActionExecutionMessage}
        RenderAgentStateMessage={RenderAgentStateMessage}
        RenderResultMessage={RenderResultMessage}
        RenderImageMessage={RenderImageMessage}
        RenderFileMessage={RenderFileMessage}
        messages={visibleMessages}
        inProgress={isLoading}
        onRegenerate={handleRegenerate}
        onCopy={handleCopy}
        onThumbsUp={onThumbsUp}
        onThumbsDown={onThumbsDown}
        markdownTagRenderers={markdownTagRenderers}
      >
        {currentSuggestions.length > 0 && (
          <RenderSuggestionsList
            onSuggestionClick={handleSendMessage}
            suggestions={currentSuggestions}
          />
        )}
      </Messages>

      {uploadsEnabled && (
        <>
          <ImageUploadQueue images={selectedFiles} onRemoveImage={removeSelectedFile} />
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept={inputFileAccept}
            style={{ display: "none" }}
          />
        </>
      )}

      <Input
        inProgress={isLoading}
        onSend={handleSendMessage}
        isVisible={isVisible}
        onStop={stopGeneration}
        onUpload={uploadsEnabled ? () => fileInputRef.current?.click() : undefined}
        onDragEnter={uploadsEnabled ? handleDragEnter : undefined}
        onDragOver={uploadsEnabled ? handleDragOver : undefined}
        onDragLeave={uploadsEnabled ? handleDragLeave : undefined}
        onDrop={uploadsEnabled ? handleDropUpload : undefined}
        isDragOver={isDragOver}
        hideStopButton={hideStopButton}
      />

      {showCompressionDialog && pendingCompression && (
        <ImageCompressionDialog
          fileName={pendingCompression.file.name}
          fileSizeKB={getImageSizeInKB(pendingCompression.base64)}
          onConfirm={handleCompressionConfirm}
          onCancel={handleCompressionCancel}
        />
      )}
    </WrappedCopilotChat>
  );
}

export function WrappedCopilotChat({
  children,
  icons,
  labels,
  className,
}: {
  children: React.ReactNode;
  icons?: CopilotChatIcons;
  labels?: CopilotChatLabels;
  className?: string;
}) {
  const chatContext = React.useContext(ChatContext);
  if (!chatContext) {
    return (
      <ChatContextProvider icons={icons} labels={labels} open={true} setOpen={() => {}}>
        <div className={`copilotKitChat ${className ?? ""}`}>{children}</div>
      </ChatContextProvider>
    );
  }
  return <>{children}</>;
}

const SUGGESTIONS_DEBOUNCE_TIMEOUT = 1000;

export const useCopilotChatLogic = (
  makeSystemMessage?: SystemMessageFunction,
  onInProgress?: (isLoading: boolean) => void,
  onSubmitMessage?: (messageContent: string) => Promise<void> | void,
  onStopGeneration?: OnStopGeneration,
  onReloadMessages?: OnReloadMessages,
) => {
  const {
    visibleMessages,
    appendMessage,
    reloadMessages: defaultReloadMessages,
    stopGeneration: defaultStopGeneration,
    runChatCompletion,
    isLoading,
  } = useCopilotChat({
    id: randomId(),
    makeSystemMessage,
  });

  const [currentSuggestions, setCurrentSuggestions] = useState<CopilotChatSuggestion[]>([]);
  const suggestionsAbortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<any>();

  const abortSuggestions = () => {
    suggestionsAbortControllerRef.current?.abort();
    suggestionsAbortControllerRef.current = null;
  };

  const generalContext = useCopilotContext();
  const messagesContext = useCopilotMessagesContext();
  const context = { ...generalContext, ...messagesContext };

  useEffect(() => {
    onInProgress?.(isLoading);

    abortSuggestions();

    debounceTimerRef.current = setTimeout(
      () => {
        if (!isLoading && Object.keys(context.chatSuggestionConfiguration).length !== 0) {
          suggestionsAbortControllerRef.current = new AbortController();
          reloadSuggestions(
            context,
            context.chatSuggestionConfiguration,
            setCurrentSuggestions,
            suggestionsAbortControllerRef,
          );
        }
      },
      currentSuggestions.length == 0 ? 0 : SUGGESTIONS_DEBOUNCE_TIMEOUT,
    );

    return () => {
      clearTimeout(debounceTimerRef.current);
    };
  }, [
    isLoading,
    context.chatSuggestionConfiguration,
    // hackish way to trigger suggestions reload on reset, but better than moving suggestions to the
    // global context
    visibleMessages.length == 0,
  ]);

  const sendMessage = async (
    messageContent: string,
    filesToUse?: Array<{ contentType: string; bytes: string; fileName?: string }>,
  ) => {
    // Use files passed in the call OR the ones from the state (passed via props)
    const files = filesToUse || [];

    abortSuggestions();
    setCurrentSuggestions([]);

    let firstMessage: Message | null = null;

    // If there's text content, send a text message first
    if (messageContent.trim().length > 0) {
      const textMessage = new TextMessage({
        content: messageContent,
        role: Role.User,
      });

      if (onSubmitMessage) {
        try {
          // Call onSubmitMessage only with text, as file handling is internal right now
          await onSubmitMessage(messageContent);
        } catch (error) {
          console.error("Error in onSubmitMessage:", error);
        }
      }

      await appendMessage(textMessage, { followUp: files.length === 0 });

      if (!firstMessage) {
        firstMessage = textMessage;
      }
    }

    // Send file messages (images and other files)
    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let fileMessage: Message;

        if (isImageMimeType(file.contentType)) {
          // For images, use ImageMessage with format extracted from contentType
          const format = file.contentType.replace("image/", "");
          fileMessage = new ImageMessage({
            format: format,
            bytes: file.bytes,
            role: Role.User,
          });
        } else {
          // For non-image files (xlsx, PDF, etc.), use FileMessage
          fileMessage = new FileMessage({
            mimeType: file.contentType,
            bytes: file.bytes,
            fileName: file.fileName || "document",
            role: Role.User,
          });
        }

        await appendMessage(fileMessage, { followUp: i === files.length - 1 });
        if (!firstMessage) {
          firstMessage = fileMessage;
        }
      }
    }

    if (!firstMessage) {
      // Should not happen if send button is properly disabled, but handle just in case
      return new TextMessage({ content: "", role: Role.User }); // Return a dummy message
    }

    // The hook implicitly triggers API call on appendMessage.
    // We return the first message sent (either text or first image)
    return firstMessage;
  };

  const messages = visibleMessages;
  const { setMessages } = messagesContext;
  const currentAgentName = generalContext.agentSession?.agentName;
  const restartCurrentAgent = async (hint?: HintFunction) => {
    if (generalContext.agentSession) {
      generalContext.setAgentSession({
        ...generalContext.agentSession,
        nodeName: undefined,
        threadId: undefined,
      });
      generalContext.setCoagentStates((prevAgentStates) => {
        return {
          ...prevAgentStates,
          [generalContext.agentSession!.agentName]: {
            ...prevAgentStates[generalContext.agentSession!.agentName],
            threadId: undefined,
            nodeName: undefined,
            runId: undefined,
          },
        };
      });
    }
  };
  const runCurrentAgent = async (hint?: HintFunction) => {
    if (generalContext.agentSession) {
      await runAgent(
        generalContext.agentSession.agentName,
        context,
        appendMessage,
        runChatCompletion,
        hint,
      );
    }
  };
  const stopCurrentAgent = () => {
    if (generalContext.agentSession) {
      stopAgent(generalContext.agentSession.agentName, context);
    }
  };
  const setCurrentAgentState = (state: any) => {
    if (generalContext.agentSession) {
      generalContext.setCoagentStates((prevAgentStates) => {
        return {
          ...prevAgentStates,
          [generalContext.agentSession!.agentName]: {
            state,
          },
        } as any;
      });
    }
  };

  function stopGeneration() {
    if (onStopGeneration) {
      onStopGeneration({
        messages,
        setMessages,
        stopGeneration: defaultStopGeneration,
        currentAgentName,
        restartCurrentAgent,
        stopCurrentAgent,
        runCurrentAgent,
        setCurrentAgentState,
      });
    } else {
      defaultStopGeneration();
    }
  }
  function reloadMessages(messageId: string) {
    if (onReloadMessages) {
      onReloadMessages({
        messages,
        setMessages,
        stopGeneration: defaultStopGeneration,
        currentAgentName,
        restartCurrentAgent,
        stopCurrentAgent,
        runCurrentAgent,
        setCurrentAgentState,
        messageId,
      });
    } else {
      defaultReloadMessages(messageId);
    }
  }

  return {
    visibleMessages,
    isLoading,
    currentSuggestions,
    sendMessage,
    stopGeneration,
    reloadMessages,
  };
};
