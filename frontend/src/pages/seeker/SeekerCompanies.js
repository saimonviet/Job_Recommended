import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNavBar from '../../components/TopNavBar';

const SeekerCompanies = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login-seeker');
      return;
    }
    setIsLoggedIn(true);
    loadCompanies();
  }, [navigate]);

  useEffect(() => {
    filterCompanies();
  }, [searchTerm, selectedIndustry, companies]);

  const loadCompanies = () => {
    const mockCompanies = [
      {
        id: 1,
        name: 'FPT Software',
        logo: 'https://api.dicebear.com/7.x/icons/svg?seed=fpt',
        industry: 'IT',
        location: 'TP. Hồ Chí Minh, Hà Nội',
        employees: '5,000+',
        description: 'Công ty phần mềm hàng đầu Việt Nam với các giải pháp IT toàn cầu.',
        openPositions: 24,
        rating: 4.8,
        reviews: 2341,
        followed: false,
      },
      {
        id: 2,
        name: 'VNG Corporation',
        logo: 'https://api.dicebear.com/7.x/icons/svg?seed=vng',
        industry: 'IT',
        location: 'Hà Nội',
        employees: '3,000+',
        description: 'Công ty công nghệ hàng đầu với các sản phẩm trực tuyến phổ biến.',
        openPositions: 18,
        rating: 4.6,
        reviews: 1856,
        followed: false,
      },
      {
        id: 3,
        name: 'Techcombank',
        logo: 'https://api.dicebear.com/7.x/icons/svg?seed=techcom',
        industry: 'Fintech',
        location: 'TP. Hồ Chí Minh',
        employees: '2,500+',
        description: 'Ngân hàng kỹ thuật số với các dịch vụ tài chính hiện đại.',
        openPositions: 12,
        rating: 4.5,
        reviews: 1205,
        followed: false,
      },
      {
        id: 4,
        name: 'Grab Vietnam',
        logo: 'https://api.dicebear.com/7.x/icons/svg?seed=grab',
        industry: 'Công nghệ',
        location: 'Hà Nội, TP. Hồ Chí Minh',
        employees: '1,500+',
        description: 'Nền tảng giao thông chia sẻ và dịch vụ giao hàng hàng đầu.',
        openPositions: 16,
        rating: 4.4,
        reviews: 987,
        followed: true,
      },
      {
        id: 5,
        name: 'Shopee',
        logo: 'https://api.dicebear.com/7.x/icons/svg?seed=shopee',
        industry: 'E-commerce',
        location: 'TP. Hồ Chí Minh',
        employees: '4,000+',
        description: 'Sàn thương mại điện tử dẫn đầu Đông Nam Á.',
        openPositions: 28,
        rating: 4.3,
        reviews: 1543,
        followed: false,
      },
      {
        id: 6,
        name: 'Samsung Vietnam',
        logo: 'https://api.dicebear.com/7.x/icons/svg?seed=samsung',
        industry: 'Sản xuất',
        location: 'Bắc Ninh, Hải Phòng',
        employees: '8,000+',
        description: 'Nhà sản xuất điện tử hàng đầu thế giới.',
        openPositions: 32,
        rating: 4.2,
        reviews: 2103,
        followed: false,
      },
      {
        id: 7,
        name: 'Tiki',
        logo: 'https://api.dicebear.com/7.x/icons/svg?seed=tiki',
        industry: 'E-commerce',
        location: 'TP. Hồ Chí Minh',
        employees: '2,000+',
        description: 'Nền tảng thương mại điện tử với dịch vụ giao hàng nhanh.',
        openPositions: 14,
        rating: 4.1,
        reviews: 876,
        followed: false,
      },
      {
        id: 8,
        name: 'VNPT',
        logo: 'https://api.dicebear.com/7.x/icons/svg?seed=vnpt',
        industry: 'Viễn thông',
        location: 'Hà Nội, TP. Hồ Chí Minh',
        employees: '6,000+',
        description: 'Công ty viễn thông quốc gia hàng đầu.',
        openPositions: 20,
        rating: 3.9,
        reviews: 1234,
        followed: false,
      },
    ];

    setCompanies(mockCompanies);
    setFilteredCompanies(mockCompanies);
  };

  const filterCompanies = () => {
    let filtered = companies;

    // Filter by industry
    if (selectedIndustry !== 'all') {
      filtered = filtered.filter((company) => company.industry === selectedIndustry);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (company) =>
          company.name.toLowerCase().includes(lowerSearch) ||
          company.description.toLowerCase().includes(lowerSearch)
      );
    }

    setFilteredCompanies(filtered);
  };

  const toggleFollow = (companyId) => {
    setCompanies(
      companies.map((company) =>
        company.id === companyId ? { ...company, followed: !company.followed } : company
      )
    );
  };

  const industries = [
    'all',
    'IT',
    'Fintech',
    'Công nghệ',
    'E-commerce',
    'Sản xuất',
    'Viễn thông',
  ];

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <TopNavBar currentPage="companies" />

      <main className="max-w-7xl mx-auto px-6 py-24 space-y-8">
        {/* Header Section */}
        <section className="space-y-4 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-[#00488d] dark:text-[#005fb8] mb-2">
              Khám phá công ty
            </h1>
            <p className="text-on-surface-variant text-lg">
              Tìm kiếm và theo dõi các công ty hàng đầu Việt Nam. Cập nhật thông tin tuyển dụng mới nhất.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Search Bar */}
            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex items-center gap-3 px-4">
              <span className="material-symbols-outlined text-outline">search</span>
              <input
                className="flex-1 border-none focus:ring-0 bg-transparent text-on-surface placeholder:text-outline-variant text-base py-2 outline-none"
                placeholder="Tìm kiếm công ty, ngành nghề..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-outline-variant hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
            </div>

            {/* Industry Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {industries.map((industry) => (
                <button
                  key={industry}
                  onClick={() => setSelectedIndustry(industry)}
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition-all whitespace-nowrap ${
                    selectedIndustry === industry
                      ? 'bg-[#00488d] text-white shadow-md'
                      : 'bg-surface-container-high text-on-surface hover:bg-surface-dim'
                  }`}
                >
                  {industry === 'all' ? 'Tất cả' : industry}
                </button>
              ))}
            </div>

            {/* Companies Grid */}
            {filteredCompanies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCompanies.map((company) => (
                  <div
                    key={company.id}
                    className="bg-surface-container-lowest p-6 rounded-xl transition-all hover:shadow-[0_20px_40px_rgba(25,28,33,0.06)] group"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-4 flex-1">
                        <div className="w-16 h-16 rounded-lg bg-surface-container-low flex items-center justify-center p-2 flex-shrink-0">
                          <img
                            className="w-full h-full object-contain"
                            src={company.logo}
                            alt={company.name}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-on-surface group-hover:text-[#00488d] transition-colors line-clamp-1">
                            {company.name}
                          </h3>
                          <p className="text-sm text-on-surface-variant">{company.industry}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="material-symbols-outlined text-yellow-500 text-sm">star</span>
                            <span className="text-sm font-semibold text-on-surface">{company.rating}</span>
                            <span className="text-xs text-on-surface-variant">
                              ({company.reviews} đánh giá)
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFollow(company.id)}
                        className={`p-2 rounded-lg transition-all ${
                          company.followed
                            ? 'bg-[#00488d] text-white'
                            : 'bg-surface-container text-on-surface-variant hover:bg-surface-dim'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {company.followed ? 'bookmark' : 'bookmark_border'}
                        </span>
                      </button>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-on-surface-variant mb-4 line-clamp-2">
                      {company.description}
                    </p>

                    {/* Info Row */}
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-outline-variant/10 text-sm">
                      <span className="flex items-center gap-1 text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        {company.location}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-surface-container rounded-lg p-3">
                        <p className="text-xs text-on-surface-variant mb-1">Nhân viên</p>
                        <p className="text-sm font-bold text-on-surface">{company.employees}</p>
                      </div>
                      <div className="bg-surface-container rounded-lg p-3">
                        <p className="text-xs text-on-surface-variant mb-1">Vị trí mở</p>
                        <p className="text-sm font-bold text-[#00488d]">{company.openPositions}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/seeker/companies/${company.id}`)}
                        className="flex-1 bg-gradient-to-br from-[#00488d] to-[#0066cc] text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                      >
                        <span className="material-symbols-outlined text-sm">info</span>
                        Chi tiết
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="bg-surface-container-lowest rounded-xl p-12 text-center">
                <span className="material-symbols-outlined text-8xl text-outline-variant/30 block mb-4">
                  search_off
                </span>
                <h3 className="text-xl font-bold text-on-surface mb-2">Không tìm thấy công ty</h3>
                <p className="text-on-surface-variant mb-6">
                  Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc ngành nghề.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedIndustry('all');
                  }}
                  className="bg-[#00488d] text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Đặt lại bộ lọc
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Followed Companies */}
            {companies.some((c) => c.followed) && (
              <div className="bg-surface-container-low rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#00488d]">bookmark</span>
                  Công ty theo dõi
                </h3>
                <div className="space-y-3">
                  {companies
                    .filter((c) => c.followed)
                    .map((company) => (
                      <div
                        key={company.id}
                        className="flex items-center gap-3 p-3 bg-surface-container-lowest rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center p-1 flex-shrink-0">
                          <img
                            className="w-full h-full object-contain"
                            src={company.logo}
                            alt={company.name}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-on-surface line-clamp-1">
                            {company.name}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {company.openPositions} vị trí mở
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Top Rated Companies */}
            <div className="bg-surface-container-low rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ffc107]">trending_up</span>
                Công ty hàng đầu
              </h3>
              <div className="space-y-3">
                {companies
                  .sort((a, b) => b.rating - a.rating)
                  .slice(0, 5)
                  .map((company, index) => (
                    <div
                      key={company.id}
                      className="flex items-start gap-3 p-3 bg-surface-container-lowest rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#00488d] text-white flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface line-clamp-1">
                          {company.name}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="material-symbols-outlined text-yellow-500 text-xs">
                            star
                          </span>
                          <span className="text-xs font-bold text-on-surface">{company.rating}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-gradient-to-br from-[#00488d] to-[#0066cc] text-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4">Thống kê</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-white/80 text-sm mb-1">Tổng công ty</p>
                  <p className="text-3xl font-bold">{companies.length}</p>
                </div>
                <div>
                  <p className="text-white/80 text-sm mb-1">Công ty đang theo dõi</p>
                  <p className="text-3xl font-bold">{companies.filter((c) => c.followed).length}</p>
                </div>
                <div>
                  <p className="text-white/80 text-sm mb-1">Tổng vị trí mở</p>
                  <p className="text-3xl font-bold">
                    {companies.reduce((sum, c) => sum + c.openPositions, 0)}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default SeekerCompanies;
