"use client"

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Loader2, Upload, X } from "lucide-react";

type Mode = "generate" | "edit" | "variation";

export default function GeneratePage() {
  const [mode, setMode] = useState<Mode>("generate");
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [revisedPrompt, setRevisedPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeUploadedImage = () => {
    setUploadedImage(null);
    setUploadedImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (mode === "generate") {
      if (!prompt.trim()) {
        setError("Please enter a prompt");
        return;
      }
    } else {
      if (!uploadedImage) {
        setError("Please upload an image");
        return;
      }
      if (mode === "edit" && !prompt.trim()) {
        setError("Please enter a prompt for editing");
        return;
      }
    }

    setIsLoading(true);
    setError("");
    setImageUrl("");
    setRevisedPrompt("");

    try {
      let response;

      if (mode === "generate") {
        response = await fetch("/api/generate-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt }),
        });
      } else if (mode === "edit") {
        const formData = new FormData();
        formData.append("image", uploadedImage!);
        formData.append("prompt", prompt);

        response = await fetch("/api/edit-image", {
          method: "POST",
          body: formData,
        });
      } else {
        // variation mode
        const formData = new FormData();
        formData.append("image", uploadedImage!);

        response = await fetch("/api/variation-image", {
          method: "POST",
          body: formData,
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process image");
      }

      setImageUrl(data.imageUrl);
      setRevisedPrompt(data.revisedPrompt || "");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Image Generator
          </h1>
          <p className="text-gray-600">
            Powered by DALL-E - Create, Edit, and Transform Images
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          {/* Mode Selector */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={mode === "generate" ? "default" : "outline"}
              onClick={() => setMode("generate")}
              className="flex-1"
            >
              Generate
              <span className="ml-2 text-xs opacity-70">(DALL-E 3)</span>
            </Button>
            <Button
              variant={mode === "edit" ? "default" : "outline"}
              onClick={() => setMode("edit")}
              className="flex-1"
            >
              Edit
              <span className="ml-2 text-xs opacity-70">(DALL-E 2)</span>
            </Button>
            <Button
              variant={mode === "variation" ? "default" : "outline"}
              onClick={() => setMode("variation")}
              className="flex-1"
            >
              Variation
              <span className="ml-2 text-xs opacity-70">(DALL-E 2)</span>
            </Button>
          </div>

          {/* Image Upload for Edit/Variation modes */}
          {(mode === "edit" || mode === "variation") && (
            <div className="mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png"
                onChange={handleImageUpload}
                className="hidden"
              />

              {!uploadedImagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                >
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-gray-600 font-medium">Click to upload image</p>
                  <p className="text-gray-400 text-sm mt-1">PNG format, square, max 4MB</p>
                </div>
              ) : (
                <div className="relative">
                  <AspectRatio ratio={1 / 1}>
                    <img
                      src={uploadedImagePreview}
                      alt="Uploaded"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </AspectRatio>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={removeUploadedImage}
                    className="absolute top-2 right-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Prompt Input */}
          {(mode === "generate" || mode === "edit") && (
            <div className="flex gap-4 mb-4">
              <Input
                type="text"
                placeholder={
                  mode === "generate"
                    ? "Describe the image you want to generate..."
                    : "Describe the changes you want to make..."
                }
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="flex-1"
              />
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "generate" ? "Generating..." : mode === "edit" ? "Editing..." : "Creating variation..."}
              </>
            ) : (
              <>
                {mode === "generate" ? "Generate Image" : mode === "edit" ? "Edit Image" : "Create Variation"}
              </>
            )}
          </Button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>

        {imageUrl && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Generated Image
              </h2>
              {revisedPrompt && (
                <div className="text-sm text-gray-600 mb-4">
                  <span className="font-medium">Enhanced prompt:</span>{" "}
                  {revisedPrompt}
                </div>
              )}
            </div>
            <AspectRatio ratio={1 / 1}>
              <img
                src={imageUrl}
                alt="Generated image"
                className="w-full h-full object-cover rounded-lg"
              />
            </AspectRatio>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.open(imageUrl, "_blank")}
                className="flex-1"
              >
                Open Full Size
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = imageUrl;
                  link.download = "generated-image.png";
                  link.click();
                }}
                className="flex-1"
              >
                Download
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
