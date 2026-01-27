import { API_PATHS, BASE_URL } from './apiPaths';
import axiosInstance from './axiosInstance.js';

const uploadImage = async (imageFile, isPublic = false) => {
  const formData = new FormData();
  // Append image file to form data
  formData.append('image', imageFile);

  const endpoint = isPublic ? API_PATHS.IMAGE.UPLOAD_IMAGE_PUBLIC : API_PATHS.IMAGE.UPLOAD_IMAGE;

  try {
    const response = await axiosInstance.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // Set header for file upload
      },
    });

    let data = response.data;
    if (data && data.imageUrl) {
      // Fix Localhost
      if (data.imageUrl.includes("http://localhost:8000")) {
        data.imageUrl = data.imageUrl.replace("http://localhost:8000", BASE_URL);
      }
      // Enforce HTTPS
      const isPageHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      if ((isPageHttps || BASE_URL.startsWith("https://")) && data.imageUrl.startsWith("http://")) {
        data.imageUrl = data.imageUrl.replace("http://", "https://");
      }
    }

    return data; // Return response data
  } catch (error) {
    console.error('Error uploading the image:', error);
    throw error; // Rethrow error for handling
  }
};

export default uploadImage;
