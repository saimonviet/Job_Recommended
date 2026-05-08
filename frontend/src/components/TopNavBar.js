import React from 'react';
import { useNavigate } from 'react-router-dom';

const TopNavBar = ({ currentPage = 'home' }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'User' };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login-seeker');
  };

  return (
    <nav className="fixed top-0 z-50 w-full bg-[#f9f9ff]/80 dark:bg-[#191c21]/80 backdrop-blur-md shadow-sm">
      <div className="flex justify-between items-center px-8 py-4 max-w-full">
        {/* Logo */}
        <div
          className="text-xl font-bold text-[#00488d] dark:text-[#005fb8] font-manrope cursor-pointer"
          onClick={() => navigate('/seeker/home')}
        >
          Career Authority
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8 font-manrope tracking-tight font-bold">
          <a
            className={`pb-1 transition-all duration-200 ease-in-out ${
              currentPage === 'home'
                ? 'text-[#00488d] dark:text-[#005fb8] border-b-2 border-[#00488d]'
                : 'text-[#c2c6d4] hover:text-[#00488d]'
            }`}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/seeker/home');
            }}
          >
            Việc làm
          </a>
          <a
            className="text-[#c2c6d4] hover:text-[#00488d] transition-colors"
            href="#"
          >
            Ứng tuyển
          </a>
          <button
            type="button"
            className={`transition-colors ${
              currentPage === 'saved'
                ? 'text-[#00488d] dark:text-[#005fb8] border-b-2 border-[#00488d]'
                : 'text-[#c2c6d4] hover:text-[#00488d]'
            }`}
            onClick={() => navigate('/seeker/saved-jobs')}
          >
            Công việc đã lưu
          </button>
          <a
            className={`pb-1 transition-all duration-200 ease-in-out ${
              currentPage === 'profile'
                ? 'text-[#00488d] dark:text-[#005fb8] border-b-2 border-[#00488d]'
                : 'text-[#c2c6d4] hover:text-[#00488d]'
            }`}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/seeker/profile');
            }}
          >
            Hồ sơ
          </a>
        </div>

        {/* Trailing Actions */}
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-[#f2f3fb] dark:hover:bg-slate-800 rounded-md transition-all duration-200 ease-in-out">
            <span className="material-symbols-outlined text-slate-600">notifications</span>
          </button>

          {/* User Avatar Dropdown */}
          <div className="relative group">
            <div className="h-10 w-10 rounded-full bg-[#ecedf6] dark:bg-[#191c21] overflow-hidden ring-2 ring-primary/10 transition-all duration-200 ease-in-out cursor-pointer">
              <img
                alt="User Avatar"
                className="h-full w-full object-cover"
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
              />
            </div>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#2e3036] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="p-4 border-b border-outline-variant/20">
                <p className="font-bold text-sm">{user.username}</p>
                <p className="text-xs text-on-surface-variant">{user.email}</p>
              </div>
              <div className="p-2">
                <button
                  onClick={() => navigate('/seeker/profile')}
                  className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-[#f2f3fb] rounded transition-colors"
                >
                  Hồ sơ của tôi
                </button>
                <button
                  onClick={() => navigate('/seeker/settings')}
                  className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-[#f2f3fb] rounded transition-colors"
                >
                  Cài đặt
                </button>
                <hr className="my-2" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNavBar;
