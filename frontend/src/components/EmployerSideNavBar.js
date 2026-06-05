import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { clearEmployerAuth } from "../utils/authStorage";

function EmployerSideNavBar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    clearEmployerAuth();
    window.location.href = "/login-employer";
  };

  const menuItems = [
    { path: "/employer/dashboard", label: "Bảng điều khiển", icon: "dashboard" },
    { path: "/employer/post", label: "Đăng tin tuyển dụng", icon: "add_box" },
    { path: "/employer/jobs", label: "Quản lý bài đăng", icon: "work" },
    { path: "/employer/candidates", label: "Ứng viên", icon: "groups" },
    { path: "/employer/analytics", label: "Phân tích", icon: "analytics" },
    { path: "/employer/settings", label: "Cài đặt", icon: "settings" },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-50 bg-white dark:bg-slate-900
      flex flex-col border-r border-slate-200 dark:border-slate-800
      transition-all duration-300
      ${collapsed ? "w-24" : "w-64"}`}
    >
      <div className="pt-5 px-4 mb-4 flex items-center justify-between">
        {!collapsed && (
          <div>
            <h1 className="text-orange-600 dark:text-white font-black text-xl whitespace-nowrap">
              Career Authority
            </h1>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">
              Quản trị tuyển dụng
            </p>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-orange-50 dark:hover:bg-slate-800 transition"
        >
          <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">
            {collapsed ? "menu" : "menu_open"}
          </span>
        </button>
      </div>

      <nav className="flex-1 flex flex-col gap-2 px-3">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            title={collapsed ? item.label : ""}
            className={`px-4 py-3 flex items-center rounded-lg font-medium text-sm transition-all duration-300
              ${collapsed ? "justify-center" : "gap-3"}
              ${
                isActive(item.path)
                  ? "bg-orange-50 dark:bg-slate-800 text-orange-600 dark:text-orange-400 font-bold shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:translate-x-1 hover:text-orange-600 dark:hover:text-orange-400"
              }`}
          >
            <span className="material-symbols-outlined text-lg">
              {item.icon}
            </span>

            {!collapsed && (
              <span className="whitespace-nowrap">{item.label}</span>
            )}
          </Link>
        ))}
      </nav>

      <div className="mt-auto border-t border-slate-200 dark:border-slate-800 pt-4 px-3 pb-4">
        <button
          onClick={handleLogout}
          title={collapsed ? "Đăng xuất" : ""}
          className={`w-full px-4 py-3 flex items-center rounded-lg transition-all
            text-slate-600 dark:text-slate-400 hover:bg-red-50 hover:text-red-600
            dark:hover:bg-slate-800 font-medium text-sm
            ${collapsed ? "justify-center" : "gap-3 text-left"}`}
        >
          <span className="material-symbols-outlined text-lg">logout</span>

          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}

export default EmployerSideNavBar;