import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function EmployerLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Mock authentication
    const testCredentials = {
      "employer@techvantage.com": "employer123",
      "employer": "employer123",
    };

    setTimeout(() => {
      if (testCredentials[email] === password) {
        const mockToken = "employer_token_" + Date.now();
        localStorage.setItem("employerToken", mockToken);
        localStorage.setItem("employerUser", JSON.stringify({
          name: "TechVantage Corp",
          email: email,
          role: "Employer"
        }));
        navigate("/employer/dashboard");
      } else {
        alert("❌ Đăng nhập thất bại\n\nTest Credentials:\nEmail: employer@techvantage.com\nPassword: employer123");
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 mb-4">
            <span className="material-symbols-outlined text-white text-3xl">business</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Career Authority</h1>
          <p className="text-slate-500 text-sm mt-1">Portal Nhà Tuyển Dụng</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Đăng nhập doanh nghiệp</h2>
          <p className="text-slate-500 text-sm mb-8">Quản lý quy trình tuyển dụng của bạn</p>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Email công ty</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 text-lg">
                  business
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employer@techvantage.com"
                  required
                  className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all text-slate-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="block text-sm font-semibold text-slate-700">Mật khẩu</label>
                <a href="#" className="text-xs font-medium text-blue-600 hover:underline">Quên mật khẩu?</a>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 text-lg">
                  lock
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  required
                  className="block w-full pl-11 pr-12 py-3.5 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all text-slate-900 placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Security Notice */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-blue-600 flex-shrink-0 mt-0.5">info</span>
                <div className="text-sm">
                  <p className="font-semibold text-blue-900">Thông tin đăng nhập thử nghiệm:</p>
                  <p className="text-blue-700 text-xs mt-1">Email: <span className="font-mono font-bold">employer@techvantage.com</span></p>
                  <p className="text-blue-700 text-xs">Mật khẩu: <span className="font-mono font-bold">employer123</span></p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold text-sm tracking-wide hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              <span>{loading ? "Đang xử lý..." : "Đăng nhập quản trị"}</span>
              <span className="material-symbols-outlined text-xl">login</span>
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-slate-500">
            <p>Không có tài khoản? <a href="#" className="font-semibold text-blue-600 hover:underline">Liên hệ bộ phận bán hàng</a></p>
          </div>
        </div>

        {/* Brand Footer */}
        <p className="text-center text-xs text-slate-400 mt-8">© 2024 Career Authority - Nền tảng tuyển dụng hàng đầu Việt Nam</p>
      </div>
    </div>
  );
}

export default EmployerLogin;
