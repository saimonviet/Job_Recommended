/**
 * Job Listing Script for seeker_home.html
 * Dynamically fetches and displays job data from the API
 */

const API_URL = "http://127.0.0.1:5000";

class JobDisplay {
  constructor(containerId = "jobs-container") {
    this.container = document.getElementById(containerId);
    this.currentPage = 1;
    this.perPage = 6;
    this.totalPages = 1;
    this.allJobs = [];
    this.filteredJobs = [];
  }

  /**
   * Fetch jobs from API
   */
  async fetchJobs(page = 1, search = "") {
    try {
      const params = new URLSearchParams({
        page: page,
        per_page: this.perPage,
      });

      if (search) {
        params.append("search", search);
      }

      const response = await fetch(`${API_URL}/jobs?${params}`);

      if (!response.ok) {
        throw new Error(
          `API Error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      this.allJobs = data.jobs || [];
      this.totalPages = data.pages || 1;
      this.currentPage = data.current_page || 1;

      return {
        jobs: this.allJobs,
        total: data.total,
        pages: this.totalPages,
      };
    } catch (error) {
      console.error("Error fetching jobs:", error);
      return {
        jobs: [],
        total: 0,
        pages: 0,
      };
    }
  }

  /**
   * Render job cards to the container
   */
  renderJobs(jobs) {
    if (!this.container) {
      console.error("Container not found!");
      return;
    }

    if (jobs.length === 0) {
      this.container.innerHTML = `
        <div class="no-jobs-message">
          <p>Không tìm thấy công việc nào. Vui lòng thử tìm kiếm khác.</p>
        </div>
      `;
      return;
    }

    const jobsHTML = jobs
      .map((job) => this.createJobCard(job))
      .join("");

    this.container.innerHTML = jobsHTML;
  }

  /**
   * Create a single job card HTML
   */
  createJobCard(job) {
    const salary = `${job.salary_min} - ${job.salary_max}`;
    const location = job.job_address || "Chưa cập nhật";
    const experience = job.job_experience_required || "Chưa cập nhật";

    return `
      <div class="bg-surface-container-lowest p-6 rounded-xl hover:shadow-[0_20px_40px_rgba(25,28,33,0.06)] transition-all flex flex-col h-full group" data-job-id="${job.id}">
        <div class="flex justify-between items-start mb-6">
          <div class="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center overflow-hidden">
            <span class="material-symbols-outlined text-primary">business</span>
          </div>
          <div class="bg-tertiary/10 text-tertiary px-3 py-1 rounded-full text-xs font-bold">Phù hợp</div>
        </div>

        <h4 class="text-xl font-bold text-on-surface group-hover:text-primary transition-colors mb-1">
          ${this.escapeHtml(job.job_title)}
        </h4>

        <p class="text-sm font-medium text-on-surface-variant mb-6">
          ${this.escapeHtml(job.company_name)} • ${this.escapeHtml(location)}
        </p>

        <div class="flex flex-wrap gap-2 mb-8">
          ${job.job_function ? `<span class="px-2 py-1 bg-surface-container text-xs rounded-md text-on-surface-variant">${this.escapeHtml(job.job_function)}</span>` : ""}
          ${job.employment_type ? `<span class="px-2 py-1 bg-surface-container text-xs rounded-md text-on-surface-variant">${this.escapeHtml(job.employment_type)}</span>` : ""}
        </div>

        <div class="mt-auto pt-6 flex justify-between items-center border-t border-surface-container">
          <span class="font-bold text-on-surface">${salary}</span>
          <button class="text-primary font-bold text-sm view-job-btn" onclick="jobDisplay.showJobDetail(${job.id})">
            Xem chi tiết
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Show job detail modal
   */
  showJobDetail(jobId) {
    const job = this.allJobs.find((j) => j.id === jobId);
    if (!job) {
      alert("Không tìm thấy công việc!");
      return;
    }

    const modal = `
      <div class="job-detail-modal" onclick="jobDisplay.closeModal()">
        <div class="job-detail-content" onclick="event.stopPropagation()">
          <button class="close-btn" onclick="jobDisplay.closeModal()">×</button>

          <h2>${this.escapeHtml(job.job_title)}</h2>
          <p class="company-name">${this.escapeHtml(job.company_name)}</p>

          <div class="job-info">
            <div class="info-item">
              <strong>Địa điểm:</strong> ${this.escapeHtml(job.job_address || "Chưa cập nhật")}
            </div>
            <div class="info-item">
              <strong>Lương:</strong> ${job.salary_min} - ${job.salary_max}
            </div>
            <div class="info-item">
              <strong>Loại hợp đồng:</strong> ${this.escapeHtml(job.employment_type || "Chưa cập nhật")}
            </div>
            <div class="info-item">
              <strong>Kinh nghiệm:</strong> ${this.escapeHtml(job.job_experience_required || "Chưa cập nhật")}
            </div>
            <div class="info-item">
              <strong>Hạn chót:</strong> ${this.formatDate(job.deadline)}
            </div>
          </div>

          <div class="job-section">
            <h3>Mô tả công việc</h3>
            <p>${this.formatText(job.job_description)}</p>
          </div>

          <div class="job-section">
            <h3>Yêu cầu công việc</h3>
            <p>${this.formatText(job.job_requirement)}</p>
          </div>

          <button class="apply-btn" onclick="alert('Tính năng ứng tuyển sẽ được cập nhật sớm!')">
            Ứng tuyển ngay
          </button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modal);
  }

  /**
   * Close modal
   */
  closeModal() {
    const modal = document.querySelector(".job-detail-modal");
    if (modal) {
      modal.remove();
    }
  }

  /**
   * Format text (convert line breaks to HTML)
   */
  formatText(text) {
    if (!text) return "";
    return this.escapeHtml(text).replace(/\n/g, "<br>");
  }

  /**
   * Format date
   */
  formatDate(dateString) {
    if (!dateString) return "Chưa cập nhật";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Load and display jobs
   */
  async loadJobs(page = 1, search = "") {
    const data = await this.fetchJobs(page, search);
    this.renderJobs(data.jobs);
    this.updatePagination(page, data.pages);
  }

  /**
   * Update pagination buttons
   */
  updatePagination(currentPage, totalPages) {
    const prevBtn = document.getElementById("prev-page-btn");
    const nextBtn = document.getElementById("next-page-btn");
    const pageInfo = document.getElementById("page-info");

    if (prevBtn) {
      prevBtn.disabled = currentPage === 1;
      prevBtn.onclick = () => this.loadJobs(currentPage - 1);
    }

    if (nextBtn) {
      nextBtn.disabled = currentPage >= totalPages;
      nextBtn.onclick = () => this.loadJobs(currentPage + 1);
    }

    if (pageInfo) {
      pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;
    }
  }
}

// Global instance
let jobDisplay;

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  jobDisplay = new JobDisplay("jobs-container");
  jobDisplay.loadJobs(1);

  // Setup search form
  const searchForm = document.getElementById("job-search-form");
  if (searchForm) {
    searchForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const searchInput = document.getElementById("job-search-input");
      const query = searchInput ? searchInput.value : "";
      jobDisplay.loadJobs(1, query);
    });
  }
});

// Add CSS for modal
const style = document.createElement("style");
style.textContent = `
  .job-detail-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .job-detail-content {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    max-width: 700px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  }

  .job-detail-content h2 {
    margin: 0 0 0.5rem 0;
    color: #191c21;
    font-size: 1.5rem;
  }

  .company-name {
    margin: 0 0 1.5rem 0;
    color: #666;
    font-weight: 500;
  }

  .close-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    font-size: 2rem;
    cursor: pointer;
    color: #999;
  }

  .close-btn:hover {
    color: #333;
  }

  .job-info {
    background: #f9f9ff;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
  }

  .info-item {
    margin-bottom: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #e0e0f0;
  }

  .info-item:last-child {
    margin-bottom: 0;
    border-bottom: none;
  }

  .info-item strong {
    color: #00488d;
    display: inline-block;
    width: 120px;
  }

  .job-section {
    margin-bottom: 1.5rem;
  }

  .job-section h3 {
    margin: 0 0 0.75rem 0;
    color: #00488d;
    font-size: 1.1rem;
  }

  .job-section p {
    margin: 0;
    color: #666;
    line-height: 1.6;
  }

  .apply-btn {
    width: 100%;
    padding: 0.75rem;
    background: linear-gradient(135deg, #00488d 0%, #005fb8 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    font-size: 1rem;
    transition: transform 0.3s ease;
  }

  .apply-btn:hover {
    transform: translateY(-2px);
  }

  .no-jobs-message {
    text-align: center;
    padding: 2rem;
    color: #999;
  }
`;
document.head.appendChild(style);
