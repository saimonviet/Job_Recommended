import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GuestTopNavBar from '../../components/GuestTopNavBar';
import '../../styles/seeker-home.css';
import { formatSalaryRange } from '../../utils/dataFormatter';

const SeekerHome = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  
  // Filter states
  const [filters, setFilters] = useState({
    location: '',
    salaryMin: '',
    salaryMax: '',
    employmentType: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Search suggestions & history
  const [suggestions, setSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // View mode
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  
  const debounceTimer = useRef(null);
  const API_URL = 'http://127.0.0.1:5000';
  const perPage = 6;

  // Load search history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('searchHistory');
    if (saved) {
      setSearchHistory(JSON.parse(saved));
    }
    // Fetch initial jobs
    fetchJobs(1, '', {
      location: '',
      salaryMin: '',
      salaryMax: '',
      employmentType: ''
    });
  }, []);

  // Fetch jobs when page, search, or filters change
  useEffect(() => {
    fetchJobs(currentPage, searchQuery, filters);
  }, [currentPage, searchQuery, filters]);

  // Fetch jobs from API
  const fetchJobs = async (page = 1, search = '', appliedFilters = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page,
        per_page: perPage,
      });

      if (search) {
        params.append('search', search);
      }
      if (appliedFilters.location) {
        params.append('location', appliedFilters.location);
      }
      if (appliedFilters.salaryMin) {
        params.append('salary_min', appliedFilters.salaryMin);
      }
      if (appliedFilters.salaryMax) {
        params.append('salary_max', appliedFilters.salaryMax);
      }
      if (appliedFilters.employmentType) {
        params.append('employment_type', appliedFilters.employmentType);
      }

      const response = await fetch(`${API_URL}/jobs?${params}`);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      setJobs(data.jobs || []);
      setTotalPages(data.pages || 1);
      setCurrentPage(data.current_page || 1);
      setTotalResults(data.total || 0);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch suggestions as user types
  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    
    try {
      const params = new URLSearchParams({ search: query, per_page: 5 });
      const response = await fetch(`${API_URL}/jobs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      
      const data = await response.json();
      const uniqueTitles = [...new Set(data.jobs.map(job => job.job_title))];
      setSuggestions(uniqueTitles.slice(0, 5));
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  }, []);

  // Debounced search handler
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(true);
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 500);
  };

  // Handle search submission
  const handleSearch = (e, query = null) => {
    e.preventDefault();
    const finalQuery = query || searchQuery;
    
    if (finalQuery && !searchHistory.includes(finalQuery)) {
      const newHistory = [finalQuery, ...searchHistory].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    }
    
    setCurrentPage(1);
    setShowSuggestions(false);
    fetchJobs(1, finalQuery, filters);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setCurrentPage(1);
    fetchJobs(1, '', filters);
  };

  // Delete from history
  const deleteHistory = (query) => {
    const newHistory = searchHistory.filter(item => item !== query);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1);
    setShowFilters(false);
    // useEffect sẽ tự động fetch với filters mới
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      location: '',
      salaryMin: '',
      salaryMax: '',
      employmentType: ''
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatText = (text) => {
    if (!text) return '';
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        <br />
      </React.Fragment>
    ));
  };

  const JobCard = ({ job }) => (
    <div className={`bg-surface-container-lowest rounded-xl hover:shadow-[0_20px_40px_rgba(25,28,33,0.06)] transition-all h-full group ${
      viewMode === 'list' 
        ? 'flex items-center gap-6 p-6' 
        : 'flex flex-col p-6 relative'
    }`}>
      {/* Logo / Icon */}
      <div className={`w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center overflow-hidden flex-shrink-0 ${
        viewMode === 'list' ? '' : 'mb-6'
      }`}>
        <span className="material-symbols-outlined text-primary">business</span>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <h4 className={`font-bold text-on-surface group-hover:text-primary transition-colors mb-1 ${
          viewMode === 'list' ? 'text-lg' : 'text-xl'
        } line-clamp-2 overflow-hidden`}>
          {job.job_title}
        </h4>

        <div className="text-sm font-medium text-on-surface-variant mb-3 space-y-1">
          <p className="line-clamp-1 overflow-hidden truncate">{job.company_name}</p>
          {job.job_address && (
            <div className="flex items-center gap-2 text-sm text-on-surface-variant mt-4 pt-2">
              <span className="material-symbols-outlined text-[16px] text-outline">location_on</span>
              <span className="line-clamp-2 overflow-hidden">{job.job_address}</span>
            </div>
          )}
        </div>

        {/* Tags - chỉ hiển thị khi grid view */}
        {viewMode === 'grid' && (
          <div className="flex flex-wrap gap-2 mb-8">
            {job.job_function && (
              <span className="px-2 py-1 bg-surface-container text-xs rounded-md text-on-surface-variant line-clamp-1 overflow-hidden">
                {job.job_function}
              </span>
            )}
            {job.employment_type && (
              <span className="px-2 py-1 bg-surface-container text-xs rounded-md text-on-surface-variant line-clamp-1 overflow-hidden">
                {job.employment_type}
              </span>
            )}
          </div>
        )}

        {/* List view tags */}
        {viewMode === 'list' && (
          <div className="flex flex-wrap gap-2">
            {job.job_function && (
              <span className="px-2 py-0.5 bg-surface-container text-xs rounded-md text-on-surface-variant line-clamp-1 overflow-hidden">
                {job.job_function}
              </span>
            )}
            {job.employment_type && (
              <span className="px-2 py-0.5 bg-surface-container text-xs rounded-md text-on-surface-variant line-clamp-1 overflow-hidden">
                {job.employment_type}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Salary & Button */}
      <div className={`flex ${viewMode === 'list' ? 'flex-col items-end gap-3' : 'pt-6 justify-between items-center border-t border-surface-container w-full'}`}>
        <div className={`font-bold text-on-surface ${viewMode === 'list' ? 'text-right whitespace-nowrap' : ''}`}>
          <div className="text-sm text-on-surface-variant">Mức lương</div>
          <span className="block line-clamp-1 overflow-hidden">{formatSalaryRange(job.salary_min, job.salary_max)}</span>
        </div>
        <button
          onClick={() => navigate(`/jobs/${job.id}`)}
          className={`text-primary font-bold hover:underline transition-colors ${
            viewMode === 'list' 
              ? 'text-sm whitespace-nowrap bg-primary/10 px-4 py-2 rounded-lg hover:bg-primary/20' 
              : 'text-sm'
          }`}
        >
          {viewMode === 'list' ? 'Chi tiết' : 'Xem chi tiết'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        html { color-scheme: light; }
        body { 
          font-family: 'Inter', sans-serif; 
          background-color: #f9f9ff; 
          color: #191c21; 
        }
        h1, h2, h3 { font-family: 'Manrope', sans-serif; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .glass-nav { background: rgba(249, 249, 255, 0.8); backdrop-filter: blur(12px); }
        .hero-gradient { background: linear-gradient(135deg, #00488d 0%, #005fb8 100%); }
      `}</style>

      {/* TopNavBar */}
      <GuestTopNavBar currentPage="home" />

      <main className="pt-24 pb-20">
        {/* Hero & Search Section */}
        <section className="px-8 mb-20 flex flex-col items-center text-center">
          {/* <h1 className="text-5xl md:text-7xl font-extrabold text-on-surface tracking-tighter mb-6 max-w-4xl">
            Tương lai nghề nghiệp của bạn, <span className="text-primary">Được dự đoán.</span>
          </h1>
          <p className="text-on-surface-variant text-lg max-w-2xl mb-12 font-body">
            Khám phá những cơ hội công việc được cá nhân hóa dựa trên nhu cầu kỹ năng thị trường hiện tại và xu hướng tương lai.
          </p> */}

          {/* Prominent Job Search Bar */}
          <div className="w-full max-w-4xl bg-surface-container-lowest p-2 rounded-full shadow-lg flex flex-col md:flex-row items-center gap-2 relative">
            <form onSubmit={handleSearch} className="flex-1 flex items-center px-6 gap-3 w-full">
              <span className="material-symbols-outlined text-outline">search</span>
              <input
                id="job-search-input"
                className="w-full border-none focus:ring-0 bg-transparent text-on-surface placeholder:text-outline-variant font-body"
                placeholder="Chức danh, kỹ năng, hoặc vai trò dự đoán..."
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowSuggestions(true)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="text-outline-variant hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className={`hero-gradient text-on-primary px-10 py-4 rounded-full font-bold flex items-center justify-center gap-2 transition-all hover:shadow-xl ${loading ? 'opacity-70 cursor-wait' : ''}`}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">autorenew</span>
                    <span>Đang tìm</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">search</span>
                    <span className="hidden sm:inline">Tìm</span>
                  </>
                )}
              </button>
            </form>

                  </div>
        </section>

        {/* Bento Grid: Market Forecast & Trends */}
   

        {/* Job Postings List */}
        <section className="px-8 max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-4xl font-extrabold tracking-tight mb-2">Vị trí đang tuyển</h2>
              <p className="text-on-surface-variant">
                Các vai trò được tuyển chọn từ những công ty dẫn đầu sự thay đổi thị trường.
                {totalResults > 0 && <span className="font-bold text-primary"> ({totalResults} kết quả)</span>}
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 rounded-full border border-outline-variant/20 hover:bg-surface-container transition-colors relative"
              >
                <span className="material-symbols-outlined">filter_list</span>
                {(filters.location || filters.salaryMin || filters.salaryMax || filters.employmentType) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
                )}
              </button>
              <button 
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 rounded-full border border-outline-variant/20 hover:bg-surface-container transition-colors"
                title={viewMode === 'grid' ? 'Chuyển sang danh sách' : 'Chuyển sang lưới'}
              >
                <span className="material-symbols-outlined">
                  {viewMode === 'grid' ? 'view_list' : 'grid_view'}
                </span>
              </button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="bg-surface-container-low rounded-xl p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Tỉnh / Thành phố</label>
                  <select
                    name="location"
                    value={filters.location}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface"
                  >
                    <option value="">Tất cả tỉnh thành</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Hải Phòng">Hải Phòng</option>
                    <option value="Cần Thơ">Cần Thơ</option>
                    <option value="An Giang">An Giang</option>
                    <option value="Bắc Giang">Bắc Giang</option>
                    <option value="Bắc Kạn">Bắc Kạn</option>
                    <option value="Bạc Liêu">Bạc Liêu</option>
                    <option value="Bắc Ninh">Bắc Ninh</option>
                    <option value="Bến Tre">Bến Tre</option>
                    <option value="Biên Hòa">Biên Hòa</option>
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
                    <option value="Phú Yên">Phú Yên</option>
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
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Mức lương tối thiểu</label>
                  <input
                    type="number"
                    name="salaryMin"
                    value={filters.salaryMin}
                    onChange={handleFilterChange}
                    placeholder="VND..."
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Mức lương tối đa</label>
                  <input
                    type="number"
                    name="salaryMax"
                    value={filters.salaryMax}
                    onChange={handleFilterChange}
                    placeholder="VND..."
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Loại hình công việc</label>
                  <select
                    name="employmentType"
                    value={filters.employmentType}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface"
                  >
                    <option value="">Tất cả</option>
                    <option value="Toàn thời gian">Toàn thời gian</option>
                    <option value="Bán thời gian">Bán thời gian</option>
                    <option value="Hợp đồng">Hợp đồng</option>
                    <option value="Thực tập">Thực tập</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={applyFilters}
                  className="bg-primary text-on-primary px-6 py-2 rounded-lg font-bold hover:shadow-lg transition-all"
                >
                  Áp dụng bộ lọc
                </button>
                <button
                  onClick={() => {
                    clearFilters();
                    setCurrentPage(1);
                    setShowFilters(false);
                    fetchJobs(1, searchQuery, {
                      location: '',
                      salaryMin: '',
                      salaryMax: '',
                      employmentType: ''
                    });
                  }}
                  className="border border-outline-variant px-6 py-2 rounded-lg font-bold hover:bg-surface-container transition-all"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          )}

          {/* Job Card Grid */}
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' : 'space-y-3'}>
            {loading ? (
              <div className="text-center py-12 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl text-primary animate-spin">autorenew</span>
                <p className="mt-4">Đang tải dữ liệu công việc...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                Không tìm thấy công việc nào. Vui lòng thử tìm kiếm khác.
              </div>
            ) : (
              jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-bold hover:bg-primary hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Trước
            </button>
            <span className="font-bold text-gray-600">Trang {currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-bold hover:bg-primary hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tiếp →
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-low border-t-0 font-inter text-xs uppercase tracking-widest text-on-surface-variant px-12 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 w-full">
          <div className="text-lg font-black text-on-surface">Career Authority</div>
          <div className="flex flex-wrap justify-center gap-8">
            <a className="hover:underline transition-all opacity-80 hover:opacity-100" href="#">Chính sách Bảo mật</a>
            <a className="hover:underline transition-all opacity-80 hover:opacity-100" href="#">Điều khoản Dịch vụ</a>
            <a className="hover:underline transition-all opacity-80 hover:opacity-100" href="#">Liên hệ Hỗ trợ</a>
            <a className="hover:underline transition-all opacity-80 hover:opacity-100" href="#">Phương pháp AI</a>
          </div>
          <div className="opacity-80">© 2024 The Predictive Career Authority. Bảo lưu mọi quyền.</div>
        </div>
      </footer>
    </>
  );
};

export default SeekerHome;
