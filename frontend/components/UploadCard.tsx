"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, File, X, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ky from "ky";

interface UploadedFile {
  file: File;
  cid?: string;
  uploading: boolean;
  error?: string;
}

interface UploadCardProps {
  onFilesUploaded?: (
    files: { cid: string; name: string; type: string }[]
  ) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
}

export function UploadCard({
  onFilesUploaded,
  maxFiles = 5,
  acceptedTypes = [".txt", ".md", ".pdf", ".json"],
}: UploadCardProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  // Effect to check for upload completion and notify parent
  useEffect(() => {
    if (!uploading && files.length > 0) {
      const uploadedFiles = files
        .filter((f) => f.cid)
        .map((f) => ({
          cid: f.cid!,
          name: f.file.name,
          type: f.file.type,
        }));

      const allUploadsComplete = files.every((f) => f.cid || f.error);

      if (uploadedFiles.length > 0 && allUploadsComplete && onFilesUploaded) {
        console.log(
          "All uploads complete, calling onFilesUploaded with:",
          uploadedFiles
        );
        onFilesUploaded(uploadedFiles);
      }
    }
  }, [files, uploading, onFilesUploaded]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map((file) => ({
        file,
        uploading: false,
        error: undefined,
      }));

      setFiles((prev) => [...prev, ...newFiles].slice(0, maxFiles));
    },
    [maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    accept: {
      "text/plain": [".txt"],
      "text/markdown": [".md"],
      "application/pdf": [".pdf"],
      "application/json": [".json"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const uploadFile = async (index: number) => {
    const fileData = files[index];
    if (!fileData || fileData.uploading || fileData.cid) return;

    setFiles((prev) =>
      prev.map((f, i) =>
        i === index ? { ...f, uploading: true, error: undefined } : f
      )
    );

    try {
      const formData = new FormData();
      formData.append("file", fileData.file);
      formData.append("pinName", `omni-soul-${fileData.file.name}`);

      const response = await ky
        .post("/api/ipfs/upload", {
          body: formData,
          timeout: 30000, // 30 second timeout
        })
        .json<{ success: boolean; data?: { cid: string }; error?: string }>();

      if (response.success && response.data) {
        setFiles((prev) =>
          prev.map((f, i) =>
            i === index
              ? { ...f, uploading: false, cid: response.data!.cid }
              : f
          )
        );
        toast.success(`${fileData.file.name} uploaded to IPFS`);
      } else {
        throw new Error(response.error || "Upload failed");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, uploading: false, error: errorMessage } : f
        )
      );
      toast.error(`Failed to upload ${fileData.file.name}: ${errorMessage}`);
    }
  };

  const uploadAllFiles = async () => {
    setUploading(true);

    // Only upload files that haven't been uploaded yet and aren't currently uploading
    const filesToUpload = files
      .map((file, index) => ({ file, index }))
      .filter(({ file }) => !file.cid && !file.uploading && !file.error);

    const uploadPromises = filesToUpload.map(({ index }) => uploadFile(index));
    await Promise.all(uploadPromises);
    setUploading(false);

    // The useEffect will handle calling onFilesUploaded when uploads complete
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  return (
    <Card className="glass p-6">
      <div className="space-y-6">
        <div>
          <Label className="text-lg font-semibold text-neon-cyan">
            Upload Persona Files
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Upload text files, markdown, PDFs, or JSON data that represents your
            persona
          </p>
        </div>

        {/* Drop Zone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300
            ${
              isDragActive
                ? "border-neon-cyan bg-neon-cyan/10 neon-glow-cyan"
                : "border-border hover:border-neon-cyan/50 hover:bg-neon-cyan/5"
            }
          `}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto mb-4 text-neon-cyan" />
          <p className="text-lg font-medium mb-2">
            {isDragActive ? "Drop files here" : "Drag & drop files here"}
          </p>
          <p className="text-sm text-muted-foreground">
            or click to select files ({acceptedTypes.join(", ")})
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Max {maxFiles} files, 10MB each
          </p>
        </div>

        {/* File List */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              {files.map((fileData, index) => (
                <motion.div
                  key={`${fileData.file.name}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center space-x-3 p-3 bg-card/50 rounded-lg border"
                >
                  <File className="h-5 w-5 text-neon-magenta flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {fileData.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(fileData.file.size)}
                    </p>
                    {fileData.error && (
                      <p className="text-xs text-destructive mt-1">
                        {fileData.error}
                      </p>
                    )}
                  </div>

                  {fileData.uploading && (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-neon-cyan">
                        Uploading...
                      </span>
                    </div>
                  )}

                  {fileData.cid && (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-green-500">Uploaded</span>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="flex-shrink-0 h-8 w-8 p-0 hover:bg-destructive/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Button */}
        {files.length > 0 && (
          <Button
            onClick={uploadAllFiles}
            disabled={uploading || files.every((f) => f.cid || f.uploading)}
            className="w-full neon-glow-cyan"
            size="lg"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                Uploading to IPFS...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                Upload All to IPFS
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  );
}
