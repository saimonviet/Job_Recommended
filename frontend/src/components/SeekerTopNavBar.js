import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CACHE_TTL_MS = 5 * 60 * 1000;
const TOP_BAR_PROFILE_CACHE_KEY = 'cache_seeker_topbar_profile_v1';
const TOP_BAR_NOTIFICATIONS_CACHE_KEY = 'cache_seeker_topbar_notifications_v1';

const topBarMemoryCache = {
  profile: null,
  notifications: null,
};

const readCachedValue = (key) => {
  if (key === TOP_BAR_PROFILE_CACHE_KEY && topBarMemoryCache.profile) {
    return topBarMemoryCache.profile;
  }

  if (key === TOP_BAR_NOTIFICATIONS_CACHE_KEY && topBarMemoryCache.notifications) {
    return topBarMemoryCache.notifications;
  }

  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts < CACHE_TTL_MS) {
      return data;
    }
    sessionStorage.removeItem(key);
  } catch (error) {
    console.warn('Top bar cache read error:', error);
  }

  return null;
};

const writeCachedValue = (key, data) => {
  try {
    if (key === TOP_BAR_PROFILE_CACHE_KEY) {
      topBarMemoryCache.profile = data;
    }

    if (key === TOP_BAR_NOTIFICATIONS_CACHE_KEY) {
      topBarMemoryCache.notifications = data;
    }

    sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch (error) {
    console.warn('Top bar cache write error:', error);
  }
};

const TopNavBar = ({ currentPage = 'home' }) => {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user')) || {
    username: 'User',
    email: '',
  };

  const [avatarPreview, setAvatarPreview] = useState(
    `https://api.dicebear.com/10.x/glyphs/svg?seed=Luna`
  );
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const cachedProfile = readCachedValue(TOP_BAR_PROFILE_CACHE_KEY);
    if (cachedProfile?.avatarPreview) {
      setAvatarPreview(cachedProfile.avatarPreview);
      return;
    }

    const fetchProfile = async () => {
      try {
        const data = await api.request('/seeker/profile');

        if (data.avatar_path) {
          const nextAvatarPreview = `http://127.0.0.1:5000${data.avatar_path}`;
          setAvatarPreview(nextAvatarPreview);
          writeCachedValue(TOP_BAR_PROFILE_CACHE_KEY, { avatarPreview: nextAvatarPreview });
        }
      } catch (error) {
        console.error('Failed to fetch profile avatar:', error);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const cachedNotifications = readCachedValue(TOP_BAR_NOTIFICATIONS_CACHE_KEY);
    if (cachedNotifications) {
      setNotifications(cachedNotifications.notifications || []);
      setUnreadCount(cachedNotifications.unreadCount || 0);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const data = await api.request('/seeker/notifications');
        const nextNotifications = data.notifications || [];
        const nextUnreadCount = data.unread_count || 0;
        setNotifications(nextNotifications);
        setUnreadCount(nextUnreadCount);
        writeCachedValue(TOP_BAR_NOTIFICATIONS_CACHE_KEY, {
          notifications: nextNotifications,
          unreadCount: nextUnreadCount,
        });
      } catch (error) {
        console.error('Failed to fetch seeker notifications:', error);
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    fetchNotifications();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login-seeker');
  };

  const handleNotificationClick = async (item) => {
    setShowNotifications(false);
    if (item?.id && !item.is_read) {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === item.id
            ? { ...notification, is_read: true }
            : notification
        )
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));

      try {
        await api.put(`/seeker/notifications/${encodeURIComponent(item.id)}/read`, {});
      } catch (error) {
        console.error('Failed to mark seeker notification as read:', error);
      }
    }

    if (item?.job?.id) {
      navigate(`/jobs/${item.job.id}`);
      return;
    }
    navigate('/seeker/applications');
  };

  const getNotificationIcon = (type, status) => {
    if (type === 'invitation') return 'mark_email_unread';
    if (status === 'accepted') return 'check_circle';
    if (status === 'rejected') return 'cancel';
    if (status === 'interview') return 'event_available';
    return 'notifications';
  };

  return (
    <nav className="fixed top-0 z-50 w-full bg-[#f9f9ff]/80 dark:bg-[#191c21]/80 backdrop-blur-md shadow-sm">
      <div className="flex justify-between items-center px-8 py-4 max-w-full">
        <div
          className="text-xl font-bold text-[#00488d] dark:text-[#005fb8] font-manrope cursor-pointer"
          onClick={() => navigate('/seeker/home')}
        >
          Career Authority
        </div>

        <div className="hidden md:flex items-center gap-8 font-manrope tracking-tight font-bold">
          <a
            className={`inline-flex items-center pb-1 transition-all duration-200 ease-in-out ${
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
            className={`inline-flex items-center pb-1 transition-all duration-200 ease-in-out ${
              currentPage === 'companies'
                ? 'text-[#00488d] dark:text-[#005fb8] border-b-2 border-[#00488d]'
                : 'text-[#c2c6d4] hover:text-[#00488d]'
            }`}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/seeker/company');
            }}
          >
            Công ty
          </a>

          <a
            className={`inline-flex items-center pb-1 transition-all duration-200 ease-in-out ${
              currentPage === 'applications'
                ? 'text-[#00488d] dark:text-[#005fb8] border-b-2 border-[#00488d]'
                : 'text-[#c2c6d4] hover:text-[#00488d]'
            }`}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/seeker/applications');
            }}
          >
            Ứng tuyển
          </a>

          <a
            className={`inline-flex items-center pb-1 transition-all duration-200 ease-in-out ${
              currentPage === 'saved'
                ? 'text-[#00488d] dark:text-[#005fb8] border-b-2 border-[#00488d]'
                : 'text-[#c2c6d4] hover:text-[#00488d]'
            }`}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/seeker/saved-jobs');
            }}
          >
            Công việc đã lưu
          </a>

          <a
            className={`inline-flex items-center pb-1 transition-all duration-200 ease-in-out ${
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

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((prev) => !prev)}
              className="relative p-2 hover:bg-[#f2f3fb] dark:hover:bg-slate-800 rounded-md transition-all duration-200 ease-in-out"
              aria-label="Thông báo"
            >
              <span className="material-symbols-outlined text-slate-600">
                notifications
              </span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#2e3036] rounded-xl shadow-xl border border-slate-200/70 dark:border-slate-700 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <p className="font-bold text-sm text-slate-900 dark:text-white">Thông báo</p>
                  <button
                    type="button"
                    onClick={() => navigate('/seeker/applications')}
                    className="text-xs font-semibold text-[#00488d] hover:underline"
                  >
                    Xem ứng tuyển
                  </button>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-500">
                      Chưa có thông báo mới.
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNotificationClick(item)}
                        className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-[#f2f3fb] dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-700 last:border-b-0 ${
                          item.is_read ? 'bg-white dark:bg-[#2e3036]' : 'bg-[#eef6ff] dark:bg-[#0f2a44]'
                        }`}
                      >
                        <span className="relative mt-0.5">
                          {!item.is_read && (
                            <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
                          )}
                          <span className="material-symbols-outlined text-[#00488d] text-xl">
                            {getNotificationIcon(item.type, item.status)}
                          </span>
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-slate-900 dark:text-white">
                            {item.title}
                          </span>
                          <span className="block text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-1">
                            {item.message}
                          </span>
                          {item.job?.company_name && (
                            <span className="block text-[11px] text-slate-400 mt-1">
                              {item.job.company_name}
                            </span>
                          )}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative group">
            <div className="h-10 w-10 rounded-full bg-[#ecedf6] dark:bg-[#191c21] overflow-hidden ring-2 ring-primary/10 transition-all duration-200 ease-in-out cursor-pointer">
              <img
                alt="User Avatar"
                className="h-full w-full object-cover"
                src={avatarPreview}
              />
            </div>

            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#2e3036] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="p-4 border-b border-outline-variant/20">
                <p className="font-bold text-sm">{user.username || user.name}</p>
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
                  onClick={() => navigate('/seeker/profile/settings')}
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
