import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GuestTopNavBar from '../../components/GuestTopNavBar';

const SeekerCompany = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [selectedScale, setSelectedScale] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCompanies, setTotalCompanies] = useState(0);

  const API_BASE_URL = 'http://127.0.0.1:5000';

  // Available filters
  const LOCATIONS = ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Singapore'];
  const SCALES = [
    { label: '100 - 500', min: 100, max: 500 },
    { label: '500 - 1000', min: 500, max: 1000 },
    { label: '1000 - 5000', min: 1000, max: 5000 },
    { label: '5000+', min: 5000, max: 999999 },
  ];

  // Fetch companies from API
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        per_page: 12,
        sort: sortBy,
      });

      if (searchTerm) params.append('search', searchTerm);
      // Use searchLocation from hero input first, fallback to selectedLocation from sidebar filter
      if (searchLocation) {
        params.append('location', searchLocation);
      } else if (selectedLocation) {
        params.append('location', selectedLocation);
      }
      if (selectedIndustries.length > 0) params.append('industry', selectedIndustries[0]);

      const response = await fetch(`${API_BASE_URL}/companies?${params}`);
      if (!response.ok) throw new Error('Failed to fetch companies');

      const data = await response.json();
      setCompanies(data.companies || []);
      setTotalCompanies(data.total || 0);
      setTotalPages(data.pages || 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on component mount and when filters change
  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [searchTerm, searchLocation, selectedIndustries, selectedLocation, sortBy]);

  useEffect(() => {
    fetchCompanies();
  }, [searchTerm, searchLocation, selectedIndustries, selectedLocation, sortBy, currentPage]);

  const handleIndustryChange = (industry) => {
    setSelectedIndustries(prev =>
      prev.includes(industry)
        ? prev.filter(i => i !== industry)
        : [industry] // Allow only one industry at a time
    );
  };

  const handleScaleChange = (scale) => {
    setSelectedScale(selectedScale === scale ? '' : scale);
  };

  const handleLocationChange = (location) => {
    setSelectedLocation(selectedLocation === location ? '' : location);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSearchLocation('');
    setSelectedIndustries([]);
    setSelectedScale('');
    setSelectedLocation('');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchCompanies();
  };
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
        .glass-nav { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); }
      `}</style>

      <div className=" text-on-surface min-h-screen flex flex-col">
        {/* TopNavBar */}
        <GuestTopNavBar currentPage="companies" />

        <main className="mt-24 flex-grow container mx-auto px-6 max-w-7xl">
          {/* Hero Search Section */}
          <section className="mb-12">
            <div className="bg-surface-container-low rounded-xl p-8 md:p-12 text-center relative overflow-hidden">
              <div className="relative z-10">
                <h1 className="text-4xl md:text-5xl font-extrabold font-headline tracking-tight text-on-surface mb-4">Khám phá các tổ chức hàng đầu</h1>
                <p className="text-on-surface-variant max-w-2xl mx-auto mb-8 font-body">Tìm kiếm và kết nối với những công ty đang kiến tạo tương lai sự nghiệp của bạn.</p>
                <div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-3 p-2 bg-surface-container-lowest rounded-xl shadow-sm">
                  <div className="flex-grow flex items-center px-4 gap-3 bg-surface-container-low rounded-lg">
                    <span className="material-symbols-outlined text-outline">search</span>
                    <input
                      className="w-full bg-transparent border-none focus:ring-0 py-3 text-on-surface placeholder:text-outline"
                      placeholder="Tên công ty, từ khóa kỹ năng..."
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center px-4 gap-3 bg-surface-container-low rounded-lg md:w-1/3">
                    <span className="material-symbols-outlined text-outline">location_on</span>
                    <input
                      className="w-full bg-transparent border-none focus:ring-0 py-3 text-on-surface placeholder:text-outline"
                      placeholder="Địa điểm"
                      type="text"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                    />
                  </div>
                  <button onClick={handleSearch} className="bg-primary text-on-primary px-8 py-3 rounded-lg font-bold font-headline hover:bg-primary-container transition-all">Tìm kiếm</button>
                </div>
              </div>
              {/* Decorative element */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            </div>
          </section>

          <div className="flex flex-col lg:flex-row gap-8 pb-20">
            {/* Left Filters */}
            <aside className="w-full lg:w-72 flex-shrink-0">
              <div className="sticky top-28 space-y-8">
                <div>
                  <h3 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">filter_list</span> Bộ lọc tìm kiếm
                  </h3>
                  <div className="space-y-6">
                    {/* Category Filter */}
                    <div>
                      <label className="block text-sm font-semibold text-on-surface-variant mb-3 uppercase tracking-wider font-label">Ngành nghề</label>
                      <div className="space-y-2">
                        {['Công nghệ thông tin', 'Tài chính & Ngân hàng', 'Marketing & Creative', 'Sản xuất & Công nghiệp'].map(ind => (
                          <label key={ind} className="flex items-center gap-3 cursor-pointer group">
                            <input
                              className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20 bg-surface-container"
                              type="checkbox"
                              checked={selectedIndustries.includes(ind)}
                              onChange={() => handleIndustryChange(ind)}
                            />
                            <span className="text-on-surface-variant group-hover:text-primary transition-colors font-body">
                              {ind}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    {/* Scale Filter */}
                    <div>
                      <label className="block text-sm font-semibold text-on-surface-variant mb-3 uppercase tracking-wider font-label">Quy mô công ty</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['100 - 500', '500 - 1000', '1000 - 5000', '5000+'].map(scale => (
                          <button
                            key={scale}
                            onClick={() => handleScaleChange(scale)}
                            className={`py-2 px-3 rounded-md text-xs font-semibold text-center transition-all ${
                              selectedScale === scale
                                ? 'bg-primary text-on-primary'
                                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                            }`}
                          >
                            {scale}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Location Filter */}
                    <div>
                      <label className="block text-sm font-semibold text-on-surface-variant mb-3 uppercase tracking-wider font-label">Địa điểm phổ biến</label>
                      <div className="flex flex-wrap gap-2">
                        {LOCATIONS.map(loc => (
                          <span
                            key={loc}
                            onClick={() => handleLocationChange(loc)}
                            className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                              selectedLocation === loc
                                ? 'bg-primary text-on-primary'
                                : 'bg-surface-container-high text-on-surface-variant hover:bg-primary/10 hover:text-primary'
                            }`}
                          >
                            {loc}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button onClick={handleClearFilters} className="w-full mt-8 py-3 rounded-lg border border-outline-variant/30 text-on-surface-variant text-sm font-semibold hover:bg-surface-container transition-all">Xóa tất cả bộ lọc</button>
                </div>
              </div>
            </aside>

            {/* Company List Grid */}
            <div className="flex-grow">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-headline text-xl font-bold">{totalCompanies} Kết quả tìm thấy</h2>
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <span>Sắp xếp theo:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent border-none font-bold text-primary focus:ring-0 py-0 pr-8 cursor-pointer"
                  >
                    <option value="newest">Mới nhất</option>
                    <option value="hiring">Nhiều việc làm nhất</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <p className="text-on-surface-variant">Đang tải dữ liệu...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-error">Lỗi: {error}</p>
                </div>
              ) : companies.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-on-surface-variant">Không tìm thấy công ty nào</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                    {companies.map((company) => (
                      <div key={company.id} className="bg-surface-container-lowest rounded-xl p-6 flex flex-col hover:shadow-[0_20px_40px_rgba(25,28,33,0.06)] transition-all group">
                        <div className="flex justify-between items-start mb-6">
                          <div className="w-16 h-16 rounded-xl bg-surface-container p-2 flex items-center justify-center">
                            {company.logo_path ? (
                              <img
                                alt={company.company_name}
                                className="w-full h-full object-contain"
                                src={`${API_BASE_URL}/uploads/${company.logo_path}`}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = '<span className="material-symbols-outlined text-primary text-2xl">business</span>';
                                }}
                              />
                            ) : (
                              <span className="material-symbols-outlined text-primary text-2xl">business</span>
                            )}
                          </div>
                          {company.job_count > 5 && (
                            <span className="px-3 py-1 bg-tertiary text-on-primary text-[10px] font-bold rounded-full uppercase tracking-widest">Đề xuất</span>
                          )}
                        </div>
                        <div className="mb-6">
                          <h3 className="font-headline font-bold text-xl text-on-surface mb-1 group-hover:text-primary transition-colors">{company.company_name}</h3>
                          <p className="text-on-surface-variant text-sm font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">domain</span> {company.industry || 'Chưa cập nhật'}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-on-surface-variant mb-8">
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-outline">location_on</span>
                            <span>{company.address || 'Chưa cập nhật'}</span>
                          </div>
                        </div>
                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-outline-variant/10">
                          <div className="text-primary font-bold text-sm">{company.job_count} Việc làm đang tuyển</div>
                          <button
                            onClick={() => navigate(`/company/${company.id}`)}
                            className="px-4 py-2 rounded-md bg-surface-container-high text-primary font-bold text-xs hover:bg-primary hover:text-on-primary transition-all"
                          >
                            Xem chi tiết
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="mt-12 flex justify-center items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-primary hover:text-on-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                      return pageNum <= totalPages ? (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-all ${
                            currentPage === pageNum
                              ? 'bg-primary text-on-primary'
                              : 'bg-surface-container-high text-on-surface-variant hover:bg-primary hover:text-on-primary'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ) : null;
                    })}

                    {totalPages > 5 && currentPage < totalPages - 2 && <span className="px-2 text-on-surface-variant">...</span>}

                    {totalPages > 5 && currentPage < totalPages - 1 && (
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-primary hover:text-on-primary transition-all"
                      >
                        {totalPages}
                      </button>
                    )}

                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-primary hover:text-on-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default SeekerCompany;