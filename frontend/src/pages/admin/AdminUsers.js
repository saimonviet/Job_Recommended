import React, { useState, useEffect } from "react";
import AdminSideNavBar from "../../components/AdminSideNavBar";
import AdminTopNavBar from "../../components/AdminTopNavBar";

function AdminUsers() {
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "Nguyễn Văn A",
      email: "nguyenvana@example.com",
      role: "Ứng viên",
      status: "Đang hoạt động",
      joinDate: "2024-01-15",
    },
    {
      id: 2,
      name: "Trần Thị B",
      email: "tranthib@example.com",
      role: "Nhà tuyển dụng",
      status: "Đang hoạt động",
      joinDate: "2024-02-20",
    },
    {
      id: 3,
      name: "Lê Văn C",
      email: "levantc@example.com",
      role: "Ứng viên",
      status: "Bị chặn",
      joinDate: "2024-03-10",
    },
  ]);

  const [roleFilter, setRoleFilter] = useState("Tất cả");
  const [statusFilter, setStatusFilter] = useState("Tất cả");

  const filteredUsers = users.filter((user) => {
    const roleMatch = roleFilter === "Tất cả" || user.role === roleFilter;
    const statusMatch = statusFilter === "Tất cả" || user.status === statusFilter;
    return roleMatch && statusMatch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Đang hoạt động":
        return "text-emerald-600 bg-emerald-50";
      case "Bị chặn":
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
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black text-blue-600 tracking-tight mb-2">
                Quản lý người dùng
              </h2>
              <p className="text-on-surface-variant max-w-lg">
                Tổng quan và điều phối quyền truy cập cho tất cả các ứng viên và nhà tuyển dụng trong hệ thống.
              </p>
            </div>
            <button className="bg-gradient-to-br from-blue-600 to-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg transition-all">
              <span className="material-symbols-outlined text-xl">person_add</span>
              Thêm người dùng
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-blue-600">
              <p className="text-sm font-semibold text-slate-500 mb-1">Tổng người dùng</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-4xl font-black text-on-surface">12,842</h3>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  +12%
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-cyan-600">
              <p className="text-sm font-semibold text-slate-500 mb-1">Ứng viên</p>
              <h3 className="text-4xl font-black text-on-surface">11,204</h3>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-orange-600">
              <p className="text-sm font-semibold text-slate-500 mb-1">Nhà tuyển dụng</p>
              <h3 className="text-4xl font-black text-on-surface">1,638</h3>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Filters Bar */}
            <div className="p-6 bg-gray-50 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 text-sm rounded-lg pl-4 pr-10 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-transparent cursor-pointer"
                >
                  <option>Tất cả vai trò</option>
                  <option>Ứng viên</option>
                  <option>Nhà tuyển dụng</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 text-sm rounded-lg pl-4 pr-10 py-2.5 focus:ring-2 focus:ring-blue-600 focus:border-transparent cursor-pointer"
                >
                  <option>Tất cả trạng thái</option>
                  <option>Đang hoạt động</option>
                  <option>Bị chặn</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Sắp xếp theo:</span>
                <button className="text-sm font-semibold text-blue-600 flex items-center gap-1 px-3 py-2 hover:bg-white rounded-lg transition-colors">
                  <span>Ngày gia nhập</span>
                  <span className="material-symbols-outlined text-lg">edit</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Họ tên / Email
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Vai trò
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Ngày gia nhập
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <img
                            alt={user.name}
                            src="https://via.placeholder.com/40"
                            className="w-10 h-10 rounded-full bg-gray-300"
                          />
                          <div>
                            <p className="font-semibold text-on-surface">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-semibold text-slate-700">{user.role}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusColor(
                            user.status
                          )}`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600">
                        {new Date(user.joinDate).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm mr-4">
                          Sửa
                        </button>
                        <button className="text-red-600 hover:text-red-700 font-semibold text-sm">
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminUsers;
