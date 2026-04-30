import React, { useState } from 'react';

const Experience = () => {
  const [experiences, setExperiences] = useState([
    {
      id: 1,
      company: 'FPT Software',
      position: 'Senior Architect',
      startDate: '2020',
      endDate: 'Hiện tại',
      description: 'Thiết kế và quản lý các dự án kiến trúc quy mô lớn, đạt 50,000m² diện tích xây dựng.',
      skills: ['BIM', 'Revit', 'CAD'],
    },
    {
      id: 2,
      company: 'VNG Corporation',
      position: 'Architect',
      startDate: '2018',
      endDate: '2020',
      description: 'Phát triển các giải pháp kiến trúc bền vững cho các dự án thương mại.',
      skills: ['Sustainability', 'Design', 'Planning'],
    },
  ]);
  const [isEditing, setIsEditing] = useState(false);
  const [newExp, setNewExp] = useState({
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    description: '',
    skills: [],
  });

  const handleAddExperience = () => {
    if (newExp.company && newExp.position) {
      setExperiences([...experiences, { ...newExp, id: Date.now() }]);
      setNewExp({
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        description: '',
        skills: [],
      });
    }
  };

  const handleDeleteExperience = (id) => {
    setExperiences(experiences.filter(exp => exp.id !== id));
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
          className="flex items-center gap-2 px-6 py-3 bg-[#00488d] text-white rounded-lg font-semibold hover:shadow-lg transition-all"
        >
          <span className="material-symbols-outlined text-xl">{isEditing ? 'close' : 'edit'}</span>
          {isEditing ? 'Hủy' : 'Chỉnh sửa'}
        </button>
      </header>

      <div className="space-y-6">
        {/* Experience List */}
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
              {exp.startDate} - {exp.endDate}
            </p>

            <p className="text-on-surface mb-6">{exp.description}</p>

            {exp.skills && exp.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {exp.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-primary-fixed text-primary px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Add New Experience */}
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
                  type="text"
                  value={newExp.startDate}
                  onChange={(e) => setNewExp({ ...newExp, startDate: e.target.value })}
                  className="w-full bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10"
                  placeholder="2020"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2">Đến năm</label>
                <input
                  type="text"
                  value={newExp.endDate}
                  onChange={(e) => setNewExp({ ...newExp, endDate: e.target.value })}
                  className="w-full bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10"
                  placeholder="Hiện tại"
                />
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

            <button
              onClick={handleAddExperience}
              className="w-full bg-gradient-to-br from-[#00488d] to-[#0066cc] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              <span className="material-symbols-outlined text-sm inline-block mr-2">add</span>
              Thêm kinh nghiệm
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Experience;
