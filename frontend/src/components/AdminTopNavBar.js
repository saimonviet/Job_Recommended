import React, { useState, useEffect, useRef } from "react";

const API_BASE_URL = "http://127.0.0.1:5000";

function AdminTopNavBar() {
  const [admin, setAdmin] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
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

  useEffect(() => {
    fetchAdminInfo();
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

        {/* Admin Info */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {admin?.display_name || "Quản trị viên"}
            </p>

            <p className="text-xs text-slate-500 dark:text-slate-400">
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
              className="w-10 h-10 rounded-full bg-emerald-100 object-cover border border-emerald-200 dark:border-emerald-800"
              src={
                avatarUrl ||
                "https://api.dicebear.com/7.x/initials/svg?seed=Admin"
              }
            />

            <span className="absolute inset-0 rounded-full bg-emerald-700/60 text-white text-[10px] font-bold hidden group-hover:flex items-center justify-center">
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
