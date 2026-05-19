import React, { useEffect, useState } from "react";
import API from "../services/api";
import { formatSalaryRange } from "../utils/dataFormatter";

const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchJobs();
  }, [page, search]);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: page,
        per_page: 12,
      };
      if (search) {
        params.search = search;
      }

      const response = await API.get("/jobs", { params });
      setJobs(response.data.jobs || []);
      setTotal(response.data.total || 0);
    } catch (err) {
      setError("Failed to fetch jobs: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const getTotalPages = () => {
    return Math.ceil(total / 12);
  };

  return (
    <div className="job-list-container">
      <div className="job-search-section">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Tìm kiếm theo chức danh, công ty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">
            Tìm kiếm
          </button>
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="jobs-grid">
        {loading ? (
          <div className="loading">Đang tải dữ liệu...</div>
        ) : jobs.length === 0 ? (
          <div className="no-jobs">Không tìm thấy công việc nào</div>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="job-card">
              <div className="job-header">
                <h3 className="job-title">{job.job_title}</h3>
                <span className="match-badge">Phù hợp</span>
              </div>

              <p className="job-company">
                {job.company_name}
                {job.job_address && ` • ${job.job_address}`}
              </p>

              <div className="job-tags">
                {job.job_function && (
                  <span className="tag">{job.job_function}</span>
                )}
                {job.employment_type && (
                  <span className="tag">{job.employment_type}</span>
                )}
              </div>

              <div className="job-details">
                <p>
                  <strong>Lương:</strong> {formatSalaryRange(job.salary_min, job.salary_max)}
                </p>
                {job.job_experience_required && (
                  <p>
                    <strong>Kinh nghiệm:</strong> {job.job_experience_required}
                  </p>
                )}
              </div>

              <div className="job-footer">
                <button className="view-button">Xem chi tiết</button>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && jobs.length > 0 && (
        <div className="pagination">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="pagination-button"
          >
            Trước
          </button>

          <span className="page-info">
            Trang {page} / {getTotalPages()}
          </span>

          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= getTotalPages()}
            className="pagination-button"
          >
            Tiếp
          </button>
        </div>
      )}
    </div>
  );
};

export default JobList;
