import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TopNavBar from '../../components/TopNavBar';

const SeekerCompanyDetail = () => {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [followed, setFollowed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedJobType, setSelectedJobType] = useState('all');

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login-seeker');
      return;
    }
    setIsLoggedIn(true);
    loadCompanyDetails();
  }, [navigate, companyId]);

  const loadCompanyDetails = () => {
    // Mock company data
    const companiesData = {
      1: {
        id: 1,
        name: 'FPT Software',
        logo: 'https://api.dicebear.com/7.x/icons/svg?seed=fpt',
        industry: 'IT',
        location: 'TP. Hồ Chí Minh, Hà Nội',
        employees: '5,000+',
        description: 'Công ty phần mềm hàng đầu Việt Nam với các giải pháp IT toàn cầu.',
        rating: 4.8,
        reviews: 2341,
        website: 'https://www.fpt-software.com',
        founded: '1999',
        aboutText:
          'FPT Software là công ty phần mềm hàng đầu Việt Nam, thành lập từ năm 1999. Chúng tôi cung cấp các giải pháp công nghệ thông tin toàn diện cho các khách hàng trên toàn thế giới. Với đội ngũ hơn 5.000 nhân viên tài năng, chúng tôi cam kết phát triển sản phẩm và dịch vụ chất lượng cao.',
        benefits: [
          'Lương thưởng cạnh tranh theo thị trường',
          'Bảo hiểm sức khỏe toàn diện',
          'Đào tạo và phát triển kỹ năng liên tục',
          'Môi trường làm việc hiện đại',
          'Cơ hội du học quốc tế',
          'Phúc lợi sức khỏe tâm thần',
        ],
        images: [
          'https://api.dicebear.com/7.x/icons/svg?seed=office1',
          'https://api.dicebear.com/7.x/icons/svg?seed=office2',
        ],
      },
      2: {
        id: 2,
        name: 'VNG Corporation',
        logo: 'https://api.dicebear.com/7.x/icons/svg?seed=vng',
        industry: 'IT',
        location: 'Hà Nội',
        employees: '3,000+',
        description: 'Công ty công nghệ hàng đầu với các sản phẩm trực tuyến phổ biến.',
        rating: 4.6,
        reviews: 1856,
        website: 'https://www.vng.com.vn',
        founded: '2004',
        aboutText:
          'VNG Corporation là công ty công nghệ Việt Nam hàng đầu, nổi tiếng với các sản phẩm trực tuyến như Zalo, Zing, VNG Game. Chúng tôi phát triển các dịch vụ kỹ thuật số đổi mới cho hàng triệu người dùng.',
        benefits: [
          'Mức lương cạnh tranh',
          'Bảo hiểm y tế cao cấp',
          'Chế độ làm việc linh hoạt',
          'Đạo tạo công nghệ mới',
          'Cơ hội thăng tiến nhanh',
          'Môi trường sáng tạo',
        ],
        images: [
          'https://api.dicebear.com/7.x/icons/svg?seed=office3',
          'https://api.dicebear.com/7.x/icons/svg?seed=office4',
        ],
      },
      3: {
        id: 3,
        name: 'Techcombank',
        logo: 'https://api.dicebear.com/7.x/icons/svg?seed=techcom',
        industry: 'Fintech',
        location: 'TP. Hồ Chí Minh',
        employees: '2,500+',
        description: 'Ngân hàng kỹ thuật số với các dịch vụ tài chính hiện đại.',
        rating: 4.5,
        reviews: 1205,
        website: 'https://www.techcombank.com.vn',
        founded: '2004',
        aboutText:
          'Techcombank là ngân hàng kỹ thuật số hàng đầu Việt Nam, cung cấp các dịch vụ tài chính hiện đại và an toàn. Chúng tôi tập trung vào chuyển đổi số trong lĩnh vực ngân hàng.',
        benefits: [
          'Lương thưởng cao',
          'Bảo hiểm toàn diện',
          'Môi trường tài chính chuyên nghiệp',
          'Đạo tạo chuyên sâu',
          'Cơ hội phát triển sự nghiệp',
          'Phúc lợi gia đình',
        ],
        images: [
          'https://api.dicebear.com/7.x/icons/svg?seed=office5',
          'https://api.dicebear.com/7.x/icons/svg?seed=office6',
        ],
      },
      4: {
        id: 4,
        name: 'Grab Vietnam',
        logo: 'https://api.dicebear.com/7.x/icons/svg?seed=grab',
        industry: 'Công nghệ',
        location: 'Hà Nội, TP. Hồ Chí Minh',
        employees: '1,500+',
        description: 'Nền tảng giao thông chia sẻ và dịch vụ giao hàng hàng đầu.',
        rating: 4.4,
        reviews: 987,
        website: 'https://www.grab.com/vn',
        founded: '2012',
        aboutText:
          'Grab là nền tảng vận chuyển và giao hàng hàng đầu Đông Nam Á. Chúng tôi kết nối người dùng, tài xế và các tiểu thương thông qua ứng dụng di động.',
        benefits: [
          'Lương thưởng cạnh tranh',
          'Bảo hiểm sức khỏe',
          'Môi trường năng động',
          'Đạo tạo liên tục',
          'Thăng tiến nhanh',
          'Phúc lợi toàn diện',
        ],
        images: [
          'https://api.dicebear.com/7.x/icons/svg?seed=office7',
          'https://api.dicebear.com/7.x/icons/svg?seed=office8',
        ],
      },
      5: {
        id: 5,
        name: 'Shopee',
        logo: 'https://api.dicebear.com/7.x/icons/svg?seed=shopee',
        industry: 'E-commerce',
        location: 'TP. Hồ Chí Minh',
        employees: '4,000+',
        description: 'Sàn thương mại điện tử dẫn đầu Đông Nam Á.',
        rating: 4.3,
        reviews: 1543,
        website: 'https://shopee.vn',
        founded: '2015',
        aboutText:
          'Shopee là sàn thương mại điện tử dẫn đầu Đông Nam Á, cung cấp nền tảng kết nối mua bán trực tuyến. Chúng tôi cam kết tạo ra một hệ sinh thái mua sắm trực tuyến an toàn và thuận tiện.',
        benefits: [
          'Lương thưởng cao',
          'Bảo hiểm toàn diện',
          'Môi trường năng động, sáng tạo',
          'Đạo tạo kỹ năng',
          'Cơ hội quốc tế',
          'Phúc lợi sinh hoạt',
        ],
        images: [
          'https://api.dicebear.com/7.x/icons/svg?seed=office9',
          'https://api.dicebear.com/7.x/icons/svg?seed=office10',
        ],
      },
    };

    // Mock jobs data
    const jobsData = {
      1: [
        {
          id: 101,
          title: 'Senior Product Designer',
          company: 'FPT Software',
          location: 'TP. Hồ Chí Minh',
          salary: '2,500 - 3,500 USD',
          type: 'full-time',
          experience: '5+ năm',
          postedDate: '2 ngày trước',
          matchScore: 92,
        },
        {
          id: 102,
          title: 'Frontend Developer',
          company: 'FPT Software',
          location: 'Hà Nội',
          salary: '1,800 - 2,500 USD',
          type: 'full-time',
          experience: '2-3 năm',
          postedDate: '5 ngày trước',
          matchScore: 88,
        },
        {
          id: 103,
          title: 'Backend Engineer',
          company: 'FPT Software',
          location: 'TP. Hồ Chí Minh',
          salary: '2,200 - 3,000 USD',
          type: 'full-time',
          experience: '3-5 năm',
          postedDate: '1 tuần trước',
          matchScore: 85,
        },
        {
          id: 104,
          title: 'QA Engineer',
          company: 'FPT Software',
          location: 'Hà Nội',
          salary: '1,500 - 2,200 USD',
          type: 'full-time',
          experience: '1-2 năm',
          postedDate: '1 tuần trước',
          matchScore: 78,
        },
        {
          id: 105,
          title: 'DevOps Engineer',
          company: 'FPT Software',
          location: 'TP. Hồ Chí Minh',
          salary: '2,500 - 3,200 USD',
          type: 'full-time',
          experience: '3+ năm',
          postedDate: '2 tuần trước',
          matchScore: 82,
        },
        {
          id: 106,
          title: 'UI/UX Designer',
          company: 'FPT Software',
          location: 'Hà Nội',
          salary: '1,800 - 2,400 USD',
          type: 'part-time',
          experience: '2+ năm',
          postedDate: '2 tuần trước',
          matchScore: 80,
        },
      ],
      2: [
        {
          id: 201,
          title: 'Lead UX Researcher',
          company: 'VNG Corporation',
          location: 'Hà Nội',
          salary: 'Cạnh tranh',
          type: 'full-time',
          experience: '5+ năm',
          postedDate: '3 ngày trước',
          matchScore: 88,
        },
        {
          id: 202,
          title: 'Python Developer',
          company: 'VNG Corporation',
          location: 'Hà Nội',
          salary: '1,800 - 2,600 USD',
          type: 'full-time',
          experience: '2-3 năm',
          postedDate: '1 tuần trước',
          matchScore: 85,
        },
      ],
      3: [
        {
          id: 301,
          title: 'Data Analyst',
          company: 'Techcombank',
          location: 'TP. Hồ Chí Minh',
          salary: '1,500 - 2,200 USD',
          type: 'full-time',
          experience: '1-3 năm',
          postedDate: '4 ngày trước',
          matchScore: 81,
        },
      ],
      4: [
        {
          id: 401,
          title: 'Mobile App Developer',
          company: 'Grab Vietnam',
          location: 'Hà Nội',
          salary: '1,800 - 2,500 USD',
          type: 'full-time',
          experience: '2-4 năm',
          postedDate: '5 ngày trước',
          matchScore: 86,
        },
      ],
      5: [
        {
          id: 501,
          title: 'Full Stack Developer',
          company: 'Shopee',
          location: 'TP. Hồ Chí Minh',
          salary: '2,200 - 3,000 USD',
          type: 'full-time',
          experience: '3-5 năm',
          postedDate: '2 tuần trước',
          matchScore: 84,
        },
        {
          id: 502,
          title: 'Product Manager',
          company: 'Shopee',
          location: 'TP. Hồ Chí Minh',
          salary: '2,500 - 3,500 USD',
          type: 'full-time',
          experience: '4+ năm',
          postedDate: '2 tuần trước',
          matchScore: 79,
        },
      ],
    };

    const companyData = companiesData[companyId];
    const companyJobs = jobsData[companyId] || [];

    if (companyData) {
      setCompany(companyData);
      setJobs(companyJobs);
    } else {
      navigate('/seeker/companies');
    }
  };

  const toggleFollow = () => {
    setFollowed(!followed);
  };

  const filteredJobs =
    selectedJobType === 'all' ? jobs : jobs.filter((job) => job.type === selectedJobType);

  if (!isLoggedIn || !company) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface">
      <TopNavBar currentPage="companies" />

      <main className="max-w-7xl mx-auto px-6 py-24 space-y-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/seeker/companies')}
          className="flex items-center gap-2 text-[#00488d] hover:text-[#0066cc] font-semibold transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Quay lại
        </button>

        {/* Company Header Section */}
        <section className="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Company Info */}
            <div className="md:col-span-8 space-y-6">
              <div className="flex gap-6 items-start">
                <div className="w-24 h-24 rounded-xl bg-surface-container-low flex items-center justify-center p-2 flex-shrink-0">
                  <img className="w-full h-full object-contain" src={company.logo} alt={company.name} />
                </div>
                <div className="flex-1">
                  <h1 className="text-4xl font-extrabold text-on-surface mb-2">{company.name}</h1>
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="inline-block bg-[#00488d]/10 text-[#00488d] px-3 py-1 rounded-full text-sm font-semibold">
                      {company.industry}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-yellow-500">star</span>
                      <span className="font-bold text-on-surface">{company.rating}</span>
                      <span className="text-on-surface-variant">({company.reviews} đánh giá)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-surface-container rounded-lg p-4">
                  <p className="text-xs text-on-surface-variant mb-1">Nhân viên</p>
                  <p className="text-xl font-bold text-on-surface">{company.employees}</p>
                </div>
                <div className="bg-surface-container rounded-lg p-4">
                  <p className="text-xs text-on-surface-variant mb-1">Thành lập</p>
                  <p className="text-xl font-bold text-on-surface">{company.founded}</p>
                </div>
                <div className="bg-surface-container rounded-lg p-4">
                  <p className="text-xs text-on-surface-variant mb-1">Vị trí mở</p>
                  <p className="text-xl font-bold text-[#00488d]">{jobs.length}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-bold text-on-surface mb-2">Về công ty</h3>
                <p className="text-on-surface-variant leading-relaxed">{company.aboutText}</p>
              </div>

              {/* Benefits */}
              <div>
                <h3 className="text-lg font-bold text-on-surface mb-3">Phúc lợi</h3>
                <div className="grid grid-cols-2 gap-2">
                  {company.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#00488d] text-sm">
                        check_circle
                      </span>
                      <span className="text-on-surface-variant">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="md:col-span-4 space-y-4">
              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={toggleFollow}
                  className={`w-full px-6 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                    followed
                      ? 'bg-[#00488d] text-white hover:opacity-90'
                      : 'bg-surface-container text-on-surface hover:bg-surface-dim'
                  }`}
                >
                  <span className="material-symbols-outlined">
                    {followed ? 'bookmark' : 'bookmark_border'}
                  </span>
                  {followed ? 'Đã theo dõi' : 'Theo dõi công ty'}
                </button>
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-6 py-3 rounded-lg font-bold bg-[#00488d]/10 text-[#00488d] hover:bg-[#00488d]/20 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">open_in_new</span>
                  Trang web
                </a>
              </div>

              {/* Info Card */}
              <div className="bg-[#00488d]/5 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 pb-3 border-b border-[#00488d]/20">
                  <span className="material-symbols-outlined text-[#00488d]">location_on</span>
                  <span className="text-sm text-on-surface">{company.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#00488d]">language</span>
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#00488d] hover:underline"
                  >
                    {company.website}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Jobs Section */}
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-tight text-on-surface">
              Việc làm đang tuyển ({filteredJobs.length})
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedJobType('all')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  selectedJobType === 'all'
                    ? 'bg-[#00488d] text-white'
                    : 'bg-surface-container-high text-on-surface hover:bg-surface-dim'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setSelectedJobType('full-time')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  selectedJobType === 'full-time'
                    ? 'bg-[#00488d] text-white'
                    : 'bg-surface-container-high text-on-surface hover:bg-surface-dim'
                }`}
              >
                Full-time
              </button>
              <button
                onClick={() => setSelectedJobType('part-time')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  selectedJobType === 'part-time'
                    ? 'bg-[#00488d] text-white'
                    : 'bg-surface-container-high text-on-surface hover:bg-surface-dim'
                }`}
              >
                Part-time
              </button>
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

                  {/* Job Details */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">business_center</span>
                      {job.experience}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {job.postedDate}
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                    <span className="text-[#00488d] dark:text-[#005fb8] font-bold">{job.salary}</span>
                    <div className="bg-[#00cc00]/20 text-[#00cc00] px-2 py-1 rounded-full text-xs font-bold">
                      Khớp {job.matchScore}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-surface-container-lowest rounded-xl p-12 text-center">
              <span className="material-symbols-outlined text-8xl text-outline-variant/30 block mb-4">
                work_off
              </span>
              <h3 className="text-xl font-bold text-on-surface mb-2">Không có vị trí tuyển dụng</h3>
              <p className="text-on-surface-variant">
                Công ty này hiện không có vị trí {selectedJobType !== 'all' ? selectedJobType : ''} đang tuyển dụng.
              </p>
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-[#00488d] to-[#0066cc] rounded-xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-2">Quan tâm đến công ty này?</h2>
          <p className="text-white/80 mb-6">
            Hãy theo dõi công ty để nhận thông báo về các vị trí tuyển dụng mới.
          </p>
          <button
            onClick={toggleFollow}
            className={`px-8 py-3 rounded-lg font-bold transition-all ${
              followed ? 'bg-white text-[#00488d]' : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
          >
            {followed ? 'Đã theo dõi ✓' : 'Theo dõi công ty'}
          </button>
        </section>
      </main>
    </div>
  );
};

export default SeekerCompanyDetail;
