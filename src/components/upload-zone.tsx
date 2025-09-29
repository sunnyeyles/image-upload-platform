"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";

interface UploadResult {
  originalName: string;
  key: string;
  size: number;
  type: string;
}

interface UploadZoneProps {
  onUpload: (files: File[]) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
  uploadResults: UploadResult[];
  errors: string[];
}

export function UploadZone({
  onUpload,
  isUploading,
  uploadProgress,
  uploadResults,
  errors,
}: UploadZoneProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Check if this is a folder upload (has webkitRelativePath)
      const isFolderUpload = acceptedFiles.some(
        (file) =>
          file.webkitRelativePath && file.webkitRelativePath.includes("/")
      );

      if (isFolderUpload) {
        // Auto-upload folder contents
        await onUpload(acceptedFiles);
      } else {
        // Add individual files to selection for manual upload
        setSelectedFiles((prev) => [...prev, ...acceptedFiles]);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    maxFiles: 10,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    await onUpload(selectedFiles);
    setSelectedFiles([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card className="brutalist-card">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            UPLOAD IMAGES
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-4 border-dashed border-black p-12 text-center cursor-pointer transition-all
              ${
                isDragActive
                  ? "bg-yellow-100 border-yellow-500"
                  : "bg-white hover:bg-gray-50"
              }
              ${isUploading ? "pointer-events-none opacity-50" : ""}
            `}
          >
            <input
              {...getInputProps()}
              {...({ webkitdirectory: "true" } as any)}
            />
            <Upload className="mx-auto h-16 w-16 text-black mb-4" />
            {isDragActive ? (
              <p className="text-xl font-bold">DROP IMAGES HERE</p>
            ) : (
              <div>
                <p className="text-xl font-bold mb-2">
                  DRAG & DROP IMAGES OR FOLDERS HERE
                </p>
                <p className="text-sm text-gray-600">
                  OR CLICK TO SELECT FILES/FOLDERS
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  MAX 150 IMAGES • MAX 10MB EACH • JPG, PNG, GIF, WEBP
                </p>
                <p className="text-xs text-yellow-600 font-bold">
                  FOLDERS: AUTO-UPLOAD • FILES: MANUAL UPLOAD
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <Card className="brutalist-card">
          <CardHeader>
            <CardTitle className="text-lg">
              SELECTED FILES ({selectedFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-100 border-2 border-black"
                >
                  <div className="flex-1">
                    <p className="font-bold text-sm">{file.name}</p>
                    <p className="text-xs text-gray-600">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="brutalist-button"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-center">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="brutalist-button bg-yellow-400 hover:bg-yellow-500 text-black"
                size="lg"
              >
                {isUploading ? "UPLOADING..." : "UPLOAD FILES"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <Card className="brutalist-card">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-bold">UPLOADING...</span>
                <span className="font-bold">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-4" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Results */}
      {uploadResults.length > 0 && (
        <Card className="brutalist-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              UPLOAD SUCCESSFUL ({uploadResults.length} FILES)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {uploadResults.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-green-100 border-2 border-green-500"
                >
                  <div>
                    <p className="font-bold text-sm">{result.originalName}</p>
                    <p className="text-xs text-gray-600">
                      {formatFileSize(result.size)}
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <Card className="brutalist-card border-red-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              UPLOAD ERRORS ({errors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {errors.map((error, index) => (
                <div
                  key={index}
                  className="p-2 bg-red-100 border-2 border-red-500"
                >
                  <p className="font-bold text-sm text-red-800">{error}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
