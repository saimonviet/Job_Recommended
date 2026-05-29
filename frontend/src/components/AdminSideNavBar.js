import React from "react";
import { Link, useLocation } from "react-router-dom";

function AdminSideNavBar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    window.location.href = "/admin";
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 z-50 bg-slate-50 dark:bg-slate-900 flex flex-col p-4 gap-2">
      <div className="mb-8 px-4 py-2">
        <h1 className="text-blue-900 dark:text-white font-black text-xl">Predictive Career</h1>
        <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">Admin Authority</p>
      </div>

      <nav className="flex-1 flex flex-col gap-2">
        <Link
          to="/admin/users"
          className={`px-4 py-3 flex items-center gap-3 rounded-lg font-medium text-sm transition-all duration-300 ${
            isActive("/admin/users")
              ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 font-bold shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:translate-x-1 hover:text-blue-600 dark:hover:text-blue-300"
          }`}
        >
          <span className="material-symbols-outlined text-lg">group</span>
          <span>Quản lý ứng viên</span>
        </Link>
        <Link
          to="/admin/employers"
          className={`px-4 py-3 flex items-center gap-3 rounded-lg font-medium text-sm transition-all duration-300 ${
            isActive("/admin/employers")
              ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 font-bold shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:translate-x-1 hover:text-blue-600 dark:hover:text-blue-300"
          }`}
        >
          <span className="material-symbols-outlined text-lg">business_center</span>
          <span>Quản lý nhà tuyển dụng</span>
        </Link>

        <Link
          to="/admin/jobs"
          className={`px-4 py-3 flex items-center gap-3 rounded-lg font-medium text-sm transition-all duration-300 ${
            isActive("/admin/jobs")
              ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 font-bold shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:translate-x-1 hover:text-blue-600 dark:hover:text-blue-300"
          }`}
        >
          <span className="material-symbols-outlined text-lg">article</span>
          <span>Quản lý bài đăng</span>
        </Link>

        <Link
          to="/admin/analytics"
          className={`px-4 py-3 flex items-center gap-3 rounded-lg font-medium text-sm transition-all duration-300 ${
            isActive("/admin/analytics")
              ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 font-bold shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:translate-x-1 hover:text-blue-600 dark:hover:text-blue-300"
          }`}
        >
          <span className="material-symbols-outlined text-lg">analytics</span>
          <span>Phân tích</span>
        </Link>

        <Link
          to="/admin/settings"
          className={`px-4 py-3 flex items-center gap-3 rounded-lg font-medium text-sm transition-all duration-300 ${
            isActive("/admin/settings")
              ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 font-bold shadow-sm"
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

export default AdminSideNavBar;
