import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EmployerSideNavBar from "../../components/EmployerSideNavBar";
import EmployerTopNavBar from "../../components/EmployerTopNavBar";

function EmployerCandidates() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('employerToken');
    if (!token) {
      navigate('/employer/login');
    }
  }, [navigate]);
  const [candidates, setCandidates] = useState([
    { id: 1, name: "Nguyễn Văn A", position: "UI/UX Designer", status: "Mới", rating: 4.5 },
    { id: 2, name: "Trần Thị B", position: "Frontend Developer", status: "Xem xét", rating: 4.8 },
    { id: 3, name: "Lê Văn C", position: "Backend Developer", status: "Phỏng vấn", rating: 4.3 },
    { id: 4, name: "Phạm Thị D", position: "Product Manager", status: "Mới", rating: 4.6 },
    { id: 5, name: "Hoàng Văn E", position: "Data Analyst", status: "Từ chối", rating: 3.9 },
  ]);

  const [statusFilter, setStatusFilter] = useState("Tất cả");

  const getStatusColor = (status) => {
    switch (status) {
      case "Mới":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
      case "Xem xét":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
      case "Phỏng vấn":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400";
      case "Từ chối":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
      default:
        return "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-400";
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <EmployerSideNavBar />

      <main className="ml-64 w-full">
        <EmployerTopNavBar />

        <div className="pt-20 p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <h2 className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight mb-2">
              Quản lý ứng viên
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-lg">
              Xem danh sách tất cả ứng viên đã nộp hồ sơ và quản lý quy trình tuyển dụng.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2">Tổng ứng viên</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">248</p>
              <div className="mt-3 text-xs text-blue-600 dark:text-blue-400 font-medium">+24 tuần này</div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2">Mới hôm nay</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">8</p>
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 font-medium">4 chị/em từ hôm qua</div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2">Đang phỏng vấn</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">12</p>
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 font-medium">5 người tiếp theo</div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2">Đã tuyển</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">3</p>
              <div className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium">+1 tháng này</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm mb-8">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">filter_list</span>
                Lọc theo trạng thái
              </h3>
              <button className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">Xóa bộ lọc</button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {["Tất cả", "Mới", "Xem xét", "Phỏng vấn", "Từ chối"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    statusFilter === status
                      ? "bg-blue-600 dark:bg-blue-500 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Candidates List */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Thông tin ứng viên</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Vị trí ứng tuyển</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Trạng thái</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Đánh giá</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {candidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">person</span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{candidate.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Nộp 2 ngày trước</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{candidate.position}</p>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(candidate.status)}`}>
                        {candidate.status}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-yellow-500 text-sm">star</span>
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">{candidate.rating}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold text-sm">
                        Xem hồ sơ
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

export default EmployerCandidates;
