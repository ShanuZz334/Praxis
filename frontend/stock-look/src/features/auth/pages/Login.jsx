import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

import axiosInstance from "@/shared/utils/axiosInstance";
import { API_PATHS } from "@/shared/utils/apiPaths";
import { UserContext } from "@/shared/context/UserContext";
import { validateEmail } from "@/shared/utils/helper";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { updateUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    if (!validateEmail(email)) {
      return setError("Invalid email.");
    }

    if (!password) {
      return setError("Please enter your password.");
    }

    setLoading(true);

    try {
      const res = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
        email,
        password,
      });

      const { user, token } = res.data;

      // Single source of truth → context
      updateUser(user, token);

      navigate("/dashboard/home");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-semibold text-white mb-2">
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Login
      </h2>
      <p className="text-sm text-white/70 mb-6">
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Access your trading dashboard
      </p>

      <form onSubmit={handleLogin} className="space-y-3">
        {/* Email */}
        <div>
          <label className="text-xs text-white/70 block mb-2">
            Email
          </label>
          <div className="bg-white/10 border border-white/20 rounded-md px-3 py-2 flex items-center">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full bg-transparent outline-none text-white placeholder:text-white/40"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="text-xs text-white/70 block mb-2">
            Password
          </label>
          <div className="bg-white/10 border border-white/20 rounded-md px-3 py-2 flex items-center">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 Characters"
              className="w-full bg-transparent outline-none text-white placeholder:text-white/40"
            />
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-md text-white font-medium shadow-md transition ${loading ? 'bg-indigo-800 cursor-not-allowed' : 'bg-[#1E1BFF] hover:bg-[#1720cc]'}`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-center text-white/60 text-sm">
          Don't have an account?{" "}
          <button
            type="button"
            className="text-indigo-300 underline"
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </button>
        </p>
      </form>
    </div>
  );
};

export default Login;
