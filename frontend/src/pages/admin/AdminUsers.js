import React, { useState, useEffect } from "react";
import AdminSideNavBar from "../../components/AdminSideNavBar";
import AdminTopNavBar from "../../components/AdminTopNavBar";

const API_BASE_URL = "http://127.0.0.1:5000";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả trạng thái");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const [stats, setStats] = useState({
    total_seekers: 0,
  });

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          total_seekers: data.total_seekers || 0,
        });
      }
    } catch (err) {
      console.error("Lỗi lấy thống kê:", err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("per_page", 20);

      if (searchTerm.trim()) {
        params.append("search", searchTerm);
      }

      if (statusFilter !== "Tất cả trạng thái") {
        params.append(
          "status",
          statusFilter === "Đang hoạt động" ? "active" : "inactive"
        );
      }

      const response = await fetch(`${API_BASE_URL}/admin/users?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
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
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, [currentPage, searchTerm, statusFilter]);

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Bạn có chắc muốn xóa người dùng này?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
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
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
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
    const maxVisible = 5;

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          onClick={() => setCurrentPage(1)}
          className="min-w-[40px] h-10 rounded-lg text-sm font-bold bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600"
        >
          1
        </button>
      );

      if (startPage > 2) {
        buttons.push(
          <span key="start-dots" className="px-1 text-slate-400">
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
          className={`min-w-[40px] h-10 rounded-lg text-sm font-bold transition-all ${
            i === currentPage
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600"
          }`}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(
          <span key="end-dots" className="px-1 text-slate-400">
            ...
          </span>
        );
      }

      buttons.push(
        <button
          key={totalPages}
          onClick={() => setCurrentPage(totalPages)}
          className="min-w-[40px] h-10 rounded-lg text-sm font-bold bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600"
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
              <h2 className="text-3xl font-black text-emerald-600 tracking-tight mb-2">
                Quản lý ứng viên
              </h2>

              <p className="text-on-surface-variant max-w-lg">
                Tìm kiếm, lọc và quản lý quyền truy cập.
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-blue-600">
              <p className="text-sm font-semibold text-slate-500 mb-1">
                Tổng ứng viên
              </p>
              <h3 className="text-4xl font-black text-slate-900">
                {stats.total_seekers.toLocaleString()}
              </h3>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-emerald-600">
              <p className="text-sm font-semibold text-slate-500 mb-1">
                Đang hoạt động
              </p>
              <h3 className="text-4xl font-black text-slate-900">
                {users.filter((u) => u.is_active).length}
              </h3>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-red-600">
              <p className="text-sm font-semibold text-slate-500 mb-1">
                Bị khóa
              </p>
              <h3 className="text-4xl font-black text-slate-900">
                {users.filter((u) => !u.is_active).length}
              </h3>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg text-red-700">
              ❌ {error}
            </div>
          )}

          {/* Table Container */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
            {/* Filters Bar */}
            <div className="p-6 bg-gray-50 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên hoặc email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-[420px] appearance-none bg-white border border-gray-300 text-sm rounded-xl pl-4 pr-4 py-3 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 text-sm rounded-xl pl-4 pr-10 py-3 focus:ring-2 focus:ring-emerald-600 focus:border-transparent cursor-pointer outline-none"
                >
                  <option>Tất cả trạng thái</option>
                  <option>Đang hoạt động</option>
                  <option>Bị khóa</option>
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
              <table className="w-full min-w-[980px] table-fixed text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="w-[40%] px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Ứng viên / Email
                    </th>

                    <th className="w-[15%] px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">
                      Trạng thái
                    </th>

                    <th className="w-[15%] px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">
                      Đơn ứng tuyển
                    </th>

                    <th className="w-[15%] px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">
                      Ngày tạo
                    </th>

                    <th className="w-[15%] px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">
                      Hành động
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {users.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-8 text-center text-slate-500"
                      >
                        {loading ? "Đang tải..." : "Không tìm thấy ứng viên nào"}
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-5">
                          <div className="min-w-0 max-w-full">
                            <p className="font-bold text-slate-900 truncate max-w-[360px]">
                              {user.username}
                            </p>
                            <p className="text-sm text-slate-500 truncate max-w-[360px]">
                              {user.email}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-5 text-center">
                          <span
                            className={`inline-flex items-center justify-center min-w-[110px] px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
                              user.is_active
                                ? "text-emerald-700 bg-emerald-50"
                                : "text-red-700 bg-red-50"
                            }`}
                          >
                            {user.is_active ? "Hoạt động" : "Bị khóa"}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-center text-sm font-semibold text-slate-700">
                          {user.total_applications || 0}
                        </td>

                        <td className="px-6 py-5 text-center text-sm text-slate-600 whitespace-nowrap">
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString(
                                "vi-VN"
                              )
                            : "-"}
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                            <button
                              onClick={() =>
                                handleToggleActive(user.id, user.is_active)
                              }
                              className={`min-w-[70px] px-3 py-2 rounded-full text-xs font-bold text-white transition-all ${
                                user.is_active
                                  ? "bg-emerald-600 hover:bg-emerald-700"
                                  : "bg-emerald-600 hover:bg-emerald-700"
                              }`}
                            >
                              {user.is_active ? "Khóa" : "Mở"}
                            </button>

                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="min-w-[70px] px-3 py-2 rounded-full text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-all"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-slate-500">
                  Trang{" "}
                  <span className="font-bold text-slate-700">
                    {currentPage}
                  </span>{" "}
                  /{" "}
                  <span className="font-bold text-slate-700">
                    {totalPages}
                  </span>
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      currentPage === 1
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600"
                    }`}
                  >
                    Trước
                  </button>

                  {paginationButtons()}

                  <button
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(prev + 1, totalPages)
                      )
                    }
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      currentPage === totalPages
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600"
                    }`}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminUsers;