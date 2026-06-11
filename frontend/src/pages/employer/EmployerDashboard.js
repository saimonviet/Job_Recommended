import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EmployerSideNavBar from "../../components/EmployerSideNavBar";
import EmployerTopNavBar from "../../components/EmployerTopNavBar";
import API from "../../services/api";
import { getEmployerToken } from "../../utils/authStorage";

const DASHBOARD_CACHE_KEY_PREFIX = "employer_dashboard_cache_v3";
const DASHBOARD_CACHE_DURATION = 5 * 60 * 1000;

const getDashboardCacheKey = (token) => `${DASHBOARD_CACHE_KEY_PREFIX}:${token || "anonymous"}`;

const readDashboardCache = (token) => {
  try {
    const raw = sessionStorage.getItem(getDashboardCacheKey(token));
    if (!raw) return null;

    const cached = JSON.parse(raw);
    if (Date.now() - cached.timestamp > DASHBOARD_CACHE_DURATION) {
      sessionStorage.removeItem(getDashboardCacheKey(token));
      return null;
    }

    return cached.data || null;
  } catch {
    return null;
  }
};

const writeDashboardCache = (token, data) => {
  try {
    sessionStorage.setItem(
      getDashboardCacheKey(token),
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {
    // ignore storage quota errors
  }
};

const buildFallbackWeeklyApplications = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const labels = [];
  const values = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    labels.push(date.toISOString().slice(0, 10));
    values.push(0);
  }

  return { labels, values };
};

const formatChartDate = (dateKey) => {
  if (!dateKey) return "";
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) return dateKey;

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
};

function EmployerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const weeklyApplications =
    stats?.weeklyApplications?.labels?.length
      ? stats.weeklyApplications
      : buildFallbackWeeklyApplications();
  const chartValues = weeklyApplications.values || [];
  const maxValue = Math.max(...chartValues, 1);
  const totalWeeklyApplications = chartValues.reduce((sum, value) => sum + (value || 0), 0);

  useEffect(() => {
    const token = getEmployerToken();
    if (!token) {
      navigate("/login-employer");
      return;
    }

    let cancelled = false;

    const cached = readDashboardCache(token);
    if (cached) {
      setStats(cached.stats || null);
      setRecentJobs(cached.recentJobs || []);
      setLoadingStats(false);
      return () => { cancelled = true; };
    }

    const loadDashboard = async () => {
      try {
        // Load profile + jobs + analytics concurrently
        const [, jobsRes, analyticsRes] = await Promise.allSettled([
          API.get("/auth/me"),
          API.get("/employer/jobs", { params: { page: 1, per_page: 100 } }),
          API.get("/employer/analytics"),
        ]);

        if (cancelled) return;

        // Jobs stats
        if (jobsRes.status === "fulfilled") {
          const jobs = jobsRes.value.data?.jobs || [];
          const activeJobs = jobs.filter((j) => j.is_active);
          const totalApplications = jobs.reduce(
            (sum, j) => sum + (j.total_applications || 0),
            0
          );

          const weeklyData = analyticsRes.status === "fulfilled"
            ? analyticsRes.value.data?.weekly_applications
            : null;
          const analyticsKpis = analyticsRes.status === "fulfilled"
            ? analyticsRes.value.data?.kpis
            : null;
          const nextStats = {
            activePostings: activeJobs.length,
            totalJobs: jobs.length,
            newApplications: totalApplications,
            reviewedApplications: analyticsKpis?.reviewed_applications_count || 0,
            weeklyApplications: {
              labels: weeklyData?.labels || [],
              values: weeklyData?.values || [],
            },
          };

          setStats(nextStats);

          // Top 5 jobs by applications for "recent" panel
          const sorted = [...jobs]
            .sort((a, b) => (b.total_applications || 0) - (a.total_applications || 0))
            .slice(0, 5);
          setRecentJobs(sorted);

          writeDashboardCache(token, {
            stats: nextStats,
            recentJobs: sorted,
          });
        }
      } catch {
        // silently fail — UI shows placeholders
      } finally {
        if (!cancelled) setLoadingStats(false);
      }
    };

    loadDashboard();
    return () => { cancelled = true; };
  }, [navigate]);


  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <EmployerSideNavBar />
      <EmployerTopNavBar />

      <main className="ml-64 w-full">

        <div className="pt-20 p-5 max-w-7xl mx-auto">

          {/* Action Buttons */}
          <div className="flex gap-3 mb-5">
            <button
              onClick={() => navigate("/employer/analytics")}
              className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              <span className="material-symbols-outlined text-lg">description</span>
              Xem phân tích
            </button>
            <button
              onClick={() => navigate("/employer/post")}
              className="flex items-center gap-2 bg-gradient-to-br from-orange-600 to-orange-500 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:shadow-lg transition-all"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Đăng tin mới
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
            {/* Active Postings */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                  <span className="material-symbols-outlined text-xl">campaign</span>
                </div>
              </div>
              <h3 className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-0.5">Bài đăng</h3>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {loadingStats ? "—" : stats?.activePostings ?? 0}
              </p>
            </div>

            {/* Total Applications */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                  <span className="material-symbols-outlined text-xl">person_add</span>
                </div>
              </div>
              <h3 className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-0.5">Tổng lượt ứng tuyển</h3>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {loadingStats ? "—" : stats?.newApplications ?? 0}
              </p>
            </div>

            {/* Reviewed Applications */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2.5 bg-sky-100 dark:bg-sky-900/30 rounded-lg text-sky-600 dark:text-sky-400">
                  <span className="material-symbols-outlined text-xl">fact_check</span>
                </div>
              </div>
              <h3 className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-0.5">CV đã duyệt</h3>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {loadingStats ? "—" : stats?.reviewedApplications ?? 0}
              </p>
            </div>

            {/* Navigate to Candidates */}
            <div
              onClick={() => navigate("/employer/candidates")}
              className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <span className="material-symbols-outlined text-xl">groups</span>
                </div>
                <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors">
                  arrow_forward
                </span>
              </div>
              <h3 className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-0.5">Quản lý ứng viên</h3>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">Xem tất cả ứng viên →</p>
            </div>
          </div>

          {/* Charts & Top Jobs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[440px]">
            {/* Placeholder Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Thống kê 7 ngày gần nhất
                  </p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {loadingStats ? "—" : totalWeeklyApplications}
                    <span className="ml-2 text-sm font-semibold text-slate-500 dark:text-slate-400">CV mới</span>
                  </p>
                </div>
              </div>
              <div className="flex-1 min-h-0 flex items-end justify-between gap-3 px-2">
                {chartValues.map((value, idx) => {
                  const pct = Math.round(((value || 0) / maxValue) * 100);
                  return (
                    <div key={idx} className="flex-1 h-full flex flex-col items-center justify-end gap-2">
                      <div
                        className="relative w-full bg-orange-200 dark:bg-orange-900/30 rounded-t-lg transition-all duration-500 hover:bg-orange-700 group"
                        style={{ height: `${pct}%`, minHeight: 16 }}
                        title={`${formatChartDate(weeklyApplications.labels?.[idx])}: ${value || 0} CV`}
                      />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {value || 0}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                        {formatChartDate(weeklyApplications.labels?.[idx])}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Jobs by Applications */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm flex flex-col">
              {loadingStats ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải...</p>
              ) : recentJobs.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có dữ liệu.</p>
              ) : (
                <div className="space-y-2 flex-1 overflow-hidden">
                  {recentJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => navigate(`/employer/candidates?job=${job.id}`)}
                      className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                        {job.job_title}
                      </p>
                      <div className="flex justify-between items-center mt-0.5">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {job.employment_type || "—"}
                        </p>
                        <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">
                          {job.total_applications} CV
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default EmployerDashboard;
