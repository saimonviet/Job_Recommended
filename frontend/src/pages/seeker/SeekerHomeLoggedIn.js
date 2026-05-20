import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNavBar from '../../components/SeekerTopNavBar';
import API from '../../services/api';
import { formatSalaryRange } from '../../utils/dataFormatter';
import { buildJobSearchParams } from '../../utils/searchHelper';

const createJobLogo = (seed) => `https://api.dicebear.com/7.x/icons/svg?seed=${encodeURIComponent(seed || 'job')}`;

const normalizeSalaryField = (salary, min, max) => {
  const rawSalary = salary === null || salary === undefined ? '' : String(salary).trim();
  if (rawSalary) {
    if (/triệu|vnd/i.test(rawSalary)) {
      return rawSalary;
    }

    const rangeMatch = rawSalary.match(/^\s*([0-9,.]+)\s*-\s*([0-9,.]+)\s*$/);
    if (rangeMatch) {
      return formatSalaryRange(rangeMatch[1], rangeMatch[2]);
    }

    const numeric = rawSalary.replace(/[^0-9]/g, '');
    if (numeric) {
      return formatSalaryRange(numeric, numeric);
    }
  }

  return formatSalaryRange(min, max);
};

const formatSalary = (job) => normalizeSalaryField(job.salary, job.salary_min ?? job.min_salary, job.salary_max ?? job.max_salary);

const normalizeJob = (job) => ({
  id: job.id,
  title: job.title || job.job_title,
  company: job.company || job.company_name,
  location: job.location || job.job_address,
  salary: formatSalary(job),
  benefits: job.benefits || '',
  logo: job.logo || createJobLogo(job.company || job.company_name || job.title || job.job_title),
  matchScore: job.matchScore ?? job.match_score ?? 0,
  detail_address: job.job_detail_address,
});

const toRecommendedJob = (job) => normalizeJob(job);

const toLatestJob = (job) => ({
  ...normalizeJob(job),
  posted: job.deadline ? `Hạn ${new Date(job.deadline).toLocaleDateString('vi-VN')}` : 'Mới đăng',
});

const profileStepLabels = {
  location: 'Địa điểm mong muốn',
  desired_job: 'Chức vụ mong muốn',
  experience: 'Kinh nghiệm làm việc',
};

// Cache constants
const CACHE_KEY_LATEST_JOBS = 'cache_latest_jobs';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút

// Helper: kiểm tra cache có còn hiệu lực
const getCachedData = (key) => {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts < CACHE_TTL_MS) {
      return data; // Cache còn hợp lệ
    }
    sessionStorage.removeItem(key); // Cache hết hạn, xóa
  } catch (e) {
    console.warn('Cache read error:', e);
  }
  return null;
};

// Helper: lưu dữ liệu vào cache
const setCachedData = (key, data) => {
  try {
    sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch (e) {
    console.warn('Cache write error:', e);
  }
};

const SeekerHomeLoggedIn = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [latestJobs, setLatestJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [careerScore] = useState(842);
  const [newRecommendations, setNewRecommendations] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [profileMissingFields, setProfileMissingFields] = useState([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [latestJobsLoaded, setLatestJobsLoaded] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [searchActive, setSearchActive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchExpanded, setSearchExpanded] = useState(true);
  const [activeSortCriteria, setActiveSortCriteria] = useState('newest'); // newest, location, salary, experience, industry
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc
  // Filter states
  const [filterLocation, setFilterLocation] = useState('');
  const [filterSalary, setFilterSalary] = useState('');
  const [filterExperience, setFilterExperience] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedJobIds, setSavedJobIds] = useState([]);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login-seeker');
      return;
    }

    setIsLoggedIn(true);
    const currentUser = JSON.parse(user);
    loadLatestJobs();
    loadDashboard(currentUser);
    loadSavedJobsFromAPI(currentUser);
  }, [navigate]);

  const loadLatestJobs = async () => {
    setJobsLoading(true);
    try {
      // Kiểm tra cache trước
      const cached = getCachedData(CACHE_KEY_LATEST_JOBS);
      if (cached) {
        setLatestJobs(cached.jobs);
        setTotalPages(cached.pages);
        setLatestJobsLoaded(true);
        setJobsLoading(false);
        return;
      }

      // Gọi API nếu cache hết hạn
      const latestJobsResponse = await API.get('/jobs', { params: { page: 1, per_page: 6 } });
      const freshJobs = (latestJobsResponse.data?.jobs || []).map(toLatestJob);
      setLatestJobs(freshJobs);
      setTotalPages(latestJobsResponse.data?.pages || 1);

      // Lưu vào cache
      setCachedData(CACHE_KEY_LATEST_JOBS, {
        jobs: freshJobs,
        pages: latestJobsResponse.data?.pages || 1,
      });
    } catch (error) {
      console.error('Failed to load latest jobs:', error);
      setLatestJobs([]);
    } finally {
      setLatestJobsLoaded(true);
      setJobsLoading(false);
    }
  };

  const loadDashboard = async (user) => {
    setProfileLoading(true);
    setLoadingRecommendations(true);

    try {
      const profileResponse = await API.get(`/user-profile/${user.id}`);

      const isComplete = true;
      const missingFields = [];

      setProfileComplete(isComplete);
      setProfileMissingFields(missingFields);

      if (!isComplete) {
        setRecommendations([]);
        setNewRecommendations(0);
        setLoadingRecommendations(false);
        return;
      }

      const recommendationResponse = await API.get('/seeker/recommendations');
      const recommendedJobs = (recommendationResponse.data?.recommendations || []).map(toRecommendedJob);

      setRecommendations(recommendedJobs);
      setNewRecommendations(recommendedJobs.length);
    } catch (error) {
      console.error('Failed to load seeker dashboard jobs:', error);
      setRecommendations([]);
      setNewRecommendations(0);
    } finally {
      setProfileLoading(false);
      setLoadingRecommendations(false);
    }
  };

  const loadSavedJobsFromAPI = async (user) => {
    try {
      const response = await API.get('/seeker/saved-jobs');
      setSavedJobIds(response.data.saved_job_ids || []);
    } catch (error) {
      console.error('Failed to load saved jobs:', error);
      setSavedJobIds([]);
    }
  };

  const toggleSaveJob = async (e, jobId) => {
    e.stopPropagation();

    try {
      if (savedJobIds.includes(jobId)) {
        // Remove from saved
        await API.unsaveJob(jobId);
        setSavedJobIds(prevIds => prevIds.filter(id => id !== jobId));
      } else {
        // Add to saved
        await API.saveJob(jobId);
        setSavedJobIds(prevIds => [...prevIds, jobId]);
      }
    } catch (error) {
      console.error('Failed to toggle saved job:', error);
    }
  };

  const handleSearch = async () => {
    try {
      setCurrentPage(1); // Reset to page 1 for new search
      setJobsLoading(true);
      
      // If no search criteria are selected, restore the latest jobs
      if (!searchQuery && !filterLocation && !filterSalary && !filterExperience && !filterIndustry) {
        handleClearFilters();
        return;
      }

      const params = buildJobSearchParams({
        page: 1,
        perPage: 6,
        searchQuery,
        filterLocation,
        filterSalary,
        filterExperience,
        filterIndustry,
      });

      // Call API with filters
      const response = await API.get('/jobs', { params });
      const results = (response.data?.jobs || []).map(toLatestJob);
      
      setFilteredJobs(results);
      setTotalPages(response.data?.pages || 1);
      setSearchActive(true);
    } catch (error) {
      console.error('Failed to search jobs:', error);
      setFilteredJobs([]);
      setTotalPages(1);
      setSearchActive(true);
    } finally {
      setJobsLoading(false);
    }
  };

  const handlePageChange = async (newPage) => {
    try {
      setCurrentPage(newPage);
      setJobsLoading(true);
      
      const params = buildJobSearchParams({
        page: newPage,
        perPage: 6,
        searchQuery,
        filterLocation,
        filterSalary,
        filterExperience,
        filterIndustry,
      });

      const response = await API.get('/jobs', { params });
      const results = (response.data?.jobs || []).map(toLatestJob);
      
      if (searchActive) {
        setFilteredJobs(results);
      } else {
        setLatestJobs(results);
      }
      setTotalPages(response.data?.pages || 1);
      
      // Scroll to top of jobs section
      window.scrollTo({ top: document.querySelector('section')?.offsetTop - 100, behavior: 'smooth' });
    } catch (error) {
      console.error('Failed to change page:', error);
    } finally {
      setJobsLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilterLocation('');
    setFilterSalary('');
    setFilterExperience('');
    setFilterIndustry('');
    setSearchQuery('');
    setSearchActive(false);
    setFilteredJobs([]);
    setCurrentPage(1);
    setTotalPages(1);
    setActiveSortCriteria('newest');
    setSortOrder('asc');
    loadLatestJobs();
  };

  // Format match score for display (handles 0-1 and 0-100 ranges)
  const formatMatchScore = (s) => {
    if (s === null || s === undefined) return '—';
    const n = Number(s);
    if (Number.isNaN(n)) return '—';
    if (n >= 0 && n <= 1) return `${Math.round(n * 100)}%`;
    if (n > 1 && n <= 100) return `${Math.round(n)}%`;
    return `${n.toFixed(2)}`;
  };

  if (!isLoggedIn) return null;

  // Toggle sort for criteria
  const handleSortToggleCriteria = (criteria) => {
    if (activeSortCriteria === criteria) {
      // Toggle between asc and desc
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Switch criteria and reset to asc
      setActiveSortCriteria(criteria);
      setSortOrder('asc');
    }
  };

  // Apply sorting to display jobs
  const applySorting = (jobs) => {
    const sorted = [...jobs];
    
    if (activeSortCriteria === 'location') {
      sorted.sort((a, b) => {
        const locA = (a.location || '').toLowerCase();
        const locB = (b.location || '').toLowerCase();
        return sortOrder === 'asc' ? locA.localeCompare(locB) : locB.localeCompare(locA);
      });
    } else if (activeSortCriteria === 'salary') {
      sorted.sort((a, b) => {
        const salaryA = parseInt(String(a.salary || '').replace(/[^0-9]/g, '')) || 0;
        const salaryB = parseInt(String(b.salary || '').replace(/[^0-9]/g, '')) || 0;
        return sortOrder === 'asc' ? salaryA - salaryB : salaryB - salaryA;
      });
    } else if (activeSortCriteria === 'experience') {
      sorted.sort((a, b) => {
        const expA = (a.detail_address || '').toLowerCase();
        const expB = (b.detail_address || '').toLowerCase();
        return sortOrder === 'asc' ? expA.localeCompare(expB) : expB.localeCompare(expA);
      });
    } else if (activeSortCriteria === 'industry') {
      sorted.sort((a, b) => {
        const indA = (a.title || '').toLowerCase();
        const indB = (b.title || '').toLowerCase();
        return sortOrder === 'asc' ? indA.localeCompare(indB) : indB.localeCompare(indA);
      });
    }
    // newest is default, no sort needed
    return sorted;
  };

  const displayJobs = applySorting(searchActive ? filteredJobs : latestJobs);

  return (
    <div className="min-h-screen">
      <TopNavBar currentPage="home" />

      <main className="max-w-7xl mx-auto px-6 py-24 space-y-16">
        {/* Search Section */}
        <section className="space-y-6">
          <div className="bg-surface-container-low rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setSearchExpanded(!searchExpanded)}>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00488d]">search_insights</span>
                Tìm kiếm nhanh
              </h3>
              <button className="p-2 hover:bg-surface-container-low rounded-lg transition-colors">
                <span className="material-symbols-outlined text-[#00488d] text-2xl">
                  {searchExpanded ? 'expand_less' : 'expand_more'}
                </span>
              </button>
            </div>
            {searchExpanded && (
              <>
                <div className="space-y-3 mb-6">
                  <label className="text-sm font-semibold text-on-surface">Tìm kiếm theo từ khóa</label>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tên công việc, công ty hoặc kỹ năng"
                    className="w-full border border-outline-variant/20 rounded-lg bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-[#00488d] transition-colors"
                  />
                </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Location Filter */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-on-surface">Địa điểm làm việc</label>
                  <button
                    onClick={() => handleSortToggleCriteria('location')}
                    className={`text-lg transition-colors ${activeSortCriteria === 'location' ? 'text-[#22c55e]' : 'text-on-surface-variant hover:text-on-surface'}`}
                    title="Sắp xếp"
                  >
                    {activeSortCriteria === 'location' ? (sortOrder === 'asc' ? '↑' : '↓') : '↑'}
                  </button>
                </div>
                <select 
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="w-full border border-outline-variant/20 rounded-lg bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-[#00488d] transition-colors"
                >
                  <option value="">Chọn tỉnh thành</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Hải Phòng">Hải Phòng</option>
                  <option value="Cần Thơ">Cần Thơ</option>
                  <option value="An Giang">An Giang</option>
                  <option value="Bà Rịa - Vũng Tàu">Bà Rịa - Vũng Tàu</option>
                  <option value="Bắc Giang">Bắc Giang</option>
                  <option value="Bắc Kạn">Bắc Kạn</option>
                  <option value="Bạc Liêu">Bạc Liêu</option>
                  <option value="Bắc Ninh">Bắc Ninh</option>
                  <option value="Bến Tre">Bến Tre</option>
                  <option value="Bình Định">Bình Định</option>
                  <option value="Bình Dương">Bình Dương</option>
                  <option value="Bình Phước">Bình Phước</option>
                  <option value="Bình Thuận">Bình Thuận</option>
                  <option value="Cà Mau">Cà Mau</option>
                  <option value="Cao Bằng">Cao Bằng</option>
                  <option value="Đắk Lắk">Đắk Lắk</option>
                  <option value="Đắk Nông">Đắk Nông</option>
                  <option value="Điện Biên">Điện Biên</option>
                  <option value="Đồng Nai">Đồng Nai</option>
                  <option value="Đồng Tháp">Đồng Tháp</option>
                  <option value="Gia Lai">Gia Lai</option>
                  <option value="Hà Giang">Hà Giang</option>
                  <option value="Hà Nam">Hà Nam</option>
                  <option value="Hà Tĩnh">Hà Tĩnh</option>
                  <option value="Hải Dương">Hải Dương</option>
                  <option value="Hậu Giang">Hậu Giang</option>
                  <option value="Hòa Bình">Hòa Bình</option>
                  <option value="Hưng Yên">Hưng Yên</option>
                  <option value="Khánh Hòa">Khánh Hòa</option>
                  <option value="Kiên Giang">Kiên Giang</option>
                  <option value="Kon Tum">Kon Tum</option>
                  <option value="Lai Châu">Lai Châu</option>
                  <option value="Lâm Đồng">Lâm Đồng</option>
                  <option value="Lạng Sơn">Lạng Sơn</option>
                  <option value="Lào Cai">Lào Cai</option>
                  <option value="Long An">Long An</option>
                  <option value="Nam Định">Nam Định</option>
                  <option value="Nghệ An">Nghệ An</option>
                  <option value="Ninh Bình">Ninh Bình</option>
                  <option value="Ninh Thuận">Ninh Thuận</option>
                  <option value="Phú Thọ">Phú Thọ</option>
                  <option value="Quảng Bình">Quảng Bình</option>
                  <option value="Quảng Nam">Quảng Nam</option>
                  <option value="Quảng Ngãi">Quảng Ngãi</option>
                  <option value="Quảng Ninh">Quảng Ninh</option>
                  <option value="Quảng Trị">Quảng Trị</option>
                  <option value="Sóc Trăng">Sóc Trăng</option>
                  <option value="Sơn La">Sơn La</option>
                  <option value="Tây Ninh">Tây Ninh</option>
                  <option value="Thái Bình">Thái Bình</option>
                  <option value="Thái Nguyên">Thái Nguyên</option>
                  <option value="Thanh Hóa">Thanh Hóa</option>
                  <option value="Thừa Thiên Huế">Thừa Thiên Huế</option>
                  <option value="Tiền Giang">Tiền Giang</option>
                  <option value="Trà Vinh">Trà Vinh</option>
                  <option value="Tuyên Quang">Tuyên Quang</option>
                  <option value="Vĩnh Long">Vĩnh Long</option>
                  <option value="Vĩnh Phúc">Vĩnh Phúc</option>
                  <option value="Yên Bái">Yên Bái</option>
                  <option value="Phú Yên">Phú Yên</option>
                </select>
              </div>

              {/* Salary Filter */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-on-surface">Mức lương</label>
                  <button
                    onClick={() => handleSortToggleCriteria('salary')}
                    className={`text-lg transition-colors ${activeSortCriteria === 'salary' ? 'text-[#22c55e]' : 'text-on-surface-variant hover:text-on-surface'}`}
                    title="Sắp xếp"
                  >
                    {activeSortCriteria === 'salary' ? (sortOrder === 'asc' ? '↑' : '↓') : '↑'}
                  </button>
                </div>
                <select 
                  value={filterSalary}
                  onChange={(e) => setFilterSalary(e.target.value)}
                  className="w-full border border-outline-variant/20 rounded-lg bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-[#00488d] transition-colors"
                >
                  <option value="">Tất cả mức lương</option>
                  <option value="0-5">Dưới 5 triệu</option>
                  <option value="5-10">5 - 10 triệu</option>
                  <option value="10-15">10 - 15 triệu</option>
                  <option value="15-20">15 - 20 triệu</option>
                  <option value="20-30">20 - 30 triệu</option>
                  <option value="30-50">30 - 50 triệu</option>
                  <option value="50+">Trên 50 triệu</option>
                </select>
              </div>

              {/* Experience Filter */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-on-surface">Kinh nghiệm</label>
                  <button
                    onClick={() => handleSortToggleCriteria('experience')}
                    className={`text-lg transition-colors ${activeSortCriteria === 'experience' ? 'text-[#22c55e]' : 'text-on-surface-variant hover:text-on-surface'}`}
                    title="Sắp xếp"
                  >
                    {activeSortCriteria === 'experience' ? (sortOrder === 'asc' ? '↑' : '↓') : '↑'}
                  </button>
                </div>
                <select 
                  value={filterExperience}
                  onChange={(e) => setFilterExperience(e.target.value)}
                  className="w-full border border-outline-variant/20 rounded-lg bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-[#00488d] transition-colors"
                >
                  <option value="">Tất cả kinh nghiệm</option>
                  <option value="0">Không yêu cầu</option>
                  <option value="1">Dưới 1 năm</option>
                  <option value="3">1 - 3 năm</option>
                  <option value="5">3 - 5 năm</option>
                  <option value="10">Trên 5 năm</option>
                </select>
              </div>

              {/* Industry Filter */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-on-surface">Ngành nghề</label>
                  <button
                    onClick={() => handleSortToggleCriteria('industry')}
                    className={`text-lg transition-colors ${activeSortCriteria === 'industry' ? 'text-[#22c55e]' : 'text-on-surface-variant hover:text-on-surface'}`}
                    title="Sắp xếp"
                  >
                    {activeSortCriteria === 'industry' ? (sortOrder === 'asc' ? '↑' : '↓') : '↑'}
                  </button>
                </div>
                <select 
                  value={filterIndustry}
                  onChange={(e) => setFilterIndustry(e.target.value)}
                  className="w-full border border-outline-variant/20 rounded-lg bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-[#00488d] transition-colors"
                >
                  <option value="">Tất cả ngành nghề</option>
                  <option value="Công nghệ thông tin">Công nghệ thông tin</option>
                  <option value="Tài chính - Kế toán">Tài chính - Kế toán</option>
                  <option value="Kinh doanh - Bán hàng">Kinh doanh - Bán hàng</option>
                  <option value="Marketing - Truyền thông">Marketing - Truyền thông</option>
                  <option value="Kỹ thuật - Sản xuất">Kỹ thuật - Sản xuất</option>
                  <option value="Xây dựng - BĐS">Xây dựng - BĐS</option>
                  <option value="Dịch vụ - F&B - Làm đẹp">Dịch vụ - F&B - Làm đẹp</option>
                  <option value="Vận tải - Logistics">Vận tải - Logistics</option>
                  <option value="Y tế - Dược">Y tế - Dược</option>
                  <option value="Hành chính - Nhân sự">Hành chính - Nhân sự</option>
                  <option value="Giáo dục - Đào tạo">Giáo dục - Đào tạo</option>
                  <option value="Lao động phổ thông">Lao động phổ thông</option>
                  <option value="Nông - Lâm - Ngư nghiệp">Nông - Lâm - Ngư nghiệp</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end items-center gap-4 mt-6">
              <div className="flex gap-3">
                <button 
                  onClick={handleClearFilters}
                  className="border border-[#00488d] text-[#00488d] px-6 py-3 rounded-lg font-semibold transition-all hover:bg-[#00488d]/5"
                >
                  Xóa bộ lọc
                </button>
                <button
                  onClick={handleSearch}
                  disabled={jobsLoading}
                  className={`bg-gradient-to-br from-[#00488d] to-[#0066cc] text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${jobsLoading ? 'opacity-70 cursor-wait' : 'hover:shadow-md'}`}
                >
                  {jobsLoading ? (
                    <span className="material-symbols-outlined animate-spin">autorenew</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">search</span>
                      Tìm kiếm
                    </>
                  )}
                </button>
              </div>
            </div>
            </>
            )}
          </div>
        </section>

        {/* Jobs Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-8 space-y-6">
            <div className="flex justify-between items-end">
              <h2 className="text-2xl font-bold tracking-tight text-on-surface">
                Danh sách việc làm mới nhất
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {latestJobsLoaded ? (
                // Loaded: show jobs (if any)
                displayJobs.length ? (
                  displayJobs.map((job) => (
                    <div
                      key={job.id}
                      className="bg-surface-container-lowest p-6 rounded-xl transition-all hover:shadow-[0_20px_40px_rgba(25,28,33,0.06)] group cursor-pointer relative h-full min-h-[210px] flex flex-col overflow-hidden"
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      <div className="flex gap-4 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center p-2">
                          <img className="w-full h-full object-contain" src={job.logo} alt={job.company} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-on-surface group-hover:text-[#00488d] transition-colors line-clamp-2 overflow-hidden truncate">
                            {job.title}
                          </h3>
                          <p className="text-sm text-on-surface-variant line-clamp-1 overflow-hidden truncate">{job.company}</p>
                        </div>
                        <button
                          onClick={(e) => toggleSaveJob(e, job.id)}
                          className={`flex items-center gap-2 font-semibold ${
                            savedJobIds.includes(job.id)
                              ? 'bg-primary text-on-primary'
                              : 'text-on-surface-variant'
                          }`}
                          title={savedJobIds.includes(job.id) ? 'Bỏ lưu công việc' : 'Lưu công việc'}
                        >
                          <span className="material-symbols-outlined text-lg">
                            {savedJobIds.includes(job.id) ? 'bookmark_remove' : 'bookmark'}
                          </span>
                        </button>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm text-on-surface-variant mb-2 line-clamp-1 overflow-hidden truncate">{job.location}</p>
                        {job.detail_address && (
                          <p className="text-xs text-on-surface-variant mb-4 line-clamp-3 overflow-hidden truncate">{job.detail_address}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                        <span className="text-sm text-on-surface-variant">{job.posted}</span>
                        <span className="text-[#00488d] dark:text-[#005fb8] font-bold">{job.salary}</span>
                      </div>
                    </div>
                  ))
                ) : null
              ) : jobsLoading ? (
                // Loading skeleton
                <div className="col-span-full bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/20 animate-pulse space-y-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-lg bg-surface-container-low" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-1/2 rounded bg-surface-container-low" />
                      <div className="h-3 w-1/3 rounded bg-surface-container-low" />
                    </div>
                  </div>
                  <div className="h-3 w-2/3 rounded bg-surface-container-low" />
                  <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                    <div className="h-3 w-24 rounded bg-surface-container-low" />
                    <div className="h-4 w-20 rounded bg-surface-container-low" />
                  </div>
                </div>
              ) : null}
            </div>

            {/* Empty state message (outside ternary) */}
            {!jobsLoading && latestJobsLoaded && !displayJobs.length && (
              <div className="col-span-full rounded-xl border border-dashed border-outline-variant/30 bg-surface-container-lowest p-6 text-center text-sm text-on-surface-variant">
                {searchActive ? 'Không tìm thấy việc làm phù hợp với tiêu chí tìm kiếm.' : 'Chưa có dữ liệu việc làm mới nhất.'}
              </div>
            )}

            {/* Pagination Controls (after grid) */}
            {!jobsLoading && displayJobs.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border border-[#00488d] text-[#00488d] font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#00488d]/5 transition-colors"
                >
                  <span className="material-symbols-outlined inline mr-2" style={{ fontSize: '20px' }}>chevron_left</span>
                  Trang trước
                </button>

                <div className="text-sm text-on-surface-variant">
                  Trang <span className="font-bold text-on-surface">{currentPage}</span> / <span className="font-bold text-on-surface">{totalPages}</span>
                </div>

                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg bg-[#00488d] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-colors"
                >
                  Trang sau
                  <span className="material-symbols-outlined inline ml-2" style={{ fontSize: '20px' }}>chevron_right</span>
                </button>
              </div>
            )}
          </section>
          <section className="lg:col-span-4 space-y-6">

            {/* Prominent recommended panel */}
            <div className="bg-gradient-to-tr from-[#f8fbff] to-[#eef6ff] p-4 rounded-2xl shadow-xl border border-[#e6f3ff]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 bg-[#00488d] text-white text-xs font-semibold px-3 py-1 rounded-full">Đề xuất cho bạn</span>
                </div>
              </div>

              <div className="space-y-4">
                {profileLoading || loadingRecommendations ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="relative w-16 h-16 mb-4">
                      <div className="absolute inset-0 rounded-full border-4 border-[#00488d]/20"></div>
                      <div 
                        className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#00488d] border-r-[#00488d]"
                        style={{
                          animation: 'spin 1s linear infinite'
                        }}
                      ></div>
                    </div>
                    <p className="text-sm text-on-surface-variant animate-pulse">Đang tải đề xuất từ mô hình AI...</p>
                    <style>{`
                      @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                      }
                    `}</style>
                  </div>
                ) : !profileComplete ? (
                  <div className="bg-white p-4 rounded-lg">
                    <div className="text-sm font-bold uppercase tracking-widest text-[#00488d] mb-2">Bước 1 / 2</div>
                    <div className="text-sm text-on-surface-variant mb-3">Hoàn thiện hồ sơ để nhận đề xuất việc làm được cá nhân hoá.</div>
                    <div className="flex gap-2">
                      <button onClick={() => navigate('/seeker/profile/personal')} className="px-3 py-2 rounded-md bg-[#00488d] text-white text-sm">Nhập thông tin</button>
                      <button onClick={() => navigate('/seeker/profile/experience')} className="px-3 py-2 rounded-md border border-outline-variant/20 text-sm">Thêm kinh nghiệm</button>
                    </div>
                  </div>
                ) : (
                  recommendations.map((job) => (
                    <div
                      key={job.id}
                      className="flex flex-col gap-3 p-3 rounded-lg bg-white cursor-pointer hover:bg-surface-container-low transition-colors max-h-[180px] overflow-hidden"
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center p-2">
                          <img className="w-full h-full object-contain" src={job.logo} alt={job.company} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-on-surface line-clamp-2 overflow-hidden truncate">{job.title}</h3>
                          <p className="text-xs text-on-surface-variant mt-1 line-clamp-1 overflow-hidden truncate">{job.company}</p>
                          <p className="text-xs text-on-surface-variant mt-1 line-clamp-1 overflow-hidden truncate">{job.location}</p>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <span className="text-xs inline-block bg-[#e6f7ef] text-[#0b6e4f] px-2 py-1 rounded-full font-semibold">{formatMatchScore(job.matchScore)}</span>
                        </div>
                      </div>
                      <div className="mt-auto text-sm font-bold text-[#00488d]">{job.salary}</div>
                    </div>
                  ))
                )}

                {!loadingRecommendations && !recommendations.length && (
                  <div className="rounded-xl border border-dashed border-outline-variant/30 bg-white p-4 text-center text-sm text-on-surface-variant">
                    Chưa tìm thấy việc làm phù hợp cho hồ sơ hiện tại.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

      </main>
    </div>
  );
};

export default SeekerHomeLoggedIn;
