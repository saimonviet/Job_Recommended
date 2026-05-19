import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import EmployerSideNavBar from "../../components/EmployerSideNavBar";
import EmployerTopNavBar from "../../components/EmployerTopNavBar";
import API from "../../services/api";
import { getEmployerToken } from "../../utils/authStorage";
import {
  PROVINCES_LIST,
  INDUSTRIES_LIST,
  EMPLOYMENT_TYPES,
  SALARY_RANGES,
} from "../../constants/dropdownOptions";

const TODAY = new Date();
const TODAY_DATE = new Date(TODAY.getTime() - TODAY.getTimezoneOffset() * 60000)
  .toISOString()
  .split("T")[0];

const SALARY_RANGE_MAP = {
  "0-5": { min: 0, max: 5000000 },
  "5-10": { min: 5000000, max: 10000000 },
  "10-15": { min: 10000000, max: 15000000 },
  "15-20": { min: 15000000, max: 20000000 },
  "20-30": { min: 20000000, max: 30000000 },
  "30-50": { min: 30000000, max: 50000000 },
  "50+": { min: 50000000, max: null },
  negotiate: { min: null, max: null },
};

const normalizeSalary = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return null;
  return numeric > 1000 ? numeric : numeric * 1000000;
};

const getSalaryRangeKey = (salaryMin, salaryMax) => {
  const normalizedMin = normalizeSalary(salaryMin);
  const normalizedMax = normalizeSalary(salaryMax);

  const entries = Object.entries(SALARY_RANGE_MAP);
  for (const [key, range] of entries) {
    if (key === "negotiate") {
      if (normalizedMin === null && normalizedMax === null) return key;
      continue;
    }

    if (key === "50+") {
      if (normalizedMin === 50000000 && normalizedMax === null) return key;
      continue;
    }

    if (range.min === normalizedMin && range.max === normalizedMax) {
      return key;
    }
  }

  return "custom";
};

function EmployerJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // '' | 'active' | 'inactive'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const PER_PAGE = 10;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
  const token = getEmployerToken();

  // Cache management functions
  const getCacheKey = useCallback((tokenValue, pageNum, filterStatus) => {
    return `employer_jobs_cache:${tokenValue || "anonymous"}_p${pageNum}_${filterStatus || "all"}`;
  }, []);

  const getCachedJobs = useCallback((tokenValue, pageNum, filterStatus) => {
    try {
      const cacheKey = getCacheKey(tokenValue, pageNum, filterStatus);
      const cached = sessionStorage.getItem(cacheKey);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > CACHE_DURATION;

      if (isExpired) {
        sessionStorage.removeItem(cacheKey);
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }, [getCacheKey]);

  const setCachedJobs = useCallback((tokenValue, data, pageNum, filterStatus) => {
    try {
      const cacheKey = getCacheKey(tokenValue, pageNum, filterStatus);
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      );
    } catch {
      // Silently fail if sessionStorage is full
    }
  }, [getCacheKey]);

  const clearJobsCache = useCallback((tokenValue) => {
    // Clear only the active employer's job cache entries
    const prefix = `employer_jobs_cache:${tokenValue || "anonymous"}_`;
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(prefix)) {
        sessionStorage.removeItem(key);
      }
    }
  }, []);

  useEffect(() => {
    const token = getEmployerToken();
    if (!token) navigate("/login-employer");
  }, [navigate]);

  const loadJobs = useCallback(async (forceRefresh = false) => {
    const currentToken = getEmployerToken();
    if (!currentToken) {
      navigate("/login-employer");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedData = getCachedJobs(currentToken, page, statusFilter);
        if (cachedData) {
          setJobs(cachedData.jobs || []);
          setTotalPages(cachedData.pages || 1);
          setTotalJobs(cachedData.total || 0);
          setLoading(false);
          return;
        }
      }

      const params = { page, per_page: PER_PAGE };
      if (statusFilter) params.status = statusFilter;

      const response = await API.get("/employer/jobs", { params });
      const data = {
        jobs: response.data?.jobs || [],
        pages: response.data?.pages || 1,
        total: response.data?.total || 0,
      };

      setJobs(data.jobs);
      setTotalPages(data.pages);
      setTotalJobs(data.total);

      // Cache the result
      setCachedJobs(currentToken, data, page, statusFilter);
    } catch (err) {
      setError("Không tải được danh sách việc làm.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, navigate, getCachedJobs, setCachedJobs]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleFilterChange = (value) => {
    setStatusFilter(value);
    setPage(1); // Reset to page 1 when filter changes
  };

  const handleToggleActive = async (job) => {
    try {
      await API.put(`/employer/jobs/${job.id}`, { is_active: !job.is_active });
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, is_active: !j.is_active } : j))
      );
      clearJobsCache(token); // Clear cache when status changes
    } catch {
      alert("Không thể thay đổi trạng thái bài đăng.");
    }
  };

  const handleDeleteJob = async (job) => {
    if (!window.confirm(`Xác nhận xóa bài đăng "${job.job_title}"?`)) return;
    try {
      const response = await API.delete(`/employer/jobs/${job.id}`);
      alert(response.data?.message || "Đã xử lý.");
      clearJobsCache(token); // Clear cache when job is deleted
      loadJobs(true); // Force refresh after deletion
    } catch (err) {
      console.error('Delete job error:', err);
      alert(err.message || "Không thể xóa bài đăng.");
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("vi-VN");
  };

  const handleOpenEditModal = async (job) => {
    setEditLoading(true);
    try {
      const response = await API.get(`/employer/jobs/${job.id}`);
      const jobDetail = response.data;
      setEditFormData({
        id: jobDetail.id,
        job_title: jobDetail.job_title || "",
        salary_min: jobDetail.salary_min || "",
        salary_max: jobDetail.salary_max || "",
        salary_band: getSalaryRangeKey(jobDetail.salary_min, jobDetail.salary_max),
        job_address: jobDetail.job_address || "",
        employment_type: jobDetail.employment_type || "",
        deadline: jobDetail.deadline ? jobDetail.deadline.substring(0, 10) : "",
        job_description: jobDetail.job_description || "",
        job_requirement: jobDetail.job_requirement || "",
        benefits: jobDetail.benefits || "",
        exp_min: jobDetail.exp_min || "",
        exp_max: jobDetail.exp_max || "",
        job_function: jobDetail.job_function || "",
        industries: jobDetail.industries || "",
        job_detail_address: jobDetail.job_detail_address || "",
      });
      setShowEditModal(true);
    } catch (err) {
      alert("Không thể tải chi tiết job");
    } finally {
      setEditLoading(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditFormData({});
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSalaryBandChange = (value) => {
    const range = SALARY_RANGE_MAP[value];
    setEditFormData((prev) => ({
      ...prev,
      salary_band: value,
      salary_min: range ? (range.min === null ? "" : String(range.min)) : prev.salary_min,
      salary_max: range ? (range.max === null ? "" : String(range.max)) : prev.salary_max,
    }));
  };

  const handleSaveEdit = async () => {
    if (!editFormData.job_title || !editFormData.job_title.trim()) {
      alert("Tên công việc không được để trống");
      return;
    }

    const expMin = editFormData.exp_min ? parseInt(editFormData.exp_min, 10) : null;
    const expMax = editFormData.exp_max ? parseInt(editFormData.exp_max, 10) : null;
    if (expMin !== null && (Number.isNaN(expMin) || expMin < 0)) {
      alert("Kinh nghiệm tối thiểu phải lớn hơn hoặc bằng 0");
      return;
    }
    if (expMax !== null && (Number.isNaN(expMax) || expMax < 0)) {
      alert("Kinh nghiệm tối đa phải lớn hơn hoặc bằng 0");
      return;
    }
    if (expMin !== null && expMax !== null && expMax < expMin) {
      alert("Kinh nghiệm tối đa phải lớn hơn hoặc bằng kinh nghiệm tối thiểu");
      return;
    }

    setEditLoading(true);
    try {
      const salaryRange = SALARY_RANGE_MAP[editFormData.salary_band];
      const saveData = {
        job_title: editFormData.job_title,
        salary_min: editFormData.salary_band && editFormData.salary_band !== "custom"
          ? salaryRange?.min
          : (editFormData.salary_min ? parseInt(editFormData.salary_min) : null),
        salary_max: editFormData.salary_band && editFormData.salary_band !== "custom"
          ? salaryRange?.max
          : (editFormData.salary_max ? parseInt(editFormData.salary_max) : null),
        job_address: editFormData.job_address,
        employment_type: editFormData.employment_type,
        deadline: editFormData.deadline || null,
        job_description: editFormData.job_description,
        job_requirement: editFormData.job_requirement,
        benefits: editFormData.benefits,
        exp_min: expMin,
        exp_max: expMax,
        job_function: editFormData.job_function,
        industries: editFormData.industries,
        job_detail_address: editFormData.job_detail_address,
      };

      await API.put(`/employer/jobs/${editFormData.id}`, saveData);
      alert("Cập nhật job thành công");
      clearJobsCache(token);
      loadJobs(true);
      handleCloseEditModal();
    } catch (err) {
      console.error('Update job error:', err);
      alert(err.message || "Không thể cập nhật job");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <EmployerSideNavBar />
      <EmployerTopNavBar />

      <main className="ml-64 w-full">

        <div className="pt-20 p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsRefreshing(true);
                  clearJobsCache(token);
                  loadJobs(true).finally(() => setIsRefreshing(false));
                }}
                disabled={isRefreshing || loading}
                className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-bold text-sm shadow-lg transition-all disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-lg ${isRefreshing || loading ? "animate-spin" : ""}`}>
                  refresh
                </span>
                Làm mới
              </button>
              <button
                onClick={() => navigate("/employer/post")}
                className="flex items-center gap-2 bg-gradient-to-br from-blue-600 to-blue-500 text-white px-6 py-3 rounded-lg font-bold text-sm shadow-lg hover:shadow-blue-600/20 transition-all"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Đăng tin mới
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="pt-4 pb-4">

            <div className="flex flex-wrap gap-2">
              {[
                { label: "Tất cả", value: "" },
                { label: "Đang đăng", value: "active" },
                { label: "Đã đóng", value: "inactive" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleFilterChange(opt.value)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    statusFilter === opt.value
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Tên công việc</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Ngày đăng</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Hạn nộp</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest text-center">Ứng tuyển</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Trạng thái</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {loading ? (
                  <tr>
                    <td className="px-6 py-10 text-slate-500 dark:text-slate-400" colSpan={6}>
                      Đang tải...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td className="px-6 py-10 text-red-600 dark:text-red-400" colSpan={6}>
                      {error}
                    </td>
                  </tr>
                ) : jobs.length === 0 ? (
                  <tr>
                    <td className="px-6 py-10 text-slate-500 dark:text-slate-400" colSpan={6}>
                      Chưa có bài đăng nào.
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                      <td className="px-6 py-5">
                        <h4 className="font-bold text-blue-600 dark:text-blue-400 text-sm group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                          {job.job_title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {job.employment_type || "—"} • {job.job_address || "—"}
                        </p>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400">
                        {formatDate(job.created_at)}
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400">
                        {formatDate(job.deadline)}
                      </td>
                      <td className="px-6 py-5 text-sm text-center font-semibold text-slate-900 dark:text-white">
                        <button
                          onClick={() => navigate(`/employer/candidates?job=${job.id}`)}
                          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          {job.total_applications ?? 0}
                        </button>
                      </td>
                      <td className="px-6 py-5">
                        <button
                          onClick={() => handleToggleActive(job)}
                          className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                            job.is_active
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200"
                              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200"
                          }`}
                          title="Nhấn để đổi trạng thái"
                        >
                          {job.is_active ? "Đang đăng" : "Đã đóng"}
                        </button>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex gap-3 justify-end">
                          <button
                            onClick={() => navigate(`/employer/candidates?job=${job.id}`)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold text-sm"
                          >
                            Ứng viên
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(job)}
                            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold text-sm"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteJob(job)}
                            className="text-red-500 dark:text-red-400 hover:text-red-700 font-semibold text-sm"
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
            <div className="flex justify-center items-center gap-3 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-semibold disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                ← Trước
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Trang {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-semibold disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Sau →
              </button>
            </div>
          )}
        </div>

        {/* Edit Job Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-3xl w-full max-h-screen overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-8 py-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  Sửa bài đăng tuyển dụng
                </h2>
                <button
                  onClick={handleCloseEditModal}
                  disabled={editLoading}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-2xl disabled:opacity-50"
                >
                  ✕
                </button>
              </div>

              <div className="px-8 py-6 space-y-4">
                {/* Row 1: Job Title */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Tên công việc *
                  </label>
                  <input
                    type="text"
                    value={editFormData.job_title || ""}
                    onChange={(e) => handleEditFormChange("job_title", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                {editFormData.salary_band === "custom" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Lương tối thiểu
                      </label>
                      <input
                        type="number"
                        value={editFormData.salary_min || ""}
                        onChange={(e) => handleEditFormChange("salary_min", e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Lương tối đa
                      </label>
                      <input
                        type="number"
                        value={editFormData.salary_max || ""}
                        onChange={(e) => handleEditFormChange("salary_max", e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Row 3: Address & Detail Address */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Tỉnh/Thành phố
                  </label>
                  <select
                    value={editFormData.job_address || ""}
                    onChange={(e) => handleEditFormChange("job_address", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">Chọn tỉnh/thành phố</option>
                    {PROVINCES_LIST.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Chi tiết địa chỉ
                  </label>
                  <input
                    type="text"
                    value={editFormData.job_detail_address || ""}
                    onChange={(e) => handleEditFormChange("job_detail_address", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Row 4: Employment Type & Deadline */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Hình thức làm việc
                    </label>
                    <select
                      value={editFormData.employment_type || ""}
                      onChange={(e) => handleEditFormChange("employment_type", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="">Chọn hình thức</option>
                      {EMPLOYMENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Hạn nộp
                    </label>
                    <input
                      type="date"
                      min={TODAY_DATE}
                      value={editFormData.deadline || ""}
                      onChange={(e) => handleEditFormChange("deadline", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Row 5: Experience */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Kinh nghiệm tối thiểu (năm)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={editFormData.exp_min || ""}
                      onChange={(e) => handleEditFormChange("exp_min", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Kinh nghiệm tối đa (năm)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={editFormData.exp_max || ""}
                      onChange={(e) => handleEditFormChange("exp_max", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Row 6: Job Function & Industries */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Chức năng công việc
                    </label>
                    <input
                      type="text"
                      value={editFormData.job_function || ""}
                      onChange={(e) => handleEditFormChange("job_function", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Ngành nghề
                    </label>
                    <select
                      value={editFormData.industries || ""}
                      onChange={(e) => handleEditFormChange("industries", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="">Chọn ngành nghề</option>
                      {INDUSTRIES_LIST.map((industry) => (
                        <option key={industry} value={industry}>
                          {industry}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 7: Description */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Mô tả công việc
                  </label>
                  <textarea
                    value={editFormData.job_description || ""}
                    onChange={(e) => handleEditFormChange("job_description", e.target.value)}
                    rows="4"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Row 8: Requirements */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Yêu cầu công việc
                  </label>
                  <textarea
                    value={editFormData.job_requirement || ""}
                    onChange={(e) => handleEditFormChange("job_requirement", e.target.value)}
                    rows="4"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Row 9: Benefits */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Quyền lợi
                  </label>
                  <textarea
                    value={editFormData.benefits || ""}
                    onChange={(e) => handleEditFormChange("benefits", e.target.value)}
                    rows="3"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-8 py-4 flex justify-end gap-3">
                <button
                  onClick={handleCloseEditModal}
                  disabled={editLoading}
                  className="px-6 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={editLoading}
                  className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {editLoading && <span className="animate-spin">⟳</span>}
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default EmployerJobs;