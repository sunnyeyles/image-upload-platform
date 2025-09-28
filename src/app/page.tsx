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

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa("user:" + "8!6G#"),
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadResults(data.results || []);
        if (data.errors && data.errors.length > 0) {
          setErrors(data.errors);
        }
        setUploadProgress(100);

        // Switch to gallery tab after successful upload
        setTimeout(() => {
          setActiveTab("gallery");
        }, 2000);
      } else {
        setErrors([data.error || "Upload failed"]);
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
