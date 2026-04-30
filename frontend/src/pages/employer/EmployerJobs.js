import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EmployerSideNavBar from "../../components/EmployerSideNavBar";
import EmployerTopNavBar from "../../components/EmployerTopNavBar";

function EmployerJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([
    { id: 1, title: "Senior UI/UX Designer", date: "12/10/2023", views: 245, applications: 12, status: "Đang đăng" },
    { id: 2, title: "Frontend Developer", date: "10/10/2023", views: 389, applications: 28, status: "Đang đăng" },
    { id: 3, title: "Backend Developer", date: "08/10/2023", views: 156, applications: 8, status: "Đã đóng" },
    { id: 4, title: "Product Manager", date: "05/10/2023", views: 412, applications: 35, status: "Đang đăng" },
  ]);

  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [timeFilter, setTimeFilter] = useState("Tất cả thời gian");

  useEffect(() => {
    const token = localStorage.getItem('employerToken');
    if (!token) {
      navigate('/employer/login');
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <EmployerSideNavBar />

      <main className="ml-64 w-full">
        <EmployerTopNavBar />

        <div className="pt-20 p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight mb-2">
                Quản lý tuyển dụng
              </h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-lg">
                Theo dõi hiệu suất bài đăng và quản lý quy trình thu hút nhân tài của bạn.
              </p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 px-6 py-3 rounded-lg font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                <span className="material-symbols-outlined text-lg">download</span>
                Xuất dữ liệu
              </button>
              <button className="flex items-center gap-2 bg-gradient-to-br from-blue-600 to-blue-500 text-white px-6 py-3 rounded-lg font-bold text-sm shadow-lg hover:shadow-blue-600/20 transition-all">
                <span className="material-symbols-outlined text-lg">add</span>
                Đăng tin mới
              </button>
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">filter_list</span>
                Bộ lọc
              </h3>
              <button className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">Xóa tất cả</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Trạng thái</label>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-sm p-3 focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white"
                >
                  <option>Tất cả bài đăng</option>
                  <option>Đang đăng</option>
                  <option>Đã đóng</option>
                  <option>Nháp</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Thời gian</label>
                <select 
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-sm p-3 focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white"
                >
                  <option>Tất cả thời gian</option>
                  <option>7 ngày qua</option>
                  <option>30 ngày qua</option>
                  <option>Quý này</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Chuyên môn</label>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-full cursor-pointer">Công nghệ</span>
                  <span className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-full cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600">Kinh doanh</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Insight Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl p-6 text-white mb-8 shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-lg opacity-80">auto_awesome</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Dự báo tuần này</span>
                </div>
                <h4 className="text-2xl font-bold mb-2">Xu hướng ứng tuyển tăng 24%</h4>
                <p className="text-sm opacity-90">Các vị trí Marketing đang nhận được sự quan tâm lớn từ ứng viên cấp cao.</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs font-bold bg-orange-400 text-white px-2 py-0.5 rounded">Actionable Insight</span>
                  <span className="text-xs">Cập nhật tin Marketing ngay!</span>
                </div>
              </div>
            </div>
          </div>

          {/* Job Listings Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Tên công việc</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Ngày đăng</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest text-center">Lượt xem</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest text-center">Ứng tuyển</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Trạng thái</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                    <td className="px-6 py-6">
                      <div>
                        <h4 className="font-bold text-blue-600 dark:text-blue-400 text-base group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                          {job.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Toàn thời gian • TP. Hồ Chí Minh</p>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-sm text-slate-600 dark:text-slate-400">{job.date}</td>
                    <td className="px-6 py-6 text-sm text-center font-semibold text-slate-900 dark:text-white">{job.views}</td>
                    <td className="px-6 py-6 text-sm text-center font-semibold text-slate-900 dark:text-white">{job.applications}</td>
                    <td className="px-6 py-6">
                      <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold ${
                        job.status === "Đang đăng"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex gap-2 justify-end">
                        <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold text-sm">Xem</button>
                        <button className="text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 font-semibold text-sm">Sửa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default EmployerJobs;
