import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://127.0.0.1:5000";

function AdminTopNavBar() {
  const [admin, setAdmin] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const fetchAdminInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/me`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAdmin(data);

        if (data.avatar_url) {
          setAvatarUrl(`${data.avatar_url}?t=${Date.now()}`);
        }
      }
    } catch (err) {
      console.error("Lỗi lấy thông tin admin:", err);
    }
  };
    
  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/notifications`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Lỗi lấy thông báo:", err);
    }
  };

  useEffect(() => {
    fetchAdminInfo();
    fetchNotifications();
  }, []);

  const handleChooseAvatar = () => {
    fileInputRef.current?.click();
  };

  const handleUploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

    if (!validTypes.includes(file.type)) {
      alert("Chỉ hỗ trợ ảnh PNG, JPG, JPEG hoặc WEBP");
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    setUploading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Không thể cập nhật avatar");
        return;
      }

      if (data.avatar_url) {
        setAvatarUrl(`${data.avatar_url}?t=${Date.now()}`);
      }

      await fetchAdminInfo();

      alert("✓ Cập nhật ảnh admin thành công");
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <header className="sticky top-0 w-full z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl flex justify-between items-center px-6 h-16 shadow-sm">
      <div className="flex items-center justify-end gap-5 ml-auto">

        {/* Notifications */}
        <div className="relative">

          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-all"
          >
            <span className="material-symbols-outlined text-slate-600">
              notifications
            </span>

            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-[360px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">

              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-black text-slate-900">
                  Thông báo
                </h3>

                <span className="text-xs font-bold text-red-500">
                  {notifications.length} mới
                </span>
              </div>

              <div className="max-h-[420px] overflow-y-auto">

                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">
                    Không có thông báo mới
                  </div>
                ) : (
                  notifications.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate("/admin/employers");
                        setShowNotifications(false);
                      }}
                      className="w-full text-left px-5 py-4 hover:bg-slate-50 border-b border-slate-100 transition-all"
                    >
                      <div className="flex items-start gap-3">

                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-orange-600 text-[20px]">
                            business
                          </span>
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900">
                            {item.title}
                          </p>

                          <p className="text-sm text-slate-600 mt-1 leading-6">
                            {item.message}
                          </p>

                          <p className="text-xs text-slate-400 mt-2">
                            {item.created_at
                              ? new Date(item.created_at).toLocaleString("vi-VN")
                              : ""}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>

        {/* Admin Info */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-on-surface">
              {admin?.display_name || "Quản trị viên"}
            </p>
            <p className="text-xs text-slate-500">
              {admin?.email || admin?.username || "Admin"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleChooseAvatar}
            disabled={uploading}
            className="relative group"
            title="Đổi ảnh đại diện"
          >
            <img
              alt="Admin Avatar"
              className="w-10 h-10 rounded-full bg-gray-300 object-cover border border-slate-200"
              src={
                avatarUrl ||
                "https://api.dicebear.com/7.x/initials/svg?seed=Admin"
              }
            />

            <span className="absolute inset-0 rounded-full bg-black/40 text-white text-[10px] font-bold hidden group-hover:flex items-center justify-center">
              Đổi
            </span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleUploadAvatar}
            className="hidden"
          />
        </div>
      </div>
    </header>
  );
}

export default AdminTopNavBar;