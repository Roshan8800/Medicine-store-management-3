import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

interface ImageUploadConfig {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "jpeg" | "png";
  allowMultiple?: boolean;
  aspect?: [number, number];
  allowsEditing?: boolean;
}

interface UploadedImage {
  uri: string;
  width: number;
  height: number;
  base64?: string;
  fileSize?: number;
  fileName?: string;
  mimeType?: string;
}

interface UseImageUploadResult {
  images: UploadedImage[];
  isLoading: boolean;
  error: string | null;
  pickFromGallery: () => Promise<UploadedImage[] | null>;
  pickFromCamera: () => Promise<UploadedImage | null>;
  compressImage: (uri: string) => Promise<UploadedImage>;
  removeImage: (uri: string) => void;
  clearImages: () => void;
  requestCameraPermission: () => Promise<boolean>;
  requestGalleryPermission: () => Promise<boolean>;
}

const defaultConfig: ImageUploadConfig = {
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.8,
  format: "jpeg",
  allowMultiple: false,
  allowsEditing: true,
};

export function useImageUpload(
  config: ImageUploadConfig = {}
): UseImageUploadResult {
  const mergedConfig = { ...defaultConfig, ...config };
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "web") return true;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === "granted";
  }, []);

  const requestGalleryPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "web") return true;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === "granted";
  }, []);

  const compressImage = useCallback(
    async (uri: string): Promise<UploadedImage> => {
      const { maxWidth, maxHeight, quality, format } = mergedConfig;

      const actions: ImageManipulator.Action[] = [];

      if (maxWidth || maxHeight) {
        actions.push({
          resize: {
            width: maxWidth,
            height: maxHeight,
          },
        });
      }

      const result = await ImageManipulator.manipulateAsync(uri, actions, {
        compress: quality,
        format:
          format === "png"
            ? ImageManipulator.SaveFormat.PNG
            : ImageManipulator.SaveFormat.JPEG,
        base64: true,
      });

      let fileSize: number | undefined;
      if (Platform.OS !== "web") {
        try {
          const fileInfo = await FileSystem.getInfoAsync(result.uri);
          if (fileInfo.exists && "size" in fileInfo) {
            fileSize = fileInfo.size;
          }
        } catch {
        }
      }

      return {
        uri: result.uri,
        width: result.width,
        height: result.height,
        base64: result.base64,
        fileSize,
        mimeType: format === "png" ? "image/png" : "image/jpeg",
        fileName: `image_${Date.now()}.${format}`,
      };
    },
    [mergedConfig]
  );

  const pickFromGallery = useCallback(async (): Promise<UploadedImage[] | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const hasPermission = await requestGalleryPermission();
      if (!hasPermission) {
        setError("Gallery permission denied");
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: mergedConfig.allowMultiple,
        allowsEditing: mergedConfig.allowsEditing && !mergedConfig.allowMultiple,
        aspect: mergedConfig.aspect,
        quality: 1,
      });

      if (result.canceled) {
        return null;
      }

      const compressedImages = await Promise.all(
        result.assets.map((asset) => compressImage(asset.uri))
      );

      setImages((prev) =>
        mergedConfig.allowMultiple
          ? [...prev, ...compressedImages]
          : compressedImages
      );

      return compressedImages;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to pick image";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [
    mergedConfig.allowMultiple,
    mergedConfig.allowsEditing,
    mergedConfig.aspect,
    compressImage,
    requestGalleryPermission,
  ]);

  const pickFromCamera = useCallback(async (): Promise<UploadedImage | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        setError("Camera permission denied");
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: mergedConfig.allowsEditing,
        aspect: mergedConfig.aspect,
        quality: 1,
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      const compressedImage = await compressImage(result.assets[0].uri);

      setImages((prev) =>
        mergedConfig.allowMultiple ? [...prev, compressedImage] : [compressedImage]
      );

      return compressedImage;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to capture image";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [
    mergedConfig.allowsEditing,
    mergedConfig.aspect,
    mergedConfig.allowMultiple,
    compressImage,
    requestCameraPermission,
  ]);

  const removeImage = useCallback((uri: string) => {
    setImages((prev) => prev.filter((img) => img.uri !== uri));
  }, []);

  const clearImages = useCallback(() => {
    setImages([]);
  }, []);

  return {
    images,
    isLoading,
    error,
    pickFromGallery,
    pickFromCamera,
    compressImage,
    removeImage,
    clearImages,
    requestCameraPermission,
    requestGalleryPermission,
  };
}

export async function uploadToServer(
  image: UploadedImage,
  uploadUrl: string,
  additionalData?: Record<string, string>
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const formData = new FormData();

    if (Platform.OS === "web") {
      if (image.base64) {
        const response = await fetch(`data:${image.mimeType};base64,${image.base64}`);
        const blob = await response.blob();
        formData.append("image", blob, image.fileName);
      }
    } else {
      formData.append("image", {
        uri: image.uri,
        type: image.mimeType,
        name: image.fileName,
      } as unknown as Blob);
    }

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, url: data.url };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return { success: false, error: message };
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
