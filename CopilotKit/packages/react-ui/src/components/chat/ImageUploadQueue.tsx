import React from "react";

interface FileUploadItem {
  contentType: string;
  bytes: string;
  fileName?: string;
}

interface ImageUploadQueueProps {
  images: Array<FileUploadItem>;
  onRemoveImage: (index: number) => void;
  className?: string;
}

// Helper function to determine if a file is an image
const isImageFile = (contentType: string): boolean => {
  return contentType.startsWith("image/");
};

// Helper function to get file type label
const getFileTypeLabel = (contentType: string): string => {
  if (contentType.includes("spreadsheetml") || contentType.includes("ms-excel")) {
    return "XLSX";
  }
  if (contentType === "application/pdf") {
    return "PDF";
  }
  return "FILE";
};

// Helper function to get file icon
const getFileIcon = (contentType: string): string => {
  if (contentType.includes("spreadsheetml") || contentType.includes("ms-excel")) {
    return "📊";
  }
  if (contentType === "application/pdf") {
    return "📄";
  }
  return "📎";
};

export const ImageUploadQueue: React.FC<ImageUploadQueueProps> = ({
  images,
  onRemoveImage,
  className = "",
}) => {
  // Debug: 打印上传队列中的文件信息
  console.log("[ImageUploadQueue] Files in queue:", images.length);
  images.forEach((file, index) => {
    console.log(`[ImageUploadQueue] File ${index}:`, {
      contentType: file.contentType,
      fileName: file.fileName,
      isImage: isImageFile(file.contentType),
      bytesLength: file.bytes?.length || 0,
    });
  });

  if (images.length === 0) return null;

  return (
    <div
      className={`copilotKitImageUploadQueue ${className}`}
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        margin: "8px",
        padding: "8px",
      }}
    >
      {images.map((file, index) => (
        <div
          key={index}
          className="copilotKitImageUploadQueueItem"
          style={{
            position: "relative",
            display: "inline-block",
            width: "60px",
            height: "60px",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          {isImageFile(file.contentType) ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={`data:${file.contentType};base64,${file.bytes}`}
              alt={file.fileName || `Selected image ${index + 1}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f0f0f0",
                fontSize: "10px",
                textAlign: "center",
                padding: "4px",
              }}
              title={file.fileName || getFileTypeLabel(file.contentType)}
            >
              <span style={{ fontSize: "20px" }}>{getFileIcon(file.contentType)}</span>
              <span
                style={{
                  marginTop: "2px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  width: "100%",
                }}
              >
                {file.fileName
                  ? file.fileName.length > 8
                    ? file.fileName.substring(0, 6) + "..."
                    : file.fileName
                  : getFileTypeLabel(file.contentType)}
              </span>
            </div>
          )}
          <button
            onClick={() => onRemoveImage(index)}
            className="copilotKitImageUploadQueueRemoveButton"
            style={{
              position: "absolute",
              top: "2px",
              right: "2px",
              background: "rgba(0,0,0,0.6)",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "10px",
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};
