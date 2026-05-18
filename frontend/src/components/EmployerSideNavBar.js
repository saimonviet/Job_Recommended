import React from "react";
import { Link, useLocation } from "react-router-dom";
import { clearEmployerAuth } from "../utils/authStorage";

function EmployerSideNavBar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    clearEmployerAuth();
    window.location.href = "/login-employer";
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 z-50 bg-white dark:bg-slate-900 flex flex-col p-4 gap-2 border-r border-slate-200 dark:border-slate-800">
      <div className="mb-8 px-4 py-2">
        <h1 className="text-blue-900 dark:text-white font-black text-xl">Career Authority</h1>
        <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">Quản trị tuyển dụng</p>
      </div>

      <nav className="flex-1 flex flex-col gap-2">
        <Link
          to="/employer/dashboard"
          className={`px-4 py-3 flex items-center gap-3 rounded-lg font-medium text-sm transition-all duration-300 ${
            isActive("/employer/dashboard")
              ? "bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-400 font-bold shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:translate-x-1 hover:text-blue-600 dark:hover:text-blue-300"
          }`}
        >
          <span className="material-symbols-outlined text-lg">dashboard</span>
          <span>Bảng điều khiển</span>
        </Link>

        <Link
          to="/employer/post"
          className={`px-4 py-3 flex items-center gap-3 rounded-lg font-medium text-sm transition-all duration-300 ${
            isActive("/employer/post")
              ? "bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-400 font-bold shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:translate-x-1 hover:text-blue-600 dark:hover:text-blue-300"
          }`}
        >
          <span className="material-symbols-outlined text-lg">add_box</span>
          <span>Đăng tin tuyển dụng</span>
        </Link>

        <Link
          to="/employer/jobs"
          className={`px-4 py-3 flex items-center gap-3 rounded-lg font-medium text-sm transition-all duration-300 ${
            isActive("/employer/jobs")
              ? "bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-400 font-bold shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:translate-x-1 hover:text-blue-600 dark:hover:text-blue-300"
          }`}
        >
          <span className="material-symbols-outlined text-lg">work</span>
          <span>Quản lý bài đăng</span>
        </Link>

        <Link
          to="/employer/candidates"
          className={`px-4 py-3 flex items-center gap-3 rounded-lg font-medium text-sm transition-all duration-300 ${
            isActive("/employer/candidates")
              ? "bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-400 font-bold shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:translate-x-1 hover:text-blue-600 dark:hover:text-blue-300"
          }`}
        >
          <span className="material-symbols-outlined text-lg">groups</span>
          <span>Ứng viên</span>
        </Link>

        <Link
          to="/employer/analytics"
          className={`px-4 py-3 flex items-center gap-3 rounded-lg font-medium text-sm transition-all duration-300 ${
            isActive("/employer/analytics")
              ? "bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-400 font-bold shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:translate-x-1 hover:text-blue-600 dark:hover:text-blue-300"
          }`}
        >
          <span className="material-symbols-outlined text-lg">analytics</span>
          <span>Phân tích</span>
        </Link>

        <Link
          to="/employer/settings"
          className={`px-4 py-3 flex items-center gap-3 rounded-lg font-medium text-sm transition-all duration-300 ${
            isActive("/employer/settings")
              ? "bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-400 font-bold shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:translate-x-1 hover:text-blue-600 dark:hover:text-blue-300"
          }`}
        >
          <span className="material-symbols-outlined text-lg">settings</span>
          <span>Cài đặt</span>
        </Link>
      </nav>

      <div className="mt-auto border-t border-slate-200 dark:border-slate-800 pt-4 flex flex-col gap-1">
        <button
          onClick={handleLogout}
          className="text-slate-600 dark:text-slate-400 px-4 py-3 flex items-center gap-3 hover:translate-x-1 transition-transform hover:text-blue-600 dark:hover:text-blue-300 font-medium text-sm text-left"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}

export default EmployerSideNavBar;
