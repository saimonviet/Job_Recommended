import React, { useState } from "react";
import AdminSideNavBar from "../../components/AdminSideNavBar";
import AdminTopNavBar from "../../components/AdminTopNavBar";

function AdminJobs() {
  const [jobs, setJobs] = useState([
    {
      id: 1,
      title: "Senior AI Engineer",
      company: "Tech Company A",
      postedDate: "2024-04-10",
      status: "Chờ duyệt",
    },
    {
      id: 2,
      title: "Data Scientist",
      company: "Data Corp B",
      postedDate: "2024-04-09",
      status: "Đã duyệt",
    },
    {
      id: 3,
      title: "Frontend Developer",
      company: "Web Studio C",
      postedDate: "2024-04-08",
      status: "Vi phạm",
    },
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Chờ duyệt":
        return "text-orange-600 bg-orange-50";
      case "Đã duyệt":
        return "text-emerald-600 bg-emerald-50";
      case "Vi phạm":
        return "text-red-600 bg-red-50";
      default:
        return "text-slate-600 bg-slate-50";
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSideNavBar />

      <main className="ml-64 w-full">
        <AdminTopNavBar />

        <div className="p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-on-background mb-2">
                Quản lý bài đăng tuyển dụng
              </h1>
              <p className="text-on-surface-variant max-w-2xl">
                Theo dõi, phê duyệt và điều phối các tin tuyển dụng trên nền tảng Predictive Career.
              </p>
            </div>
            <button className="bg-gradient-to-br from-blue-600 to-blue-500 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-blue-600/20 transition-all">
              <span className="material-symbols-outlined text-xl">add_circle</span>
              Thêm bài đăng
            </button>
          </div>

          {/* Dashboard Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-gray-100 p-6 rounded-2xl flex flex-col justify-between h-32">
              <span className="text-slate-500 text-sm font-medium">Tổng bài đăng</span>
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-black text-blue-600">1,284</span>
                <span className="text-green-600 text-xs font-bold">+12%</span>
              </div>
            </div>

            <div className="bg-gray-100 p-6 rounded-2xl flex flex-col justify-between h-32">
              <span className="text-slate-500 text-sm font-medium">Đang chờ duyệt</span>
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-black text-orange-600">42</span>
                <span className="text-orange-600 text-xs font-bold">Action Needed</span>
              </div>
            </div>

            <div className="bg-gray-100 p-6 rounded-2xl flex flex-col justify-between h-32">
              <span className="text-slate-500 text-sm font-medium">Đã phê duyệt</span>
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-black text-blue-500">1,190</span>
                <span className="material-symbols-outlined text-xl text-blue-500">check_circle</span>
              </div>
            </div>

            <div className="bg-gray-100 p-6 rounded-2xl flex flex-col justify-between h-32">
              <span className="text-slate-500 text-sm font-medium">Vi phạm</span>
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-black text-red-600">52</span>
                <span className="material-symbols-outlined text-xl text-red-600">warning</span>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-wrap gap-4 items-center mb-6">
            <div className="flex-1 min-w-[240px] relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                domain
              </span>
              <input
                type="text"
                placeholder="Lọc theo tên công ty..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase px-2">Trạng thái:</span>
              <button className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold">
                Tất cả
              </button>
              <button className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full text-xs font-semibold hover:bg-gray-200">
                Chờ duyệt
              </button>
              <button className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full text-xs font-semibold hover:bg-gray-200">
                Đã duyệt
              </button>
              <button className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full text-xs font-semibold hover:bg-gray-200">
                Vi phạm
              </button>
            </div>

            <button className="ml-auto flex items-center gap-2 text-blue-600 font-bold text-sm px-4 py-2 hover:bg-blue-50 rounded-xl transition-colors">
              <span className="material-symbols-outlined text-xl">filter_list</span>
              Bộ lọc
            </button>
          </div>

          {/* Job Listings Table */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Tiêu đề công việc
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Công ty
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Ngày đăng
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-5">
                      <p className="font-bold text-on-background group-hover:text-blue-600 transition-colors">
                        {job.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">ID: POST-{job.id}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-semibold text-slate-700">{job.company}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm text-slate-600">
                        {new Date(job.postedDate).toLocaleDateString("vi-VN")}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm mr-4">
                        Xem
                      </button>
                      <button className="text-green-600 hover:text-green-700 font-semibold text-sm mr-4">
                        Duyệt
                      </button>
                      <button className="text-red-600 hover:text-red-700 font-semibold text-sm">
                        Từ chối
                      </button>
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

export default AdminJobs;
