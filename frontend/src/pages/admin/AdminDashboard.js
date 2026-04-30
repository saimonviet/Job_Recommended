import React, { useState, useEffect } from "react";
import AdminSideNavBar from "../../components/AdminSideNavBar";
import AdminTopNavBar from "../../components/AdminTopNavBar";

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 24892,
    totalJobs: 1402,
    totalCompanies: 846,
    systemHealth: 99.9,
  });

  useEffect(() => {
    // Fetch dashboard stats from API
    // const fetchStats = async () => {
    //   const response = await fetch("/api/admin/stats");
    //   const data = await response.json();
    //   setStats(data);
    // };
    // fetchStats();
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSideNavBar />

      <main className="ml-64 w-full">
        <AdminTopNavBar />

        {/* Main Content */}
        <div className="p-8 max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-10">
            <h2 className="text-3xl font-black text-on-surface tracking-tight mb-2">
              Tổng quan hệ thống
            </h2>
            <p className="text-on-surface-variant max-w-2xl">
              Chào mừng trở lại. Dưới đây là phân tích dữ liệu thời gian thực cho nền tảng Predictive Career
              ngày hôm nay.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            {/* Users Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm hover:translate-y-[-4px] transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                  <span className="material-symbols-outlined text-xl">person_search</span>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  +12%
                </span>
              </div>
              <h3 className="text-slate-500 text-sm font-medium mb-1">Người dùng mới</h3>
              <p className="text-2xl font-black text-on-surface">{stats.totalUsers.toLocaleString()}</p>
              <div className="mt-4 w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full w-[70%]"></div>
              </div>
            </div>

            {/* Jobs Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm hover:translate-y-[-4px] transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
                  <span className="material-symbols-outlined text-xl">work</span>
                </div>
                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                  +8%
                </span>
              </div>
              <h3 className="text-slate-500 text-sm font-medium mb-1">Tin tuyển dụng</h3>
              <p className="text-2xl font-black text-on-surface">{stats.totalJobs.toLocaleString()}</p>
              <div className="mt-4 w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                <div className="bg-purple-600 h-full w-[45%]"></div>
              </div>
            </div>

            {/* Companies Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm hover:translate-y-[-4px] transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-cyan-100 rounded-lg text-cyan-600">
                  <span className="material-symbols-outlined text-xl">corporate_fare</span>
                </div>
                <span className="text-xs font-bold text-cyan-600 bg-cyan-50 px-2 py-1 rounded-full">
                  +5%
                </span>
              </div>
              <h3 className="text-slate-500 text-sm font-medium mb-1">Doanh nghiệp</h3>
              <p className="text-2xl font-black text-on-surface">{stats.totalCompanies}</p>
              <div className="mt-4 w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                <div className="bg-cyan-600 h-full w-[60%]"></div>
              </div>
            </div>

            {/* Health Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm hover:translate-y-[-4px] transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600">
                  <span className="material-symbols-outlined text-xl">speed</span>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  Ổn định
                </span>
              </div>
              <h3 className="text-slate-500 text-sm font-medium mb-1">Sức khỏe hệ thống</h3>
              <p className="text-2xl font-black text-on-surface">{stats.systemHealth}%</p>
              <div className="mt-4 w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[99%]"></div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            {/* Trend Chart */}
            <div className="lg:col-span-2 bg-white p-8 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-extrabold text-on-surface tracking-tight">Xu hướng tuyển dụng</h3>
                  <p className="text-sm text-slate-500">Dữ liệu theo tháng trong năm 2024</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-gray-100 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors">
                    6 tháng
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg">
                    1 năm
                  </button>
                </div>
              </div>

              {/* Simple Bar Chart */}
              <div className="h-64 flex items-end justify-between gap-4 px-2">
                {[40, 65, 45, 70, 55, 80, 60, 75, 50, 85, 70, 90].map((height, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-3">
                    <div
                      className="w-full bg-blue-100 rounded-t-lg transition-all duration-500 hover:bg-blue-200"
                      style={{ height: `${height}%` }}
                    ></div>
                    <span className="text-[10px] text-slate-500 font-bold">T{idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Jobs */}
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <h3 className="text-xl font-extrabold text-on-surface tracking-tight mb-6">
                Vị trí hàng đầu
              </h3>
              <div className="space-y-4">
                {[
                  { title: "Senior Software Engineer", count: 234 },
                  { title: "Data Scientist", count: 156 },
                  { title: "Product Manager", count: 142 },
                  { title: "UX Designer", count: 128 },
                ].map((job, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <span className="text-sm font-semibold text-on-surface">{job.title}</span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      {job.count}
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

export default AdminDashboard;
