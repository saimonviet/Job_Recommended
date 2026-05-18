import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EmployerSideNavBar from "../../components/EmployerSideNavBar";
import EmployerTopNavBar from "../../components/EmployerTopNavBar";
import API from "../../services/api";
import { getEmployerToken } from "../../utils/authStorage";

function EmployerDashboard() {
  const navigate = useNavigate();
  const [employerName, setEmployerName] = useState("Nhà tuyển dụng");
  const [stats, setStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const token = getEmployerToken();
    if (!token) {
      navigate("/login-employer");
      return;
    }

    let cancelled = false;

    const loadDashboard = async () => {
      try {
        // Load profile + jobs concurrently
        const [profileRes, jobsRes] = await Promise.allSettled([
          API.get("/auth/me"),
          API.get("/employer/jobs", { params: { page: 1, per_page: 100 } }),
        ]);

        if (cancelled) return;

        // Profile
        if (profileRes.status === "fulfilled" && profileRes.value.data) {
          setEmployerName(
            profileRes.value.data.company_name ||
              profileRes.value.data.username ||
              "Nhà tuyển dụng"
          );
        }

        // Jobs stats
        if (jobsRes.status === "fulfilled") {
          const jobs = jobsRes.value.data?.jobs || [];
          const activeJobs = jobs.filter((j) => j.is_active);
          const totalApplications = jobs.reduce(
            (sum, j) => sum + (j.total_applications || 0),
            0
          );

          setStats({
            activePostings: activeJobs.length,
            totalJobs: jobs.length,
            newApplications: totalApplications,
          });

          // Top 5 jobs by applications for "recent" panel
          const sorted = [...jobs]
            .sort((a, b) => (b.total_applications || 0) - (a.total_applications || 0))
            .slice(0, 5);
          setRecentJobs(sorted);
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

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Chào buổi sáng";
    if (h < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <EmployerSideNavBar />

      <main className="ml-64 w-full">
        <EmployerTopNavBar />

        <div className="pt-20 p-8 max-w-7xl mx-auto">
          {/* Welcome */}
          <div className="mb-10">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
              {greeting()}, {employerName}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
              Hôm nay là một ngày tuyệt vời để tìm kiếm những tài năng mới cho đội ngũ của bạn.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-10">
            <button
              onClick={() => navigate("/employer/analytics")}
              className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              <span className="material-symbols-outlined text-lg">description</span>
              Xem phân tích
            </button>
            <button
              onClick={() => navigate("/employer/post")}
              className="flex items-center gap-2 bg-gradient-to-br from-blue-600 to-blue-500 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:shadow-lg transition-all"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Đăng tin mới
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Active Postings */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                  <span className="material-symbols-outlined text-xl">campaign</span>
                </div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                  Đang chạy
                </span>
              </div>
              <h3 className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">Bài đăng đang chạy</h3>
              <p className="text-3xl font-black text-slate-900 dark:text-white">
                {loadingStats ? "—" : stats?.activePostings ?? 0}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                / {loadingStats ? "—" : stats?.totalJobs ?? 0} tổng bài đăng
              </p>
            </div>

            {/* Total Applications */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                  <span className="material-symbols-outlined text-xl">person_add</span>
                </div>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                  Tổng
                </span>
              </div>
              <h3 className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">Tổng lượt ứng tuyển</h3>
              <p className="text-3xl font-black text-slate-900 dark:text-white">
                {loadingStats ? "—" : stats?.newApplications ?? 0}
              </p>
              <div className="mt-4 text-xs text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">work</span>
                <span>Từ tất cả bài đăng</span>
              </div>
            </div>

            {/* Navigate to Candidates */}
            <div
              onClick={() => navigate("/employer/candidates")}
              className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <span className="material-symbols-outlined text-xl">groups</span>
                </div>
                <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  arrow_forward
                </span>
              </div>
              <h3 className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">Quản lý ứng viên</h3>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">Xem tất cả ứng viên →</p>
            </div>
          </div>

          {/* Charts & Top Jobs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Placeholder Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Xu hướng ứng tuyển theo tuần
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Thống kê 7 ngày gần nhất
                  </p>
                </div>
              </div>
              <div className="h-64 flex items-end justify-between gap-3 px-2">
                {[40, 65, 45, 70, 55, 80, 60].map((height, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-3">
                    <div
                      className="w-full bg-blue-200 dark:bg-blue-900/40 rounded-t-lg transition-all duration-500 hover:bg-blue-400"
                      style={{ height: `${height}%` }}
                    ></div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                      N{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Jobs by Applications */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">
                Job nhận nhiều CV nhất
              </h3>
              {loadingStats ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải...</p>
              ) : recentJobs.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có dữ liệu.</p>
              ) : (
                <div className="space-y-4">
                  {recentJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => navigate(`/employer/candidates?job=${job.id}`)}
                      className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                        {job.job_title}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {job.employment_type || "—"}
                        </p>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
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