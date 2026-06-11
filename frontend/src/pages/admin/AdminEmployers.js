import React, { useState, useEffect } from "react";
import AdminSideNavBar from "../../components/AdminSideNavBar";
import AdminTopNavBar from "../../components/AdminTopNavBar";

const API_BASE_URL = "http://127.0.0.1:5000";

function AdminEmployers() {
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [sortFilter, setSortFilter] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total_employers: 0,
    active_employers: 0,
    inactive_employers: 0,
  });

  const [selectedEmployer, setSelectedEmployer] = useState(null);

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
          total_employers: data.total_employers || 0,
          active_employers: data.active_employers || 0,
          inactive_employers: data.inactive_employers || 0,
        });
      }
    } catch (err) {
      console.error("Lá»—i láº¥y thá»‘ng kÃª:", err);
    }
  };

  const fetchEmployers = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("per_page", 20);

      if (searchTerm.trim()) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`${API_BASE_URL}/admin/employers?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Lỗi khi lấy danh sách nhà tuyển dụng");
      }

      const data = await response.json();
      const sortedEmployers = [...(data.employers || [])].sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);

        return sortFilter === "newest" ? dateB - dateA : dateA - dateB;
      });

      setEmployers(sortedEmployers);
      setTotalPages(data.pages || 1);
    } catch (err) {
      setError(err.message);
      setEmployers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortFilter]);
  useEffect(() => {
    fetchStats();
    fetchEmployers();
  }, [currentPage, searchTerm, sortFilter]);

  const handleToggleActive = async (employerId, currentStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/employers/${employerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({
          is_active: !currentStatus,
        }),
      });

      if (response.ok) {
        alert(`✓ ${!currentStatus ? "Mở khóa" : "Khóa"} nhà tuyển dụng thành công`);
        fetchStats();
        fetchEmployers();
      } else {
        alert("❌ Không thể cập nhật trạng thái");
      }
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  const handleDeleteEmployer = async (employerId) => {
    if (!window.confirm("Bạn có chắc muốn xóa nhà tuyển dụng này?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/employers/${employerId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (response.ok) {
        alert("✓ Xóa nhà tuyển dụng thành công");
        fetchStats();
        fetchEmployers();
      } else {
        alert("❌ Không thể xóa nhà tuyển dụng");
      }
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    }
  };
  const handleViewDetail = async (employerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/employers/${employerId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Không thể lấy chi tiết nhà tuyển dụng");
      }

      const data = await response.json();
      setSelectedEmployer(data);
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
        className="min-w-[40px] h-10 rounded-lg text-sm font-bold bg-white border border-slate-200 hover:bg-emerald-50"
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
        className="min-w-[40px] h-10 rounded-lg text-sm font-bold bg-white border border-slate-200 hover:bg-emerald-50"
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
      {selectedEmployer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
              <div>
                <h3 className="text-2xl font-black text-slate-900">
                  Chi tiết nhà tuyển dụng
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Thông tin doanh nghiệp và hoạt động tuyển dụng
                </p>
              </div>

              <button
                onClick={() => setSelectedEmployer(null)}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-8 overflow-y-auto max-h-[75vh]">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

                <div className="bg-slate-50 rounded-xl p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                    Tên công ty
                  </p>

                  <p className="text-lg font-bold text-slate-900">
                    {selectedEmployer.company_name}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                    Email
                  </p>

                  <p className="text-base font-semibold text-slate-700 break-all">
                    {selectedEmployer.email}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                    Ngày đăng ký
                  </p>

                  <p className="text-base font-semibold text-slate-700">
                    {selectedEmployer.created_at
                      ? new Date(selectedEmployer.created_at).toLocaleDateString("vi-VN")
                      : "-"}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                    Số điện thoại
                  </p>

                  <p className="text-base font-semibold text-slate-700">
                    {selectedEmployer.phone || "-"}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                    Website
                  </p>

                  <p className="text-base font-semibold text-emerald-600 break-all">
                    {selectedEmployer.website || "-"}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-5 md:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                    Địa chỉ
                  </p>

                  <p className="text-base font-semibold text-slate-700">
                    {selectedEmployer.address || "-"}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-5 md:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                    Mô tả công ty
                  </p>

                  <p className="text-sm leading-7 text-slate-700 whitespace-pre-line">
                    {selectedEmployer.description || "Chưa có mô tả"}
                  </p>
                </div>

              </div>

              {/* Recent Jobs */}
              <div>
                <h4 className="text-lg font-black text-slate-900 mb-4">
                  Bài đăng gần đây
                </h4>

                {selectedEmployer.recent_jobs?.length > 0 ? (
                  <div className="space-y-3">
                    {selectedEmployer.recent_jobs.map((job) => (
                      <div
                        key={job.id}
                        className="border border-slate-200 rounded-xl p-4 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-900">
                            {job.job_title}
                          </p>

                          <p className="text-sm text-slate-500 mt-1">
                            {job.created_at
                              ? new Date(job.created_at).toLocaleDateString("vi-VN")
                              : "-"}
                          </p>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            job.is_active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {job.is_active ? "Đang mở" : "Đã đóng"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 bg-slate-50 rounded-xl p-5">
                    Nhà tuyển dụng chưa có bài đăng nào.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <main className="ml-64 w-full">
        <AdminTopNavBar />

        <div className="p-8 max-w-7xl mx-auto">
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black text-emerald-600 tracking-tight mb-2">
                Quản lý nhà tuyển dụng
              </h2>
              <p className="text-on-surface-variant max-w-lg">
                Tìm kiếm, lọc, khóa, mở khóa hoặc xóa tài khoản.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-blue-600">
              <p className="text-sm font-semibold text-slate-500 mb-1">
                Tổng nhà tuyển dụng
              </p>
              <h3 className="text-4xl font-black text-on-surface">
                {stats.total_employers.toLocaleString()}
              </h3>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-emerald-600">
              <p className="text-sm font-semibold text-slate-500 mb-1">
                Đang hoạt động
              </p>
              <h3 className="text-4xl font-black text-on-surface">
                {stats.active_employers.toLocaleString()}
              </h3>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-red-600">
              <p className="text-sm font-semibold text-slate-500 mb-1">
                Bị khóa
              </p>
              <h3 className="text-4xl font-black text-on-surface">
                {stats.inactive_employers.toLocaleString()}
              </h3>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg text-red-700">
              ❌ {error}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
            <div className="p-6 bg-gray-50 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên công ty hoặc email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-[420px] appearance-none bg-white border border-gray-300 text-sm rounded-xl pl-4 pr-4 py-3 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none"                />

                <select
                  value={sortFilter}
                  onChange={(e) => setSortFilter(e.target.value)}
                  className="w-64 appearance-none bg-white border border-gray-300 text-sm rounded-xl pl-4 pr-4 py-3 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none"
                >
                  <option value="newest">Đăng ký mới nhất</option>
                  <option value="oldest">Đăng ký cũ nhất</option>
                </select>
              </div>

              {loading && (
                <div className="text-sm text-slate-500 font-semibold">
                  <span className="inline-block animate-spin mr-2">⟳</span>
                  Đang tải...
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] table-fixed text-left border-collapse">
                <colgroup>
                  <col className="w-[40%]" />
                  <col className="w-[18%]" />
                  <col className="w-[18%]" />
                  <col className="w-[24%]" />
                </colgroup>
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">

                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Công ty / Email
                    </th>

                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">
                      Ngày đăng ký
                    </th>

                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">
                      Trạng thái
                    </th>

                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">
                      Hành động
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {employers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                        {loading ? "Đang tải..." : "Không tìm thấy nhà tuyển dụng nào"}
                      </td>
                    </tr>
                  ) : (
                    employers.map((employer) => (
                      <tr key={employer.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-5 align-middle">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              {employer.company_name}
                            </p>
                            <p className="text-sm text-slate-500 truncate">
                              {employer.email}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center text-sm text-slate-600 whitespace-nowrap">
                          {employer.created_at
                            ? new Date(employer.created_at).toLocaleDateString("vi-VN")
                            : "-"}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span
                            className={`inline-flex items-center justify-center min-w-[110px] px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
                              employer.is_active
                                ? "text-emerald-700 bg-emerald-50"
                                : "text-red-700 bg-red-50"
                            }`}
                          >
                            {employer.is_active ? "Hoạt động" : "Bị khóa"}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                            
                            <button
                              onClick={() => handleViewDetail(employer.id)}
                              className="min-w-[78px] px-3 py-2 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
                            >
                              Chi tiết
                            </button>

                            <button
                              onClick={() =>
                                handleToggleActive(employer.id, employer.is_active)
                              }
                              className={`min-w-[78px] px-3 py-2 rounded-lg text-xs font-bold text-white transition-all ${
                                employer.is_active
                                  ? "bg-emerald-600 hover:bg-emerald-700"
                                  : "bg-emerald-600 hover:bg-emerald-700"
                              }`}
                            >
                              {employer.is_active ? "Khóa" : "Mở khóa"}
                            </button>

                            <button
                              onClick={() => handleDeleteEmployer(employer.id)}
                              className="min-w-[78px] px-3 py-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-all"
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

            {totalPages > 1 && (
  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
    <p className="text-sm text-slate-500">
      Trang <span className="font-bold text-slate-700">{currentPage}</span> /{" "}
      <span className="font-bold text-slate-700">{totalPages}</span>
    </p>

    <div className="flex items-center gap-2">
      <button
        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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

export default AdminEmployers;
