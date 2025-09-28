"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image, Download, Trash2, RefreshCw } from "lucide-react";

interface GalleryImage {
  key: string;
  name: string;
  size: number;
  lastModified: string;
  url: string;
}

interface GalleryProps {
  isAuthenticated: boolean;
}

export function Gallery({ isAuthenticated }: GalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchImages = async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/gallery", {
        headers: {
          Authorization: "Basic " + btoa("user:" + "8!6G#"),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setImages(data.images || []);
      } else {
        setError("Failed to load images");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [isAuthenticated]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const downloadImage = (url: string, name: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Card className="brutalist-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">
            IMAGE GALLERY ({images.length})
          </CardTitle>
          <Button
            onClick={fetchImages}
            disabled={isLoading}
            className="brutalist-button"
            size="sm"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            REFRESH
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-3 bg-red-100 border-2 border-red-500 mb-4">
            <p className="text-sm font-bold text-red-800">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="font-bold">LOADING IMAGES...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-8">
            <Image className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="font-bold text-gray-600">NO IMAGES UPLOADED YET</p>
            <p className="text-sm text-gray-500">
              UPLOAD SOME IMAGES TO GET STARTED
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.key} className="brutalist-card p-4">
                <div className="aspect-square mb-3 bg-gray-100 border-2 border-black overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-sm truncate" title={image.name}>
                    {image.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {formatFileSize(image.size)}
                  </p>
                  <p className="text-xs text-gray-600">
                    {formatDate(image.lastModified)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => downloadImage(image.url, image.name)}
                      className="brutalist-button flex-1"
                      size="sm"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      DOWNLOAD
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
