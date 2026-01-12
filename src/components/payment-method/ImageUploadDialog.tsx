import React, { useState, useRef } from "react";
import { PaymentMethod } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ImageIcon,
  UploadIcon,
  XIcon,
  Trash2Icon,
  CheckCircle,
} from "lucide-react";
import PaymentCardDisplay from "../expense/PaymentCardDisplay";

interface ImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentMethod: PaymentMethod | null;
  onImageUpload: (file: File) => Promise<void>;
  onImageRemove?: () => Promise<void>;
  isUploading: boolean;
}

// Helper to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ImageUploadDialog: React.FC<ImageUploadDialogProps> = ({
  open,
  onOpenChange,
  paymentMethod,
  onImageUpload,
  onImageRemove,
  isUploading,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasExistingImage = !!paymentMethod?.imageUrl;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Create a preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (selectedFile) {
      await onImageUpload(selectedFile);
      setUploadSuccess(true);
      // Show success for 2 seconds then close
      setTimeout(() => {
        resetUpload();
        onOpenChange(false);
      }, 2000);
    }
  };

  const handleRemoveImage = async () => {
    if (onImageRemove) {
      setIsRemoving(true);
      try {
        await onImageRemove();
        onOpenChange(false);
      } finally {
        setIsRemoving(false);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetUpload();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-md"
        style={{
          backgroundColor: "var(--color-modal-bg)",
          border: "1px solid var(--color-border)",
          borderRadius: "16px",
        }}
        hideCloseButton
      >
        <DialogHeader showCloseButton>
          <DialogTitle>
            {hasExistingImage ? "Change Card Image" : "Upload Card Image"}
          </DialogTitle>
          <DialogDescription>
            {hasExistingImage
              ? `Replace the current image for ${paymentMethod?.name}`
              : `Upload a custom image for your ${paymentMethod?.name} card`}
          </DialogDescription>
        </DialogHeader>

        {/* Success state */}
        {uploadSuccess ? (
          <div
            className="flex flex-col items-center justify-center py-8"
            style={{ color: "var(--color-success)" }}
          >
            <CheckCircle className="h-12 w-12 mb-3" />
            <p className="font-medium">Image uploaded successfully!</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-4 py-4">
            {/* Current image preview */}
            {hasExistingImage && !previewUrl && (
              <div>
                <div
                  className="text-sm font-medium mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Current Image:
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-16 rounded-lg overflow-hidden">
                    <img
                      src={paymentMethod?.imageUrl}
                      alt="Current card"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {onImageRemove && (
                    <button
                      onClick={handleRemoveImage}
                      disabled={isRemoving}
                      className="flex items-center px-3 py-1.5 text-sm transition-colors"
                      style={{
                        color: "var(--color-error)",
                        border: "1px solid var(--color-error)",
                        borderRadius: "6px",
                        opacity: isRemoving ? 0.5 : 1,
                      }}
                    >
                      <Trash2Icon className="h-4 w-4 mr-1.5" />
                      {isRemoving ? "Removing..." : "Remove"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Upload area */}
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-surface)",
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {previewUrl ? (
                <div className="flex flex-col items-center">
                  <div className="relative mb-3 max-w-[180px]">
                    <img
                      src={previewUrl}
                      alt="Card preview"
                      className="w-full h-auto rounded-lg object-cover"
                    />
                    <button
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: "var(--color-error)",
                        color: "var(--color-bg)",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        resetUpload();
                      }}
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </div>
                  {/* File info */}
                  {selectedFile && (
                    <div
                      className="text-xs mb-2 px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: "var(--color-accent-subtle)",
                        color: "var(--color-accent-text)",
                      }}
                    >
                      {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </div>
                  )}
                  <span
                    className="text-sm"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    Click to select a different image
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <ImageIcon
                    className="h-10 w-10 mb-3"
                    style={{ color: "var(--color-accent)", opacity: 0.5 }}
                  />
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Drop image here or click to browse
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    Supports JPG, PNG, WebP
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {!uploadSuccess && (
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              style={{
                backgroundColor: "transparent",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!selectedFile || isUploading}
              onClick={handleUpload}
              style={{
                backgroundColor: selectedFile
                  ? "var(--color-accent)"
                  : undefined,
                color: selectedFile ? "var(--color-bg)" : undefined,
              }}
            >
              {isUploading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Uploading...
                </span>
              ) : (
                <span className="flex items-center">
                  <UploadIcon className="mr-2 h-4 w-4" />
                  Upload
                </span>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImageUploadDialog;
