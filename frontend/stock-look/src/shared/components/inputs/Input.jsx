/**
 * @file Input.jsx
 * @purpose Reusable input form field with icon support.
 * @responsibilities
 * - Renders text/password inputs with consistent styling.
 * - Handles password visibility toggling.
 * - Supports external labels and placeholders.
 * @key_exports
 * - Input (Default)
 * @dependencies
 * - react-icons (FaRegEye, FaRegEyeSlash)
 * @lifecycle
 * - Used in Auth Forms and Search bars.
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import React, { useState } from 'react';
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";

// =============================
// Component
// =============================

const Input = ({ value, onChange, placeholder, label, type }) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="mb-4">
      {label && (
        <label className="text-[13px] text-slate-800 mb-1 block">{label}</label>
      )}

      <div className="input-box relative flex items-center">
        <input
          type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none pr-10"
          value={value}
          onChange={(e) => onChange(e)}
        />

        {type === "password" && (
          showPassword ? (
            <FaRegEye
              size={22}
              className="absolute right-3 text-primary cursor-pointer"
              onClick={toggleShowPassword}
            />
          ) : (
            <FaRegEyeSlash
              size={22}
              className="absolute right-3 text-slate-400 cursor-pointer"
              onClick={toggleShowPassword}
            />
          )
        )}
      </div>
    </div>
  );
};

export default Input;
