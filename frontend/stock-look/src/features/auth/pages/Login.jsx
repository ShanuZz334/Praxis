import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

import axiosInstance from "@/shared/utils/axiosInstance";
import { API_PATHS } from "@/shared/utils/apiPaths";
import { UserContext } from "@/shared/context/UserContext";
import { validateEmail } from "@/shared/utils/helper";

import Loader from "@/shared/components/ui/Loader";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const { updateUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!validateEmail(email)) {
      setIsLoading(false);
      return setError("Invalid email.");
    }

    if (!password) {
      setIsLoading(false);
      return setError("Please enter your password.");
    }

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
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[335px] md:max-w-md mx-auto p-2 md:p-0">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
        Login
      </h2>
      <p className="text-sm text-white/70 mb-6 md:mb-8">
        Access your trading dashboard
      </p>

      <form onSubmit={handleLogin} className="space-y-3 md:space-y-3">
        {/* Email */}
        <div>
          <label className="text-xs text-white/70 block mb-2">
            Email
          </label>
          <div className="bg-white/10 border border-white/20 rounded-md px-3 py-2.5 md:py-3 flex items-center transition-colors focus-within:border-blue-500/50">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full bg-transparent outline-none text-white placeholder:text-white/40 h-6"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="text-xs text-white/70 block mb-2">
            Password
          </label>
          <div className="bg-white/10 border border-white/20 rounded-md px-3 py-2.5 md:py-3 flex items-center transition-colors focus-within:border-blue-500/50">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 Characters"
              className="w-full bg-transparent outline-none text-white placeholder:text-white/40 h-6"
            />
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 md:py-3 rounded-md bg-[#1E1BFF] text-white font-medium shadow-md hover:bg-[#1720cc] transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center active:scale-[0.98]"
        >
          {isLoading ? (
            <Loader size="xxs" color="white" />
          ) : (
            "Login"
          )}
        </button>

        <p className="text-center text-white/60 text-sm pt-2">
          Don't have an account?{" "}
          <button
            type="button"
            className="text-blue-400/80 font-bold hover:underline"
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
