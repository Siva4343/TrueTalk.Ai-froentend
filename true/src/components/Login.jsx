import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import GoogleLogin from "./GoogleLogin";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("email"); // "email" or "phone"
  const [phone, setPhone] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const res = await fetch("http://127.0.0.1:8000/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        login(data.token, data.user);
        navigate("/dashboard");
      } else {
        setMessage(data.message || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      setMessage("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneLogin = async (e) => {
    e.preventDefault();
    
    if (!phone) {
      // Send OTP
      if (phone.length < 10) {
        setMessage("Please enter a valid phone number");
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch("http://127.0.0.1:8000/send-otp/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phone }),
        });

        const data = await res.json();
        if (res.ok) {
          setMessage("OTP sent successfully!");
        } else {
          setMessage(data.message || "Failed to send OTP");
        }
      } catch (err) {
        setMessage("Server error.");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Verify OTP and login
      if (phoneOtp.length !== 6) {
        setMessage("Please enter a valid 6-digit OTP");
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch("http://127.0.0.1:8000/phone-otp/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, otp: phoneOtp }),
        });

        const data = await res.json();
        if (res.ok) {
          login(data.token, data.user);
          navigate("/dashboard");
        } else {
          setMessage(data.message || "Invalid OTP");
        }
      } catch (err) {
        setMessage("Server error.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGoogleSuccess = (userData) => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-8 py-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          {/* Auth Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab("email")}
              className={`flex-1 py-3 font-medium text-sm ${
                activeTab === "email"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              📧 Email Login
            </button>
            <button
              onClick={() => setActiveTab("phone")}
              className={`flex-1 py-3 font-medium text-sm ${
                activeTab === "phone"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              📱 Phone Login
            </button>
          </div>

          {/* Email Login Form */}
          {activeTab === "email" && (
            <form className="space-y-6" onSubmit={handleEmailSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition-all duration-200 ${
                  isLoading
                    ? "bg-purple-400 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700 transform hover:scale-105"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          )}

          {/* Phone Login Form */}
          {activeTab === "phone" && (
            <form className="space-y-4" onSubmit={handlePhoneLogin}>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {phone && (
                <div>
                  <label htmlFor="phoneOtp" className="block text-sm font-medium text-gray-700 mb-1">
                    OTP
                  </label>
                  <input
                    id="phoneOtp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    maxLength={6}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition-all duration-200 ${
                  isLoading
                    ? "bg-purple-400 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700 transform hover:scale-105"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                    {phone ? "Verifying..." : "Sending OTP..."}
                  </div>
                ) : (
                  phone ? "Verify OTP" : "Send OTP"
                )}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Google Sign In */}
          <div className="flex justify-center mb-4">
            <GoogleLogin onLogin={handleGoogleSuccess} />
          </div>

          {message && (
            <div className={`mt-4 p-3 rounded-lg text-center ${
              message.toLowerCase().includes("success")
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {message}
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link to="/signup" className="text-purple-600 hover:text-purple-700 font-semibold transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;