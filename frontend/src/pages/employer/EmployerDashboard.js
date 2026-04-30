import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EmployerSideNavBar from "../../components/EmployerSideNavBar";
import EmployerTopNavBar from "../../components/EmployerTopNavBar";

function EmployerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activePostings: 12,
    newApplications: 148,
    totalViews: 4200,
    matchingRate: 72,
  });

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('employerToken');
    if (!token) {
      navigate('/employer/login');
      return;
    }
    // Mock data - replace with API call
  }, [navigate]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <EmployerSideNavBar />

      <main className="ml-64 w-full">
        <EmployerTopNavBar />

        <div className="pt-20 p-8 max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-10">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
              Chào buổi sáng, TechVantage Corp
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
              Hôm nay là một ngày tuyệt vời để tìm kiếm những tài năng mới cho đội ngũ của bạn.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-10">
            <button className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
              <span className="material-symbols-outlined text-lg">description</span>
              Xuất báo cáo
            </button>
            <button className="flex items-center gap-2 bg-gradient-to-br from-blue-600 to-blue-500 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:shadow-lg transition-all">
              <span className="material-symbols-outlined text-lg">add</span>
              Đăng tin mới
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            {/* Stat Card 1 */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                  <span className="material-symbols-outlined text-xl">campaign</span>
                </div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                  Đang chạy
                </span>
              </div>
              <h3 className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">Số bài đăng đang chạy</h3>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.activePostings}</p>
              <div className="mt-4 w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full w-[70%]"></div>
              </div>
            </div>

            {/* Stat Card 2 */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                  <span className="material-symbols-outlined text-xl">person_add</span>
                </div>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                  Mới nhất
                </span>
              </div>
              <h3 className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">Tổng lượt ứng tuyển mới</h3>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.newApplications}</p>
              <div className="mt-4 text-xs text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                <span>+15% lượt nộp hồ sơ</span>
              </div>
            </div>

            {/* Stat Card 3 */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg text-cyan-600 dark:text-cyan-400">
                  <span className="material-symbols-outlined text-xl">visibility</span>
                </div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                  30 ngày qua
                </span>
              </div>
              <h3 className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">Lượt xem tin tuyển dụng</h3>
              <p className="text-3xl font-black text-slate-900 dark:text-white">4.2k</p>
              <div className="mt-4 text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">trending_flat</span>
                <span>Ổn định so với tuần trước</span>
              </div>
            </div>

            {/* Stat Card 4 */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <span className="material-symbols-outlined text-xl">verified</span>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
                  Chất lượng
                </span>
              </div>
              <h3 className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">Tỷ lệ hồ sơ phù hợp</h3>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.matchingRate}%</p>
              <div className="mt-4 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-sm filled">star</span>
                <span>Tăng 5% nhờ AI lọc hồ sơ</span>
              </div>
            </div>
          </div>

          {/* Charts & Recent Candidates */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Trend Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Xu hướng ứng tuyển theo tuần</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Thống kê dữ liệu trong 7 ngày gần nhất</p>
                </div>
              </div>

              {/* Simple Bar Chart */}
              <div className="h-64 flex items-end justify-between gap-3 px-2">
                {[40, 65, 45, 70, 55, 80, 60].map((height, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-3">
                    <div
                      className="w-full bg-blue-200 dark:bg-blue-900/40 rounded-t-lg transition-all duration-500 hover:bg-blue-300"
                      style={{ height: `${height}%` }}
                    ></div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Ngày {idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Candidates */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">
                Ứng viên mới nhất
              </h3>
              <div className="space-y-4">
                {[
                  { name: "Nguyễn Văn A", position: "UI/UX Designer", status: "Mới" },
                  { name: "Trần Thị B", position: "Frontend Developer", status: "Xem xét" },
                  { name: "Lê Văn C", position: "Product Manager", status: "Mới" },
                  { name: "Phạm Thị D", position: "Data Analyst", status: "Xem xét" },
                  { name: "Hoàng Văn E", position: "DevOps Engineer", status: "Mới" },
                ].map((candidate, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">{candidate.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{candidate.position}</p>
                    <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded mt-2 ${
                      candidate.status === "Mới" 
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" 
                        : "bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300"
                    }`}>
                      {candidate.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default EmployerDashboard;
