import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNavBar from '../../components/TopNavBar';
import API from '../../services/api';

const createJobLogo = (seed) => `https://api.dicebear.com/7.x/icons/svg?seed=${encodeURIComponent(seed || 'job')}`;

const SavedJobsPage = () => {
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login-seeker');
      return;
    }

    const currentUser = JSON.parse(user);
    loadSavedJobs(currentUser);
  }, [navigate]);

  const loadSavedJobs = async (user) => {
    setLoading(true);
    setError('');

    try {
      const response = await API.get(`/user/${user.id}/saved-jobs`);
      setSavedJobs(response.data?.saved_jobs || []);
      setSavedJobIds(response.data?.saved_job_ids || []);
    } catch (err) {
      console.error('Failed to load saved jobs:', err);
      setError('Không tải được danh sách công việc đã lưu.');
      setSavedJobs([]);
      setSavedJobIds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (e, jobId) => {
    e.stopPropagation();

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    try {
      await API.delete(`/user/${user.id}/saved-jobs/${jobId}`);
      setSavedJobs((prev) => prev.filter((job) => job.id !== jobId));
      setSavedJobIds((prev) => prev.filter((id) => id !== jobId));
    } catch (err) {
      console.error('Failed to unsave job:', err);
      setError('Không thể bỏ lưu công việc này.');
    }
  };

  const filteredJobs = savedJobs.filter((job) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;

    return [job.title, job.company, job.location, job.jobFunction, job.industries]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(query));
  });

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <TopNavBar currentPage="saved" />

      <main className="relative pt-28 pb-16 px-4 sm:px-6 lg:px-10">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute right-[-6rem] top-24 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#0b1120] to-transparent" />
        </div>

        <section className="mx-auto max-w-7xl space-y-8">
          {error && (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-100">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 animate-pulse">
                  <div className="flex gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-white/10" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-3/4 rounded bg-white/10" />
                      <div className="h-3 w-1/2 rounded bg-white/10" />
                      <div className="h-3 w-2/3 rounded bg-white/10" />
                    </div>
                  </div>
                  <div className="mt-5 h-24 rounded-2xl bg-white/10" />
                </div>
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200">
                <span className="material-symbols-outlined text-3xl">bookmark</span>
              </div>
              <h3 className="mt-5 text-2xl font-bold text-white">
                {search ? 'Không tìm thấy công việc phù hợp' : 'Chưa có công việc nào được lưu'}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {search
                  ? 'Thử đổi từ khóa tìm kiếm để lọc lại các công việc đã lưu.'
                  : 'Hãy quay lại danh sách việc làm và bấm ngôi sao để lưu công việc bạn quan tâm.'}
              </p>
              <button
                onClick={() => navigate('/seeker/home')}
                className="mt-6 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
              >
                Xem việc làm
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredJobs.map((job) => (
                <article
                  key={job.id}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className="group cursor-pointer rounded-[1.5rem] border border-white/10 bg-white/6 p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/10"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#eef6ff] p-2">
                      <img src={job.logo || createJobLogo(job.company || job.title)} alt={job.company} className="h-full w-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="truncate text-lg font-bold text-white group-hover:text-cyan-200">
                            {job.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-300">{job.company}</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleUnsave(e, job.id)}
                          className="rounded-full border border-white/10 bg-white/5 p-2 text-cyan-200 transition hover:bg-cyan-400/15"
                          title="Bỏ lưu"
                        >
                          <img src="/assets/star2.png" alt="Saved" className="h-5 w-5" />
                        </button>
                      </div>
                      <p className="mt-3 text-sm text-slate-300">{job.location}</p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-[#0b1220]/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Mức lương</span>
                      <span className="text-sm font-semibold text-emerald-200">{job.salary || 'Thoả thuận'}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {job.employmentType && (
                        <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                          {job.employmentType}
                        </span>
                      )}
                      {job.jobFunction && (
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
                          {job.jobFunction}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default SavedJobsPage;
