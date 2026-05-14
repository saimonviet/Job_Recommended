import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const Experience = () => {
  const [experiences, setExperiences] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newExp, setNewExp] = useState({
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    description: '',
    skills: [],
  });

  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        const data = await api.request('/seeker/profile');
        if (data.skills) {
          setExperiences(JSON.parse(data.skills));
        }
      } catch (error) {
        console.error('Failed to fetch experiences:', error);
      }
    };

    fetchExperiences();
  }, []);

  const handleSave = async (updatedExperiences) => {
    try {
      await api.request('/seeker/profile', {
        method: 'POST',
        body: JSON.stringify({ skills: JSON.stringify(updatedExperiences) }),
      });
    } catch (error) {
      console.error('Failed to save experiences:', error);
      alert('Lưu thông tin thất bại.');
    }
  };

  const handleAddExperience = () => {
    if (!newExp.company || !newExp.position) return;

    const newExperience = { ...newExp, id: Date.now() };
    const updatedExperiences = [...experiences, newExperience];
    setExperiences(updatedExperiences);
    handleSave(updatedExperiences);
    setNewExp({
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      description: '',
      skills: [],
    });
  };

  const handleDeleteExperience = (id) => {
    const updatedExperiences = experiences.filter((exp) => exp.id !== id);
    setExperiences(updatedExperiences);
    handleSave(updatedExperiences);
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Hiện tại') return dateString;
    const parts = dateString.split('-');
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="p-12 max-w-4xl">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight text-on-surface mb-2">Kinh nghiệm làm việc</h1>
          <p className="text-on-surface-variant text-lg">Hãy chia sẻ quá trình sự nghiệp của bạn để công ty hiểu rõ hơn về năng lực.</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 px-3 py-1 bg-[#00488d] text-white rounded-lg font-semibold hover:shadow-lg transition-all text-sm"
        >
          <span className="material-symbols-outlined text-xl">{isEditing ? 'close' : 'edit'}</span>
          {isEditing ? 'Hủy' : 'Chỉnh sửa'}
        </button>
      </header>

      <div className="space-y-6">
        {experiences.map((exp) => (
          <div key={exp.id} className="bg-surface-container-lowest p-8 rounded-xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold text-on-surface">{exp.position}</h3>
                <p className="text-on-surface-variant font-medium">{exp.company}</p>
              </div>
              {isEditing && (
                <button
                  onClick={() => handleDeleteExperience(exp.id)}
                  className="text-red-600 hover:bg-red-50 p-2 rounded transition-colors"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              )}
            </div>

            <p className="text-sm text-on-surface-variant mb-4">
              {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
            </p>

            <p className="text-on-surface mb-6">{exp.description}</p>

            {exp.skills && exp.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {exp.skills.map((skill, idx) => (
                  <span key={idx} className="bg-primary-fixed text-primary px-3 py-1 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {isEditing && (
          <div className="bg-surface-container-lowest p-8 rounded-xl border-2 border-dashed border-outline-variant/30">
            <h3 className="text-xl font-bold text-on-surface mb-6">Thêm kinh nghiệm mới</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2">Công ty</label>
                <input
                  type="text"
                  value={newExp.company}
                  onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                  className="w-full bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10"
                  placeholder="Tên công ty"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2">Chức vụ</label>
                <input
                  type="text"
                  value={newExp.position}
                  onChange={(e) => setNewExp({ ...newExp, position: e.target.value })}
                  className="w-full bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10"
                  placeholder="Chức vụ của bạn"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2">Từ năm</label>
                <input
                  type="date"
                  value={newExp.startDate || ''}
                  onChange={(e) => setNewExp({ ...newExp, startDate: e.target.value })}
                  className="w-full bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2">Đến năm</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newExp.endDate && newExp.endDate !== 'Hiện tại' ? newExp.endDate : ''}
                    onChange={(e) => setNewExp({ ...newExp, endDate: e.target.value })}
                    className="flex-1 bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                  <label className="flex items-center gap-2 px-4 py-2 bg-surface-container-low border-2 border-outline-variant/20 rounded-lg cursor-pointer hover:bg-surface-variant transition-colors">
                    <input
                      type="checkbox"
                      checked={newExp.endDate === 'Hiện tại'}
                      onChange={(e) => setNewExp({ ...newExp, endDate: e.target.checked ? 'Hiện tại' : '' })}
                      className="w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-on-surface-variant whitespace-nowrap">Hiện tại</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-on-surface-variant mb-2">Mô tả công việc</label>
              <textarea
                value={newExp.description}
                onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                rows="3"
                className="w-full bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none"
                placeholder="Mô tả về công việc và thành tích"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-on-surface-variant mb-2">Kỹ năng</label>
              <div className="space-y-2">
                {newExp.skills && newExp.skills.map((skill, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={skill}
                      onChange={(e) => {
                        const updatedSkills = [...newExp.skills];
                        updatedSkills[idx] = e.target.value;
                        setNewExp({ ...newExp, skills: updatedSkills });
                      }}
                      className="flex-1 bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10"
                      placeholder="Nhập kỹ năng"
                    />
                    <button
                      onClick={() => {
                        const updatedSkills = newExp.skills.filter((_, i) => i !== idx);
                        setNewExp({ ...newExp, skills: updatedSkills });
                      }}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setNewExp({ ...newExp, skills: [...newExp.skills, ''] })}
                  className="w-full px-4 py-2 bg-surface-container-high text-on-surface rounded-lg font-semibold hover:bg-surface-variant transition-colors text-sm"
                >
                  + Thêm kỹ năng
                </button>
              </div>
            </div>

            <button
              onClick={handleAddExperience}
              className="w-full bg-gradient-to-br from-[#00488d] to-[#0066cc] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Thêm kinh nghiệm
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Experience;
