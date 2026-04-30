import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EmployerSideNavBar from "../../components/EmployerSideNavBar";
import EmployerTopNavBar from "../../components/EmployerTopNavBar";

function EmployerSettings() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('employerToken');
    if (!token) {
      navigate('/employer/login');
    }
  }, [navigate]);
  const [settings, setSettings] = useState({
    companyName: "TechVantage Solutions Vietnam",
    website: "https://vantage-solutions.vn",
    companySize: "200-500",
    industry: "Công nghệ",
    description: "Vantage Solutions là đơn vị tiên phong trong lĩnh vực giải pháp phần mềm tại Việt Nam...",
    twoFA: true,
    emailNotifications: {
      newCandidates: true,
      systemUpdates: false,
    },
  });

  const handleChange = (field, value) => {
    setSettings({ ...settings, [field]: value });
  };

  const handleSave = () => {
    alert("Cài đặt đã được lưu!");
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <EmployerSideNavBar />

      <main className="ml-64 w-full">
        <EmployerTopNavBar />

        <div className="pt-24 pb-16 px-8 min-h-screen">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <header className="mb-12">
              <h1 className="text-4xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400 mb-2">
                Cài đặt hệ thống
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                Quản lý thông tin doanh nghiệp, bảo mật và đội ngũ tuyển dụng.
              </p>
            </header>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-12 gap-8">
              {/* Company Profile: 8 columns */}
              <section className="col-span-12 lg:col-span-8 bg-white dark:bg-slate-800 rounded-xl p-8 transition-all duration-200">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-2xl text-blue-600 dark:text-blue-400">domain</span>
                    Hồ sơ công ty
                  </h2>
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-lg font-bold text-sm hover:opacity-90 transition-all"
                  >
                    Lưu thay đổi
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Logo Section */}
                  <div className="col-span-1 md:col-span-2 flex items-center gap-6 mb-4">
                    <div className="relative group">
                      <img
                        alt="Company Logo"
                        className="w-24 h-24 rounded-xl object-cover bg-slate-200 dark:bg-slate-700"
                        src="https://via.placeholder.com/96"
                      />
                      <button className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity rounded-xl">
                        <span className="material-symbols-outlined text-2xl">edit</span>
                      </button>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">Logo doanh nghiệp</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Khuyên dùng 512x512px. Định dạng PNG, JPG.</p>
                    </div>
                  </div>

                  {/* Company Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tên công ty</label>
                    <input
                      type="text"
                      value={settings.companyName}
                      onChange={(e) => handleChange("companyName", e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-700 border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Website */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Website</label>
                    <input
                      type="url"
                      value={settings.website}
                      onChange={(e) => handleChange("website", e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-700 border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Company Size */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Quy mô nhân sự</label>
                    <select
                      value={settings.companySize}
                      onChange={(e) => handleChange("companySize", e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-700 border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white"
                    >
                      <option>50 - 200 nhân viên</option>
                      <option value="200-500">200 - 500 nhân viên</option>
                      <option>500+ nhân viên</option>
                    </select>
                  </div>

                  {/* Industry */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Lĩnh vực công nghiệp</label>
                    <select
                      value={settings.industry}
                      onChange={(e) => handleChange("industry", e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-700 border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white"
                    >
                      <option>Công nghệ thông tin</option>
                      <option>Tài chính - Ngân hàng</option>
                      <option>Sản xuất &amp; Công nghiệp</option>
                      <option>Giáo dục</option>
                      <option>Bán lẻ &amp; Thương mại</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Mô tả công ty</label>
                    <textarea
                      value={settings.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                      rows="4"
                      className="w-full bg-slate-100 dark:bg-slate-700 border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white resize-none"
                    />
                  </div>
                </div>
              </section>

              {/* Account Security & Notifications: 4 columns */}
              <section className="col-span-12 lg:col-span-4 space-y-8">
                {/* Security */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                    <span className="material-symbols-outlined text-2xl text-blue-600 dark:text-blue-400">security</span>
                    Bảo mật
                  </h2>

                  <div className="space-y-4">
                    <button className="w-full flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors rounded-lg group">
                      <div className="text-left">
                        <p className="font-bold text-slate-900 dark:text-white">Đổi mật khẩu</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Thay đổi định kỳ để bảo mật</p>
                      </div>
                      <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">chevron_right</span>
                    </button>

                    <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-slate-900 dark:text-white">Xác thực 2 yếu tố (2FA)</p>
                        <button
                          onClick={() => handleChange("twoFA", !settings.twoFA)}
                          className={`relative inline-flex items-center cursor-pointer h-6 w-11 rounded-full transition-colors ${
                            settings.twoFA ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                              settings.twoFA ? "translate-x-5" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Tăng cường lớp bảo mật khi đăng nhập</p>
                    </div>
                  </div>
                </div>

                {/* Email Notifications */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border-t-4 border-blue-600 dark:border-blue-400">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                    <span className="material-symbols-outlined text-2xl text-blue-600 dark:text-blue-400">mail</span>
                    Thông báo email
                  </h2>

                  <div className="space-y-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">Ứng viên mới</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Nhận email khi có ứng viên nộp hồ sơ</p>
                      </div>
                      <button
                        onClick={() => handleChange("emailNotifications", { ...settings.emailNotifications, newCandidates: !settings.emailNotifications.newCandidates })}
                        className={`relative inline-flex items-center cursor-pointer h-6 w-11 rounded-full transition-colors ${
                          settings.emailNotifications.newCandidates ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                            settings.emailNotifications.newCandidates ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">Cập nhật hệ thống</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Thông báo về tính năng &amp; bảo trì</p>
                      </div>
                      <button
                        onClick={() => handleChange("emailNotifications", { ...settings.emailNotifications, systemUpdates: !settings.emailNotifications.systemUpdates })}
                        className={`relative inline-flex items-center cursor-pointer h-6 w-11 rounded-full transition-colors ${
                          settings.emailNotifications.systemUpdates ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                            settings.emailNotifications.systemUpdates ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default EmployerSettings;
