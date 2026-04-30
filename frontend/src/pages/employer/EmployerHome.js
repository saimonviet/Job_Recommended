import React from 'react';
import { useNavigate } from 'react-router-dom';

const EmployerHome = () => {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        body { 
          font-family: 'Inter', sans-serif; 
          background-color: #f9f9ff; 
          color: #191c21; 
        }
        h1, h2, h3 { font-family: 'Manrope', sans-serif; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}</style>

      {/* Header Navigation */}
      <header className="bg-slate-50/80 backdrop-blur-xl fixed w-full top-0 sticky z-50 shadow-sm">
        <nav className="flex justify-between items-center w-full px-6 py-3 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-8">
            <span className="text-2xl font-bold text-blue-900 font-headline tracking-tight cursor-pointer" onClick={() => navigate('/')}>
              Career Authority
            </span>
            <div className="hidden md:flex gap-6 items-center">
              <a className="text-slate-600 hover:text-blue-600 transition-colors font-medium cursor-pointer">Giải pháp</a>
              <a className="text-slate-600 hover:text-blue-600 transition-colors font-medium cursor-pointer">Bảng giá</a>
              <a className="text-slate-600 hover:text-blue-600 transition-colors font-medium cursor-pointer">Tài nguyên</a>
              
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a 
              onClick={() => navigate('/')}
                className="text-slate-600 hover:text-blue-600 transition-colors font-medium border-l border-slate-300 pl-6 cursor-pointer bg-none border-none p-0"
              >
                Dành cho Người tìm việc
            </a>
            <div className="h-6 w-[1px] bg-outline-variant/30 mx-2"></div>
            <button 
              onClick={() => navigate('/login-employer')}
              className="text-on-surface-variant font-medium px-4 py-2 hover:bg-surface-container-high rounded-lg transition-all"
            >
              Đăng nhập
            </button>
            <button 
              onClick={() => navigate('/register-employer')}
              className="bg-primary text-on-primary px-5 py-2.5 rounded-md font-semibold text-sm hover:opacity-90 transition-all shadow-sm"
            >
              Đăng ký ngay
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-32 px-6">
        <div className="max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="z-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-xs font-bold uppercase tracking-widest mb-6">
              Kỷ nguyên Tuyển dụng Mới
            </span>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-on-surface leading-[1.1] mb-8 tracking-tight">
              Tuyển dụng nhân tài dựa trên <span className="text-primary italic">dữ liệu dự báo.</span>
            </h1>
            <p className="text-lg text-on-surface-variant max-w-xl mb-10 leading-relaxed">
              Vượt xa các phương pháp truyền thống. Sử dụng trí tuệ nhân tạo để dự báo nhu cầu nhân sự và kết nối với những ứng viên phù hợp nhất ngay cả trước khi họ bắt đầu tìm việc.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => navigate('/login-employer')}
                className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-8 py-4 rounded-md font-bold text-lg hover:shadow-lg transition-all transform active:scale-95"
              >
                Bắt đầu miễn phí
              </button>
              <button className="bg-surface-container-high text-on-surface-variant px-8 py-4 rounded-md font-bold text-lg hover:bg-surface-container-highest transition-all" onClick={() => navigate('/register-employer')}>
                Đăng ký ngay
              </button>
            </div>
            <div className="mt-12 flex items-center gap-4">
              <div className="flex -space-x-3">
                <img 
                  className="w-10 h-10 rounded-full border-2 border-surface" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8cx0B0O8CHrcysbEL8mbddH0WdhE8FZZiMOeAcHEA6lZoz8MCIO3c_Lm8lAptayRkBrfgb8ILEkOZpk2hMYze-SYMX1RNTc1UX71QokhYDbUVy4fKz1_Ig2l-odbrD5dNFQS45_crRNtVD74gaCvoEMJPiIjEL_IEJkIZDXqekxGCBCp3vadlWSshY0MUUnokdrq0seX4m_N6i7HuBXS9Fe8lmKMOippqb3rK8FK4h_5vrKDHVOlCIEtDgPiqR-eE9-wTC_495WPq"
                  alt="professional"
                />
                <img 
                  className="w-10 h-10 rounded-full border-2 border-surface" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHobzXq7J6jBVzwaaIMm7Pyii9aigg2UzH0Ue4MxWdF1clG8d5JKTQTH1xwrdwf4S7sRzI58_160g8sgzzFfBqfYTfv47g9UCidcXcGkXy2kdeswzlT_F-1j376hi4vssS4HxoBCaxO0I4F0CMfUYFC0zFr8X87A47uaBEuLzGL7Slj4QJ3jeLZF5fW7FEL8se9J7waS861TybFD4O5PvwSEY36Pb5ZoyRRj0vXeIMaP7uIcFmDA14Sai1cSI4XqtLC6miGdT2TZ_w"
                  alt="professional"
                />
                <img 
                  className="w-10 h-10 rounded-full border-2 border-surface" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZQL9JfIX9XhlpJRAXdTz3dvFRxjVAjVPN5D5FYcx384cy22T2UxHxBxCVq7wFnh2vMmwi-mydCYF4mgG68Hz8Q1z8KuV3hNphTQETNaPulHAGNUiBHvUZX_rAQENedIBLd5uj8EfFxwO3dZaUe8NVkJuLGYTCkf8cN0c085_NrHuf_EtnuxAHmMIA5-EiLnpT4JZJPR_AK2f9P4slPiEXZKFHry2P1M0a2XIhGsFUrUnNQCjmEtX0SD8OakzXvTUoU1-_0_-GCOCy"
                  alt="professional"
                />
              </div>
              <p className="text-sm font-medium text-on-surface-variant">
                Được tin dùng bởi hơn <span className="text-primary font-bold">5,000+</span> tập đoàn hàng đầu
              </p>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl group-hover:bg-primary-container/20 transition-all duration-700"></div>
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-tertiary/10 rounded-full blur-3xl group-hover:bg-tertiary/20 transition-all duration-700"></div>
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">analytics</span>
                  <span className="font-bold text-sm">Dự báo nhu cầu 2024</span>
                </div>
                <span className="text-xs bg-surface-container text-on-surface-variant px-2 py-1 rounded">Cập nhật 2 phút trước</span>
              </div>
              <img 
                className="w-full h-auto rounded-lg mb-6 grayscale hover:grayscale-0 transition-all duration-500" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1XMRKWyBOCEQsi4QtHfx4W99zua58AxkJpG4E5_p0zYOFQHkIi0xlPq08rOKbt3Lbf-0-eU0aE7fV41TlTycIQmW_WfRUYenmUH_Q04W247SyDXl9emBmJem-BBoHh3VFD-DvDMQ9wNwvYAhIlA5MmCEljGalAT5k0Vb7neXhuo439VtZ99nYcJ4ZEkrd09S2ArP7jNIxrVObCNOO5tU8WVL8i6t7pW6kpMXKHPz5HCSTd-gtGeq5E2M32ZeB7kBY_gxFhAsGAGlj"
                alt="dashboard"
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-low p-4 rounded-lg">
                  <p className="text-xs text-on-surface-variant mb-1">Chỉ số phù hợp</p>
                  <p className="text-2xl font-extrabold text-primary tracking-tight">98.4%</p>
                </div>
                <div className="bg-surface-container-low p-4 rounded-lg">
                  <p className="text-xs text-on-surface-variant mb-1">Thời gian giảm</p>
                  <p className="text-2xl font-extrabold text-tertiary tracking-tight">-42%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-24 px-6 bg-surface-container-low">
        <div className="max-w-screen-2xl mx-auto">
          <div className="mb-16 text-center max-w-3xl mx-auto">
            <h2 className="text-4xl font-extrabold mb-6 tracking-tight">Giải pháp tuyển dụng toàn diện</h2>
            <p className="text-on-surface-variant">Tối ưu hóa mọi giai đoạn của quy trình tuyển dụng bằng các công cụ thông minh nhất thị trường.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[600px]">
            {/* AI Search */}
            <div className="md:col-span-8 bg-surface-container-lowest p-8 rounded-xl flex flex-col justify-between group cursor-pointer hover:shadow-xl transition-all">
              <div className="flex justify-between items-start">
                <div className="max-w-md">
                  <span className="material-symbols-outlined text-4xl text-primary mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                  <h3 className="text-2xl font-bold mb-4">Tìm kiếm ứng viên bằng AI</h3>
                  <p className="text-on-surface-variant leading-relaxed">Thuật toán Deep Learning tự động phân tích hàng triệu hồ sơ để đề xuất những gương mặt sáng giá nhất cho vị trí của bạn.</p>
                </div>
              </div>
              <div className="mt-8 flex items-center text-primary font-bold gap-2">
                <span>Khám phá công nghệ AI</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </div>
            </div>

            {/* Job Posting */}
            <div className="md:col-span-4 bg-primary p-8 rounded-xl flex flex-col justify-between text-on-primary group cursor-pointer hover:shadow-xl transition-all">
              <div>
                <span className="material-symbols-outlined text-4xl mb-4">campaign</span>
                <h3 className="text-2xl font-bold mb-4">Đăng tin tuyển dụng</h3>
                <p className="opacity-80 text-sm leading-relaxed">Tin tuyển dụng của bạn được tối ưu hóa SEO và tự động đẩy lên các nền tảng mạng xã hội chuyên nghiệp nhất.</p>
              </div>
              <div className="mt-8">
                <div className="w-full h-1 bg-on-primary/20 rounded-full overflow-hidden">
                  <div className="w-2/3 h-full bg-on-primary transition-all duration-1000"></div>
                </div>
                <p className="text-xs mt-2 font-medium">Khả năng tiếp cận: Cao (85%)</p>
              </div>
            </div>

            {/* Market Analytics */}
            <div className="md:col-span-4 bg-tertiary-container p-8 rounded-xl flex flex-col justify-between text-on-tertiary-container group cursor-pointer hover:shadow-xl transition-all">
              <div>
                <span className="material-symbols-outlined text-4xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>query_stats</span>
                <h3 className="text-2xl font-bold mb-4">Phân tích thị trường</h3>
                <p className="opacity-90 text-sm leading-relaxed">Báo cáo lương thưởng, xu hướng kỹ năng và hành vi của ứng viên trong ngành nghề cụ thể của bạn.</p>
              </div>
              <button className="mt-8 flex items-center justify-center w-12 h-12 bg-on-tertiary-container text-tertiary-container rounded-full">
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>

            {/* Success Prediction */}
            <div className="md:col-span-8 bg-surface p-8 rounded-xl border border-outline-variant/20 flex items-center justify-between group cursor-pointer hover:bg-surface-container-lowest transition-all">
              <div className="max-w-lg">
                <h3 className="text-2xl font-bold mb-4">Dự báo tỷ lệ thành công</h3>
                <p className="text-on-surface-variant">Hệ thống của chúng tôi dự báo khả năng gắn bó và hiệu suất làm việc của ứng viên sau khi được tuyển dụng.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-3xl font-black text-on-surface">92%</p>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">Độ chính xác</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-32 px-6 overflow-hidden">
        <div className="max-w-screen-2xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="relative">
              <div className="absolute -top-12 -left-12 text-slate-200 text-9xl font-black select-none z-0">98%</div>
              <div className="relative z-10 space-y-12">
                <div className="flex gap-6 items-start">
                  <div className="w-14 h-14 shrink-0 bg-blue-50 flex items-center justify-center rounded-xl">
                    <span className="material-symbols-outlined text-primary text-3xl">speed</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-3">Giảm thời gian tuyển dụng</h4>
                    <p className="text-on-surface-variant leading-relaxed">Rút ngắn quy trình từ 45 ngày xuống còn 12 ngày nhờ hệ thống sàng lọc tự động và lịch phỏng vấn thông minh.</p>
                  </div>
                </div>
                <div className="flex gap-6 items-start">
                  <div className="w-14 h-14 shrink-0 bg-orange-50 flex items-center justify-center rounded-xl">
                    <span className="material-symbols-outlined text-tertiary text-3xl">verified_user</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-3">Tìm đúng người phù hợp 98%</h4>
                    <p className="text-on-surface-variant leading-relaxed">Không chỉ là kỹ năng chuyên môn, chúng tôi khớp nối cả giá trị cốt lõi và văn hóa doanh nghiệp của ứng viên.</p>
                  </div>
                </div>
                <div className="flex gap-6 items-start">
                  <div className="w-14 h-14 shrink-0 bg-blue-50 flex items-center justify-center rounded-xl">
                    <span className="material-symbols-outlined text-primary text-3xl">glass_cup</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-3">Dự báo nhu cầu nhân sự</h4>
                    <p className="text-on-surface-variant leading-relaxed">Biết trước khi nào đội ngũ của bạn cần thêm người dựa trên tốc độ tăng trưởng và dữ liệu thị trường thực tế.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-surface-container rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGlkvj6EV8KBl1cXHetl_whZLobJaMBIMExdgAZkR0-LbpJjeMw-POE1CvwoWlJLL6Wz_arnpnhN8lRWtqvTLtkGNEmXv67trFOZnPYkETvpZ_muDxULgtX4BzYbBso3myF0fbkqhcKy0DtlkxCDyWBQfJao1hJuA5lIW6F1hcr1GIQuv4LzdbDBynj_hJ2EPmR76A7sjeaFhxy-IDrjk8yxgoyt3f4epVbdrkMqtOsaMf1vqrHRjJ_m60eE4_gEC7O0yFXfS2hv3X"
                  alt="team"
                />
              </div>
              <div className="absolute -bottom-8 -left-8 bg-surface-container-lowest p-8 rounded-2xl shadow-xl max-w-xs border border-outline-variant/10">
                <p className="text-tertiary font-bold mb-2">Chuyên gia nhận xét:</p>
                <p className="text-sm italic text-on-surface leading-relaxed mb-4">"Nền tảng này đã thay đổi hoàn toàn cách chúng tôi nhìn nhận về quản trị nhân tài. Không còn là phỏng đoán nữa."</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                  <div>
                    <p className="text-xs font-bold">Giám đốc Nhân sự</p>
                    <p className="text-[10px] text-on-surface-variant">Global Tech Corp</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto bg-primary rounded-3xl p-12 lg:p-20 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-extrabold text-on-primary mb-8 tracking-tight">Bắt đầu hành trình tuyển dụng thông minh</h2>
            <p className="text-on-primary-container text-lg mb-12 max-w-2xl mx-auto">Gia nhập cộng đồng các doanh nghiệp dẫn đầu trong kỷ nguyên dữ liệu. Đăng tin tuyển dụng đầu tiên của bạn chỉ trong vài phút.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={() => navigate('/login-employer')}
                className="bg-on-primary text-primary px-10 py-4 rounded-md font-bold text-lg hover:bg-on-primary-container transition-all"
              >
                Đăng bài ngay
              </button>
              <button className="border border-on-primary/30 text-on-primary px-10 py-4 rounded-md font-bold text-lg hover:bg-on-primary/10 transition-all">
                Liên hệ tư vấn
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-100 py-12 px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-screen-2xl mx-auto">
          <div className="space-y-6">
            <span className="text-lg font-bold text-slate-900 font-headline">Career Authority</span>
            <p className="text-slate-500 max-w-sm leading-relaxed text-sm">© 2024 The Predictive Career Authority. Editorial Career Intelligence. Hệ thống tuyển dụng dựa trên trí tuệ nhân tạo hàng đầu Việt Nam.</p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h5 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Khám phá</h5>
              <ul className="space-y-3 text-sm">
                <li><a className="text-slate-500 hover:text-blue-600 transition-colors cursor-pointer">Insights</a></li>
                <li><a className="text-slate-500 hover:text-blue-600 transition-colors cursor-pointer">Methodology</a></li>
                <li><a className="text-slate-500 hover:text-blue-600 transition-colors cursor-pointer">Báo cáo thị trường</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Pháp lý</h5>
              <ul className="space-y-3 text-sm">
                <li><a className="text-slate-500 hover:text-blue-600 transition-colors cursor-pointer">Privacy</a></li>
                <li><a className="text-slate-500 hover:text-blue-600 transition-colors cursor-pointer">Terms of Authority</a></li>
                <li><a className="text-slate-500 hover:text-blue-600 transition-colors cursor-pointer">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-screen-2xl mx-auto mt-12 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-400">
          <p>Trụ sở chính: Tầng 42, Bitexco Financial Tower, Quận 1, TP. HCM</p>
          <div className="flex gap-6">
            <a className="hover:text-primary transition-colors cursor-pointer">Facebook</a>
            <a className="hover:text-primary transition-colors cursor-pointer">LinkedIn</a>
            <a className="hover:text-primary transition-colors cursor-pointer">Twitter</a>
          </div>
        </div>
      </footer>
    </>
  );
};

export default EmployerHome;
