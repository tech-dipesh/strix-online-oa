"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { useUploadFiles, useUploadZip } from "@/hooks/use-files";

export function UploadDropzone({ projectId }: { projectId: string }) {
  const uploadZip = useUploadZip(projectId);
  const uploadFiles = useUploadFiles(projectId);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 1 && acceptedFiles[0].name.endsWith(".zip")) {
        uploadZip.mutate(acceptedFiles[0]);
        return;
      }
      uploadFiles.mutate(acceptedFiles);
    },
    [uploadZip, uploadFiles],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });
  const isUploading = uploadZip.isPending || uploadFiles.isPending;

  return (
    <div
      {...getRootProps()}
      className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center transition-colors ${
        isDragActive ? "border-accent bg-surface/60" : "border-border"
      }`}
    >
      <input {...getInputProps()} />
      <UploadCloud size={22} className="text-accent" />
      <p className="text-sm text-foreground">
        {isUploading ? "Uploading..." : "Drop a .zip or individual files here"}
      </p>
      <p className="text-xs text-muted">or click to browse</p>
    </div>
  );
}
