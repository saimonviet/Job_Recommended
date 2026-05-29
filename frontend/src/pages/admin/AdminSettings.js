import React, { useEffect, useState } from "react";
import AdminSideNavBar from "../../components/AdminSideNavBar";
import AdminTopNavBar from "../../components/AdminTopNavBar";

const API_BASE_URL = "http://127.0.0.1:5000";

function AdminSettings() {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
  });

  const [admin, setAdmin] = useState(null);

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");

  const getAdminHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
  });

  const fetchSettings = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/admin/settings`, {
        headers: getAdminHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể tải cài đặt");
      }

      setSettings({
        maintenanceMode: Boolean(data.maintenanceMode),
      });

      setAdmin(data.admin || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const saveMaintenanceMode = async (maintenanceMode) => {
    setSaving(true);
    setError("");
    setStatusMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: "PUT",
        headers: getAdminHeaders(),
        body: JSON.stringify({ maintenanceMode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể cập nhật bảo trì");
      }

      setSettings({
        maintenanceMode: Boolean(data.maintenanceMode),
      });

      setStatusMessage("Đã cập nhật chế độ bảo trì");
    } catch (err) {
      setError(err.message);
      setSettings((prev) => ({
        ...prev,
        maintenanceMode: !maintenanceMode,
      }));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMaintenance = () => {
    const nextValue = !settings.maintenanceMode;

    setSettings((prev) => ({
      ...prev,
      maintenanceMode: nextValue,
    }));

    saveMaintenanceMode(nextValue);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");
    setStatusMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/admin/change-password`, {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify(passwordForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể đổi mật khẩu");
      }

      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });

      setStatusMessage("Đổi mật khẩu admin thành công");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSideNavBar />

      <main className="ml-64 w-full">
        <AdminTopNavBar />

        <div className="p-8 max-w-6xl mx-auto">
          <div className="mb-10">
            <h2 className="text-3xl font-black text-blue-600 tracking-tight mb-2">
              Cài đặt hệ thống
            </h2>
            <p className="text-on-surface-variant max-w-2xl">
              Quản lý thông tin quản trị viên, bảo trì website và bảo mật tài khoản.
            </p>
          </div>

          {(loading || saving || error || statusMessage) && (
            <div
              className={`mb-6 rounded-xl px-4 py-3 text-sm font-semibold ${
                error
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
            >
              {error ||
                (loading
                  ? "Đang tải cài đặt..."
                  : saving
                  ? "Đang xử lý..."
                  : statusMessage)}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-600">
                    admin_panel_settings
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Thông tin admin
                  </h3>
                  <p className="text-sm text-slate-500">
                    Hồ sơ quản trị viên
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-bold uppercase text-slate-400 mb-1">
                    Tên hiển thị
                  </p>
                  <p className="font-bold text-slate-900">
                    {admin?.display_name || "Quản trị viên"}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-bold uppercase text-slate-400 mb-1">
                    Tên đăng nhập
                  </p>
                  <p className="font-bold text-slate-900">
                    {admin?.username || "-"}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-bold uppercase text-slate-400 mb-1">
                    Email
                  </p>
                  <p className="font-bold text-slate-900 break-all">
                    {admin?.email || "-"}
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-orange-600">
                    construction
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Bảo trì website
                  </h3>
                  <p className="text-sm text-slate-500">
                    Chặn truy cập người dùng
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Chế độ bảo trì
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Admin vẫn truy cập bình thường
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleMaintenance}
                  disabled={loading || saving}
                  className={`w-14 h-7 rounded-full relative transition-all ${
                    settings.maintenanceMode ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-all ${
                      settings.maintenanceMode ? "left-7" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              <div
                className={`mt-5 rounded-xl p-4 text-sm font-semibold ${
                  settings.maintenanceMode
                    ? "bg-orange-50 text-orange-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {settings.maintenanceMode
                  ? "Website đang ở chế độ bảo trì."
                  : "Website đang hoạt động bình thường."}
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-600">
                    lock_reset
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Đổi mật khẩu
                  </h3>
                  <p className="text-sm text-slate-500">
                    Bảo mật tài khoản admin
                  </p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <input
                  type="password"
                  name="current_password"
                  value={passwordForm.current_password}
                  onChange={handlePasswordChange}
                  placeholder="Mật khẩu hiện tại"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />

                <input
                  type="password"
                  name="new_password"
                  value={passwordForm.new_password}
                  onChange={handlePasswordChange}
                  placeholder="Mật khẩu mới"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />

                <input
                  type="password"
                  name="confirm_password"
                  value={passwordForm.confirm_password}
                  onChange={handlePasswordChange}
                  placeholder="Xác nhận mật khẩu mới"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Đang đổi..." : "Đổi mật khẩu"}
                </button>
              </form>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminSettings;