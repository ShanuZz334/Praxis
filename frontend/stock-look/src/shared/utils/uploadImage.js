/**
 * @file uploadImage.js
 * @purpose Handles image upload to the server with URL sanitization.
 * @responsibilities
 * - Uploads image files via FormData to public or private endpoints.
 * - Sanitizes returned image URLs (localhost → BASE_URL, HTTP → HTTPS).
 * - Ensures mixed-content security compliance.
 * @key_exports
 * - uploadImage (default)
 * @dependencies
 * - axiosInstance
 * - apiPaths (API_PATHS, BASE_URL)
 * @lifecycle
 * - Used by ProfilePhotoSelector and other image upload components.
 * @date 2026-02-04
 */

// =============================
// Imports
// =============================

import { API_PATHS, BASE_URL } from './apiPaths';
import axiosInstance from './axiosInstance.js';

// =============================
// Image Upload Function
// =============================

const uploadImage = async (imageFile, isPublic = false) => {
  const formData = new FormData();
  formData.append('image', imageFile);

  const endpoint = isPublic ? API_PATHS.IMAGE.UPLOAD_IMAGE_PUBLIC : API_PATHS.IMAGE.UPLOAD_IMAGE;

  try {
    const response = await axiosInstance.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    let data = response.data;
    if (data && data.imageUrl) {
      if (data.imageUrl.includes("http://localhost:8000")) {
        data.imageUrl = data.imageUrl.replace("http://localhost:8000", BASE_URL);
      }
      const isPageHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      if ((isPageHttps || BASE_URL.startsWith("https://")) && data.imageUrl.startsWith("http://")) {
        data.imageUrl = data.imageUrl.replace("http://", "https://");
      }
    }

    return data;
  } catch (error) {
    console.error('Error uploading the image:', error);
    throw error;
  }
};

export default uploadImage;

