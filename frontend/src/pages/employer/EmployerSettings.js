import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EmployerSideNavBar from "../../components/EmployerSideNavBar";
import EmployerTopNavBar from "../../components/EmployerTopNavBar";
import API, { API_URL } from "../../services/api";
import { getEmployerToken } from "../../utils/authStorage";
import { INDUSTRIES_LIST } from "../../constants/dropdownOptions";

const PROFILE_CACHE_KEY_PREFIX = "employer_profile_cache";
const PROFILE_CACHE_DURATION = 10 * 60 * 1000;

const getProfileCacheKey = (token) => `${PROFILE_CACHE_KEY_PREFIX}:${token || "anonymous"}`;

const readProfileCache = (token) => {
  try {
    const raw = sessionStorage.getItem(getProfileCacheKey(token));
    if (!raw) return null;

    const cached = JSON.parse(raw);
    if (Date.now() - cached.timestamp > PROFILE_CACHE_DURATION) {
      sessionStorage.removeItem(getProfileCacheKey(token));
      return null;
    }

    return cached.data || null;
  } catch {
    return null;
  }
};

const writeProfileCache = (token, data) => {
  try {
    sessionStorage.setItem(
      getProfileCacheKey(token),
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {
    // ignore storage quota errors
  }
};

const clearProfileCache = (token) => {
  try {
    sessionStorage.removeItem(getProfileCacheKey(token));
  } catch {
    // ignore storage errors
  }
};

// ---------------------------------------------------------------------------
// Modal đổi mật khẩu
// ---------------------------------------------------------------------------
function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!form.current_password.trim()) {
      setError("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (form.new_password.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (form.new_password !== form.confirm_password) {
      setError("Mật khẩu mới và xác nhận không khớp.");
      return;
    }
    if (form.new_password === form.current_password) {
      setError("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
      return;
    }

    setSaving(true);
    try {
      await API.post("/auth/change-password", {
        old_password: form.current_password,
        new_password: form.new_password,
      });
      setSuccess("Đổi mật khẩu thành công!");
      setForm({ current_password: "", new_password: "", confirm_password: "" });
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(
        err.response?.data?.error || "Đổi mật khẩu thất bại. Vui lòng thử lại."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">lock_reset</span>
            Đổi mật khẩu
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-slate-500">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400">
              ✓ {success}
            </div>
          )}

          {/* Mật khẩu hiện tại */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Mật khẩu hiện tại
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={form.current_password}
                onChange={(e) => handleChange("current_password", e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                className="w-full px-4 py-3 pr-12 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600/20"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <span className="material-symbols-outlined text-xl">
                  {showCurrent ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {/* Mật khẩu mới */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={form.new_password}
                onChange={(e) => handleChange("new_password", e.target.value)}
                placeholder="Ít nhất 6 ký tự"
                className="w-full px-4 py-3 pr-12 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600/20"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <span className="material-symbols-outlined text-xl">
                  {showNew ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
            {/* Strength indicator */}
            {form.new_password && (
              <div className="mt-1 flex gap-1">
                {[1, 2, 3, 4].map((level) => {
                  const strength = Math.min(
                    Math.floor(form.new_password.length / 3) +
                      (/[A-Z]/.test(form.new_password) ? 1 : 0) +
                      (/[0-9]/.test(form.new_password) ? 1 : 0) +
                      (/[^A-Za-z0-9]/.test(form.new_password) ? 1 : 0),
                    4
                  );
                  return (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        level <= strength
                          ? strength <= 1
                            ? "bg-red-500"
                            : strength <= 2
                            ? "bg-yellow-500"
                            : strength <= 3
                            ? "bg-blue-500"
                            : "bg-green-500"
                          : "bg-slate-200 dark:bg-slate-600"
                      }`}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Xác nhận mật khẩu mới */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              value={form.confirm_password}
              onChange={(e) => handleChange("confirm_password", e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className={`w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 ${
                form.confirm_password && form.new_password !== form.confirm_password
                  ? "ring-2 ring-red-400 focus:ring-red-400"
                  : "focus:ring-blue-600/20"
              }`}
            />
            {form.confirm_password && form.new_password !== form.confirm_password && (
              <p className="text-xs text-red-500 mt-1">Mật khẩu không khớp</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving && (
              <span className="animate-spin material-symbols-outlined text-base">
                progress_activity
              </span>
            )}
            {saving ? "Đang lưu..." : "Xác nhận đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
function EmployerSettings() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveError, setSaveError] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [settings, setSettings] = useState({
    company_name: "",
    phone: "",
    address: "",
    website: "",
    description: "",
    industry: "",
    logo_path: "",
    // Preferences lưu vào localStorage để persist qua session
    twoFA: false,
    emailNotifications: {
      newCandidates: true,
      systemUpdates: false,
    },
  });

  // Load profile + preferences
  useEffect(() => {
    const token = getEmployerToken();
    if (!token) {
      navigate("/login-employer");
      return;
    }

    // Load saved preferences từ localStorage
    const savedPrefs = (() => {
      try {
        return JSON.parse(localStorage.getItem("employer_preferences") || "{}");
      } catch {
        return {};
      }
    })();

    let cancelled = false;

    const cachedProfile = readProfileCache(token);
    if (cachedProfile) {
      setSettings((prev) => ({
        ...prev,
        company_name: cachedProfile.company_name || "",
        phone: cachedProfile.phone || "",
        address: cachedProfile.address || "",
        website: cachedProfile.website || "",
        description: cachedProfile.description || "",
        industry: cachedProfile.industry || "",
        logo_path: cachedProfile.logo_path || "",
        twoFA: savedPrefs.twoFA ?? prev.twoFA,
        emailNotifications: savedPrefs.emailNotifications ?? prev.emailNotifications,
      }));
      if (cachedProfile.logo_path) setLogoPreview(cachedProfile.logo_path);
      return () => { cancelled = true; };
    }

    const loadProfile = async () => {
      try {
        const response = await API.get("/employer/profile");
        if (!cancelled && response.data) {
          const d = response.data;
          setSettings((prev) => ({
            ...prev,
            company_name: d.company_name || "",
            phone: d.phone || "",
            address: d.address || "",
            website: d.website || "",
            description: d.description || "",
            industry: d.industry || "",
            logo_path: d.logo_path || "",
            // Merge preferences đã lưu
            twoFA: savedPrefs.twoFA ?? prev.twoFA,
            emailNotifications: savedPrefs.emailNotifications ?? prev.emailNotifications,
          }));
          if (d.logo_path) setLogoPreview(d.logo_path);
          writeProfileCache(token, d);
        }
      } catch {
        // keep defaults
      }
    };

    loadProfile();
    return () => { cancelled = true; };
  }, [navigate]);

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Toggle 2FA / email notifications — lưu vào localStorage ngay.
   * Khi backend hỗ trợ endpoint preferences thì thay bằng API call.
   */
  const handleTogglePreference = (field, value) => {
    setSettings((prev) => {
      const next = { ...prev, [field]: value };
      // Persist
      try {
        const prefs = JSON.parse(localStorage.getItem("employer_preferences") || "{}");
        prefs[field] = value;
        localStorage.setItem("employer_preferences", JSON.stringify(prefs));
      } catch { /* ignore */ }
      return next;
    });
  };

  const handleToggleEmailNotification = (key) => {
    setSettings((prev) => {
      const updated = {
        ...prev.emailNotifications,
        [key]: !prev.emailNotifications[key],
      };
      // Persist
      try {
        const prefs = JSON.parse(localStorage.getItem("employer_preferences") || "{}");
        prefs.emailNotifications = updated;
        localStorage.setItem("employer_preferences", JSON.stringify(prefs));
      } catch { /* ignore */ }
      return { ...prev, emailNotifications: updated };
    });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg("");
    setSaveError("");

    try {
      const formData = new FormData();
      formData.append("company_name", settings.company_name);
      formData.append("phone", settings.phone);
      formData.append("address", settings.address);
      formData.append("website", settings.website);
      formData.append("description", settings.description);
      formData.append("industry", settings.industry);
      if (logoFile) formData.append("logo", logoFile);

      await API.put("/employer/profile", formData);

      setSaveMsg("Cài đặt đã được lưu thành công!");
      setLogoFile(null);
      clearProfileCache(getEmployerToken());

      // Reload profile từ server để hiển thị đúng
      try {
        const resp = await API.get("/employer/profile");
        if (resp.data) {
          const d = resp.data;
          setSettings((prev) => ({
            ...prev,
            company_name: d.company_name || "",
            phone: d.phone || "",
            address: d.address || "",
            website: d.website || "",
            description: d.description || "",
            industry: d.industry || "",
            logo_path: d.logo_path || "",
          }));
          if (d.logo_path) setLogoPreview(d.logo_path);
          writeProfileCache(getEmployerToken(), d);
        }
      } catch { /* ignore reload errors */ }
    } catch (err) {
      setSaveError(
        err.response?.data?.error || "Lưu thất bại, vui lòng thử lại."
      );
    } finally {
      setSaving(false);
      setTimeout(() => { setSaveMsg(""); setSaveError(""); }, 4000);
    }
  };

  const getLogoSrc = () => {
    if (logoPreview) {
      if (typeof logoPreview === "string" &&
        (logoPreview.startsWith("blob:") || logoPreview.startsWith("data:"))) {
        return logoPreview;
      }
      if (typeof logoPreview === "string" && logoPreview.startsWith("/")) {
        return `${API_URL}${logoPreview}`;
      }
      return logoPreview;
    }

    const p = settings.logo_path;
    if (p && typeof p === "string" && p.trim()) {
      return p.startsWith("http") ? p : `${API_URL}${p}`;
    }

    return `${API_URL}/logos/default.png`;
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <EmployerSideNavBar />
      <EmployerTopNavBar />

      <main className="ml-64 w-full">
        <div className="pt-20 pb-2 px-4 min-h-screen">
          <div className="max-w-6xl mx-auto">

            {/* Save feedback */}
            {saveMsg && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">check_circle</span>
                {saveMsg}
              </div>
            )}
            {saveError && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">error</span>
                {saveError}
              </div>
            )}

            <div className="grid grid-cols-12 gap-8">
              {/* ----------------------------------------------------------------
                  Hồ sơ công ty
              ---------------------------------------------------------------- */}
              <section className="col-span-12 lg:col-span-8 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-2xl text-blue-600 dark:text-blue-400">domain</span>
                    Hồ sơ công ty
                  </h2>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-lg font-bold text-sm hover:opacity-90 transition-all disabled:opacity-60 flex items-center gap-2"
                  >
                    {saving && (
                      <span className="animate-spin material-symbols-outlined text-base">progress_activity</span>
                    )}
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Logo */}
                  <div className="col-span-1 md:col-span-2 flex items-center gap-6 mb-4">
                    <label className="relative group cursor-pointer">
                      <img
                        alt="Company Logo"
                        className="w-24 h-24 rounded-xl object-cover bg-slate-200 dark:bg-slate-700"
                        src={getLogoSrc()}
                        onError={(e) => {
                          const img = e.currentTarget;
                          if (img.dataset._logoErrorHandled) return;
                          img.dataset._logoErrorHandled = "1";
                          img.src = "https://via.placeholder.com/96?text=Logo";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity rounded-xl">
                        <span className="material-symbols-outlined text-2xl">edit</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                    </label>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">Logo doanh nghiệp</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Khuyên dùng 512×512px. PNG, JPG.</p>
                      {logoFile && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Đã chọn: {logoFile.name}</p>
                      )}
                    </div>
                  </div>

                  {/* Company Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tên công ty</label>
                    <input
                      type="text"
                      value={settings.company_name}
                      onChange={(e) => handleChange("company_name", e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-700 border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Số điện thoại</label>
                    <input
                      type="text"
                      value={settings.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-700 border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  {/* Website */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Website</label>
                    <input
                      type="url"
                      value={settings.website}
                      onChange={(e) => handleChange("website", e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-700 border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  {/* Industry */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Lĩnh vực</label>
                    <select
                      value={settings.industry}
                      onChange={(e) => handleChange("industry", e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-700 border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white outline-none"
                    >
                      <option value="">Chọn ngành nghề</option>
                      {INDUSTRIES_LIST.map((industry) => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                  </div>

                  {/* Address */}
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Địa chỉ</label>
                    <input
                      type="text"
                      value={settings.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      placeholder="Địa chỉ văn phòng"
                      className="w-full bg-slate-100 dark:bg-slate-700 border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  {/* Description */}
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Mô tả công ty</label>
                    <textarea
                      value={settings.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                      rows="4"
                      className="w-full bg-slate-100 dark:bg-slate-700 border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white resize-none outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* ----------------------------------------------------------------
                  Bảo mật & Thông báo
              ---------------------------------------------------------------- */}
              <section className="col-span-12 lg:col-span-4 space-y-8">
                {/* Bảo mật */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                    <span className="material-symbols-outlined text-2xl text-blue-600 dark:text-blue-400">security</span>
                    Bảo mật
                  </h2>
                  <div className="space-y-4">
                    {/* Đổi mật khẩu */}
                    <button
                      onClick={() => setShowChangePassword(true)}
                      className="w-full flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors rounded-lg group"
                    >
                      <div className="text-left">
                        <p className="font-bold text-slate-900 dark:text-white">Đổi mật khẩu</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Thay đổi định kỳ để bảo mật</p>
                      </div>
                      <span className="material-symbols-outlined text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        chevron_right
                      </span>
                    </button>
                  </div>
                </div>

                {/* Thông báo email */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border-t-4 border-blue-600 dark:border-blue-400">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                    <span className="material-symbols-outlined text-2xl text-blue-600 dark:text-blue-400">mail</span>
                    Thông báo email
                  </h2>
                  <div className="space-y-6">
                    {[
                      {
                        key: "newCandidates",
                        label: "Ứng viên mới",
                        desc: "Nhận email khi có ứng viên nộp hồ sơ",
                      },
                      {
                        key: "systemUpdates",
                        label: "Cập nhật hệ thống",
                        desc: "Thông báo về tính năng & bảo trì",
                      },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-bold text-sm text-slate-900 dark:text-white">{label}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{desc}</p>
                        </div>
                        <button
                          onClick={() => handleToggleEmailNotification(key)}
                          aria-checked={settings.emailNotifications[key]}
                          role="switch"
                          className={`relative inline-flex items-center cursor-pointer h-6 w-11 rounded-full transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-600/30 ${
                            settings.emailNotifications[key]
                              ? "bg-blue-600"
                              : "bg-slate-300 dark:bg-slate-600"
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                              settings.emailNotifications[key]
                                ? "translate-x-5"
                                : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Modal đổi mật khẩu */}
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </div>
  );
}

export default EmployerSettings;