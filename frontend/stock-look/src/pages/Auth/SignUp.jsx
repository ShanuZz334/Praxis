import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";
import { UserContext } from "../../context/userContext";
import uploadImage from "../../utils/uploadimage";
import { validateEmail } from "../../utils/helper";

const SignUp = () => {
  const [profilePic, setProfilePic] = useState(null);
  const [previewPic, setPreviewPic] = useState(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const { updateUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!fullName) return setError("Enter full name.");
    if (!validateEmail(email)) return setError("Invalid email.");
    if (!password) return setError("Enter password.");

    let profileImageUrl = "";

    try {
      // Upload profile image if provided
      if (profilePic) {
        const uploadRes = await uploadImage(profilePic);
        profileImageUrl = uploadRes?.imageUrl || "";
      }

      const res = await axiosInstance.post(
        API_PATHS.AUTH.REGISTER,
        {
          fullName,
          email,
          password,
          profileImageUrl,
        }
      );

      const { user, token } = res.data;

      // Single source of truth
      updateUser(user, token);

      navigate("/dashboard/home");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create account. Please try again."
      );
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-semibold text-white mb-2">
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Create Account
      </h2>
      <p className="text-sm text-white/70 mb-6">
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Your edge in the markets starts here
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* PROFILE PICTURE */}
        <div className="flex flex-col items-center mb-4">
          <label className="text-xs text-white/70 mb-2">
            Profile Picture
          </label>

          <label
            htmlFor="profileUpload"
            className="w-20 h-20 rounded-full bg-white/10 border border-white/20 
                       flex items-center justify-center cursor-pointer overflow-hidden
                       backdrop-blur-md hover:bg-white/20 transition"
          >
            {previewPic ? (
              <img
                src={previewPic}
                className="w-full h-full object-cover"
                alt="Profile Preview"
              />
            ) : (
              <span className="text-3xl text-white/70 font-light">
                +
              </span>
            )}
          </label>

          <input
            id="profileUpload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              setProfilePic(file);
              setPreviewPic(URL.createObjectURL(file));
            }}
          />
        </div>

        {/* FULL NAME */}
        <div>
          <label className="text-xs text-white/70 block mb-1">
            Full Name
          </label>
          <div className="bg-white/10 rounded-md border border-white/20 px-3 py-2 flex items-center">
            <input
              type="text"
              className="w-full bg-transparent text-white outline-none placeholder:text-white/40"
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
        </div>

        {/* EMAIL */}
        <div>
          <label className="text-xs text-white/70 block mb-1">
            Email
          </label>
          <div className="bg-white/10 rounded-md border border-white/20 px-3 py-2 flex items-center">
            <input
              type="email"
              className="w-full bg-transparent text-white outline-none placeholder:text-white/40"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* PASSWORD */}
        <div>
          <label className="text-xs text-white/70 block mb-1">
            Password
          </label>
          <div className="bg-white/10 rounded-md border border-white/20 px-3 py-2 flex items-center">
            <input
              type="password"
              className="w-full bg-transparent text-white outline-none placeholder:text-white/40"
              placeholder="Min 8 Characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <button
            type="submit"
            className="w-full py-3 rounded-md bg-[#1E1BFF] text-white font-medium shadow-md hover:bg-[#1720cc] transition"
            >Sign Up
        </button>


        <p className="text-center text-white/60 text-sm">
          Already have an account?{" "}
          <button
            type="button"
            className="text-indigo-300 underline"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </p>
      </form>
    </div>
  );
};

export default SignUp;
