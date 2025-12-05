import React from "react";

interface ImageCompressionDialogProps {
  fileName: string;
  fileSizeKB: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ImageCompressionDialog: React.FC<ImageCompressionDialogProps> = ({
  fileName,
  fileSizeKB,
  onConfirm,
  onCancel,
}) => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
      }}
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "400px",
          width: "90%",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h3
          style={{
            margin: "0 0 16px 0",
            fontSize: "18px",
            fontWeight: "600",
            color: "#333",
          }}
        >
          图片过大
        </h3>
        
        <p
          style={{
            margin: "0 0 8px 0",
            fontSize: "14px",
            color: "#666",
            lineHeight: "1.5",
          }}
        >
          <strong>{fileName}</strong> 的大小为 <strong>{fileSizeKB.toFixed(0)} KB</strong>，超过了 250 KB 的限制。
        </p>
        
        <p
          style={{
            margin: "0 0 20px 0",
            fontSize: "14px",
            color: "#666",
            lineHeight: "1.5",
          }}
        >
          是否压缩此图片到 250 KB 以下？
        </p>
        
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              backgroundColor: "white",
              color: "#333",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f5f5f5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "white";
            }}
          >
            取消
          </button>
          
          <button
            onClick={onConfirm}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              border: "none",
              borderRadius: "4px",
              backgroundColor: "#007bff",
              color: "white",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#0056b3";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#007bff";
            }}
          >
            压缩
          </button>
        </div>
      </div>
    </div>
  );
};

