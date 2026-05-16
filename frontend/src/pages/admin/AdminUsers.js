import React, { useState, useEffect } from "react";
import AdminSideNavBar from "../../components/AdminSideNavBar";
import AdminTopNavBar from "../../components/AdminTopNavBar";

const API_BASE_URL = "http://127.0.0.1:5000";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("Tất cả");
  const [statusFilter, setStatusFilter] = useState("Tất cả trạng thái");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [stats, setStats] = useState({
    total_users: 0,
    total_seekers: 0,
    total_employers: 0,
  });

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          total_users: data.total_users || 0,
          total_seekers: data.total_seekers || 0,
          total_employers: data.total_employers || 0,
        });
      }
    } catch (err) {
      console.error("Lỗi lấy thống kê:", err);
    }
  };

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("per_page", 20);
      if (searchTerm.trim()) params.append("search", searchTerm);
      if (statusFilter !== "Tất cả trạng thái") {
        params.append("status", statusFilter === "Đang hoạt động" ? "active" : "inactive");
      }

      const response = await fetch(`${API_BASE_URL}/admin/users?${params}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Lỗi khi lấy danh sách người dùng");
      }

      const data = await response.json();
      setUsers(data.users || []);
      setTotalPages(data.pages || 1);
      setTotalUsers(data.total || 0);
    } catch (err) {
      setError(err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchStats(); // Fetch stats on mount
    fetchUsers();
  }, [currentPage, searchTerm, statusFilter]);

  const getStatusColor = (is_active) => {
    if (is_active) return "text-emerald-600 bg-emerald-50";
    return "text-red-600 bg-red-50";
  };

  const getRoleText = (role) => {
    if (role === "seeker") return "Ứng viên";
    if (role === "employer") return "Nhà tuyển dụng";
    if (role === "admin") return "Quản trị viên";
    return role;
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Bạn có chắc muốn xóa người dùng này?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (response.ok) {
        alert("✓ Xóa người dùng thành công");
        fetchUsers();
      } else {
        alert("❌ Không thể xóa người dùng");
      }
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        alert(`✓ ${!currentStatus ? "Mở khoá" : "Khoá"} người dùng thành công`);
        fetchUsers();
      } else {
        alert("❌ Không thể cập nhật trạng thái");
      }
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  const paginationButtons = () => {
    const buttons = [];
    const maxShow = 5;
    const halfShow = Math.floor(maxShow / 2);

    let startPage = Math.max(1, currentPage - halfShow);
    let endPage = Math.min(totalPages, startPage + maxShow - 1);

    if (endPage - startPage + 1 < maxShow) {
      startPage = Math.max(1, endPage - maxShow + 1);
    }

    if (startPage > 1) {
      buttons.push(
        <button
          key="first"
          onClick={() => setCurrentPage(1)}
          className="px-3 py-1 rounded text-sm font-semibold text-blue-600 hover:bg-blue-50"
        >
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(
          <span key="dots1" className="px-2">
            ...
          </span>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-1 rounded text-sm font-semibold ${
            i === currentPage
              ? "bg-blue-600 text-white"
              : "text-blue-600 hover:bg-blue-50"
          }`}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(
          <span key="dots2" className="px-2">
            ...
          </span>
        );
      }
      buttons.push(
        <button
          key="last"
          onClick={() => setCurrentPage(totalPages)}
          className="px-3 py-1 rounded text-sm font-semibold text-blue-600 hover:bg-blue-50"
        >
          {totalPages}
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSideNavBar />

      <main className="ml-64 w-full">
        <AdminTopNavBar />

        <div className="p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black text-blue-600 tracking-tight mb-2">
                Quản lý người dùng
              </h2>
              <p className="text-on-surface-variant max-w-lg">
                Tổng {totalUsers} người dùng trong hệ thống - Tìm kiếm, lọc và quản lý quyền truy cập.
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-blue-600">
              <p className="text-sm font-semibold text-slate-500 mb-1">Tổng người dùng</p>
              <h3 className="text-4xl font-black text-on-surface">{(stats.total_users || totalUsers).toLocaleString()}</h3>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-cyan-600">
              <p className="text-sm font-semibold text-slate-500 mb-1">Ứng viên</p>
              <h3 className="text-4xl font-black text-on-surface">{stats.total_seekers.toLocaleString()}</h3>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-orange-600">
              <p className="text-sm font-semibold text-slate-500 mb-1">Nhà tuyển dụng</p>
              <h3 className="text-4xl font-black text-on-surface">{stats.total_employers.toLocaleString()}</h3>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg text-red-700">
              ❌ {error}
            </div>
          )}

          {/* Table Container */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Filters Bar */}
            <div className="p-6 bg-gray-50 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên hoặc email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 text-sm rounded-lg pl-4 pr-4 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 text-sm rounded-lg pl-4 pr-10 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-transparent cursor-pointer"
                >
                  <option>Tất cả trạng thái</option>
                  <option>Đang hoạt động</option>
                  <option>Bị chặn</option>
                </select>
              </div>

              {loading && (
                <div className="text-sm text-slate-500 font-semibold">
                  <span className="inline-block animate-spin mr-2">⟳</span>
                  Đang tải...
                </div>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Tên / Email
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Vai trò
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Đơn ứng tuyển
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                        {loading ? "Đang tải..." : "Không tìm thấy người dùng nào"}
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-5">
                          <div>
                            <p className="font-semibold text-on-surface">{user.username}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm font-semibold text-slate-700">
                            {getRoleText(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusColor(
                              user.is_active
                            )}`}
                          >
                            {user.is_active ? "Đang hoạt động" : "Bị chặn"}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-sm text-slate-600">
                          {user.total_applications || 0}
                        </td>
                        <td className="px-6 py-5 text-sm text-slate-600">
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString("vi-VN")
                            : "-"}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={() => handleToggleActive(user.id, user.is_active)}
                            className="text-blue-600 hover:text-blue-700 font-semibold text-sm mr-4"
                          >
                            {user.is_active ? "Khoá" : "Mở khoá"}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-700 font-semibold text-sm"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-6 bg-gray-50 flex items-center justify-center gap-2">
                {paginationButtons()}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminUsers;
