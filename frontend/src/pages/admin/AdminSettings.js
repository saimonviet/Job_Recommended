import React, { useState } from "react";
import AdminSideNavBar from "../../components/AdminSideNavBar";
import AdminTopNavBar from "../../components/AdminTopNavBar";

function AdminSettings() {
  const [settings, setSettings] = useState({
    siteTitle: "Predictive Career Admin",
    siteUrl: "https://admin.careerpredict.vn",
    maintenanceMode: false,
    sessionTimeout: 30,
    smtpHost: "smtp.sendgrid.net",
    smtpPort: 587,
    smtpEncryption: "TLS",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSave = () => {
    alert("Cài đặt đã được lưu!");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSideNavBar />

      <main className="ml-64 w-full">
        <AdminTopNavBar />

        <div className="p-10 max-w-6xl mx-auto space-y-12">
          {/* Header Section */}
          <header className="space-y-2">
            <h2 className="text-4xl font-extrabold text-blue-600 tracking-tight">
              Cài đặt hệ thống
            </h2>
            <p className="text-on-surface-variant max-w-2xl">
              Quản lý các cấu hình nền tảng, bảo mật và tích hợp bên thứ ba từ một trung tâm điều khiển duy nhất.
            </p>
          </header>

          {/* Settings Grid */}
          <div className="grid grid-cols-12 gap-6">
            {/* General Settings */}
            <section className="col-span-12 lg:col-span-8 bg-white p-8 rounded-xl space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                  <span className="material-symbols-outlined text-xl">settings_applications</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-on-surface">Cài đặt chung</h3>
                  <p className="text-xs text-on-surface-variant">Cấu hình thông tin cơ bản của website</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-on-surface-variant">
                    Tiêu đề trang web
                  </label>
                  <input
                    type="text"
                    name="siteTitle"
                    value={settings.siteTitle}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border-none rounded-md px-4 py-2.5 focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-on-surface-variant">
                    URL hệ thống
                  </label>
                  <input
                    type="text"
                    name="siteUrl"
                    value={settings.siteUrl}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border-none rounded-md px-4 py-2.5 focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all text-sm"
                  />
                </div>

                <div className="col-span-1 md:col-span-2 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold">Chế độ bảo trì</p>
                    <p className="text-xs text-on-surface-variant">Chỉ cho phép quản trị viên truy cập</p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="maintenanceMode"
                      checked={settings.maintenanceMode}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className={`w-12 h-6 ${settings.maintenanceMode ? "bg-blue-600" : "bg-gray-300"} rounded-full relative transition-colors`}>
                      <div
                        className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                          settings.maintenanceMode ? "translate-x-6" : "translate-x-0.5"
                        }`}
                      ></div>
                    </div>
                  </label>
                </div>
              </div>
            </section>

            {/* Security Settings */}
            <section className="col-span-12 lg:col-span-4 bg-white p-8 rounded-xl space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
                  <span className="material-symbols-outlined text-xl">security</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-on-surface">Bảo mật</h3>
                  <p className="text-xs text-on-surface-variant">Quản lý an toàn dữ liệu</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-xl text-orange-600">verified_user</span>
                    <span className="text-sm font-medium">Xác thực 2 yếu tố</span>
                  </div>
                  <span className="text-[10px] bg-orange-600 text-white px-2 py-0.5 rounded font-bold uppercase">
                    Bật
                  </span>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-on-surface-variant">
                    Thời gian chờ phiên (phút)
                  </label>
                  <input
                    type="number"
                    name="sessionTimeout"
                    value={settings.sessionTimeout}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border-none rounded-md px-4 py-2.5 text-sm"
                  />
                </div>

                <div className="pt-4">
                  <button className="w-full py-2.5 text-xs font-bold text-blue-600 border border-blue-600/20 rounded-md hover:bg-blue-50 transition-colors">
                    Đặt lại mật khẩu admin
                  </button>
                </div>
              </div>
            </section>

            {/* Email Configuration */}
            <section className="col-span-12 md:col-span-7 bg-white p-8 rounded-xl flex gap-8">
              <div className="hidden sm:block w-32 shrink-0 h-48 bg-gray-50 rounded-lg overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-blue-600 opacity-20">
                  <span className="material-symbols-outlined text-3xl text-blue-500">mail</span>
                </div>
              </div>

              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                    <span className="material-symbols-outlined text-xl">forward_to_inbox</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-on-surface">Cấu hình Email</h3>
                    <p className="text-xs text-on-surface-variant">Cài đặt SMTP và thông báo hệ thống</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-on-surface-variant">SMTP Host</label>
                    <input
                      type="text"
                      name="smtpHost"
                      value={settings.smtpHost}
                      onChange={handleChange}
                      className="w-full bg-gray-50 border-none rounded-md px-4 py-2.5 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-on-surface-variant">Cổng (Port)</label>
                      <input
                        type="text"
                        name="smtpPort"
                        value={settings.smtpPort}
                        onChange={handleChange}
                        className="w-full bg-gray-50 border-none rounded-md px-4 py-2.5 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-on-surface-variant">Mã hóa</label>
                      <select
                        name="smtpEncryption"
                        value={settings.smtpEncryption}
                        onChange={handleChange}
                        className="w-full bg-gray-50 border-none rounded-md px-4 py-2.5 text-sm"
                      >
                        <option>TLS</option>
                        <option>SSL</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* API Integration */}
            <section className="col-span-12 md:col-span-5 bg-white p-8 rounded-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                  <span className="material-symbols-outlined text-xl">api</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-on-surface">API</h3>
                  <p className="text-xs text-on-surface-variant">Quản lý tích hợp bên thứ ba</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm font-semibold text-purple-900 mb-2">API Key</p>
                  <input
                    type="password"
                    placeholder="••••••••••••••••"
                    className="w-full bg-white border-none rounded-md px-4 py-2.5 text-sm mb-2"
                  />
                  <button className="text-xs font-bold text-purple-600 hover:underline">
                    Tạo API Key mới
                  </button>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                    <span className="text-sm text-on-surface">Cho phép Webhook</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded" />
                    <span className="text-sm text-on-surface">OAuth 2.0 Integration</span>
                  </label>
                </div>
              </div>
            </section>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button className="px-6 py-2.5 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Lưu cài đặt
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminSettings;
