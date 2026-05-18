import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EmployerSideNavBar from "../../components/EmployerSideNavBar";
import EmployerTopNavBar from "../../components/EmployerTopNavBar";
import { getEmployerToken } from "../../utils/authStorage";

function EmployerAnalytics() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = getEmployerToken();
    if (!token) {
      navigate('/login-employer');
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <EmployerSideNavBar />

      <main className="ml-64 w-full">
        <EmployerTopNavBar />

        <div className="pt-20 p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <h2 className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight mb-2">
              Phân tích & Báo cáo
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-lg">
              Xem chi tiết hiệu suất bài đăng, ứng viên và quy trình tuyển dụng của bạn.
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            {/* Card 1 */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                  <span className="material-symbols-outlined text-xl">trending_up</span>
                </div>
                <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                  +23.5%
                </span>
              </div>
              <h3 className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">Tăng trưởng ứng viên</h3>
              <p className="text-2xl font-black text-slate-900 dark:text-white">+156</p>
            </div>

            {/* Card 2 */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                  <span className="material-symbols-outlined text-xl">task_alt</span>
                </div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                  87.3%
                </span>
              </div>
              <h3 className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">Tỷ lệ xử lý hồ sơ</h3>
              <p className="text-2xl font-black text-slate-900 dark:text-white">87.3%</p>
            </div>

            {/* Card 3 */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                  <span className="material-symbols-outlined text-xl">schedule</span>
                </div>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                  14 ngày
                </span>
              </div>
              <h3 className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">Thời gian trung bình</h3>
              <p className="text-2xl font-black text-slate-900 dark:text-white">14 ngày</p>
            </div>

            {/* Card 4 */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                  <span className="material-symbols-outlined text-xl">attach_money</span>
                </div>
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded-full">
                  15M+
                </span>
              </div>
              <h3 className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">Mức lương trung bình</h3>
              <p className="text-2xl font-black text-slate-900 dark:text-white">15M+</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Growth Chart */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">Tăng trưởng ứng viên</h3>

              <div className="h-64 flex items-end justify-between gap-3 px-2">
                {[35, 42, 38, 55, 48, 62, 58, 70, 65, 78, 72, 85].map((height, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-3">
                    <div
                      className="w-full bg-blue-200 dark:bg-blue-900/40 rounded-t-lg transition-all duration-500 hover:bg-blue-300"
                      style={{ height: `${height}%` }}
                    ></div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">T{idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Application Status Distribution */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">Phân bố trạng thái ứng tuyển</h3>

              <div className="space-y-4">
                {[
                  { label: "Đã tuyển", value: 45, color: "bg-emerald-500" },
                  { label: "Đang phỏng vấn", value: 28, color: "bg-blue-500" },
                  { label: "Xem xét", value: 18, color: "bg-yellow-500" },
                  { label: "Từ chối", value: 9, color: "bg-red-500" },
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{item.label}</p>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{item.value}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div className={`${item.color} h-full transition-all`} style={{ width: `${item.value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rankings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* Top Positions */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">Vị trí phổ biến nhất</h3>

              <div className="space-y-3">
                {[
                  { rank: 1, title: "Frontend Developer", count: 45 },
                  { rank: 2, title: "UI/UX Designer", count: 38 },
                  { rank: 3, title: "Backend Developer", count: 32 },
                  { rank: 4, title: "Product Manager", count: 28 },
                  { rank: 5, title: "Data Analyst", count: 24 },
                ].map((position) => (
                  <div key={position.rank} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <div className="flex-shrink-0 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 dark:bg-blue-500 text-white font-bold rounded-full text-xs">
                        {position.rank}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{position.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{position.count} ứng viên</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Companies */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">Công ty cạnh tranh</h3>

              <div className="space-y-3">
                {[
                  { rank: 1, name: "TechVantage", hires: 156 },
                  { rank: 2, name: "Silicon Valley Vietnam", hires: 142 },
                  { rank: 3, name: "Digital Solutions Asia", hires: 128 },
                  { rank: 4, name: "CloudTech Innovations", hires: 115 },
                  { rank: 5, name: "FutureLabs", hires: 98 },
                ].map((company) => (
                  <div key={company.rank} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <div className="flex-shrink-0 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-600 dark:bg-purple-500 text-white font-bold rounded-full text-xs">
                        {company.rank}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{company.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{company.hires} lần tuyển dụng</p>
                    </div>
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

export default EmployerAnalytics;
