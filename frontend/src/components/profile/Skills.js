import React, { useState } from 'react';

const Skills = () => {
  const [skillsData, setSkillsData] = useState({
    hardSkills: [
      { name: 'Thiết kế BIM/Revit', level: 'Chuyên gia', score: 88 },
      { name: 'Quy hoạch đô thị', level: 'Nâng cao', score: 85 },
      { name: 'CAD', level: 'Chuyên gia', score: 90 },
    ],
    softSkills: [
      { name: 'Quản lý dự án', level: 'Chuyên gia', score: 82 },
      { name: 'Giao tiếp', level: 'Nâng cao', score: 78 },
      { name: 'Lãnh đạo', level: 'Nâng cao', score: 75 },
    ],
  });

  const [isEditing, setIsEditing] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', level: 'Nâng cao', category: 'hardSkills' });

  const handleAddSkill = () => {
    if (newSkill.name) {
      setSkillsData({
        ...skillsData,
        [newSkill.category]: [
          ...skillsData[newSkill.category],
          { ...newSkill, score: 75 },
        ],
      });
      setNewSkill({ name: '', level: 'Nâng cao', category: 'hardSkills' });
    }
  };

  const handleDeleteSkill = (category, index) => {
    setSkillsData({
      ...skillsData,
      [category]: skillsData[category].filter((_, i) => i !== index),
    });
  };

  const renderSkillBars = (score) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, idx) => (
          <div
            key={idx}
            className={`h-1 flex-1 rounded-full ${
              idx < Math.ceil((score / 100) * 5) ? 'bg-primary' : 'bg-primary/20'
            }`}
          ></div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-12 max-w-4xl">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight text-on-surface mb-2">Bản đồ Năng lực</h1>
          <p className="text-on-surface-variant text-lg">Phân tích chuyên sâu về kỹ năng hiện tại của bạn.</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 px-6 py-3 bg-[#00488d] text-white rounded-lg font-semibold hover:shadow-lg transition-all"
        >
          <span className="material-symbols-outlined text-xl">{isEditing ? 'close' : 'edit'}</span>
          {isEditing ? 'Hủy' : 'Chỉnh sửa'}
        </button>
      </header>

      <div className="space-y-8">
        {/* Hard Skills */}
        <section className="bg-surface-container-lowest rounded-xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">architecture</span>
            </div>
            <h2 className="text-2xl font-bold text-on-surface">Kỹ năng Chuyên môn</h2>
          </div>

          <div className="space-y-4">
            {skillsData.hardSkills.map((skill, idx) => (
              <div key={idx} className="p-4 bg-surface-container-lowest rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-on-surface">{skill.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-on-surface-variant">{skill.level}</span>
                    {isEditing && (
                      <button
                        onClick={() => handleDeleteSkill('hardSkills', idx)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    )}
                  </div>
                </div>
                {renderSkillBars(skill.score)}
              </div>
            ))}
          </div>

          {isEditing && (
            <div className="mt-4 p-4 border-2 border-dashed border-outline-variant/30 rounded-lg">
              <input
                type="text"
                value={newSkill.category === 'hardSkills' ? newSkill.name : ''}
                onChange={(e) =>
                  newSkill.category === 'hardSkills' && setNewSkill({ ...newSkill, name: e.target.value })
                }
                placeholder="Thêm kỹ năng mới"
                className="w-full bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-4 py-2 mb-2 focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
              <button
                onClick={() => {
                  setNewSkill({ ...newSkill, category: 'hardSkills' });
                  handleAddSkill();
                }}
                className="w-full bg-gradient-to-br from-[#00488d] to-[#0066cc] text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all text-sm"
              >
                Thêm
              </button>
            </div>
          )}
        </section>

        {/* Soft Skills */}
        <section className="bg-surface-container-lowest rounded-xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-lg bg-secondary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary">psychology</span>
            </div>
            <h2 className="text-2xl font-bold text-on-surface">Kỹ năng Mềm</h2>
          </div>

          <div className="space-y-4">
            {skillsData.softSkills.map((skill, idx) => (
              <div key={idx} className="p-4 bg-surface-container-lowest rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-on-surface">{skill.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-on-surface-variant">{skill.level}</span>
                    {isEditing && (
                      <button
                        onClick={() => handleDeleteSkill('softSkills', idx)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    )}
                  </div>
                </div>
                {renderSkillBars(skill.score)}
              </div>
            ))}
          </div>

          {isEditing && (
            <div className="mt-4 p-4 border-2 border-dashed border-outline-variant/30 rounded-lg">
              <input
                type="text"
                placeholder="Thêm kỹ năng mềm"
                className="w-full bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-4 py-2 mb-2 focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
              <button
                className="w-full bg-gradient-to-br from-[#00488d] to-[#0066cc] text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all text-sm"
              >
                Thêm
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Skills;
