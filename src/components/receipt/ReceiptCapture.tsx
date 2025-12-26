import React, { useRef, useCallback } from "react";
import { Camera, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReceiptCaptureProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "compact" | "dropzone";
}

/**
 * ReceiptCapture - Component for capturing or selecting receipt images
 *
 * Supports:
 * - Camera capture on mobile (uses native camera)
 * - File selection from gallery
 * - Drag and drop (dropzone variant)
 */
export const ReceiptCapture: React.FC<ReceiptCaptureProps> = ({
  onFileSelect,
  disabled = false,
  className,
  variant = "default",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
      // Reset input so same file can be selected again
      event.target.value = "";
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const file = event.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
    },
    []
  );

  const openCamera = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Hidden file inputs
  const fileInputs = (
    <>
      {/* Camera input - uses native camera on mobile */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      {/* Gallery/file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
    </>
  );

  if (variant === "compact") {
    return (
      <div className={cn("flex gap-2", className)}>
        {fileInputs}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={openCamera}
          disabled={disabled}
          title="Take photo"
        >
          <Camera className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={openFilePicker}
          disabled={disabled}
          title="Choose from gallery"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (variant === "dropzone") {
    return (
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          "hover:border-primary/50 hover:bg-accent/50",
          disabled && "opacity-50 pointer-events-none",
          className
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {fileInputs}
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-primary/10 p-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Drop receipt image here</p>
            <p
              className="text-sm mt-1"
              style={{ color: "var(--color-text-secondary)" }}
            >
              or click to select
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openCamera}
              disabled={disabled}
            >
              <Camera className="h-4 w-4 mr-2" />
              Camera
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openFilePicker}
              disabled={disabled}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Gallery
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Default variant - two buttons
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {fileInputs}
      <Button
        type="button"
        variant="outline"
        onClick={openCamera}
        disabled={disabled}
        className="w-full justify-start"
      >
        <Camera className="h-4 w-4 mr-3" />
        Take Photo
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={openFilePicker}
        disabled={disabled}
        className="w-full justify-start"
      >
        <ImageIcon className="h-4 w-4 mr-3" />
        Choose from Gallery
      </Button>
    </div>
  );
};
