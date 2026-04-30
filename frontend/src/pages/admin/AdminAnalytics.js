import React from "react";
import AdminSideNavBar from "../../components/AdminSideNavBar";
import AdminTopNavBar from "../../components/AdminTopNavBar";

function AdminAnalytics() {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSideNavBar />

      <main className="ml-64 w-full">
        <AdminTopNavBar />

        <div className="p-8 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-10">
            <h2 className="text-3xl font-black text-on-surface tracking-tight mb-2">
              Phân tích & Báo cáo
            </h2>
            <p className="text-on-surface-variant max-w-2xl">
              Dữ liệu thống kê chi tiết về hoạt động của nền tảng Predictive Career.
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                  <span className="material-symbols-outlined text-xl">trending_up</span>
                </div>
                <h3 className="text-sm font-semibold text-slate-600">Tăng trưởng người dùng</h3>
              </div>
              <p className="text-2xl font-black text-blue-600">+23.5%</p>
              <p className="text-xs text-slate-500 mt-2">So với tháng trước</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
                  <span className="material-symbols-outlined text-xl">task_alt</span>
                </div>
                <h3 className="text-sm font-semibold text-slate-600">Tỉ lệ thành công</h3>
              </div>
              <p className="text-2xl font-black text-purple-600">87.3%</p>
              <p className="text-xs text-slate-500 mt-2">Ứng viên được tuyển dụng</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-cyan-100 rounded-lg text-cyan-600">
                  <span className="material-symbols-outlined text-xl">schedule</span>
                </div>
                <h3 className="text-sm font-semibold text-slate-600">Thời gian trung bình</h3>
              </div>
              <p className="text-2xl font-black text-cyan-600">14 ngày</p>
              <p className="text-xs text-slate-500 mt-2">Từ ứng tuyển đến được tuyển</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600">
                  <span className="material-symbols-outlined text-xl">attach_money</span>
                </div>
                <h3 className="text-sm font-semibold text-slate-600">Lương trung bình</h3>
              </div>
              <p className="text-2xl font-black text-emerald-600">15M+</p>
              <p className="text-xs text-slate-500 mt-2">Vị trí IT</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            {/* User Growth Chart */}
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="mb-6">
                <h3 className="text-xl font-extrabold text-on-surface">Tăng trưởng người dùng</h3>
                <p className="text-sm text-slate-500">Biểu đồ theo tháng</p>
              </div>

              <div className="h-64 flex items-end justify-between gap-2 px-2">
                {[45, 60, 50, 75, 65, 85, 78, 90, 82, 95, 88, 100].map((height, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600"
                      style={{ height: `${height}%` }}
                    ></div>
                    <span className="text-[10px] text-slate-500 font-bold">T{idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Application Status */}
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="mb-6">
                <h3 className="text-xl font-extrabold text-on-surface">Trạng thái ứng tuyển</h3>
                <p className="text-sm text-slate-500">Phân bổ ứng tuyển</p>
              </div>

              <div className="space-y-6 py-6">
                {[
                  { label: "Đã được tuyển dụng", value: 45, color: "bg-emerald-500" },
                  { label: "Đang phỏng vấn", value: 28, color: "bg-blue-500" },
                  { label: "Đang chờ", value: 18, color: "bg-orange-500" },
                  { label: "Từ chối", value: 9, color: "bg-red-500" },
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-on-surface">{item.label}</span>
                      <span className="text-sm font-bold text-blue-600">{item.value}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${item.value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Companies & Top Jobs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Companies */}
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <h3 className="text-xl font-extrabold text-on-surface mb-6">Top Công ty tuyển dụng</h3>

              <div className="space-y-4">
                {[
                  { name: "FPT Software", count: 234, logo: "🏢" },
                  { name: "Viettel Digital", count: 198, logo: "🏢" },
                  { name: "Techcombank", count: 176, logo: "🏢" },
                  { name: "Grab Vietnam", count: 154, logo: "🏢" },
                  { name: "Samsung Vietnam", count: 142, logo: "🏢" },
                ].map((company, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{company.logo}</span>
                      <div>
                        <p className="font-semibold text-on-surface">{company.name}</p>
                        <p className="text-xs text-slate-500">Bài đăng tuyển dụng</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      {company.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Job Positions */}
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <h3 className="text-xl font-extrabold text-on-surface mb-6">Top Vị trí được tìm kiếm</h3>

              <div className="space-y-4">
                {[
                  { title: "Senior Developer", count: 456 },
                  { title: "Data Scientist", count: 389 },
                  { title: "Product Manager", count: 312 },
                  { title: "UX/UI Designer", count: 287 },
                  { title: "Business Analyst", count: 246 },
                ].map((job, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                        {idx + 1}
                      </div>
                      <p className="font-semibold text-on-surface">{job.title}</p>
                    </div>
                    <span className="text-sm font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
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

export default AdminAnalytics;
