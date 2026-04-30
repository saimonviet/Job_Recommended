import React, { useState } from 'react';

const PersonalInfo = () => {
  const [user] = useState(JSON.parse(localStorage.getItem('user')) || { name: 'Nguyễn Văn A' });
  const [formData, setFormData] = useState({
    fullName: user.name || 'Nguyễn Văn A',
    email: user.email || 'nguyenvana@email.com',
    phone: '0123456789',
    location: 'TP. Hồ Chí Minh',
    bio: 'Kiến trúc sư có 10 năm kinh nghiệm',
    company: 'FPT Software',
    position: 'Senior Architect',
  });
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    localStorage.setItem('user', JSON.stringify(formData));
    setIsEditing(false);
  };

  return (
    <div className="p-12 max-w-4xl">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight text-on-surface mb-2">Thông tin cá nhân</h1>
          <p className="text-on-surface-variant text-lg">Cập nhật hồ sơ của bạn để tăng cơ hội nhận được lời đề nghị từ nhà tuyển dụng.</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 px-6 py-3 bg-[#00488d] text-white rounded-lg font-semibold hover:shadow-lg transition-all"
        >
          <span className="material-symbols-outlined text-xl">{isEditing ? 'close' : 'edit'}</span>
          {isEditing ? 'Hủy' : 'Chỉnh sửa'}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Avatar Section */}
        <div className="md:col-span-1">
          <div className="bg-surface-container-lowest p-8 rounded-xl text-center">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-[#f2f3fb] dark:bg-[#2e3036] overflow-hidden ring-4 ring-primary/10">
              <img
                alt="User Avatar"
                className="w-full h-full object-cover"
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
              />
            </div>
            {isEditing && (
              <button className="w-full bg-surface-container-high text-on-surface px-4 py-2 rounded-lg font-semibold hover:bg-surface-variant transition-colors mb-4">
                <span className="material-symbols-outlined text-sm">upload</span> Đổi ảnh
              </button>
            )}
            <p className="text-sm text-on-surface-variant">Ảnh đại diện giúp nhà tuyển dụng nhận biết bạn tốt hơn</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-surface-container-lowest p-8 rounded-xl space-y-6">
            {/* Full Name & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">Họ và tên</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                ) : (
                  <p className="text-on-surface font-semibold">{formData.fullName}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                ) : (
                  <p className="text-on-surface font-semibold">{formData.email}</p>
                )}
              </div>
            </div>

            {/* Phone & Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">Điện thoại</label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                ) : (
                  <p className="text-on-surface font-semibold">{formData.phone}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">Địa điểm</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                ) : (
                  <p className="text-on-surface font-semibold">{formData.location}</p>
                )}
              </div>
            </div>

            {/* Company & Position */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">Công ty hiện tại</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                ) : (
                  <p className="text-on-surface font-semibold">{formData.company}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">Chức vụ</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    className="w-full bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                ) : (
                  <p className="text-on-surface font-semibold">{formData.position}</p>
                )}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">Giới thiệu bản thân</label>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="4"
                  className="w-full bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                />
              ) : (
                <p className="text-on-surface">{formData.bio}</p>
              )}
            </div>

            {/* Save Button */}
            {isEditing && (
              <button
                onClick={handleSave}
                className="w-full bg-gradient-to-br from-[#00488d] to-[#0066cc] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Lưu thay đổi
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfo;
