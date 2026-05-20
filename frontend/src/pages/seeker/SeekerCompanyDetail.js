import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TopNavBar from '../../components/SeekerTopNavBar';

const API_BASE_URL = 'http://127.0.0.1:5000';

const SeekerCompanyDetail = () => {
  const navigate = useNavigate();
  const { companyId } = useParams();

  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedJobType, setSelectedJobType] = useState('all');


  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login-seeker');
      return;
    }
    setIsLoggedIn(true);
    fetchCompanyDetail();
  }, [companyId, navigate]);

  const fetchCompanyDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      // Gọi song song: chi tiết công ty + danh sách job của công ty
      const [companyRes, jobsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/companies/${companyId}`),
        fetch(`${API_BASE_URL}/companies/${companyId}/jobs`),
      ]);

      if (!companyRes.ok) throw new Error(`Không tìm thấy công ty (${companyRes.status})`);
      const companyData = await companyRes.json();

      let jobsData = { jobs: [] };
      if (jobsRes.ok) {
        jobsData = await jobsRes.json();
      }

      // Normalize company
      const c = companyData.company || companyData;
      setCompany({
        id: c.id,
        name: c.company_name || c.name || '',
        logo: c.logo_path
          ? `${API_BASE_URL}/uploads/${c.logo_path}`
          : `https://api.dicebear.com/7.x/icons/svg?seed=${encodeURIComponent(c.company_name || c.name || c.id)}`,
        industry: c.industry || '',
        location: c.address || c.location || '',
        description: c.description || '',
        website: c.website || '',
        openPositions: c.job_count ?? jobsData.jobs?.length ?? 0,
      });

      // Normalize jobs
      const normalizedJobs = (jobsData.jobs || []).map((j) => ({
        id: j.id,
        title: j.job_title || j.title || '',
        company: j.company_name || '',
        location: j.job_address || j.location || '',
        salary: (() => {
          const min = j.salary_min || '';
          const max = j.salary_max || '';
          if (min && max && min !== max) return `${min} - ${max}`;
          return min || max || 'Thoả thuận';
        })(),
        type: (j.employment_type || 'full-time').toLowerCase().replace(' ', '-'),
        experience: j.experience_required || j.experience || '',
        postedDate: j.created_at
          ? formatRelativeDate(j.created_at)
          : j.deadline
          ? `Hạn: ${new Date(j.deadline).toLocaleDateString('vi-VN')}`
          : '',
        deadline: j.deadline || null,
      }));
      setJobs(normalizedJobs);
    } catch (err) {
      console.error('fetchCompanyDetail error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeDate = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
    if (diff === 0) return 'Hôm nay';
    if (diff === 1) return '1 ngày trước';
    if (diff < 30) return `${diff} ngày trước`;
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };


  const filteredJobs =
    selectedJobType === 'all'
      ? jobs
      : jobs.filter((j) => j.type === selectedJobType);

  if (!isLoggedIn) return null;

  if (loading) {
    return (
      <div className="min-h-screen">
        <TopNavBar currentPage="companies" />
        <main className="max-w-7xl mx-auto px-6 py-24 text-center">
          <span className="material-symbols-outlined text-7xl text-outline-variant/40 block mb-4 animate-pulse">
            hourglass_empty
          </span>
          <p className="text-on-surface-variant">Đang tải thông tin công ty...</p>
        </main>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen">
        <TopNavBar currentPage="companies" />
        <main className="max-w-7xl mx-auto px-6 py-24 text-center">
          <span className="material-symbols-outlined text-7xl text-error block mb-4">error_outline</span>
          <p className="text-error font-semibold mb-4">{error || 'Không tìm thấy công ty'}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-[#00488d] text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90"
          >
            Quay lại
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopNavBar currentPage="companies" />

      <main className="max-w-7xl mx-auto px-6 py-24 space-y-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-on-surface-variant hover:text-[#00488d] transition-colors text-sm"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Quay lại
        </button>

        {/* Company Header */}
        <section className="bg-surface-container-lowest rounded-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left: Info */}
            <div className="md:col-span-8 space-y-6">
              <div className="flex gap-6 items-start">
                <div className="w-24 h-24 rounded-xl bg-surface-container-low flex items-center justify-center p-3 flex-shrink-0">
                  <img
                    className="w-full h-full object-contain"
                    src={company.logo}
                    alt={company.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://api.dicebear.com/7.x/icons/svg?seed=${encodeURIComponent(company.name)}`;
                    }}
                  />
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-on-surface mb-1">
                    {company.name}
                  </h1>
                  <p className="text-on-surface-variant text-lg">{company.industry}</p>
                  {company.rating !== null && (
                    <div className="flex items-center gap-1 mt-2">
                      <span className="material-symbols-outlined text-yellow-500 text-sm">star</span>
                      <span className="text-sm font-semibold text-on-surface">{company.rating}</span>
                      {company.reviews > 0 && (
                        <span className="text-xs text-on-surface-variant">
                          ({company.reviews} đánh giá)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* About */}
              {company.aboutText && (
                <div>
                  <h3 className="text-lg font-bold text-on-surface mb-2">Về công ty</h3>
                  <p className="text-on-surface-variant leading-relaxed">{company.aboutText}</p>
                </div>
              )}

            </div>

            {/* Right Sidebar */}
            <div className="md:col-span-4 space-y-4">
              {/* Action Buttons */}
              <div className="space-y-2">
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-6 py-3 rounded-lg font-bold bg-[#00488d]/10 text-[#00488d] hover:bg-[#00488d]/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">open_in_new</span>
                    Trang web
                  </a>
                )}
              </div>

              {/* Info Card */}
              <div className="bg-[#00488d]/5 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 pb-3 border-b border-[#00488d]/20">
                  <span className="material-symbols-outlined text-[#00488d]">location_on</span>
                  <span className="text-sm text-on-surface">{company.location}</span>
                </div>
                {company.employees && (
                  <div className="flex items-center gap-2 pb-3 border-b border-[#00488d]/20">
                    <span className="material-symbols-outlined text-[#00488d]">group</span>
                    <span className="text-sm text-on-surface">{company.employees} nhân viên</span>
                  </div>
                )}
                {company.founded && (
                  <div className="flex items-center gap-2 pb-3 border-b border-[#00488d]/20">
                    <span className="material-symbols-outlined text-[#00488d]">calendar_today</span>
                    <span className="text-sm text-on-surface">Thành lập {company.founded}</span>
                  </div>
                )}
                {company.openPositions > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#00488d]">work</span>
                    <span className="text-sm font-bold text-[#00488d]">{company.openPositions} vị trí đang tuyển</span>
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#00488d]">language</span>
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#00488d] hover:underline truncate"
                    >
                      {company.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Jobs Section */}
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-tight text-on-surface">
              Việc làm đang tuyển ({filteredJobs?.length ?? 0})
            </h2>
            <div className="flex items-center gap-2">
              {['all', 'full-time', 'part-time'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedJobType(type)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    selectedJobType === type
                      ? 'bg-[#00488d] text-white'
                      : 'bg-surface-container-high text-on-surface hover:bg-surface-dim'
                  }`}
                >
                  {type === 'all' ? 'Tất cả' : type === 'full-time' ? 'Full-time' : 'Part-time'}
                </button>
              ))}
            </div>
          </div>

          {filteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-surface-container-lowest p-6 rounded-xl transition-all hover:shadow-[0_20px_40px_rgba(25,28,33,0.06)] group cursor-pointer"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-on-surface group-hover:text-[#00488d] transition-colors mb-1">
                        {job.title}
                      </h3>
                      <p className="text-sm text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        {job.location}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                        job.type === 'full-time'
                          ? 'bg-[#00cc00]/20 text-[#00cc00]'
                          : 'bg-[#ff9800]/20 text-[#ff9800]'
                      }`}
                    >
                      {job.type === 'full-time' ? 'Full-time' : 'Part-time'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-4 text-sm text-on-surface-variant">
                    {job.experience && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">business_center</span>
                        {job.experience}
                      </span>
                    )}
                    {job.postedDate && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {job.postedDate}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                    <span className="text-[#00488d] font-bold">{job.salary}</span>
                    <span className="text-xs text-on-surface-variant">Xem chi tiết →</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-xl p-12 text-center">
              <span className="material-symbols-outlined text-8xl text-outline-variant/30 block mb-4">
                work_off
              </span>
              <h3 className="text-xl font-bold text-on-surface mb-2">Không có vị trí tuyển dụng</h3>
              <p className="text-on-surface-variant">
                Công ty này hiện không có vị trí{' '}
                {selectedJobType !== 'all' ? selectedJobType : ''} đang tuyển dụng.
              </p>
            </div>
          )}
        </section>

      </main>
    </div>
  );
};

export default SeekerCompanyDetail;