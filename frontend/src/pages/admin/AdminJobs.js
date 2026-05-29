import React, { useState, useEffect } from "react";
import AdminSideNavBar from "../../components/AdminSideNavBar";
import AdminTopNavBar from "../../components/AdminTopNavBar";
import { formatExperienceRange, formatSalaryRange } from "../../utils/dataFormatter";

const API_BASE_URL = "http://127.0.0.1:5000";

function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [stats, setStats] = useState({
    total_jobs: 0,
    locked_jobs: 0,
    hidden_jobs: 0,
  });
  const [selectedJob, setSelectedJob] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/jobs/stats`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          total_jobs: data.total_jobs || 0,
          locked_jobs: data.locked_jobs || 0,
          hidden_jobs: data.hidden_jobs || 0,
        });
      }
    } catch (err) {
      console.error("Lỗi lấy thống kê:", err);
    }
  };

  // Fetch jobs from API
  const fetchJobs = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("per_page", 20);
      if (searchTerm.trim()) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`${API_BASE_URL}/admin/jobs?${params}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Lỗi khi lấy danh sách bài đăng");
      }

      const data = await response.json();
      setJobs(data.jobs || []);
      setTotalPages(data.pages || 1);
      setTotalJobs(data.total || 0);
    } catch (err) {
      setError(err.message);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchStats();
    fetchJobs();
  }, [currentPage, searchTerm, statusFilter]);

  const handleViewDetail = async (jobId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/jobs/${jobId}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedJob(data);
        setShowModal(true);
      } else {
        alert("❌ Không thể lấy chi tiết bài đăng");
      }
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedJob(null);
  };

  const getStatusColor = (job) => {
    if (job.is_locked) return "text-red-600 bg-red-50";
    if (job.is_hidden) return "text-slate-600 bg-slate-50";
    return "text-emerald-600 bg-emerald-50";
  };

  const getStatusText = (job) => {
    if (job.is_locked) return "Đã khóa";
    if (job.is_hidden) return "Đã ẩn";
    return "Hoạt động";
  };

  const handleSoftDeleteJob = async (jobId) => {
    if (!window.confirm("Bạn có chắc muốn xóa bài đăng này?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/jobs/${jobId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (response.ok) {
        alert("✓ Xóa bài đăng thành công");
        fetchJobs();
      } else {
        alert("❌ Không thể xóa bài đăng");
      }
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  const handleToggleLock = async (jobId, currentStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/jobs/${jobId}/lock`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ is_locked: !currentStatus }),
      });

      if (response.ok) {
        alert(`✓ ${!currentStatus ? "Khóa" : "Mở khóa"} bài đăng thành công`);
        fetchJobs();
      } else {
        alert("❌ Không thể cập nhật trạng thái");
      }
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  const handleToggleHidden = async (jobId, currentStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/jobs/${jobId}/hidden`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ is_hidden: !currentStatus }),
      });

      if (response.ok) {
        alert(`✓ ${!currentStatus ? "Ẩn" : "Hiển thị"} bài đăng thành công`);
        fetchJobs();
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
          className="min-w-[40px] h-10 rounded-lg text-sm font-bold bg-white text-slate-600 border border-slate-200 hover:bg-blue-50 hover:text-blue-600"
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
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-blue-50 hover:text-blue-600"
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
          className="min-w-[40px] h-10 rounded-lg text-sm font-bold bg-white text-slate-600 border border-slate-200 hover:bg-blue-50 hover:text-blue-600"
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
                Quản lý bài đăng tuyển dụng
              </h2>
              <p className="text-on-surface-variant max-w-lg">
                Xem chi tiết, khóa, ẩn, xóa và tìm kiếm bài đăng.
              </p>
            </div>
          </div>

          {/* Dashboard Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-blue-600">
              <p className="text-sm font-semibold text-slate-500 mb-1">Tổng bài đăng</p>
              <h3 className="text-4xl font-black text-slate-900">
                {stats.total_jobs.toLocaleString()}
              </h3>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-orange-600">
              <p className="text-sm font-semibold text-slate-500 mb-1">Đã khóa</p>
              <h3 className="text-4xl font-black text-slate-900">
                {stats.locked_jobs.toLocaleString()}
              </h3>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-slate-600">
              <p className="text-sm font-semibold text-slate-500 mb-1">Đã ẩn</p>
              <h3 className="text-4xl font-black text-slate-900">
                {stats.hidden_jobs.toLocaleString()}
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
                  placeholder="Tìm kiếm theo tiêu đề hoặc công ty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-[420px] appearance-none bg-white border border-gray-300 text-sm rounded-xl pl-4 pr-4 py-3 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 text-sm rounded-xl pl-4 pr-10 py-3 focus:ring-2 focus:ring-blue-600 focus:border-transparent cursor-pointer outline-none"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Hoạt động</option>
                  <option value="locked">Đã khóa</option>
                  <option value="hidden">Đã ẩn</option>
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
                <table className="w-full table-fixed text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="w-[42%] px-7 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Tiêu đề / Công ty
                      </th>

                      <th className="w-[14%] px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">
                        Ngày đăng
                      </th>

                      <th className="w-[14%] px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">
                        Trạng thái
                      </th>

                      <th className="w-[30%] px-7 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">
                        Hành động
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {jobs.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                          {loading ? "Đang tải..." : "Không tìm thấy bài đăng nào"}
                        </td>
                      </tr>
                    ) : (
                      jobs.map((job) => (
                        <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-7 py-5">
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate">
                                {job.title}
                              </p>

                              <p className="text-sm text-slate-500 truncate mt-1">
                                {job.company}
                              </p>

                              <p className="text-xs text-slate-400 mt-1">
                                ID: POST-{job.id}
                              </p>
                            </div>
                          </td>

                          <td className="px-6 py-5 text-center text-sm text-slate-600 whitespace-nowrap">
                            {job.posted_date
                              ? new Date(job.posted_date).toLocaleDateString("vi-VN")
                              : "-"}
                          </td>

                          <td className="px-6 py-5 text-center">
                            <span
                              className={`inline-flex items-center justify-center min-w-[96px] px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${getStatusColor(
                                job
                              )}`}
                            >
                              {getStatusText(job)}
                            </span>
                          </td>

                          <td className="px-7 py-5">
                            <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                              <button
                                onClick={() => handleViewDetail(job.id)}
                                className="min-w-[70px] px-3 py-2 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all"
                              >
                                Xem
                              </button>

                              <button
                                onClick={() => handleToggleLock(job.id, job.is_locked || false)}
                                className={`min-w-[70px] px-3 py-2 rounded-full text-xs font-bold text-white transition-all ${
                                  job.is_locked
                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                    : "bg-orange-600 hover:bg-orange-700"
                                }`}
                              >
                                {job.is_locked ? "Mở" : "Khóa"}
                              </button>

                              <button
                                onClick={() => handleToggleHidden(job.id, job.is_hidden || false)}
                                className={`min-w-[70px] px-3 py-2 rounded-full text-xs font-bold text-white transition-all ${
                                  job.is_hidden
                                    ? "bg-slate-600 hover:bg-slate-700"
                                    : "bg-purple-600 hover:bg-purple-700"
                                }`}
                              >
                                {job.is_hidden ? "Hiện" : "Ẩn"}
                              </button>

                              <button
                                onClick={() => handleSoftDeleteJob(job.id)}
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
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Trang{" "}
                  <span className="font-bold text-slate-700">{currentPage}</span> /{" "}
                  <span className="font-bold text-slate-700">{totalPages}</span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      currentPage === 1
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 hover:text-blue-600"
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
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 hover:text-blue-600"
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

      {/* Job Detail Modal */}
      {showModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-6 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black">{selectedJob.title}</h3>
                <p className="text-blue-100 text-sm mt-1">{selectedJob.company}</p>
              </div>
              <button
                onClick={closeModal}
                className="text-white hover:bg-blue-700 p-2 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedJob.is_locked && (
                  <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold">
                    🔒 Đã khóa
                  </span>
                )}
                {selectedJob.is_hidden && (
                  <span className="bg-slate-50 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                    👁️ Đã ẩn
                  </span>
                )}
                {selectedJob.is_deleted && (
                  <span className="bg-gray-50 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
                    🗑️ Đã xóa
                  </span>
                )}
              </div>

              {/* Grid Layout */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Loại công việc</p>
                  <p className="text-sm font-semibold text-on-surface">{selectedJob.employment_type || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Địa chỉ</p>
                  <p className="text-sm font-semibold text-on-surface">{selectedJob.job_address || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Ngày đăng</p>
                  <p className="text-sm font-semibold text-on-surface">
                    {selectedJob.posted_date
                      ? new Date(selectedJob.posted_date).toLocaleDateString("vi-VN")
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Hạn chót</p>
                  <p className="text-sm font-semibold text-on-surface">
                    {selectedJob.deadline
                      ? new Date(selectedJob.deadline).toLocaleDateString("vi-VN")
                      : '-'}
                  </p>
                </div>
              </div>

              {/* Salary */}
              {(selectedJob.salary_min || selectedJob.salary_max) && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-xs font-bold text-blue-600 uppercase mb-1">Mức lương</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatSalaryRange(selectedJob.salary_min, selectedJob.salary_max)}
                  </p>
                </div>
              )}

              {/* Experience */}
              {selectedJob.exp_min || selectedJob.exp_max ? (
                <div className="mb-6">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Kinh nghiệm yêu cầu</p>
                  <p className="text-sm text-on-surface">{formatExperienceRange(selectedJob.exp_min, selectedJob.exp_max)}</p>
                </div>
              ) : selectedJob.experience_required ? (
                <div className="mb-6">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Kinh nghiệm yêu cầu</p>
                  <p className="text-sm text-on-surface">{selectedJob.experience_required}</p>
                </div>
              ) : null}

              {/* Description */}
              {selectedJob.description && (
                <div className="mb-6">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Mô tả công việc</p>
                  <div className="text-sm text-on-surface whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                    {selectedJob.description}
                  </div>
                </div>
              )}

              {/* Employer Info */}
              {selectedJob.employer && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-3">Thông tin nhà tuyển dụng</p>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="font-semibold">Công ty:</span> {selectedJob.employer.company_name}</p>
                    <p className="text-sm"><span className="font-semibold">Email:</span> {selectedJob.employer.email}</p>
                    {selectedJob.employer.phone && <p className="text-sm"><span className="font-semibold">Điện thoại:</span> {selectedJob.employer.phone}</p>}
                    {selectedJob.employer.website && <p className="text-sm"><span className="font-semibold">Website:</span> <a href={selectedJob.employer.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{selectedJob.employer.website}</a></p>}
                  </div>
                </div>
              )}

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg mb-6">
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase">Đơn ứng tuyển</p>
                  <p className="text-2xl font-black text-blue-600">{selectedJob.total_applications || 0}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase">Mã bài đăng</p>
                  <p className="text-lg font-bold text-blue-600">POST-{selectedJob.id}</p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={closeModal}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminJobs;
