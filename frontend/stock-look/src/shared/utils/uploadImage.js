import { API_PATHS } from './apiPaths';
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
    return response.data; // Return response data
  } catch (error) {
    console.error('Error uploading the image:', error);
    throw error; // Rethrow error for handling
  }
};

export default uploadImage;
