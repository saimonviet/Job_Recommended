import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNavBar from '../../components/TopNavBar';
import API from '../../services/api';

const createJobLogo = (seed) => `https://api.dicebear.com/7.x/icons/svg?seed=${encodeURIComponent(seed || 'job')}`;

const formatSalary = (job) => {
  if (job.salary) {
    return job.salary;
  }

  if (job.salary_min && job.salary_max) {
    return `${job.salary_min} - ${job.salary_max}`;
  }

  return job.salary_min || job.salary_max || 'Thoả thuận';
};

const toRecommendedJob = (job) => ({
  id: job.id,
  title: job.title || job.job_title,
  company: job.company || job.company_name,
  location: job.location || job.job_address,
  salary: formatSalary(job),
  logo: job.logo || createJobLogo(job.company || job.company_name || job.title || job.job_title),
  matchScore: job.matchScore ?? job.match_score ?? 0,
});

const toLatestJob = (job) => ({
  id: job.id,
  title: job.title || job.job_title,
  company: job.company || job.company_name,
  location: job.location || job.job_address,
  salary: formatSalary(job),
  logo: job.logo || createJobLogo(job.company || job.company_name || job.title || job.job_title),
  posted: job.deadline ? `Hạn ${new Date(job.deadline).toLocaleDateString('vi-VN')}` : 'Mới đăng',
});

const SeekerHomeLoggedIn = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [latestJobs, setLatestJobs] = useState([]);
  const [careerScore] = useState(842);
  const [newRecommendations, setNewRecommendations] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login-seeker');
      return;
    }

    setIsLoggedIn(true);
    loadJobs(JSON.parse(user));
  }, [navigate]);

  const loadJobs = async (user) => {
    setLoading(true);

    try {
      const [recommendationResponse, latestJobsResponse] = await Promise.all([
        API.get('/recommendations', { params: { user_id: user.id } }),
        API.get('/jobs', { params: { per_page: 6 } }),
      ]);

      const recommendedJobs = (recommendationResponse.data?.recommendations || []).map(toRecommendedJob);
      const freshJobs = (latestJobsResponse.data?.jobs || []).map(toLatestJob);

      setRecommendations(recommendedJobs);
      setLatestJobs(freshJobs);
      setNewRecommendations(recommendedJobs.length);
    } catch (error) {
      console.error('Failed to load seeker dashboard jobs:', error);
      setRecommendations([]);
      setLatestJobs([]);
      setNewRecommendations(0);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-6">
        <div className="text-center space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#00488d]/10 text-[#00488d]">
            <span className="material-symbols-outlined animate-pulse">progress_activity</span>
          </div>
          <p className="text-on-surface-variant font-medium">Đang tải gợi ý việc làm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <TopNavBar currentPage="home" />

      <main className="max-w-7xl mx-auto px-6 py-24 space-y-16">
        {/* Section 1: Welcome & Career Score Widget */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-[#00488d] dark:text-[#005fb8] mb-2">
                Chào mừng trở lại
              </h1>
              <p className="text-on-surface-variant text-lg">
                Hôm nay có {newRecommendations} dự báo mới dành riêng cho lộ trình sự nghiệp của bạn.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/seeker/profile/personal')}
                className="bg-gradient-to-br from-[#00488d] to-[#0066cc] text-white px-6 py-3 rounded-md font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined">edit_note</span>
                Cập nhật hồ sơ
              </button>
              <button className="bg-surface-container-high text-on-surface px-6 py-3 rounded-md font-semibold flex items-center gap-2 hover:bg-surface-dim transition-colors">
                <span className="material-symbols-outlined">query_stats</span>
                Xem báo cáo
              </button>
            </div>
          </div>

          {/* Career Score Widget */}
          <div className="lg:col-span-5">
            <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_20px_40px_rgba(25,28,33,0.06)] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-8xl">verified_user</span>
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">
                Điểm nghề nghiệp
              </h3>
              <div className="flex items-end gap-3 mb-6">
                <span className="text-6xl font-extrabold text-[#00488d] dark:text-[#005fb8]">{careerScore}</span>
                <span className="text-[#00cc00] font-bold mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  +15
                </span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-2.5 mb-4">
                <div className="bg-[#00488d] h-2.5 rounded-full" style={{ width: '84%' }}></div>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Chỉ số cạnh tranh của bạn đang nằm trong top 5% nhân sự cao cấp ngành IT &amp; Fintech.
              </p>
            </div>
          </div>
        </section>

        {/* Jobs Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Recommended Jobs */}
          <section className="lg:col-span-8 space-y-6">
            <div className="flex justify-between items-end">
              <h2 className="text-2xl font-bold tracking-tight text-on-surface">Việc làm đề xuất</h2>
              <a
                href="#"
                className="text-[#00488d] dark:text-[#005fb8] font-semibold text-sm flex items-center gap-1 hover:underline"
              >
                Xem tất cả <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>

            <div className="space-y-4">
              {recommendations.map((job) => (
                <div
                  key={job.id}
                  className="bg-surface-container-lowest p-6 rounded-xl transition-all hover:shadow-[0_20px_40px_rgba(25,28,33,0.06)] group cursor-pointer"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 rounded-lg bg-surface-container-low flex items-center justify-center p-2">
                        <img
                          className="w-full h-full object-contain"
                          src={job.logo}
                          alt={job.company}
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-on-surface group-hover:text-[#00488d] transition-colors">
                          {job.title}
                        </h3>
                        <p className="text-on-surface-variant font-medium">
                          {job.company} • {job.location}
                        </p>
                      </div>
                    </div>
                    <div className="bg-[#00cc00] text-white px-3 py-1 rounded-full text-xs font-bold">
                      Khớp {job.matchScore}%
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-outline-variant/10">
                    <span className="text-[#00488d] dark:text-[#005fb8] font-bold">{job.salary}</span>
                    <button className="text-sm font-bold text-on-surface-variant hover:text-[#00488d]">
                      Chi tiết
                    </button>
                  </div>
                </div>
              ))}
              {!recommendations.length && (
                <div className="rounded-xl border border-dashed border-outline-variant/30 bg-surface-container-lowest p-6 text-center text-sm text-on-surface-variant">
                  Chưa tìm thấy việc làm phù hợp cho hồ sơ hiện tại.
                </div>
              )}
            </div>
          </section>

          {/* Search Section */}
          <section className="lg:col-span-4 space-y-6">
            <div className="bg-surface-container-low rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00488d]">search_insights</span>
                Tìm kiếm nhanh
              </h3>
              <div className="space-y-4">
                <div className="bg-surface-container-lowest p-2 rounded-xl border border-outline-variant/20 shadow-sm flex items-center gap-3 px-4">
                  <span className="material-symbols-outlined text-outline">search</span>
                  <input
                    className="flex-1 border-none focus:ring-0 bg-transparent text-on-surface placeholder:text-outline-variant text-sm py-2 outline-none"
                    placeholder="Chức danh, kỹ năng..."
                    type="text"
                  />
                </div>
                <div className="bg-surface-container-lowest p-2 rounded-xl border border-outline-variant/20 shadow-sm flex items-center gap-3 px-4">
                  <span className="material-symbols-outlined text-outline">location_on</span>
                  <input
                    className="flex-1 border-none focus:ring-0 bg-transparent text-on-surface placeholder:text-outline-variant text-sm py-2 outline-none"
                    placeholder="Tỉnh thành hoặc Toàn quốc"
                    type="text"
                  />
                </div>
                <button className="w-full bg-gradient-to-br from-[#00488d] to-[#0066cc] text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all hover:shadow-md">
                  <span className="material-symbols-outlined">search</span>
                  Tìm kiếm
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Latest Jobs Section */}
        <section className="space-y-6">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-bold tracking-tight text-on-surface">Danh sách việc làm mới nhất</h2>
            <a
              href="#"
              className="text-[#00488d] dark:text-[#005fb8] font-semibold text-sm flex items-center gap-1 hover:underline"
            >
              Xem thêm <span className="material-symbols-outlined text-sm">keyboard_double_arrow_right</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestJobs.map((job) => (
              <div
                key={job.id}
                className="bg-surface-container-lowest p-6 rounded-xl transition-all hover:shadow-[0_20px_40px_rgba(25,28,33,0.06)] group cursor-pointer"
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                <div className="flex gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center p-2">
                    <img className="w-full h-full object-contain" src={job.logo} alt={job.company} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-on-surface group-hover:text-[#00488d] transition-colors">
                      {job.title}
                    </h3>
                    <p className="text-sm text-on-surface-variant">{job.company}</p>
                  </div>
                </div>
                <p className="text-sm text-on-surface-variant mb-4">{job.location}</p>
                <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                  <span className="text-sm text-on-surface-variant">{job.posted}</span>
                  <span className="text-[#00488d] dark:text-[#005fb8] font-bold">{job.salary}</span>
                </div>
              </div>
            ))}
            {!latestJobs.length && (
              <div className="col-span-full rounded-xl border border-dashed border-outline-variant/30 bg-surface-container-lowest p-6 text-center text-sm text-on-surface-variant">
                Chưa có dữ liệu việc làm mới nhất.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default SeekerHomeLoggedIn;
