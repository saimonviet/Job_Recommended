import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    newJobNotifications: true,
    recruiterContact: true,
    newsAndUpdates: false,
    profileVisibility: 'public',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handlePasswordChange = () => {
    if (settings.newPassword === settings.confirmPassword && settings.newPassword) {
      alert('Mật khẩu được cập nhật thành công!');
      setSettings(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } else {
      alert('Mật khẩu mới không khớp!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login-seeker');
  };

  return (
    <div className="p-12 max-w-4xl">
      <header className="mb-12">
        <h1 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight mb-2">Cài đặt hệ thống</h1>
        <p className="text-on-surface-variant font-body">Quản lý trải nghiệm, bảo mật và các kết nối cá nhân của bạn.</p>
      </header>

      <div className="space-y-8">
        {/* Notification Settings */}
        <section className="bg-surface-container-lowest rounded-xl p-8 transition-shadow hover:shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-lg bg-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">notifications_active</span>
            </div>
            <div>
              <h2 className="text-xl font-headline font-bold text-on-surface">Cài đặt thông báo</h2>
              <p className="text-sm text-on-surface-variant">Kiểm soát cách bạn nhận tin nhắn và cập nhật.</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Toggle Items */}
            {[
              { key: 'newJobNotifications', label: 'Thông báo việc làm mới', desc: 'Gửi email khi có việc làm phù hợp' },
              { key: 'recruiterContact', label: 'Lời mời từ nhà tuyển dụng', desc: 'Nhận thông báo khi nhà tuyển dụng liên hệ' },
              { key: 'newsAndUpdates', label: 'Tin tức & Sự nghiệp', desc: 'Bản tin hàng tuần về thị trường lao động' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-on-surface">{item.label}</p>
                  <p className="text-xs text-on-surface-variant">{item.desc}</p>
                </div>
                <div
                  onClick={() => handleToggle(item.key)}
                  className={`relative inline-block w-12 h-6 rounded-full transition-colors cursor-pointer ${
                    settings[item.key] ? 'bg-primary' : 'bg-surface-container-high'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                      settings[item.key] ? 'right-1' : 'left-1'
                    }`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy & Security */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Privacy */}
          <section className="bg-surface-container-lowest rounded-xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-lg bg-tertiary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-tertiary">visibility</span>
              </div>
              <h2 className="text-lg font-headline font-bold text-on-surface">Quyền riêng tư hồ sơ</h2>
            </div>

            <div className="space-y-4">
              {[
                { value: 'public', label: 'Chế độ công khai', desc: 'Nhà tuyển dụng có thể tìm thấy bạn' },
                { value: 'private', label: 'Chế độ ẩn danh', desc: 'Chỉ những công ty bạn ứng tuyển' },
              ].map(option => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-colors ${
                    settings.profileVisibility === option.value
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'border-2 border-transparent hover:bg-surface-container'
                  }`}
                >
                  <input
                    type="radio"
                    name="profileVisibility"
                    value={option.value}
                    checked={settings.profileVisibility === option.value}
                    onChange={handleChange}
                    className="mt-1 text-primary focus:ring-primary"
                  />
                  <div>
                    <p className="font-bold text-sm text-on-surface">{option.label}</p>
                    <p className="text-xs text-on-surface-variant">{option.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Password Change */}
          <section className="bg-surface-container-lowest rounded-xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-lg bg-secondary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary">lock</span>
              </div>
              <h2 className="text-lg font-headline font-bold text-on-surface">Đổi mật khẩu</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={settings.currentPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-surface-container-low border-none rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Mật khẩu mới</label>
                <input
                  type="password"
                  name="newPassword"
                  value={settings.newPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-surface-container-low border-none rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={settings.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-surface-container-low border-none rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <button
                onClick={handlePasswordChange}
                className="w-full py-2 text-sm font-bold text-white bg-gradient-to-br from-[#00488d] to-[#0066cc] hover:shadow-lg rounded-lg transition-all"
              >
                Cập nhật mật khẩu
              </button>
            </div>
          </section>
        </div>

        {/* Account Connections */}
        <section className="bg-surface-container-lowest rounded-xl p-8">
          <h2 className="text-xl font-headline font-bold text-on-surface mb-6">Liên kết tài khoản</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Google', icon: 'G', color: 'text-blue-600', connected: true },
              { name: 'Facebook', icon: 'f', color: 'text-white', bgColor: 'bg-blue-600', connected: false },
              { name: 'LinkedIn', icon: 'in', color: 'text-white', bgColor: 'bg-blue-700', connected: false },
            ].map(account => (
              <div
                key={account.name}
                className={`flex items-center justify-between p-4 rounded-xl ${
                  account.connected
                    ? 'bg-surface-container'
                    : 'bg-surface-container-low hover:bg-surface-container cursor-pointer transition-colors'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded flex items-center justify-center font-black text-xs ${
                    account.bgColor ? account.bgColor : 'bg-white border border-outline-variant'
                  } ${account.color}`}>
                    {account.icon}
                  </div>
                  <span className="text-sm font-medium">{account.name}</span>
                </div>
                {account.connected && (
                  <span className="text-xs text-primary font-bold">Đã kết nối</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Logout */}
        <div className="flex gap-4">
          <button
            onClick={handleLogout}
            className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-all"
          >
            <span className="material-symbols-outlined text-sm inline-block mr-2">logout</span>
            Đăng xuất
          </button>
          <button className="flex-1 border-2 border-red-600 text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-red-50 transition-all">
            <span className="material-symbols-outlined text-sm inline-block mr-2">delete</span>
            Xóa tài khoản
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
