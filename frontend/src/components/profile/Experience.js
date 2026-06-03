import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const Experience = () => {
  const [experiences, setExperiences] = useState([]);
  const [skills, setSkills] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false); // Đổi tên cho rõ nghĩa: Form đang mở hay đóng
  const [editingId, setEditingId] = useState(null); // Lưu ID của kinh nghiệm đang sửa
  
  const initialExpState = {
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    description: '',
    skills: [],
  };
  const [newExp, setNewExp] = useState(initialExpState);

  // Tính toán chuỗi ngày hôm nay (YYYY-MM-DD) dùng cho thuộc tính max
  const todayObj = new Date();
  const maxDateStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.request('/seeker/profile');
        if (data.experience) {
          try {
            setExperiences(JSON.parse(data.experience));
          } catch {
            setExperiences([]);
          }
        }
        if (data.skills) {
          setSkills(data.skills);
        }
      } catch (error) {
        console.error('Failed to fetch experiences:', error);
      }
    };
    fetchData();
  }, []);

  const handleSaveToAPI = async (updatedExperiences) => {
    try {
      await api.request('/seeker/profile', {
        method: 'POST',
        body: JSON.stringify({ experience: JSON.stringify(updatedExperiences) }),
      });
    } catch (error) {
      console.error('Failed to save experiences:', error);
      alert('Lưu thông tin thất bại.');
    }
  };

  // --- HÀM MỚI: Xử lý khi bấm nút "Sửa" trên 1 thẻ kinh nghiệm ---
  const handleEditClick = (exp) => {
    setNewExp(exp);         // Đưa dữ liệu cũ vào form
    setEditingId(exp.id);   // Đánh dấu là đang sửa item này
    setIsFormOpen(true);    // Mở form lên
  };

  // --- HÀM MỚI: Hủy form ---
  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setNewExp(initialExpState);
  };

  // --- ĐÃ SỬA: Xử lý cả Thêm mới và Cập nhật ---
  const handleSaveExperience = () => {
    if (!newExp.company || !newExp.position) return;

    // Tính ngày hôm qua
    const yesterdayObj = new Date(todayObj);
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterdayStr = `${yesterdayObj.getFullYear()}-${String(yesterdayObj.getMonth() + 1).padStart(2, '0')}-${String(yesterdayObj.getDate()).padStart(2, '0')}`;

    // Xử lý mặc định nếu user để trống
    const finalStartDate = newExp.startDate || yesterdayStr;
    const finalEndDate = newExp.endDate || maxDateStr;

    const experienceData = { 
      ...newExp, 
      startDate: finalStartDate,
      endDate: finalEndDate,
      id: editingId || Date.now() // Dùng lại ID cũ nếu đang sửa, tạo mới nếu thêm
    };

    let updatedExperiences;
    if (editingId) {
      // Đang ở chế độ Sửa -> Cập nhật phần tử có ID tương ứng
      updatedExperiences = experiences.map(exp => exp.id === editingId ? experienceData : exp);
    } else {
      // Chế độ Thêm mới
      updatedExperiences = [...experiences, experienceData];
    }

    setExperiences(updatedExperiences);
    handleSaveToAPI(updatedExperiences);
    
    // Reset form
    setNewExp(initialExpState);
    setEditingId(null);
    setIsFormOpen(false); // Tự động đóng form sau khi lưu thành công
  };

  const handleDeleteExperience = (id) => {
    const updatedExperiences = experiences.filter((exp) => exp.id !== id);
    setExperiences(updatedExperiences);
    handleSaveToAPI(updatedExperiences);
    // Nếu đang sửa item này mà xóa nó đi thì đóng form
    if (editingId === id) {
      handleCancelForm();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Hiện tại') return dateString;
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-2 md:px-5">
      <div className="max-w-5xl mx-auto">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xl font-semibold tracking-widest text-[#00488d] uppercase mb-1">Hồ sơ cá nhân</p>
            <p className="text-lg text-gray-500 mt-1">Quá trình sự nghiệp giúp nhà tuyển dụng hiểu rõ năng lực của bạn.</p>
          </div>
          <button
            onClick={() => isFormOpen ? handleCancelForm() : setIsFormOpen(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${
              isFormOpen
                ? 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                : 'bg-[#00488d] text-white border-[#00488d] hover:bg-[#003b76] shadow-md shadow-[#00488d]/20'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{isFormOpen ? 'close' : 'add'}</span>
            {isFormOpen ? 'Hủy thao tác' : 'Thêm kinh nghiệm'}
          </button>
        </div>

        {/* ── Timeline List ── */}
        <div className="relative">
          {experiences.length > 0 && (
            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-[#00488d]/30 via-[#00488d]/10 to-transparent" />
          )}

          <div className="space-y-4">
            {experiences.map((exp) => (
              <div key={exp.id} className="relative flex gap-5 group">
                {/* dot */}
                <div className="relative z-10 mt-1 flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 border-[#00488d]/20 flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[18px] text-[#00488d]">work</span>
                </div>

                {/* card */}
                <div className={`flex-1 bg-white rounded-2xl border ${editingId === exp.id ? 'border-[#00488d] shadow-md' : 'border-gray-100 shadow-sm'} hover:shadow-md hover:border-[#00488d]/30 transition-all duration-200 p-5`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 leading-snug truncate">{exp.position}</h3>
                      <p className="text-sm text-[#00488d] font-medium mt-0.5">{exp.company}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400 whitespace-nowrap bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 mr-2">
                        {formatDate(exp.startDate)} — {formatDate(exp.endDate)}
                      </span>
                      
                      {/* NÚT SỬA */}
                      <button
                        onClick={() => handleEditClick(exp)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                        title="Sửa kinh nghiệm"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>

                      {/* NÚT XÓA */}
                      <button
                        onClick={() => handleDeleteExperience(exp.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Xóa kinh nghiệm"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {exp.description && (
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">{exp.description}</p>
                  )}

                  {exp.skills && exp.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {exp.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="text-xs font-medium px-2.5 py-1 rounded-lg bg-[#00488d]/8 text-[#00488d] border border-[#00488d]/10"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {experiences.length === 0 && !isFormOpen && (
              <div className="text-center py-16 text-gray-400">
                <span className="material-symbols-outlined text-4xl block mb-3 opacity-30">work_history</span>
                <p className="text-sm">Chưa có kinh nghiệm nào được thêm.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Add/Edit Experience Form ── */}
        {isFormOpen && (
          <div className="mt-6 bg-white rounded-2xl border border-dashed border-[#00488d]/30 shadow-sm overflow-hidden ring-4 ring-[#00488d]/5">

            <div className="p-6 space-y-5">
              {/* company + position */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Công ty" placeholder="Tên công ty">
                  <input
                    type="text"
                    value={newExp.company}
                    onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                    placeholder="Tên công ty"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#00488d] focus:ring-2 focus:ring-[#00488d]/10 outline-none transition-all"
                  />
                </FormField>
                <FormField label="Chức vụ">
                  <input
                    type="text"
                    value={newExp.position}
                    onChange={(e) => setNewExp({ ...newExp, position: e.target.value })}
                    placeholder="Vị trí của bạn"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#00488d] focus:ring-2 focus:ring-[#00488d]/10 outline-none transition-all"
                  />
                </FormField>
              </div>

              {/* dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Từ ngày">
                  <input
                    type="date"
                    max={maxDateStr}
                    value={newExp.startDate || ''}
                    onChange={(e) => setNewExp({ ...newExp, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#00488d] focus:ring-2 focus:ring-[#00488d]/10 outline-none transition-all"
                  />
                </FormField>
                <FormField label="Đến ngày">
                  <div className="flex gap-2">
                    <input
                      type="date"
                      max={maxDateStr}
                      value={newExp.endDate && newExp.endDate !== 'Hiện tại' ? newExp.endDate : ''}
                      onChange={(e) => setNewExp({ ...newExp, endDate: e.target.value })}
                      disabled={newExp.endDate === 'Hiện tại'}
                      className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#00488d] focus:ring-2 focus:ring-[#00488d]/10 outline-none transition-all disabled:opacity-40"
                    />
                  </div>
                </FormField>
              </div>

              {/* description */}
              <FormField label="Mô tả công việc">
                <textarea
                  value={newExp.description}
                  onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                  rows="3"
                  placeholder="Mô tả vai trò, trách nhiệm và thành tích nổi bật..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#00488d] focus:ring-2 focus:ring-[#00488d]/10 outline-none transition-all resize-none"
                />
              </FormField>

              {/* skills */}
              <FormField label="Kỹ năng liên quan">
                <div className="space-y-2">
                  {newExp.skills.map((skill, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={skill}
                        onChange={(e) => {
                          const updatedSkills = [...newExp.skills];
                          updatedSkills[idx] = e.target.value;
                          setNewExp({ ...newExp, skills: updatedSkills });
                        }}
                        placeholder="Nhập kỹ năng"
                        className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#00488d] focus:ring-2 focus:ring-[#00488d]/10 outline-none transition-all"
                      />
                      <button
                        onClick={() => setNewExp({ ...newExp, skills: newExp.skills.filter((_, i) => i !== idx) })}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setNewExp({ ...newExp, skills: [...newExp.skills, ''] })}
                    className="w-full py-2 text-xs font-semibold text-[#00488d] rounded-xl border border-dashed border-[#00488d]/25 hover:bg-[#00488d]/5 transition-colors"
                  >
                    + Thêm kỹ năng
                  </button>
                </div>
              </FormField>

              {/* submit */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCancelForm}
                  className="w-1/3 py-3 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleSaveExperience}
                  disabled={!newExp.company || !newExp.position}
                  className="w-2/3 py-3 bg-[#00488d] text-white text-sm font-semibold rounded-xl hover:bg-[#003b76] active:scale-[0.99] transition-all shadow-md shadow-[#00488d]/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {editingId ? 'Cập nhật' : 'Lưu kinh nghiệm'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

/* ── Helper ── */
const FormField = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>
    {children}
  </div>
);

const parseSkills = (skillsText) => {
  if (!skillsText) return [];
  return skillsText
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed && /^[A-Z\-]/.test(trimmed)) {
        return trimmed.replace(/^\-\s*/, '').trim();
      }
      return null;
    })
    .filter((skill) => skill !== null && skill.length > 0);
};

const handleSkillsSave = async (updatedSkills) => {
  try {
    await api.request('/seeker/profile', {
      method: 'POST',
      body: JSON.stringify({ skills: updatedSkills }),
    });
  } catch (error) {
    console.error('Failed to save skills:', error);
    alert('Lưu thông tin thất bại.');
  }
};

export default Experience;