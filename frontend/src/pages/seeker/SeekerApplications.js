import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNavBar from '../../components/TopNavBar';
import API from '../../services/api';

const statusTextMap = {
  pending: 'Đang chờ duyệt',
  interviewing: 'Đang phỏng vấn',
  accepted: 'Đã chấp nhận',
  rejected: 'Từ chối',
};

const formatAppliedDate = (value) => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN');
};

const SeekerApplications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [withdrawingId, setWithdrawingId] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login-seeker');
      return;
    }
    setIsLoggedIn(true);
    loadApplications();
  }, [navigate]);

  const loadApplications = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await API.get('/seeker/applications', {
        params: { page: 1, per_page: 100 },
      });

      const items = response.data?.applications || [];
      const mappedApplications = items.map((app) => ({
        id: app.id,
        jobId: app.job_id,
        title: app.job?.job_title || 'Chưa có tiêu đề',
        company: app.job?.company_name || 'Chưa cập nhật công ty',
        logo: `https://api.dicebear.com/7.x/icons/svg?seed=${encodeURIComponent(app.job?.company_name || app.job?.job_title || app.id)}`,
        salary: 'Thỏa thuận',
        location: app.job?.job_address || 'Chưa cập nhật địa điểm',
        appliedDate: formatAppliedDate(app.applied_at),
        status: app.status || 'pending',
        statusText: statusTextMap[app.status] || app.status || 'Chưa cập nhật',
      }));

      setApplications(mappedApplications);
    } catch (requestError) {
      console.error('Failed to load applications:', requestError);
      setError('Không tải được lịch sử ứng tuyển.');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredApplications = () => {
    if (filterStatus === 'all') return applications;
    return applications.filter(app => app.status === filterStatus);
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'interviewing':
        return 'bg-secondary-container text-on-secondary-fixed-variant';
      case 'pending':
        return 'bg-tertiary-fixed text-on-tertiary-fixed-variant';
      case 'accepted':
        return 'bg-[#e7f5ed] text-[#1e4620]';
      case 'rejected':
        return 'bg-error-container text-on-error-container';
      default:
        return 'bg-surface-container-high text-on-surface-variant';
    }
  };

  const handleMessageClick = (appId) => {
    alert('Mở tính năng nhắn tin!');
  };

  const handleDetailClick = (appId) => {
    navigate(`/jobs/${appId}`);
  };

  const handleWithdrawClick = async (appId) => {
    try {
      setWithdrawingId(appId);
      await API.delete(`/seeker/applications/${appId}`);
      setApplications((prev) => prev.filter((app) => app.id !== appId));
    } catch (requestError) {
      console.error('Failed to withdraw application:', requestError);
      alert('Không thể rút đơn lúc này.');
    } finally {
      setWithdrawingId(null);
    }
  };

  const filteredApplications = getFilteredApplications();

  // Calculate stats
  const totalApplications = applications.length;
  const interviewCount = applications.filter(app => app.status === 'interviewing').length;
  const responseRate = Math.round((interviewCount / totalApplications) * 100) || 0;

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopNavBar currentPage="applications" />

      <main className="flex-grow pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto w-full">
        {/* Hero Title Section */}
        <header className="mb-12">
          <h1 className="text-5xl font-extrabold tracking-tight text-primary mb-4">
            Lịch sử ứng tuyển
          </h1>
          <p className="text-on-surface-variant max-w-2xl text-lg">
            Theo dõi hành trình sự nghiệp và các cơ hội bạn đã nắm bắt. Dữ liệu được cập nhật theo thời gian thực từ nhà tuyển dụng.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Content: Job List & Filters */}
          <div className="lg:col-span-8 space-y-8">
            {/* Status Filter */}
            <div className="flex flex-wrap gap-2 items-center bg-surface-container-low p-2 rounded-xl">
              {[
                { value: 'all', label: 'Tất cả' },
                { value: 'pending', label: 'Đang chờ duyệt' },
                { value: 'interviewing', label: 'Đang phỏng vấn' },
                { value: 'accepted', label: 'Đã chấp nhận' },
                { value: 'rejected', label: 'Từ chối' },
              ].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setFilterStatus(filter.value)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                    filterStatus === filter.value
                      ? 'bg-primary text-on-primary'
                      : 'hover:bg-surface-container-highest text-on-surface-variant'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Job History List */}
            <div className="space-y-4">
              {loading ? (
                <div className="bg-surface-container-lowest p-12 rounded-xl text-center text-on-surface-variant">
                  Đang tải lịch sử ứng tuyển...
                </div>
              ) : error ? (
                <div className="bg-surface-container-lowest p-12 rounded-xl text-center text-error">
                  {error}
                </div>
              ) : filteredApplications.length > 0 ? (
                filteredApplications.map(app => (
                  <div
                    key={app.id}
                    className={`bg-surface-container-lowest p-6 rounded-xl hover:shadow-[0_20px_40px_rgba(25,28,33,0.06)] transition-all flex flex-col md:flex-row gap-6 ${
                      app.status === 'rejected' ? 'opacity-75 grayscale-[0.5]' : ''
                    }`}
                  >
                    <div className="w-16 h-16 bg-surface-container rounded-lg flex items-center justify-center flex-shrink-0">
                      <img
                        alt={`${app.company} Logo`}
                        className="w-10 h-10 object-contain"
                        src={app.logo}
                      />
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-primary">{app.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadgeStyle(app.status)}`}>
                          {app.statusText}
                        </span>
                      </div>
                      <p className="text-on-surface font-medium mb-4">
                        {app.company} • <span className="text-on-surface-variant font-normal">Đã ứng tuyển {app.appliedDate}</span>
                      </p>
                      <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-1.5 text-on-surface-variant text-sm">
                          <span className="material-symbols-outlined text-base">payments</span>
                          {app.salary}
                        </div>
                        <div className="flex items-center gap-1.5 text-on-surface-variant text-sm">
                          <span className="material-symbols-outlined text-base">location_on</span>
                          {app.location}
                        </div>
                      </div>
                    </div>
                    <div className="flex md:flex-col justify-end gap-2">
                      <button
                        onClick={() => handleDetailClick(app.jobId)}
                        className="text-primary hover:bg-surface-container-low px-4 py-2 rounded-md text-sm font-semibold transition-colors"
                      >
                        Chi tiết
                      </button>
                      {app.status === 'pending' && (
                        <button
                          onClick={() => handleWithdrawClick(app.id)}
                          disabled={withdrawingId === app.id}
                          className="text-on-surface-variant hover:bg-surface-container-low px-4 py-2 rounded-md text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                          {withdrawingId === app.id ? 'Đang rút...' : 'Rút đơn'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-surface-container-lowest p-12 rounded-xl text-center">
                  <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4 inline-block">
                    work
                  </span>
                  <h3 className="text-xl font-bold text-on-surface mb-2">Chưa có ứng tuyển</h3>
                  <p className="text-on-surface-variant mb-6">Hãy tìm kiếm và ứng tuyển những công việc mà bạn yêu thích.</p>
                  <button
                    onClick={() => navigate('/seeker/home')}
                    className="px-6 py-3 bg-primary text-white rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
                  >
                    Khám phá công việc
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Content: Widgets */}
          <aside className="lg:col-span-4 space-y-8">
            {/* Stat Widget */}
            <div className="bg-surface-container-low p-8 rounded-xl">
              <h4 className="font-headline font-bold text-lg text-primary mb-6">Thống kê ứng tuyển</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-lowest p-4 rounded-lg text-center">
                  <div className="text-3xl font-extrabold text-primary mb-1">{totalApplications}</div>
                  <div className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                    Tổng nộp
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-4 rounded-lg text-center border-b-4 border-secondary">
                  <div className="text-3xl font-extrabold text-secondary mb-1">{interviewCount}</div>
                  <div className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                    Phỏng vấn
                  </div>
                </div>
              </div>
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">Tỉ lệ phản hồi</span>
                  <span className="font-bold">{responseRate}%</span>
                </div>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: `${responseRate}%` }}></div>
                </div>
              </div>
            </div>

            {/* Suggestion Widget */}
            <div className="bg-primary-container p-8 rounded-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span
                  className="material-symbols-outlined text-9xl leading-none"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  insights
                </span>
              </div>
              <h4 className="font-headline font-bold text-lg text-on-primary-fixed mb-4">
                Gợi ý tối ưu hồ sơ
              </h4>
              <p className="text-on-primary-fixed text-sm mb-6 leading-relaxed">
                Cập nhật kỹ năng <b>"Python"</b> và <b>"Tableau"</b> vào hồ sơ để tăng 45% tỷ lệ nhận lời mời phỏng vấn cho các vị trí Data Analyst.
              </p>
              <button className="w-full bg-surface-container-lowest text-primary font-bold py-3 rounded-md hover:bg-surface-bright transition-all active:scale-95">
                Cập nhật hồ sơ ngay
              </button>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-slate-200/20 dark:border-slate-800/20 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-lg font-black text-slate-900 dark:text-white">Career Authority</div>
          <div className="flex gap-8">
            <a className="font-body text-xs uppercase tracking-widest text-slate-400 hover:text-primary transition-colors cursor-pointer">
              Điều khoản
            </a>
            <a className="font-body text-xs uppercase tracking-widest text-slate-400 hover:text-primary transition-colors cursor-pointer">
              Bảo mật
            </a>
            <a className="font-body text-xs uppercase tracking-widest text-slate-400 hover:text-primary transition-colors cursor-pointer">
              Liên hệ
            </a>
          </div>
          <p className="font-body text-xs uppercase tracking-widest text-slate-400">
            © 2024 The Predictive Career Authority. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SeekerApplications;
