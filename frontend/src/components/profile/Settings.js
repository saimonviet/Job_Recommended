import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    newJobNotifications: true,
    recruiterContact: true,
    newsAndUpdates: false,
    profileVisibility: 'public',
  });
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.request('/seeker/profile');
        if (data.degree) {
          setSettings(JSON.parse(data.degree));
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async (updatedSettings) => {
    try {
      await api.request('/seeker/profile', {
        method: 'POST',
        body: JSON.stringify({ degree: JSON.stringify(updatedSettings) }),
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Lưu cài đặt thất bại.');
    }
  };

  const handleToggle = (key) => {
    const updatedSettings = { ...settings, [key]: !settings[key] };
    setSettings(updatedSettings);
    handleSaveSettings(updatedSettings);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updatedSettings = { ...settings, [name]: type === 'checkbox' ? checked : value };
    setSettings(updatedSettings);
    handleSaveSettings(updatedSettings);
  };

  const handlePasswordChange = async () => {
    if (password.newPassword !== password.confirmPassword || !password.newPassword) {
      alert('Mật khẩu mới không khớp hoặc bỏ trống!');
      return;
    }
    try {
      await api.request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: password.currentPassword,
          new_password: password.newPassword,
        }),
      });
      alert('Mật khẩu được cập nhật thành công!');
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Failed to change password:', error);
      alert('Thay đổi mật khẩu thất bại.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login-seeker');
  };

  const Toggle = ({ settingKey }) => (
    <div
      onClick={() => handleToggle(settingKey)}
      className={`relative inline-flex w-11 h-6 rounded-full cursor-pointer transition-colors duration-200 flex-shrink-0 ${
        settings[settingKey] ? 'bg-[#00488d]' : 'bg-surface-container-high'
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${
          settings[settingKey] ? 'right-1' : 'left-1'
        }`}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-2 md:px-5">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <header className="mb-10">
            <h2 className="text-xl font-bold tracking-widest text-[#00488d] uppercase mb-1">Cài đặt</h2>
            <p className="text-sm text-on-surface-variant mt-1">Quản lý thông báo, bảo mật và tài khoản của bạn</p>
          </header>

          <div className="space-y-10">

            {/* ── Notifications ─────────────────────────────── */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">Thông báo</p>
              <section className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-[#00488d]/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#00488d] text-[20px]">notifications_active</span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-on-surface">Cài đặt thông báo</h2>
                    <p className="text-xs text-on-surface-variant">Kiểm soát cách bạn nhận cập nhật</p>
                  </div>
                </div>

                <div className="divide-y divide-outline-variant/10">
                  {[
                    { key: 'newJobNotifications', label: 'Thông báo việc làm mới', desc: 'Gửi email khi có việc làm phù hợp' },
                    { key: 'recruiterContact', label: 'Lời mời từ nhà tuyển dụng', desc: 'Nhận thông báo khi nhà tuyển dụng liên hệ' },
                    { key: 'newsAndUpdates', label: 'Tin tức & Sự nghiệp', desc: 'Bản tin hàng tuần về thị trường lao động' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium text-on-surface">{item.label}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">{item.desc}</p>
                      </div>
                      <Toggle settingKey={item.key} />
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* ── Privacy + Password ────────────────────────── */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">Bảo mật & Quyền riêng tư</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Privacy */}
                <section className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-[#1D9E75]/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#1D9E75] text-[20px]">visibility</span>
                    </div>
                    <h2 className="text-base font-bold text-on-surface">Hiển thị hồ sơ</h2>
                  </div>

                  <div className="space-y-2">
                    {[
                      { value: 'public', label: 'Công khai', desc: 'Nhà tuyển dụng có thể tìm thấy bạn' },
                      { value: 'private', label: 'Ẩn danh', desc: 'Chỉ công ty bạn ứng tuyển' },
                    ].map(option => (
                      <label
                        key={option.value}
                        className={`flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all border-2 ${
                          settings.profileVisibility === option.value
                            ? 'border-[#00488d] bg-[#00488d]/5'
                            : 'border-transparent hover:bg-surface-container'
                        }`}
                      >
                        <input
                          type="radio"
                          name="profileVisibility"
                          value={option.value}
                          checked={settings.profileVisibility === option.value}
                          onChange={handleChange}
                          className="text-[#00488d] focus:ring-[#00488d]"
                        />
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{option.label}</p>
                          <p className="text-xs text-on-surface-variant">{option.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </section>

                {/* Password */}
                <section className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface-variant text-[20px]">lock</span>
                    </div>
                    <h2 className="text-base font-bold text-on-surface">Đổi mật khẩu</h2>
                  </div>

                  <div className="space-y-3">
                    {[
                      { id: 'currentPassword', label: 'Mật khẩu hiện tại' },
                      { id: 'newPassword', label: 'Mật khẩu mới' },
                      { id: 'confirmPassword', label: 'Xác nhận mật khẩu' },
                    ].map(({ id, label }) => (
                      <div key={id}>
                        <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">{label}</label>
                        <input
                          type="password"
                          name={id}
                          value={password[id]}
                          onChange={(e) => setPassword({ ...password, [e.target.name]: e.target.value })}
                          placeholder="••••••••"
                          className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm px-3.5 py-2.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-[#00488d]/20 focus:border-[#00488d] transition-all"
                        />
                      </div>
                    ))}
                    <button
                      onClick={handlePasswordChange}
                      className="w-full mt-1 py-2.5 text-sm font-bold text-white bg-gradient-to-br from-[#00488d] to-[#0066cc] hover:opacity-90 rounded-lg transition-all"
                    >
                      Cập nhật mật khẩu
                    </button>
                  </div>
                </section>
              </div>
            </div>

            {/* ── Account Actions ───────────────────────────── */}
            <div>
              <section className="bg-surface-container-lowest rounded-2xl p-6">
                <div className="h-px mb-5" />
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px] leading-none">logout</span>
                    Đăng xuất
                  </button>
                  <button className="flex items-center justify-center gap-2 border border-red-500 text-red-600 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-50 transition-all">
                    <span className="material-symbols-outlined text-[18px] leading-none">delete</span>
                    Xóa tài khoản
                  </button>
                </div>
              </section>
            </div>

          </div>
         </div> 
    </div>
  );
};

export default Settings;