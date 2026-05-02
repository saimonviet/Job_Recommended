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
      {/* User Info */}
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#f2f3fb] dark:bg-[#2e3036] overflow-hidden flex items-center justify-center">
            <img
              alt="User Profile Avatar"
              className="w-full h-full object-cover"
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
            />
          </div>
          <div>
            <p className="font-bold text-[#00488d] dark:text-[#005fb8] leading-none">{user.name}</p>
            <p className="text-xs text-[#5d5e66] mt-1">Tài khoản cá nhân</p>
          </div>
        </div>
      </div>

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
