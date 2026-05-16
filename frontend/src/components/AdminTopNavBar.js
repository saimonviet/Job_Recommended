import React, { useState } from "react";

function AdminTopNavBar() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 w-full z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl flex justify-between items-center px-6 h-16 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm hệ thống..."
            className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-slate-800 border-none rounded-lg text-sm w-80 focus:ring-2 focus:ring-blue-600/20 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative">
          <span className="material-symbols-outlined text-xl">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>



        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-on-surface">Quản trị viên</p>
            <p className="text-xs text-slate-500">Hệ thống cấp cao</p>
          </div>
          <img
            alt="Admin Avatar"
            className="w-10 h-10 rounded-full bg-gray-300 object-cover"
            src="https://via.placeholder.com/40"
          />
        </div>
      </div>
    </header>
  );
}

export default AdminTopNavBar;
