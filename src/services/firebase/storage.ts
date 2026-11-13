/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

export interface UploadedAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

async function compressImageToDataUrl(file: File, maxDimension = 1200, quality = 0.78): Promise<string> {
  if (!file.type.startsWith('image/')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(event.target?.result as string);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

export async function uploadCustomDesignFile(
  file: File,
  userId: string
): Promise<UploadedAttachment> {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Please upload an image (JPG, PNG, WebP) or PDF plan.');
  }

  if (file.size > 15 * 1024 * 1024) {
    throw new Error('File size exceeds 15MB. Please upload a smaller file.');
  }

  try {
    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `custom-ideas/${userId}/${timestamp}_${cleanName}`;
    const storageRef = ref(storage, storagePath);

    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        uploadedBy: userId,
        fileName: file.name,
        timestamp: new Date().toISOString(),
      },
    });

    const downloadUrl = await getDownloadURL(snapshot.ref);
    return {
      name: file.name,
      url: downloadUrl,
      type: file.type,
      size: file.size,
    };
  } catch (error) {
    console.warn('Firebase Storage upload fallback to compressed image:', error);
    const dataUrl = await compressImageToDataUrl(file);
    return {
      name: file.name,
      url: dataUrl,
      type: file.type,
      size: file.size,
    };
  }
}

export async function uploadFurnitureIdeaImage(
  file: File,
  userId: string
): Promise<string> {
  const res = await uploadCustomDesignFile(file, userId);
  return res.url;
}

export async function uploadProductImage(
  file: File,
  productId: string
): Promise<string> {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    throw new Error('Please upload an image file (JPG, PNG, or WebP).');
  }

  if (file.size > 15 * 1024 * 1024) {
    throw new Error('Image size exceeds 15MB. Please upload a smaller photo.');
  }

  try {
    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const storagePath = `products/${productId}/${timestamp}_${cleanName}`;
    const storageRef = ref(storage, storagePath);

    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        productId,
        timestamp: new Date().toISOString(),
      },
    });

    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.warn('Firebase Storage product image upload fallback:', error);
    return compressImageToDataUrl(file);
  }
}
