import React, { useState, useEffect } from "react";
import AdminSideNavBar from "../../components/AdminSideNavBar";
import AdminTopNavBar from "../../components/AdminTopNavBar";

const API_BASE_URL = "http://127.0.0.1:5000";

function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAnalytics = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/admin/analytics`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Lỗi khi lấy dữ liệu phân tích");
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err.message);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const statusText = {
    pending: "Đang chờ",
    reviewed: "Đã xem",
    interview: "Phỏng vấn",
    accepted: "Đã tuyển",
    rejected: "Từ chối",
  };

  const maxUserCount = Math.max(
    ...(analytics?.monthly_users || []).map((item) => item.count),
    1
  );

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSideNavBar />

      <main className="ml-64 w-full">
        <AdminTopNavBar />

        <div className="p-8 max-w-7xl mx-auto">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-black text-blue-600 tracking-tight mb-2">
                Phân tích & Báo cáo
              </h2>
              <p className="text-on-surface-variant max-w-2xl">
                Thống kê hoạt động thật từ dữ liệu ứng viên, nhà tuyển dụng, bài đăng và đơn ứng tuyển.
              </p>
            </div>

            <button
              onClick={fetchAnalytics}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700"
            >
              Làm mới
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg text-red-700">
              ❌ {error}
            </div>
          )}

          {loading && (
            <div className="mb-6 text-sm text-slate-500 font-semibold">
              ⟳ Đang tải dữ liệu...
            </div>
          )}

          {analytics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-blue-600">
                  <p className="text-sm font-semibold text-slate-500 mb-1">
                    Tổng ứng viên
                  </p>
                  <h3 className="text-4xl font-black text-slate-900">
                    {analytics.overview.total_seekers.toLocaleString()}
                  </h3>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-emerald-600">
                  <p className="text-sm font-semibold text-slate-500 mb-1">
                    Nhà tuyển dụng
                  </p>
                  <h3 className="text-4xl font-black text-slate-900">
                    {analytics.overview.total_employers.toLocaleString()}
                  </h3>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-orange-600">
                  <p className="text-sm font-semibold text-slate-500 mb-1">
                    Bài đăng
                  </p>
                  <h3 className="text-4xl font-black text-slate-900">
                    {analytics.overview.total_jobs.toLocaleString()}
                  </h3>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-purple-600">
                  <p className="text-sm font-semibold text-slate-500 mb-1">
                    Đơn ứng tuyển
                  </p>
                  <h3 className="text-4xl font-black text-slate-900">
                    {analytics.overview.total_applications.toLocaleString()}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                  <div className="mb-6">
                    <h3 className="text-xl font-extrabold text-slate-900">
                      Tăng trưởng ứng viên
                    </h3>
                    <p className="text-sm text-slate-500">
                      Dựa trên ngày tạo tài khoản
                    </p>
                  </div>

                  <div className="h-64 flex items-end justify-between gap-3 px-2">
                    {analytics.monthly_users.length === 0 ? (
                      <div className="w-full h-full flex items-center justify-center text-sm text-slate-500">
                        Chưa có dữ liệu
                      </div>
                    ) : (
                      analytics.monthly_users.map((item, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                          <div
                            className="w-full bg-blue-500 rounded-t-lg hover:bg-blue-600 transition-all"
                            style={{
                              height: `${Math.max((item.count / maxUserCount) * 100, 8)}%`,
                            }}
                          ></div>
                          <span className="text-[10px] text-slate-500 font-bold">
                            {item.month}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                  <div className="mb-6">
                    <h3 className="text-xl font-extrabold text-slate-900">
                      Trạng thái ứng tuyển
                    </h3>
                    <p className="text-sm text-slate-500">
                      Phân bổ theo trạng thái đơn ứng tuyển
                    </p>
                  </div>

                  <div className="space-y-6 py-4">
                    {analytics.status_distribution.length === 0 ? (
                      <div className="text-sm text-slate-500">
                        Chưa có đơn ứng tuyển
                      </div>
                    ) : (
                      analytics.status_distribution.map((item, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-slate-700">
                              {statusText[item.status] || item.status}
                            </span>
                            <span className="text-sm font-bold text-blue-600">
                              {item.percentage}%
                            </span>
                          </div>

                          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500"
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="text-xl font-extrabold text-slate-900 mb-6">
                    Top công ty tuyển dụng
                  </h3>

                  <div className="space-y-4">
                    {analytics.top_companies.length === 0 ? (
                      <div className="text-sm text-slate-500">
                        Chưa có dữ liệu công ty
                      </div>
                    ) : (
                      analytics.top_companies.map((company, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">
                                {company.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                Bài đăng tuyển dụng
                              </p>
                            </div>
                          </div>

                          <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                            {company.count}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="text-xl font-extrabold text-slate-900 mb-6">
                    Top vị trí được đăng tuyển
                  </h3>

                  <div className="space-y-4">
                    {analytics.top_jobs.length === 0 ? (
                      <div className="text-sm text-slate-500">
                        Chưa có dữ liệu vị trí
                      </div>
                    ) : (
                      analytics.top_jobs.map((job, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold">
                              {idx + 1}
                            </div>
                            <p className="font-semibold text-slate-900">
                              {job.title}
                            </p>
                          </div>

                          <span className="text-sm font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                            {job.count}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminAnalytics;