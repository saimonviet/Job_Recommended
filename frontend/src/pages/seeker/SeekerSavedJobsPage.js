import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNavBar from '../../components/SeekerTopNavBar';
import api from '../../services/api';

const createJobLogo = (seed) =>
  `https://api.dicebear.com/7.x/icons/svg?seed=${encodeURIComponent(seed || 'job')}`;

const SeekerSavedJobsPage = () => {
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login-seeker');
      return;
    }

    loadSavedJobs();
  }, [navigate]);

  const loadSavedJobs = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/seeker/saved-jobs');
      const jobs = response.data?.saved_jobs || [];
      setSavedJobs(jobs);
    } catch (err) {
      console.error('Failed to load saved jobs:', err);
      setError(err.message || 'Không tải được danh sách công việc đã lưu.');
      setSavedJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (e, jobId) => {
    e.stopPropagation();

    try {
      await api.unsaveJob(jobId);
      setSavedJobs((prev) => prev.filter((job) => job.id !== jobId));
    } catch (err) {
      console.error('Failed to unsave job:', err);
      setError('Không thể bỏ lưu công việc này.');
    }
  };

  const getFilteredJobs = () => {
    const query = search.trim().toLowerCase();
    let filtered = savedJobs;

    if (query) {
      filtered = filtered.filter((job) =>
        [job.title, job.company, job.location, job.jobFunction, job.industries]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(query))
      );
    }

    if (filterStatus === 'all') return filtered;
    if (filterStatus === 'active') {
      return filtered.filter(
        (job) => job.status === 'active' || job.status === 'normal'
      );
    }
    if (filterStatus === 'expiring') {
      return filtered.filter((job) => job.status === 'expiring');
    }

    return filtered;
  };

  const getStatusBadge = (job) => {
    if (job.matchScore) {
      return (
        <span className="px-3 py-1 bg-tertiary/10 text-tertiary text-xs font-bold rounded-full uppercase tracking-widest">
          {job.matchScore}% Match
        </span>
      );
    }

    if (job.status === 'expiring') {
      return (
        <span className="px-3 py-1 bg-error/10 text-error text-xs font-bold rounded-full uppercase tracking-widest">
          Sắp hết hạn
        </span>
      );
    }

    return null;
  };

  const filteredJobs = getFilteredJobs();

  return (
    <div className="min-h-screen">
      <TopNavBar currentPage="saved" />

      <div className="min-h-screen pt-16">
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="max-w-5xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-on-surface font-headline">
                Công việc đã lưu
              </h1>
              <p className="mt-2 text-on-surface-variant">
                Theo dõi những công việc bạn quan tâm và ứng tuyển khi sẵn sàng.
              </p>
            </header>

            <div className="space-y-6">
              {loading ? (
                <div className="space-y-6">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="bg-surface-container-lowest p-6 rounded-xl animate-pulse"
                    >
                      <div className="flex gap-4 mb-4">
                        <div className="w-16 h-16 rounded-lg bg-surface-container-low" />
                        <div className="flex-1">
                          <div className="h-6 bg-surface-container-low rounded w-3/4 mb-2" />
                          <div className="h-4 bg-surface-container-low rounded w-1/2" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="h-4 bg-surface-container-low rounded" />
                        <div className="h-4 bg-surface-container-low rounded w-5/6" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="bg-error/10 border border-error/20 p-6 rounded-xl text-error text-center">
                  <p>{error}</p>
                </div>
              ) : filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="bg-surface-container-lowest p-6 rounded-xl transition-shadow hover:shadow-[0_20px_40px_rgba(25,28,33,0.06)] group cursor-pointer border border-outline-variant/10"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-lg bg-surface-container-low flex items-center justify-center overflow-hidden flex-shrink-0">
                          <img
                            alt={`${job.company} Logo`}
                            className="w-12 h-12 object-contain"
                            src={job.logo || createJobLogo(job.company || job.title)}
                          />
                        </div>

                        <div>
                          <h3 className="text-xl font-bold font-headline text-on-surface group-hover:text-primary transition-colors">
                            {job.title}
                          </h3>
                          <p className="text-on-surface-variant font-medium">
                            {job.company} • {job.location}
                          </p>
                        </div>
                      </div>

                      {getStatusBadge(job)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 py-4 border-y border-outline-variant/10">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1 font-bold">
                          Mức lương
                        </p>
                        <p className="text-sm font-semibold text-primary">
                          {job.salary || 'Thoả thuận'}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1 font-bold">
                          Loại công việc
                        </p>
                        <p className="text-sm font-semibold text-on-surface">
                          {job.employmentType || 'N/A'}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1 font-bold">
                          Chức năng
                        </p>
                        <p className="text-sm font-semibold text-on-surface">
                          {job.jobFunction || 'N/A'}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1 font-bold">
                          Ngành
                        </p>
                        <p className="text-sm font-semibold text-on-surface">
                          {job.industries || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        onClick={(e) => handleUnsave(e, job.id)}
                        className="text-on-surface-variant hover:text-error text-sm font-bold flex items-center gap-2 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">
                          bookmark_remove
                        </span>
                        Bỏ lưu
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/jobs/${job.id}`);
                        }}
                        className="px-8 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                      >
                        Ứng tuyển ngay
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-surface-container-lowest p-12 rounded-xl text-center border border-outline-variant/10">
                  <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4 inline-block">
                    bookmark
                  </span>

                  <h3 className="text-xl font-bold text-on-surface mb-2">
                    Chưa có công việc đã lưu
                  </h3>

                  <p className="text-on-surface-variant mb-6">
                    Hãy lưu những công việc bạn quan tâm để theo dõi dễ dàng hơn.
                  </p>

                  <button
                    onClick={() => navigate('/seeker/home')}
                    className="px-6 py-3 bg-primary text-on-primary rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
                  >
                    Khám phá công việc
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SeekerSavedJobsPage;