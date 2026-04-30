import React, { useState, useRef, useEffect } from "react";

function EmployerTopNavBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (    
    <header className="fixed top-0 inset-x-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl flex justify-between items-center px-8 h-16 border-b border-slate-200 dark:border-slate-800 overflow-visible">
      <div className="flex items-center gap-8">
        {/* <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
            <span className="material-symbols-outlined text-lg">search</span>
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm bài đăng..."
            className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-full text-sm w-72 focus:ring-2 focus:ring-blue-600/20 transition-all"
          />
        </div> */}
      </div>

      <div className="flex items-center gap-6 overflow-visible">
        <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
          Công ty của tôi
        </button>

        <div className="flex items-center gap-4">
          <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative">
            <span className="material-symbols-outlined text-lg">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <span className="material-symbols-outlined text-lg">help</span>
          </button>

          {/* Account Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors group"
            >
              <img
                alt="Company Avatar"
                className="w-9 h-9 rounded-full bg-slate-300 object-cover"
                src="https://via.placeholder.com/40"
              />
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">TechVantage Corp</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Nhà tuyển dụng</p>
              </div>
              <span className="material-symbols-outlined text-lg text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300">
                {isDropdownOpen ? "expand_less" : "expand_more"}
              </span>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 origin-top-right" style={{ right: '-1rem' }}>
                {/* Account Info */}
                <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">TechVantage Corp</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">admin@techvantage.com</p>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors group">
                    <span className="material-symbols-outlined text-lg text-slate-500 group-hover:text-blue-600">person</span>
                    <span>Hồ sơ công ty</span>
                  </button>

                  <button className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors group">
                    <span className="material-symbols-outlined text-lg text-slate-500 group-hover:text-blue-600">settings</span>
                    <span>Cài đặt</span>
                  </button>

                  <button className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors group">
                    <span className="material-symbols-outlined text-lg text-slate-500 group-hover:text-blue-600">lock</span>
                    <span>Bảo mật</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 dark:border-slate-700"></div>

                {/* Logout */}
                <button className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors group font-semibold">
                  <span className="material-symbols-outlined text-lg">logout</span>
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default EmployerTopNavBar;
