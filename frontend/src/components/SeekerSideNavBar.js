import React from 'react';
import { useNavigate } from 'react-router-dom';

const SideNavBar = ({ activeTab = 'personal' }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'User' };

  const menuItems = [
    { id: 'personal', label: 'Thông tin cá nhân', icon: 'person' },
    { id: 'experience', label: 'Kinh nghiệm làm việc', icon: 'work' },
    // { id: 'projects', label: 'Dự án', icon: 'folder_special' },
    { id: 'settings', label: 'Cài đặt', icon: 'settings' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 pt-20 bg-[#ffffff] dark:bg-[#191c21] shadow-[20px_0_40px_rgba(25,28,33,0.04)] flex flex-col font-inter text-sm font-medium z-40">

      {/* Navigation */}
      <nav className="flex flex-col gap-2 py-6 pr-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(`/seeker/profile/${item.id}`)}
            className={`p-3 pl-6 flex items-center gap-3 transition-transform hover:translate-x-1 rounded-r-full mr-4 ${
              activeTab === item.id
                ? 'bg-[#00488d] text-white shadow-sm'
                : 'text-[#5d5e66] hover:bg-[#ecedf6] dark:hover:bg-slate-800'
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default SideNavBar;