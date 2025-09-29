"use client";

import { useState } from "react";
import { AuthForm } from "@/components/auth-form";
import { UploadZone } from "@/components/upload-zone";
import { Gallery } from "@/components/gallery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Images, LogOut } from "lucide-react";

interface UploadResult {
  originalName: string;
  key: string;
  size: number;
  type: string;
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "gallery">("upload");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveTab("upload");
    setUploadResults([]);
    setErrors([]);
  };

  const handleUpload = async (files: File[]) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadResults([]);
    setErrors([]);

    const allResults = [];
    const allErrors = [];

    try {
      // Upload files one by one using client-side uploads
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        try {
          // Generate unique filename
          const timestamp = Date.now();
          const randomId = Math.random().toString(36).substring(2, 15);
          const extension = file.name.split(".").pop();

          // Preserve folder structure if file has a path (from folder upload)
          let folderPath = "";
          if (
            file.webkitRelativePath &&
            file.webkitRelativePath.includes("/")
          ) {
            const pathParts = file.webkitRelativePath.split("/");
            pathParts.pop(); // Remove filename
            // Add random slug to the first folder in the path to prevent conflicts
            if (pathParts.length > 0) {
              const randomSlug = Math.random().toString(36).substring(2, 8);
              pathParts[0] = `${pathParts[0]}-${randomSlug}`;
            }
            folderPath = pathParts.join("/") + "/";
          }

          const filename = `uploads/${folderPath}${timestamp}-${randomId}.${extension}`;

          // Get upload token (S3 presigned PUT URL) from our API
          const tokenResponse = await fetch("/api/upload-token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Basic " + btoa("user:" + "8!6G#"),
            },
            body: JSON.stringify({
              filename,
              contentType: file.type,
              size: file.size,
            }),
          });

          if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            allErrors.push(
              `${file.name}: ${errorData.error || "Failed to get upload token"}`
            );
            continue;
          }

          const { uploadUrl } = await tokenResponse.json();

          // Upload directly to S3 using the presigned URL (client-side)
          const uploadResponse = await fetch(uploadUrl, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type,
            },
          });

          if (uploadResponse.ok) {
            const blobUrl = uploadResponse.url;
            allResults.push({
              originalName: file.webkitRelativePath || file.name,
              key: filename,
              url: blobUrl,
              size: file.size,
              type: file.type,
            });
          } else {
            allErrors.push(`${file.name}: Upload failed`);
          }
        } catch (error) {
          allErrors.push(`${file.name}: Upload failed`);
        }

        // Update progress
        const progress = Math.round(((i + 1) / files.length) * 100);
        setUploadProgress(progress);
      }

      setUploadResults(allResults);
      if (allErrors.length > 0) {
        setErrors(allErrors);
      }

      // Switch to gallery tab after successful upload
      if (allResults.length > 0) {
        setTimeout(() => {
          setActiveTab("gallery");
        }, 2000);
      }
    } catch (error) {
      setErrors(["Network error. Please try again."]);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isAuthenticated) {
    return <AuthForm onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="brutalist-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-3xl font-bold">
                SUSHAUS ASSET UPLOAD
              </CardTitle>
              <Button
                onClick={handleLogout}
                className="brutalist-button"
                variant="outline"
              >
                <LogOut className="h-4 w-4 mr-2" />
                LOGOUT
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Navigation Tabs */}
        <Card className="brutalist-card">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Button
                onClick={() => setActiveTab("upload")}
                className={`brutalist-button flex-1 ${
                  activeTab === "upload"
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-gray-100"
                }`}
              >
                <Upload className="h-4 w-4 mr-2" />
                UPLOAD
              </Button>
              <Button
                onClick={() => setActiveTab("gallery")}
                className={`brutalist-button flex-1 ${
                  activeTab === "gallery"
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-gray-100"
                }`}
              >
                <Images className="h-4 w-4 mr-2" />
                GALLERY
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {activeTab === "upload" && (
          <UploadZone
            onUpload={handleUpload}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            uploadResults={uploadResults}
            errors={errors}
          />
        )}

        {activeTab === "gallery" && (
          <Gallery isAuthenticated={isAuthenticated} />
        )}

        {/* Footer */}
        <Card className="brutalist-card">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-gray-600">
              <p className="font-bold">RATE LIMIT: 300 IMAGES PER DAY</p>
              <p>MAX 150 IMAGES PER UPLOAD • MAX 10MB PER FILE</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
