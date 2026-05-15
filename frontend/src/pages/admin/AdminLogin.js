import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminLogin() {
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Test credentials
    const testCredentials = {
      "admin": "admin123",
      "admin@careerauthority.com": "admin123",
    };

    // Simulate API call with delay
    setTimeout(() => {
      if (testCredentials[identity] === password) {
        // Simulate successful login
        const mockToken = "admin_token_" + Date.now();
        localStorage.setItem("adminToken", mockToken);
        localStorage.setItem("adminUser", JSON.stringify({
          name: "Quản trị viên",
          email: identity,
          role: "Super Admin"
        }));
        navigate("/admin/dashboard");
      } else {
        alert("❌ Đăng nhập thất bại\n\nTest Credentials:\nUsername: admin\nPassword: admin123");
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-6">
      {/* Background Texture */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-500/5 blur-[120px]"></div>
      </div>

      {/* Login Container */}
      <main className="relative z-10 w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 mb-6 shadow-xl">
            <span className="material-symbols-outlined text-white text-2xl">shield</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-blue-600 mb-2">
            Hệ thống Quản trị
          </h1>
          <p className="text-on-surface-variant font-medium tracking-wide uppercase text-xs opacity-70">
            Career Authority Portal
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header Stripe */}
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600"></div>

          <div className="p-10">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email/Identity Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface ml-1">
                  Email hoặc Tên đăng nhập
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute top-1/2 -translate-y-1/2 left-0 pl-3 flex items-center text-gray-400 text-lg">
                    account_circle
                  </span>
                  <input
                    type="text"
                    value={identity}
                    onChange={(e) => setIdentity(e.target.value)}
                    placeholder="admin"
                    required
                    className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all text-on-surface placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="block text-sm font-semibold text-on-surface">
                    Mật khẩu
                  </label>
                  <a href="#" className="text-xs font-medium text-blue-600 hover:underline">
                    Quên mật khẩu?
                  </a>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute top-1/2 -translate-y-1/2 left-0 pl-3 flex items-center text-gray-400 text-lg">
                    lock
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    required
                    className="block w-full pl-11 pr-12 py-3.5 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all text-on-surface placeholder:text-gray-400"
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
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="material-symbols-outlined text-blue-600 text-lg flex-shrink-0 mt-0.5">
                  info
                </span>
                <div className="text-[11px] leading-relaxed text-blue-700">
                  <p className="font-semibold mb-1">🔐 Test Credentials:</p>
                  <p>Username: <code className="font-mono bg-white px-1 rounded">admin</code></p>
                  <p>Password: <code className="font-mono bg-white px-1 rounded">admin123</code></p>
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
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-gray-500 opacity-60 font-medium">
            © The Predictive Career Authority. <br className="md:hidden" />
            Nền tảng Quản trị Chiến lược Nhân sự.
          </p>
        </div>
      </main>
    </div>
  );
}

export default AdminLogin;
