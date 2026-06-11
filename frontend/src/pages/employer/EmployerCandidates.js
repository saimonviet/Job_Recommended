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
  pending: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
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

const ANALYTICS_CACHE_KEY_PREFIX = "employer_analytics_cache";

const clearEmployerAnalyticsCache = () => {
  const token = getEmployerToken();
  if (!token) return;
  sessionStorage.removeItem(`${ANALYTICS_CACHE_KEY_PREFIX}:${token}`);
};

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
      clearEmployerAnalyticsCache();
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
      clearEmployerAnalyticsCache();
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
                <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                  {seeker?.avatar_path ? (
                    <img
                      src={seeker.avatar_path}
                      alt={seeker.username}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-3xl">person</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {seeker?.username || "Ứng viên"}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{seeker?.email}</p>
                  {seeker?.desired_job && (
                    <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">{seeker.desired_job}</p>
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
                              <span key={`${index}-${skill}`} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
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
                  <p className="text-sm text-slate-700 dark:text-slate-300 bg-orange-50 dark:bg-orange-900/30 p-3 rounded-lg border border-orange-100 dark:border-orange-800">
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
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors"
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
                      className="text-xs text-orange-600 dark:text-orange-400 font-medium hover:underline"
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
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm text-slate-900 dark:text-white border-none outline-none focus:ring-2 focus:ring-orange-600/20 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveNote}
                        disabled={updatingStatus}
                        className="px-4 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700 disabled:opacity-60"
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
                            : "bg-orange-600 text-white hover:bg-orange-700"
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

function SearchCandidateModal({ candidate, onClose, onSendInvitation, sendingInviteId, selectedJob }) {
  if (!candidate) return null;

  const experienceItems = tryParseJsonArray(candidate.experience);
  const projectItems = tryParseJsonArray(candidate.target);
  const canInvite = selectedJob && !candidate.invitation && !candidate.application;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Hồ sơ ứng viên</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-slate-500">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
              {candidate.avatar_path ? (
                <img
                  src={candidate.avatar_path}
                  alt={candidate.username}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-3xl">person</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {candidate.username || "Ứng viên"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 break-all">{candidate.email}</p>
              {candidate.desired_job && (
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">{candidate.desired_job}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Số điện thoại", value: candidate.phone },
              { label: "Tuổi", value: candidate.age },
              { label: "Giới tính", value: candidate.gender },
              { label: "Học vấn", value: candidate.degree },
              { label: "Lương mong muốn", value: candidate.desired_salary },
              { label: "Nơi làm việc mong muốn", value: candidate.workplace_desired },
              { label: "Ngành quan tâm", value: candidate.industry },
              { label: "Tình trạng hôn nhân", value: candidate.marriage },
              {
                label: "Kinh nghiệm mong muốn",
                value: candidate.exp_min || candidate.exp_max
                  ? formatExperienceRange(candidate.exp_min, candidate.exp_max)
                  : null,
              },
            ].map(({ label, value }) =>
              value ? (
                <div key={label} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
                </div>
              ) : null
            )}
          </div>

          {candidate.skills && (
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Kỹ năng</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                {candidate.skills}
              </p>
            </div>
          )}

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
                          <span key={`${index}-${skill}`} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
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

          {projectItems.length > 0 ? (
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
          ) : candidate.target ? (
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Mục tiêu nghề nghiệp</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                {candidate.target}
              </p>
            </div>
          ) : null}

          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {selectedJob ? `Mời cho: ${selectedJob.job_title}` : "Chọn job để gửi lời mời"}
            </p>
            {candidate.application ? (
              <span className="inline-flex px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                Đã ứng tuyển
              </span>
            ) : candidate.invitation ? (
              <span className="inline-flex px-3 py-1.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                Đã mời
              </span>
            ) : (
              <button
                onClick={() => onSendInvitation(candidate.id)}
                disabled={!canInvite || sendingInviteId === candidate.id}
                className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-bold hover:bg-orange-700 disabled:opacity-60"
              >
                {sendingInviteId === candidate.id ? "Đang gửi..." : "Gửi lời mời"}
              </button>
            )}
          </div>
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

  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [error, setError] = useState("");
  const [modalAppId, setModalAppId] = useState(null);
  const [activeTab, setActiveTab] = useState("applicants");
  const [searchFilters, setSearchFilters] = useState({ q: "", industry: "", location: "" });
  const [candidateSearchResults, setCandidateSearchResults] = useState([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchPage, setSearchPage] = useState(1);
  const [searchPages, setSearchPages] = useState(1);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [sendingInviteId, setSendingInviteId] = useState(null);
  const [selectedSearchCandidate, setSelectedSearchCandidate] = useState(null);

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
        const res = await API.get("/employer/jobs", { params: { page: 1, per_page: 100 } });
        const list = res.data?.jobs || [];
        setJobs(list);
        // Ưu tiên job từ URL, nếu không có thì job đầu tiên
        if (urlJobId && list.some((j) => j.id === urlJobId)) {
          setSelectedJobId(urlJobId);
        } else if (list.length > 0) {
          setSelectedJobId(list[0].id);
        } else {
          setSelectedJobId(null);
        }
      } catch {
        setError("Không tải được danh sách việc làm.");
      } finally {
        setLoadingJobs(false);
      }
    };
    load();
  }, [navigate, urlJobId]);

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

  const handleSearchFilterChange = (field, value) => {
    setSearchFilters((prev) => ({ ...prev, [field]: value }));
    setSearchPage(1);
  };

  const searchCandidates = useCallback(async (pageOverride = searchPage) => {
    setSearchLoading(true);
    setSearchError("");

    const requestCandidates = (jobId) => API.get("/employer/candidates/search", {
      params: {
        page: pageOverride,
        per_page: 20,
        job_id: jobId || undefined,
        q: searchFilters.q,
        industry: searchFilters.industry,
        location: searchFilters.location,
      },
    });

    try {
      const res = await requestCandidates(selectedJobId);
      setCandidateSearchResults(res.data?.candidates || []);
      setSearchTotal(res.data?.total || 0);
      setSearchPages(res.data?.pages || 1);
      setSearchPage(res.data?.current_page || pageOverride);
    } catch (requestError) {
      if (selectedJobId) {
        try {
          const fallbackRes = await requestCandidates(null);
          setSelectedJobId(null);
          setCandidateSearchResults(fallbackRes.data?.candidates || []);
          setSearchTotal(fallbackRes.data?.total || 0);
          setSearchPages(fallbackRes.data?.pages || 1);
          setSearchPage(fallbackRes.data?.current_page || pageOverride);
          setSearchError("Job đã chọn không còn hợp lệ. Vui lòng chọn lại job trước khi gửi lời mời.");
        } catch (fallbackError) {
          setSearchError(fallbackError.message || requestError.message || "Không tải được danh sách ứng viên.");
          setCandidateSearchResults([]);
          setSearchTotal(0);
          setSearchPages(1);
        }
      } else {
        setSearchError(requestError.message || "Không tải được danh sách ứng viên.");
        setCandidateSearchResults([]);
        setSearchTotal(0);
        setSearchPages(1);
      }
    } finally {
      setSearchLoading(false);
    }
  }, [selectedJobId, searchFilters, searchPage]);

  const handleCandidateSearchSubmit = () => {
    setSearchPage(1);
    searchCandidates(1);
  };

  const handleSearchPageChange = (nextPage) => {
    const boundedPage = Math.min(Math.max(nextPage, 1), searchPages || 1);
    setSearchPage(boundedPage);
    searchCandidates(boundedPage);
  };
  useEffect(() => {
    if (activeTab === "search") {
      searchCandidates();
    }
  }, [activeTab, selectedJobId, searchCandidates]);

  const handleSendInvitation = async (candidateId) => {
    if (!selectedJobId) {
      alert("Vui lòng chọn job để gửi lời mời.");
      return;
    }

    setSendingInviteId(candidateId);
    try {
      const res = await API.post("/employer/invitations", {
        user_id: candidateId,
        job_id: selectedJobId,
        message: inviteMessage,
      });
      const invitation = res.data?.invitation || { status: "sent", sent_at: new Date().toISOString() };
      setCandidateSearchResults((prev) =>
        prev.map((candidate) =>
          candidate.id === candidateId ? { ...candidate, invitation } : candidate
        )
      );
      setSelectedSearchCandidate((prev) =>
        prev?.id === candidateId ? { ...prev, invitation } : prev
      );
    } catch (requestError) {
      alert(requestError.message || "Gửi lời mời thất bại.");
    } finally {
      setSendingInviteId(null);
    }
  };

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
              { label: "Tổng ứng viên", value: totalCandidates, color: "text-orange-600 dark:text-orange-400" },
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

          <div className="bg-white dark:bg-slate-800 rounded-xl p-2 shadow-sm mb-8 inline-flex gap-2">
            {[
              { key: "applicants", label: "Ứng viên đã nộp", icon: "assignment_ind" },
              { key: "search", label: "Tìm ứng viên", icon: "manage_search" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                  activeTab === tab.key
                    ? "bg-orange-600 text-white"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "applicants" && (
          <>
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
                      ? "bg-orange-600 dark:bg-orange-500 text-white"
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
                className="w-full max-w-xl bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-sm p-3 focus:ring-2 focus:ring-orange-600/20 text-slate-900 dark:text-white"
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
          </>
          )}

          {activeTab === "search" && (
            <div className="space-y-8">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Job mời tuyển dụng
                    </label>
                    <select
                      value={selectedJobId || ""}
                      onChange={(e) => { setSelectedJobId(Number(e.target.value)); setSearchPage(1); }}
                      className="w-full bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-sm p-3 focus:ring-2 focus:ring-orange-600/20 text-slate-900 dark:text-white"
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
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Từ khóa
                    </label>
                    <input
                      value={searchFilters.q}
                      onChange={(e) => handleSearchFilterChange("q", e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCandidateSearchSubmit()}
                      placeholder="Tên, kỹ năng, vị trí..."
                      className="w-full bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-sm p-3 focus:ring-2 focus:ring-orange-600/20 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Ngành nghề
                    </label>
                    <input
                      value={searchFilters.industry}
                      onChange={(e) => handleSearchFilterChange("industry", e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCandidateSearchSubmit()}
                      placeholder="CNTT, Kế toán..."
                      className="w-full bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-sm p-3 focus:ring-2 focus:ring-orange-600/20 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Khu vực
                    </label>
                    <input
                      value={searchFilters.location}
                      onChange={(e) => handleSearchFilterChange("location", e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCandidateSearchSubmit()}
                      placeholder="Hà Nội, Đà Nẵng..."
                      className="w-full bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-sm p-3 focus:ring-2 focus:ring-orange-600/20 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  rows="3"
                  placeholder="Nội dung lời mời gửi đến ứng viên..."
                  className="w-full bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-sm p-3 focus:ring-2 focus:ring-orange-600/20 text-slate-900 dark:text-white resize-none"
                />

                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {selectedJob ? `Đang mời cho: ${selectedJob.job_title}` : "Chọn job để gửi lời mời"}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Kết quả tìm kiếm</h2>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{searchTotal} ứng viên</span>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Ứng viên</th>
                      <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Mong muốn</th>
      
                      <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {searchLoading ? (
                      <tr>
                        <td className="px-6 py-10 text-slate-500 dark:text-slate-400" colSpan={4}>Đang tìm ứng viên...</td>
                      </tr>
                    ) : searchError ? (
                      <tr>
                        <td className="px-6 py-10 text-red-600 dark:text-red-400" colSpan={4}>{searchError}</td>
                      </tr>
                    ) : candidateSearchResults.length === 0 ? (
                      <tr>
                        <td className="px-6 py-10 text-slate-500 dark:text-slate-400" colSpan={4}>Chưa có kết quả phù hợp.</td>
                      </tr>
                    ) : (
                      candidateSearchResults.map((candidate) => {
                        const disabled = Boolean(candidate.invitation || candidate.application || sendingInviteId === candidate.id);
                        return (
                          <tr key={candidate.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                                  {candidate.avatar_path ? (
                                    <img src={candidate.avatar_path} alt={candidate.username} className="w-10 h-10 rounded-full object-cover" />
                                  ) : (
                                    <span className="material-symbols-outlined text-orange-600 dark:text-orange-400">person</span>
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900 dark:text-white">{candidate.username || "Ứng viên"}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">{candidate.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{candidate.desired_job || "Chưa cập nhật"}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{candidate.workplace_desired || candidate.industry || ""}</p>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedSearchCandidate(candidate)}
                                  className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600"
                                >
                                  Xem hồ sơ
                                </button>
                                {candidate.application ? (
                                  <span className="inline-flex px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    Đã ứng tuyển
                                  </span>
                                ) : candidate.invitation ? (
                                  <span className="inline-flex px-3 py-1.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                                    Đã mời
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleSendInvitation(candidate.id)}
                                    disabled={disabled}
                                    className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-bold hover:bg-orange-700 disabled:opacity-60"
                                  >
                                    {sendingInviteId === candidate.id ? "Đang gửi..." : "Gửi lời mời"}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                {searchPages > 1 && (
                  <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => handleSearchPageChange(searchPage - 1)}
                      disabled={searchLoading || searchPage <= 1}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-lg">chevron_left</span>
                      Trước
                    </button>
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Trang {searchPage} / {searchPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSearchPageChange(searchPage + 1)}
                      disabled={searchLoading || searchPage >= searchPages}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau
                      <span className="material-symbols-outlined text-lg">chevron_right</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "applicants" && (
          <>
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
                          <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                            {c.avatar ? (
                              <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-orange-600 dark:text-orange-400">person</span>
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
                          className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-400 font-semibold text-sm"
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
          </>
          )}
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
      {selectedSearchCandidate && (
        <SearchCandidateModal
          candidate={selectedSearchCandidate}
          onClose={() => setSelectedSearchCandidate(null)}
          onSendInvitation={handleSendInvitation}
          sendingInviteId={sendingInviteId}
          selectedJob={selectedJob}
        />
      )}
    </div>
  );
}

export default EmployerCandidates;
