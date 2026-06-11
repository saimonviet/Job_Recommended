import React, { useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { PROVINCES_LIST } from '../../constants/dropdownOptions';

/* ── Reusable field components ── */
const FieldLabel = ({ children }) => (
  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{children}</p>
);

const FieldValue = ({ children, placeholder = '—' }) => (
  <p className="text-sm font-medium text-gray-800">{children || <span className="text-gray-300">{placeholder}</span>}</p>
);

const InputField = ({ type = 'text', name, value, onChange, placeholder, min }) => (
  <input
    type={type}
    name={name}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    min={min}
    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#00488d] focus:ring-2 focus:ring-[#00488d]/10 outline-none transition-all"
  />
);

const SelectField = ({ name, value, onChange, children }) => (
  <select
    name={name}
    value={value}
    onChange={onChange}
    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#00488d] focus:ring-2 focus:ring-[#00488d]/10 outline-none transition-all appearance-none"
  >
    {children}
  </select>
);

/* ── Section card wrapper ── */
const Section = ({ icon, title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-50 bg-gray-50/50">
      <span className="material-symbols-outlined text-[18px] text-[#00488d]">{icon}</span>
      <h2 className="text-xs font-bold uppercase tracking-widest text-[#00488d]">{title}</h2>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

/* ── Grid row helper ── */
const Row = ({ children, cols = 2 }) => (
  <div className={`grid grid-cols-1 ${cols === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-x-6 gap-y-4`}>
    {children}
  </div>
);

/* ══════════════════════════════════════════════ */

const PersonalInfo = () => {
  const [user] = useState(JSON.parse(localStorage.getItem('user')) || { name: 'Nguyễn Văn A' });
  const fileInputRef = useRef(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('https://api.dicebear.com/10.x/glyphs/svg?seed=Luna');
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    if (avatarFile) data.append('avatar', avatarFile);
    try {
      await api.request('/seeker/profile', {
        method: 'POST',
        body: data,
        headers: { 'Content-Type': null },
      });
      // Refresh recommendations immediately so home shows updated suggestions
      try {
        await api.request('/seeker/recommendations');
      } catch (err) {
        console.warn('Failed to refresh recommendations after profile save', err);
      }
      setIsEditing(false);
      alert('Lưu thông tin thành công!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Lưu thông tin thất bại.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-2 md:px-5">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-semibold tracking-widest text-[#00488d] uppercase mb-1">Hồ sơ cá nhân</p>
            <p className="text-lg text-gray-500 mt-1">Cập nhật hồ sơ để tăng cơ hội nhận được lời mời từ nhà tuyển dụng.</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#00488d] text-white hover:bg-[#003b76] shadow-md shadow-[#00488d]/20 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Chỉnh sửa
            </button>
          )}
        </div>

        {/* ── Avatar + Identity ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-5">
            {/* avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-[#00488d]/10 bg-gray-100">
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
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
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 w-7 h-7 bg-[#00488d] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#003b76] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                  </button>
                </>
              )}
            </div>

            {/* name + email */}
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-gray-900 truncate">{user.username || user.name}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
            </div>
          </div>
        </div>


        {/* ── Thông tin cá nhân ── */}
        <Section icon="person" title="Thông tin cá nhân">
          <Row cols={3}>
            <div>
              <FieldLabel>Điện thoại</FieldLabel>
              {isEditing ? (
                <InputField type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="0900 000 000" />
              ) : (
                <FieldValue>{formData.phone}</FieldValue>
              )}
            </div>
            <div>
              <FieldLabel>Địa điểm làm việc</FieldLabel>
              {isEditing ? (
                <SelectField name="workplace_desired" value={formData.workplace_desired} onChange={handleChange}>
                  <option value="">Chọn tỉnh/thành phố</option>
                  {PROVINCES_LIST.map((province) => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </SelectField>
              ) : (
                <FieldValue>{formData.workplace_desired}</FieldValue>
              )}
            </div>

            <div>
              <FieldLabel>Tuổi</FieldLabel>
              {isEditing ? (
                <InputField type="number" name="age" value={formData.age} onChange={handleChange} min="0" placeholder="VD: 25" />
              ) : (
                <FieldValue>{formData.age}</FieldValue>
              )}
            </div>
            <div>
              <FieldLabel>Giới tính</FieldLabel>
              {isEditing ? (
                <SelectField name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </SelectField>
              ) : (
                <FieldValue>{formData.gender}</FieldValue>
              )}
            </div>
            <div>
              <FieldLabel>Tình trạng hôn nhân</FieldLabel>
              {isEditing ? (
                <SelectField name="marriage" value={formData.marriage} onChange={handleChange}>
                  <option value="Độc thân">Độc thân</option>
                  <option value="Đã kết hôn">Đã kết hôn</option>
                  <option value="Khác">Khác</option>
                </SelectField>
              ) : (
                <FieldValue>{formData.marriage}</FieldValue>
              )}
            </div>
            <div>
              <FieldLabel>Bằng cấp</FieldLabel>
              {isEditing ? (
                <InputField name="degree" value={formData.degree} onChange={handleChange} placeholder="VD: Đại học, Cao đẳng..." />
              ) : (
                <FieldValue>{formData.degree}</FieldValue>
              )}
            </div>
          </Row>
        </Section>

        {/* ── Mục tiêu nghề nghiệp ── */}
        <Section icon="track_changes" title="Mục tiêu nghề nghiệp">
          <Row cols={3}>
            <div>
              <FieldLabel>Chức vụ mong muốn</FieldLabel>
              {isEditing ? (
                <InputField name="desired_job" value={formData.desired_job} onChange={handleChange} placeholder="Vị trí bạn muốn ứng tuyển" />
              ) : (
                <FieldValue>{formData.desired_job}</FieldValue>
              )}
            </div>
            <div>
              <FieldLabel>Ngành nghề</FieldLabel>
              {isEditing ? (
                <SelectField name="industry" value={formData.industry} onChange={handleChange}>
                  <option value="">Chọn ngành nghề</option>
                  {[
                    'Công nghệ thông tin', 'Tài chính - Kế toán', 'Kinh doanh - Bán hàng',
                    'Marketing - Truyền thông', 'Kỹ thuật - Sản xuất', 'Xây dựng - BĐS',
                    'Dịch vụ - F&B - Làm đẹp', 'Vận tải - Logistics', 'Y tế - Dược',
                    'Hành chính - Nhân sự', 'Giáo dục - Đào tạo', 'Lao động phổ thông',
                    'Nông - Lâm - Ngư nghiệp',
                  ].map((v) => <option key={v} value={v}>{v}</option>)}
                </SelectField>
              ) : (
                <FieldValue>{formData.industry}</FieldValue>
              )}
            </div>
            <div>
              <FieldLabel>Mức lương mong muốn</FieldLabel>
              {isEditing ? (
                <SelectField name="desired_salary" value={formData.desired_salary} onChange={handleChange}>
                  <option value="">Chọn khoảng lương</option>
                  {[
                    ['0-5', 'Dưới 5 triệu'], ['5-10', '5 – 10 triệu'], ['10-15', '10 – 15 triệu'],
                    ['15-20', '15 – 20 triệu'], ['20-30', '20 – 30 triệu'], ['30-50', '30 – 50 triệu'],
                    ['50+', 'Trên 50 triệu'],
                  ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </SelectField>
              ) : (
                <FieldValue>{formData.desired_salary || 'Thoả thuận'}</FieldValue>
              )}
            </div>
          </Row>
        </Section>

 

        {/* ── Giới thiệu bản thân ── */}
        <Section icon="description" title="Giới thiệu bản thân">
          {isEditing ? (
            <textarea
              name="target"
              value={formData.target}
              onChange={handleChange}
              rows="4"
              placeholder="Mô tả ngắn về bản thân, điểm mạnh và định hướng nghề nghiệp..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#00488d] focus:ring-2 focus:ring-[#00488d]/10 outline-none transition-all resize-none"
            />
          ) : (
            <p className="text-sm text-gray-700 leading-relaxed">
              {formData.target || <span className="text-gray-300">Chưa có giới thiệu bản thân.</span>}
            </p>
          )}
        </Section>

        {/* ── Action buttons ── */}
        {isEditing && (
          <div className="flex gap-3 pb-4">
            <button
              onClick={() => setIsEditing(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#00488d] hover:bg-[#003b76] shadow-md shadow-[#00488d]/20 active:scale-[0.99] transition-all"
            >
              Lưu thay đổi
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default PersonalInfo;