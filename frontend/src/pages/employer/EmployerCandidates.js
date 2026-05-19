import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import EmployerSideNavBar from "../../components/EmployerSideNavBar";
import API from "../../services/api";
import { getEmployerToken } from "../../utils/authStorage";
import EmployerTopNavBar from "../../components/EmployerTopNavBar";
import { formatExperienceRange } from "../../utils/dataFormatter";

const STATUS_OPTIONS = ["Tất cả", "pending", "reviewed", "interview", "accepted", "rejected"];

const STATUS_LABEL = {
  pending: "Mới",
  reviewed: "Xem xét",
  interview: "Phỏng vấn",
  accepted: "Đã tuyển",
  rejected: "Từ chối",
};

const STATUS_STYLE = {
  pending: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  reviewed: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
  interview: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  accepted: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  rejected: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
};

const NEXT_STATUSES = {
  pending: ["reviewed", "rejected"],
  reviewed: ["interview", "rejected"],
  interview: ["accepted", "rejected"],
  accepted: [],
  rejected: [],
};

const JOBS_CACHE_KEY_PREFIX = "employer_candidates_jobs_cache";
const JOBS_CACHE_DURATION = 24 * 60 * 60 * 1000;

const fmtDate = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d) ? v : d.toLocaleDateString("vi-VN");
};

const tryParseJsonArray = (value) => {
  if (!value || typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const describeExperience = (exp) => {
  if (!exp || typeof exp !== "object") return "";
  const parts = [exp.company, exp.position, exp.startDate, exp.endDate].filter(Boolean);
  return parts.join(" • ");
};

// ---------------------------------------------------------------------------
// Modal xem hồ sơ ứng viên
// ---------------------------------------------------------------------------
function CandidateModal({ appId, onClose, onStatusChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [note, setNote] = useState("");
  const [noteEditing, setNoteEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await API.get(`/employer/applications/${appId}`);
        if (!cancelled) {
          setData(res.data);
          setNote(res.data.employer_note || "");
        }
      } catch {
        if (!cancelled) setError("Không tải được thông tin ứng viên.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [appId]);

  const handleUpdateStatus = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await API.put(`/employer/applications/${appId}/status`, {
        status: newStatus,
        employer_note: note,
      });
      setData((prev) => ({ ...prev, status: newStatus, employer_note: note }));
      onStatusChange(appId, newStatus, note);
      setNoteEditing(false);
    } catch {
      alert("Cập nhật trạng thái thất bại.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveNote = async () => {
    setUpdatingStatus(true);
    try {
      await API.put(`/employer/applications/${appId}/status`, {
        status: data.status,
        employer_note: note,
      });
      setData((prev) => ({ ...prev, employer_note: note }));
      onStatusChange(appId, data.status, note);
      setNoteEditing(false);
    } catch {
      alert("Lưu ghi chú thất bại.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const seeker = data?.seeker;
  const nextStatuses = NEXT_STATUSES[data?.status] || [];
  const experienceItems = tryParseJsonArray(seeker?.experience);
  const projectItems = tryParseJsonArray(seeker?.target);

  return (
    
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Hồ sơ ứng viên</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-slate-500">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-500 dark:text-slate-400">
              <span className="animate-spin material-symbols-outlined text-3xl mr-3">progress_activity</span>
              Đang tải...
            </div>
          ) : error ? (
            <p className="text-red-600 dark:text-red-400 py-8 text-center">{error}</p>
          ) : (
            <div className="space-y-6">
              {/* Seeker Info */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  {seeker?.avatar_path ? (
                    <img
                      src={seeker.avatar_path}
                      alt={seeker.username}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-3xl">person</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {seeker?.username || "Ứng viên"}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{seeker?.email}</p>
                  {seeker?.desired_job && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">🎯 {seeker.desired_job}</p>
                  )}
                  {/* Current Status Badge */}
                  <span
                    className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                      STATUS_STYLE[data.status] || "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {STATUS_LABEL[data.status] || data.status}
                  </span>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Số điện thoại", value: seeker?.phone },
                  { label: "Tuổi", value: seeker?.age },
                  { label: "Giới tính", value: seeker?.gender },
                  { label: "Học vấn", value: seeker?.degree },
                  { label: "Lương mong muốn", value: seeker?.desired_salary },
                  { label: "Nơi làm việc mong muốn", value: seeker?.workplace_desired },
                  { label: "Ngành quan tâm", value: seeker?.industry },
                  { label: "Tình trạng hôn nhân", value: seeker?.marriage },
                  { label: "Kinh nghiệm mong muốn", value: seeker?.exp_min || seeker?.exp_max ? formatExperienceRange(seeker?.exp_min, seeker?.exp_max) : null },
                ].map(({ label, value }) =>
                  value ? (
                    <div key={label} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
                    </div>
                  ) : null
                )}
              </div>

              {/* Skills */}
              {seeker?.skills && (
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Kỹ năng</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                    {seeker.skills}
                  </p>
                </div>
              )}

              {/* Experience */}
              {experienceItems.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Kinh nghiệm làm việc</p>
                  <div className="space-y-3">
                    {experienceItems.map((exp, index) => (
                      <div key={exp.id || index} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{exp.position || "Chưa có chức vụ"}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{exp.company || "Chưa có công ty"}</p>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 text-right">
                            {exp.startDate || exp.endDate ? `${exp.startDate || "?"} - ${exp.endDate || "Hiện tại"}` : ""}
                          </span>
                        </div>
                        {exp.description && (
                          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{exp.description}</p>
                        )}
                        {Array.isArray(exp.skills) && exp.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {exp.skills.map((skill) => (
                              <span key={`${index}-${skill}`} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {projectItems.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Dự án</p>
                  <div className="space-y-3">
                    {projectItems.map((project, index) => (
                      <div key={project.id || index} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{project.title || "Dự án chưa đặt tên"}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{project.role || "Chưa rõ vai trò"}</p>
                          </div>
                          {project.year && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">{project.year}</span>
                          )}
                        </div>
                        {project.description && (
                          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{project.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Target / Bio */}
              {seeker?.target && !projectItems.length && (
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Mục tiêu nghề nghiệp</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                    {seeker.target}
                  </p>
                </div>
              )}

              {/* Cover Letter */}
              {data.cover_letter && (
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Thư xin việc</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                    {data.cover_letter}
                  </p>
                </div>
              )}

              {/* CV Link */}
              {data.cv_path && (
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">CV đính kèm</p>
                  <a
                    href={data.cv_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">download</span>
                    Tải CV
                  </a>
                </div>
              )}

              {/* Applied At */}
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Nộp lúc: <span className="font-semibold">{fmtDate(data.applied_at)}</span>
              </div>

              {/* Employer Note */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ghi chú nội bộ</p>
                  {!noteEditing && (
                    <button
                      onClick={() => setNoteEditing(true)}
                      className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
                    >
                      {note ? "Chỉnh sửa" : "Thêm ghi chú"}
                    </button>
                  )}
                </div>
                {noteEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows="3"
                      placeholder="Ghi chú về ứng viên này..."
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm text-slate-900 dark:text-white border-none outline-none focus:ring-2 focus:ring-blue-600/20 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveNote}
                        disabled={updatingStatus}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-60"
                      >
                        Lưu
                      </button>
                      <button
                        onClick={() => { setNote(data.employer_note || ""); setNoteEditing(false); }}
                        className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-300"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : note ? (
                  <p className="text-sm text-slate-700 dark:text-slate-300 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                    {note}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 dark:text-slate-500 italic">Chưa có ghi chú.</p>
                )}
              </div>

              {/* Action Buttons — chuyển trạng thái */}
              {nextStatuses.length > 0 && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Chuyển trạng thái</p>
                  <div className="flex flex-wrap gap-2">
                    {nextStatuses.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleUpdateStatus(s)}
                        disabled={updatingStatus}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-60 ${
                          s === "rejected"
                            ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {updatingStatus ? "..." : `→ ${STATUS_LABEL[s]}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
function EmployerCandidates() {
  const navigate = useNavigate();
  const location = useLocation();
  const employerCacheKey = `${JOBS_CACHE_KEY_PREFIX}:${getEmployerToken() || "anonymous"}`;

  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [error, setError] = useState("");
  const [modalAppId, setModalAppId] = useState(null);

  // Đọc ?job=<id> từ URL (navigate từ EmployerJobs)
  const urlJobId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const v = params.get("job");
    return v ? Number(v) : null;
  }, [location.search]);

  // Load jobs
  useEffect(() => {
    const token = getEmployerToken();
    if (!token) { navigate("/login-employer"); return; }

    const load = async () => {
      setLoadingJobs(true);
      setError("");

      try {
        const rawCached = localStorage.getItem(employerCacheKey);
        if (rawCached) {
          const cached = JSON.parse(rawCached);
          const isExpired = Date.now() - cached.timestamp > JOBS_CACHE_DURATION;
          if (!isExpired && Array.isArray(cached.jobs)) {
            const list = cached.jobs;
            setJobs(list);
            if (urlJobId && list.some((j) => j.id === urlJobId)) {
              setSelectedJobId(urlJobId);
            } else if (list.length > 0) {
              setSelectedJobId(list[0].id);
            }
            setLoadingJobs(false);
            return;
          }
          localStorage.removeItem(employerCacheKey);
        }
      } catch {
        localStorage.removeItem(employerCacheKey);
      }

      try {
        const res = await API.get("/employer/jobs", { params: { page: 1, per_page: 100 } });
        const list = res.data?.jobs || [];
        setJobs(list);
        localStorage.setItem(
          employerCacheKey,
          JSON.stringify({ jobs: list, timestamp: Date.now() })
        );
        // Ưu tiên job từ URL, nếu không có thì job đầu tiên
        if (urlJobId && list.some((j) => j.id === urlJobId)) {
          setSelectedJobId(urlJobId);
        } else if (list.length > 0) {
          setSelectedJobId(list[0].id);
        }
      } catch {
        setError("Không tải được danh sách việc làm.");
      } finally {
        setLoadingJobs(false);
      }
    };
    load();
  }, [employerCacheKey, navigate, urlJobId]);

  // Load candidates khi selectedJobId thay đổi
  const loadCandidates = useCallback(async () => {
    if (!selectedJobId) { setCandidates([]); return; }
    setLoadingCandidates(true);
    setError("");
    try {
      const res = await API.get(`/employer/jobs/${selectedJobId}/applicants`, {
        params: { page: 1, per_page: 100 },
      });
      const list = res.data?.applicants || [];
      const jobTitle = res.data?.job_title || jobs.find((j) => j.id === selectedJobId)?.job_title || "—";
      setCandidates(
        list.map((app) => ({
          id: app.id,
          name: app.seeker?.username || app.seeker?.email || `Ứng viên #${app.user_id}`,
          position: jobTitle,
          status: app.status || "pending",
          appliedAt: app.applied_at,
          email: app.seeker?.email || "",
          avatar: app.seeker?.avatar_path || "",
        }))
      );
    } catch {
      setError("Không tải được danh sách ứng viên.");
      setCandidates([]);
    } finally {
      setLoadingCandidates(false);
    }
  }, [selectedJobId, jobs]);

  useEffect(() => { loadCandidates(); }, [loadCandidates]);

  // Callback khi modal cập nhật status
  const handleStatusChange = useCallback((appId, newStatus, newNote) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === appId ? { ...c, status: newStatus } : c))
    );
  }, []);

  const selectedJob = useMemo(() => jobs.find((j) => j.id === selectedJobId) || null, [jobs, selectedJobId]);

  const filtered = useMemo(() => {
    if (statusFilter === "Tất cả") return candidates;
    return candidates.filter((c) => c.status === statusFilter);
  }, [candidates, statusFilter]);

  const totalCandidates = candidates.length;
  const pendingCount = candidates.filter((c) => c.status === "pending").length;
  const interviewCount = candidates.filter((c) => c.status === "interview").length;
  const hiredCount = candidates.filter((c) => c.status === "accepted").length;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <EmployerSideNavBar />
      <EmployerTopNavBar />

      <main className="ml-64 w-full">

        <div className="pt-20 p-8 max-w-7xl mx-auto">

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {[
              { label: "Tổng ứng viên", value: totalCandidates, color: "text-blue-600 dark:text-blue-400" },
              { label: "Chờ xử lý", value: pendingCount, color: "text-slate-900 dark:text-white" },
              { label: "Đang phỏng vấn", value: interviewCount, color: "text-purple-600 dark:text-purple-400" },
              { label: "Đã tuyển", value: hiredCount, color: "text-emerald-600 dark:text-emerald-400" },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2">{label}</p>
                <p className={`text-3xl font-black ${color}`}>{value}</p>
                <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 font-medium">{sub}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm mb-8 space-y-4">
            {/* Status filter pills */}
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    statusFilter === s
                      ? "bg-blue-600 dark:bg-blue-500 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                  }`}
                >
                  {s === "Tất cả" ? s : STATUS_LABEL[s]}
                </button>
              ))}
            </div>

            {/* Job selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Job đang xem
              </label>
              <select
                value={selectedJobId || ""}
                onChange={(e) => setSelectedJobId(Number(e.target.value))}
                className="w-full max-w-xl bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-sm p-3 focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white"
              >
                {loadingJobs ? (
                  <option>Đang tải...</option>
                ) : jobs.length > 0 ? (
                  jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.job_title}
                    </option>
                  ))
                ) : (
                  <option value="">Không có job</option>
                )}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Ứng viên</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Vị trí</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Trạng thái</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Nộp lúc</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {loadingCandidates ? (
                  <tr>
                    <td className="px-6 py-10 text-slate-500 dark:text-slate-400" colSpan={5}>Đang tải ứng viên...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td className="px-6 py-10 text-red-600 dark:text-red-400" colSpan={5}>{error}</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="px-6 py-10 text-slate-500 dark:text-slate-400" colSpan={5}>
                      {candidates.length === 0 ? "Chưa có ứng viên nào." : "Không có ứng viên với trạng thái này."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            {c.avatar ? (
                              <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">person</span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{c.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-semibold text-slate-900 dark:text-white">{c.position}</td>
                      <td className="px-6 py-5">
                        <span
                          className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold ${
                            STATUS_STYLE[c.status] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {STATUS_LABEL[c.status] || c.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400">{fmtDate(c.appliedAt)}</td>
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={() => setModalAppId(c.id)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold text-sm"
                        >
                          Xem hồ sơ
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Candidate Detail Modal */}
      {modalAppId && (
        <CandidateModal
          appId={modalAppId}
          onClose={() => setModalAppId(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

export default EmployerCandidates;