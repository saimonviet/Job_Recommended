import React, { useState, useRef, useEffect } from "react";
import API, { API_URL } from "../services/api";
import { clearEmployerAuth, getEmployerToken } from "../utils/authStorage";

function EmployerTopNavBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [employerProfile, setEmployerProfile] = useState({
    company_name: "Đang tải...",
    email: "",
  });


  useEffect(() => {
    const token = getEmployerToken();
    if (!token) return;

    let cancelled = false;

    const loadEmployerProfile = async () => {
      try {
        const response = await API.get('/auth/me');
        if (!cancelled && response.data) {
          setEmployerProfile({
            company_name: response.data.company_name || response.data.username || 'Nhà tuyển dụng',
            email: response.data.email || '',
            logo_path: response.data.logo_path || response.data.avatar_path || null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setEmployerProfile({
            company_name: 'Nhà tuyển dụng',
            email: '',
          });
        }
      }
    };

    const loadNotifications = async () => {
      try {
        const response = await API.get('/employer/notifications');
        if (!cancelled && response.data) {
          setNotifications(response.data.notifications || []);
          setUnreadCount(response.data.unread_count || 0);
        }
      } catch (error) {
        if (!cancelled) {
          setNotifications([]);
          setUnreadCount(0);
        }
      }
    };

    loadEmployerProfile();
    loadNotifications();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleNotificationClick = async (notification) => {
    setShowNotifications(false);
    if (!notification?.id || notification.is_read) return;

    try {
      await API.put(`/employer/notifications/${notification.id}/read`, {});
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item
        )
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.error('Failed to mark employer notification as read:', error);
    }
  };

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
            className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-full text-sm w-72 focus:ring-2 focus:ring-orange-600/20 transition-all"
          />
        </div> */}
      </div>

      <div className="flex items-center gap-6 overflow-visible">

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((prev) => !prev)}
              className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              aria-label="Thông báo"
            >
              <span className="material-symbols-outlined text-lg">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Thông báo</p>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-slate-500 text-center">
                      Chưa có thông báo mới.
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNotificationClick(item)}
                        className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 ${
                          item.is_read ? "bg-white dark:bg-slate-900" : "bg-orange-50/70 dark:bg-orange-950/20"
                        }`}
                      >
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-3">
                          {item.message}
                        </p>
                        {item.created_at && (
                          <p className="text-[11px] text-slate-400 mt-2">
                            {new Date(item.created_at).toLocaleString("vi-VN")}
                          </p>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Account Dropdown */}
          <div className="relative">
            <div
              className="flex items-center gap-3 px-3 py-2"
            >
              <img
                alt="Company Avatar"
                className="w-9 h-9 rounded-full bg-slate-300 object-cover"
                src={(() => {
                  const p = employerProfile.logo_path;
                  if (p && typeof p === 'string' && p.trim()) {
                    return p.startsWith('http') ? p : `${API_URL}${p}`;
                  }
                  return `${API_URL}/logos/default.png`;
                })()}
                onError={(e) => {
                  // Prevent infinite loop: only handle error once per element
                  const img = e.currentTarget;
                  if (img.dataset._logoErrorHandled) return;
                  img.dataset._logoErrorHandled = '1';
                  // First try local default; if that also fails, use external placeholder
                  const defaultUrl = `${API_URL}/logos/default.png`;
                  if (!img.src || img.src.endsWith('/default.png')) {
                    img.src = 'https://via.placeholder.com/96?text=Logo';
                  } else {
                    img.src = defaultUrl;
                  }
                }}
              />
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-500">{employerProfile.company_name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default EmployerTopNavBar;
