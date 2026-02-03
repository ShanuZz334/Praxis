/**
 * @file ProfilePhotoSelector.jsx
 * @purpose Allows users to select, preview, and delete a profile photo.
 * @responsibilities
 * - Handles file selection via hidden input.
 * - Manages image preview logic.
 * - Provides upload and delete controls.
 * @key_exports
 * - ProfilePhotoSelector (Default)
 * @dependencies
 * - React (useRef, useState)
 * - react-icons/lu
 * @lifecycle
 * - Rendered by SignUp or Profile forms.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import React, { useRef, useState, useEffect } from "react";
import { LuUser, LuUpload, LuTrash } from "react-icons/lu";

// =============================
// Component
// =============================

const ProfilePhotoSelector = ({ image, setImage }) => {
    const inputRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setImage(file);
        }
    };

    const handleRemoveImage = () => {
        setImage(null);
        if (inputRef.current) {
            inputRef.current.value = ""; // Reset input
        }
    };

    const onChooseFile = () => {
        inputRef.current?.click();
    };

    // =============================
    // Render Layer
    // =============================

    return (
        <div className="flex justify-center mb-6">
            <input
                type="file"
                accept="image/*"
                ref={inputRef}
                onChange={handleImageChange}
                className="hidden"
            />

            {!image ? (
                <div className="w-20 h-20 flex items-center justify-center bg-purple-100 rounded-full relative border border-purple-200">
                    <LuUser className="text-4xl text-purple-800" />

                    <button
                        type="button"
                        className="w-8 h-8 flex items-center justify-center bg-purple-800 hover:bg-purple-900 text-white rounded-full absolute -bottom-1 -right-1 transition-colors shadow-md"
                        onClick={onChooseFile}
                        title="Upload Photo"
                    >
                        <LuUpload className="text-base" />
                    </button>
                </div>
            ) : (
                <div className="relative group">
                    <img
                        src={previewUrl}
                        alt="Profile Preview"
                        className="w-20 h-20 rounded-full object-cover border-2 border-purple-100 shadow-sm"
                    />
                    <button
                        type="button"
                        className="w-8 h-8 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full absolute -bottom-1 -right-1 transition-colors shadow-md"
                        onClick={handleRemoveImage}
                        title="Remove Photo"
                    >
                        <LuTrash className="text-base" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProfilePhotoSelector;