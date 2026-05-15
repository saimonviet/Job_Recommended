import React, { useEffect, useRef, useState } from 'react';
import api from '../../services/api';

const provinces_list = [
  'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu',
  'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước',
  'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông',
  'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang',
  'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang', 'Hòa Bình',
  'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu',
  'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định',
  'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Quảng Bình',
  'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị', 'Sóc Trăng',
  'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên', 'Thanh Hóa',
  'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang', 'Vĩnh Long',
  'Vĩnh Phúc', 'Yên Bái', 'Phú Yên'
];

const PersonalInfo = () => {
  const [user] = useState(JSON.parse(localStorage.getItem('user')) || { name: 'Nguyễn Văn A' });
  const fileInputRef = useRef(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [formData, setFormData] = useState({
    phone: '',
    workplace_desired: '',
    desired_job: '',
    desired_salary: '',
    target: '',
    age: '',
    gender: '',
    marriage: '',
    degree: '',
    industry: '',
    experience: '',
    skills: '',
    exp_min: '',
    exp_max: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('https://api.dicebear.com/7.x/avataaars/svg?seed=Felix');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.request('/seeker/profile');
        setFormData((prev) => ({
          ...prev,
          phone: data.phone || prev.phone || '',
          workplace_desired: data.workplace_desired || data.location || prev.workplace_desired || '',
          desired_job: data.desired_job || data.position || prev.desired_job || '',
          desired_salary: data.desired_salary || prev.desired_salary || '',
          target: data.target || data.bio || prev.target || '',
          age: data.age || prev.age || '',
          gender: data.gender || prev.gender || '',
          marriage: data.marriage || prev.marriage || '',
          degree: data.degree || prev.degree || '',
          industry: data.industry || prev.industry || '',
          experience: data.experience || prev.experience || '',
          skills: data.skills || prev.skills || '',
          exp_min: data.exp_min || prev.exp_min || '',
          exp_max: data.exp_max || prev.exp_max || '',
        }));
        if (data.avatar_path) {
          setAvatarPreview(`http://127.0.0.1:5000${data.avatar_path}`);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  };

  const handleSave = async () => {
    const data = new FormData();
    
    Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
    });

    if (avatarFile) {
        data.append('avatar', avatarFile);
    }

    try {
        await api.request('/seeker/profile', {
            method: 'POST',
            body: data,
            headers: {
                'Content-Type': null, // Let browser set content type for FormData
            },
        });
        setIsEditing(false);
        alert('Lưu thông tin thành công!');
    } catch (error) {
        console.error('Failed to save profile:', error);
        alert('Lưu thông tin thất bại.');
    }
  };

  return (
    <div className="p-12 max-w-4xl">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight text-on-surface mb-2">Thông tin cá nhân</h1>
          <p className="text-on-surface-variant text-lg">Cập nhật hồ sơ của bạn để tăng cơ hội nhận được lời đề nghị từ nhà tuyển dụng.</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-3 py-1 bg-[#00488d] text-white rounded-lg font-semibold hover:shadow-lg transition-all text-sm"
          >
            Chỉnh sửa
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Avatar Section */}
        <div className="md:col-span-1">
          <div className="bg-surface-container-lowest p-8 rounded-xl text-center">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-[#f2f3fb] dark:bg-[#2e3036] overflow-hidden ring-4 ring-primary/10">
              <img
                alt="User Avatar"
                className="w-full h-full object-cover"
                src={avatarPreview}
              />
            </div>
            {isEditing && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="w-full flex items-center justify-center gap-2 bg-surface-container-high text-on-surface px-4 py-2 rounded-lg font-semibold hover:bg-surface-variant transition-colors mb-4"
                >
                  <span className="material-symbols-outlined text-sm leading-none">upload</span>
                  <span>Đổi ảnh</span>
                </button>
              </>
            )}
            <p className="text-sm text-on-surface-variant">Ảnh đại diện giúp nhà tuyển dụng nhận biết bạn tốt hơn</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-surface-container-lowest p-8 rounded-xl space-y-6">
            {/* Display user's name & email (read-only, stored in User) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">Họ và tên</label>
                <p className="text-on-surface font-semibold">{user.username}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">Email</label>
                <p className="text-on-surface font-semibold">{user.email}</p>
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
                  <select
                    name="workplace_desired"
                    value={formData.workplace_desired}
                    onChange={handleChange}
                    className="w-full bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  >
                    <option value="">Chọn tỉnh/thành phố</option>
                    {provinces_list.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-on-surface font-semibold">{formData.workplace_desired}</p>
                )}
              </div>
            </div>

            {/* Desired job & Skills (model fields) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">Chức vụ mong muốn</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="desired_job"
                    value={formData.desired_job}
                    onChange={handleChange}
                    className="w-full bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                ) : (
                  <p className="text-on-surface font-semibold">{formData.desired_job}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">Ngành nghề</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className="w-full bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                ) : (
                  <p className="text-on-surface font-semibold">{formData.industry}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">


              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">Mức lương mong muốn</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="desired_salary"
                    value={formData.desired_salary}
                    onChange={handleChange}
                    className="w-full bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                ) : (
                  <p className="text-on-surface font-semibold">{formData.desired_salary}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">Kỹ năng</label>
                {isEditing ? (
                  <textarea
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    rows="3"
                    className="w-full bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                  />
                ) : (
                  <p className="text-on-surface">{formData.skills}</p>
                )}
              </div>

            </div>

            {/* Age / Gender / Marriage / Degree */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">Tuổi</label>
                {isEditing ? (
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    min="0"
                    className="w-full bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                ) : (
                  <p className="text-on-surface">{formData.age}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">Giới tính</label>
                {isEditing ? (
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                ) : (
                  <p className="text-on-surface">{formData.gender}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">Tình trạng</label>
                {isEditing ? (
                  <select
                    name="marriage"
                    value={formData.marriage}
                    onChange={handleChange}
                    className="w-full bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  >
                    <option value="Độc thân">Độc thân</option>
                    <option value="Đã kết hôn">Đã kết hôn</option>
                    <option value="Khác">Khác</option>
                  </select>
                ) : (
                  <p className="text-on-surface">{formData.marriage}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">Bằng cấp</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="degree"
                    value={formData.degree}
                    onChange={handleChange}
                    className="w-full bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                ) : (
                  <p className="text-on-surface">{formData.degree}</p>
                )}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">Giới thiệu bản thân</label>
              {isEditing ? (
                <textarea
                  name="target"
                  value={formData.target}
                  onChange={handleChange}
                  rows="4"
                  className="w-full bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                />
              ) : (
                <p className="text-on-surface">{formData.target}</p>
              )}
            </div>

            {/* Save Button */}
            {isEditing && (
              <div className="flex gap-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg font-semibold hover:bg-surface-variant transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 bg-gradient-to-br from-[#00488d] to-[#0066cc] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Lưu thay đổi
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfo;
