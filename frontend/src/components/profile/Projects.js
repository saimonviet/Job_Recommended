import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await api.request('/seeker/profile');
        if (data.target) {
          setProjects(JSON.parse(data.target));
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      }
    };

    fetchProjects();
  }, []);

  const handleSave = async (updatedProjects) => {
    try {
      await api.request('/seeker/profile', {
        method: 'POST',
        body: JSON.stringify({ target: JSON.stringify(updatedProjects) }),
      });
    } catch (error) {
      console.error('Failed to save projects:', error);
      alert('Lưu thông tin thất bại.');
    }
  };

  const handleDeleteProject = (id) => {
    const updatedProjects = projects.filter(p => p.id !== id);
    setProjects(updatedProjects);
    handleSave(updatedProjects);
  };

  return (
    <div className="p-12 max-w-6xl">
      <header className="mb-12 flex justify-between items-end">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-extrabold tracking-tight text-on-surface mb-2">Danh mục dự án</h1>
          <p className="text-on-surface-variant text-lg">Khám phá các thành tựu kiến trúc và giải pháp kỹ thuật đã thực hiện.</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center justify-center gap-2 bg-[#00488d] text-white px-6 py-3 rounded-md font-medium hover:shadow-lg transition-all"
        >
          <span className="material-symbols-outlined text-xl">{isEditing ? 'close' : 'add'}</span>
          <span>{isEditing ? 'Hủy' : 'Thêm dự án mới'}</span>
        </button>
      </header>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {projects.map((project) => (
          <article
            key={project.id}
            className={`bg-surface-container-lowest rounded-xl overflow-hidden hover:shadow-[0_20px_40px_rgba(25,28,33,0.06)] transition-all flex flex-col group ${
              project.featured ? 'md:col-span-2' : ''
            }`}
          >
            {/* Image */}
            <div className={`overflow-hidden relative ${project.featured ? 'aspect-video' : 'aspect-video'}`}>
              <img
                alt={project.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                src={project.image}
              />
              {isEditing && (
                <button
                  onClick={() => handleDeleteProject(project.id)}
                  className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col flex-grow">
              <div className="flex justify-between items-start mb-4">
                {project.featured && (
                  <span className="bg-tertiary-fixed-dim text-on-tertiary-fixed text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                    Dự án Tiêu biểu
                  </span>
                )}
                <span className="text-primary font-semibold text-sm ml-auto">{project.year}</span>
              </div>

              <h2 className="font-headline text-xl font-bold text-on-surface mb-2">{project.title}</h2>
              <p className="text-on-surface-variant text-sm mb-6">{project.description}</p>

              <div className="pt-4 border-t border-outline-variant/10 flex justify-between items-center mt-auto">
                <span className="text-xs font-bold text-on-surface-variant uppercase">Vai trò chính</span>
                <span className="text-primary text-sm font-medium">{project.role}</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Add Project Form */}
      {isEditing && (
        <div className="mt-8 bg-surface-container-lowest rounded-xl p-8 border-2 border-dashed border-outline-variant/30">
          <h3 className="text-2xl font-bold text-on-surface mb-6">Thêm dự án mới</h3>

          <div className="space-y-4 mb-6">
            <input
              type="text"
              placeholder="Tên dự án"
              className="w-full bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
            <textarea
              placeholder="Mô tả dự án"
              rows="3"
              className="w-full bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Năm bắt đầu - Năm kết thúc"
                className="bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
              <input
                type="text"
                placeholder="Vai trò của bạn"
                className="bg-surface-container-low border-2 border-outline-variant/20 rounded-lg px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <button className="w-full bg-gradient-to-br from-[#00488d] to-[#0066cc] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
              <span className="material-symbols-outlined text-sm inline-block mr-2">upload</span>
              Tải lên ảnh dự án
            </button>
          </div>

          <button className="w-full bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
            Lưu dự án
          </button>
        </div>
      )}
    </div>
  );
};

export default Projects;
