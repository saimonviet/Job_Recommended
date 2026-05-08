import React from 'react';
import { useNavigate } from 'react-router-dom';
import GuestTopNavBar from '../../components/GuestTopNavBar';

const SeekerAbout = () => {
  const navigate = useNavigate();
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

      <div className="text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container">
        {/* TopNavBar */}
        <GuestTopNavBar currentPage="about" />

        <main className="pt-24">
          {/* Hero & Mission Section */}
          <section className="relative px-6 py-20 md:py-32 max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-8">
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold uppercase tracking-widest font-label">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  <span>Kiến tạo tương lai nghề nghiệp</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-headline font-extrabold tracking-tight text-on-surface leading-[1.1]">
                  Dự báo sự nghiệp bằng <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-container">Trí tuệ nhân tạo</span>
                </h1>
                <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl font-light leading-relaxed">
                  Career Authority không chỉ là một nền tảng tuyển dụng. Chúng tôi là "Kiến trúc sư Viễn cảnh", sử dụng AI và dữ liệu lớn để giúp bạn nhìn thấy con đường sự nghiệp của mình trước khi nó hình thành.
                </p>
                <div className="flex flex-wrap gap-4 pt-4">
                  <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex-1 min-w-[200px]">
                    <div className="text-3xl font-bold text-primary mb-1 font-headline">98%</div>
                    <div className="text-sm text-on-surface-variant font-medium">Độ chính xác dự báo</div>
                  </div>
                  <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex-1 min-w-[200px]">
                    <div className="text-3xl font-bold text-tertiary mb-1 font-headline">500k+</div>
                    <div className="text-sm text-on-surface-variant font-medium">Chuyên gia tin dùng</div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-5 relative">
                <div className="aspect-square rounded-full overflow-hidden bg-surface-container-high relative z-10">
                  <img className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700" data-alt="A futuristic professional environment showing a high-tech office with glowing blue interfaces and translucent data charts floating in the air." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDBvW5f0wHUE7YV_KFbdlIS0m7QXEZrwce1GW1pv6IResViCRvLD-ACiWPnSOaPI5z8S73IK_Nub7-oP2pRoJpm3JitYhYfXfAysuNYmN16xCV7Sz7_C3I2pnTaSr1gICUisOovuCnjdFHQVClYlrAgjdJCjRyVY8DYsIB6y-yFG-dmMFaF-5lI_K_JO7ihSpNZ8lGU40TBS1qImfF9aeBJE9ZMoKD6kknIqZeR-62KCe5qtz_Q28BOv97vQFX7vTE_89Rlbhj1tyK7"/>
                </div>
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl -z-0"></div>
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-tertiary/5 rounded-full blur-3xl -z-0"></div>
              </div>
            </div>
          </section>

          {/* Technology Section (Bento Grid) */}
          <section className="bg-surface-container-low py-24 md:py-32">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16 space-y-4">
                <h2 className="text-3xl md:text-5xl font-headline font-bold text-on-surface">Động cơ thúc đẩy sự thay đổi</h2>
                <p className="text-on-surface-variant max-w-2xl mx-auto">Sức mạnh công nghệ giúp chúng tôi phân tích hàng tỷ điểm dữ liệu thị trường lao động trong tích tắc.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-surface-container-lowest p-8 rounded-2xl flex flex-col justify-between group transition-all hover:shadow-xl hover:shadow-primary/5">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>psychology</span>
                    </div>
                    <h3 className="text-2xl font-headline font-bold">Deep Career Learning</h3>
                    <p className="text-on-surface-variant leading-relaxed">Thuật toán học sâu của chúng tôi mô phỏng quỹ đạo thành công của hàng triệu chuyên gia hàng đầu để đưa ra lộ trình tối ưu cho riêng bạn.</p>
                  </div>
                  <div className="mt-8 h-48 rounded-xl bg-gradient-to-br from-primary to-primary-container relative overflow-hidden">
                    <img className="w-full h-full object-cover mix-blend-overlay opacity-60" data-alt="Intricate neural network visualization" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDezj8upSMNm8VL_3s_boEFM_2b9i8dS8j9-lrwe70HUpH7_4WkjxGsG7Bmeg2NvUSKWhcdR0hRT0hJkseG6L4X1oQfFWCaZ_csXCsgdd8rLA1iZAIHo1WpqCBfvjx9svCHUf4im7fuvgkp9zbzOUbQLOfsUEOuuX8EaZ8BD7cXh5rBVulFavNPDBB9KaXDMm873MSYnJIeZ2YQa-PeQkQWyENbEs0vk9e_BqBYLosrXI6oS7IHAuqpyTuvVgg0dQ_xFg_UaJI2cKbD"/>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-8 rounded-2xl flex flex-col space-y-6 transition-all hover:shadow-xl">
                  <div className="w-12 h-12 bg-tertiary/10 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-tertiary" style={{fontVariationSettings: "'FILL' 1"}}>dataset</span>
                  </div>
                  <h3 className="text-2xl font-headline font-bold">Thị trường 24/7</h3>
                  <p className="text-on-surface-variant leading-relaxed">Cập nhật biến động tuyển dụng và xu hướng kỹ năng toàn cầu theo thời gian thực.</p>
                  <div className="flex-grow flex items-end">
                    <div className="w-full space-y-2">
                      <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-tertiary w-[85%] rounded-full"></div>
                      </div>
                      <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[92%] rounded-full"></div>
                      </div>
                      <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-secondary w-[60%] rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-primary p-8 rounded-2xl text-on-primary flex flex-col justify-between">
                  <h3 className="text-xl font-headline font-bold">Bảo mật tuyệt đối</h3>
                  <p className="text-primary-container/80 text-sm">Dữ liệu cá nhân của bạn được mã hóa bằng công nghệ blockchain tiên tiến nhất.</p>
                  <span className="material-symbols-outlined text-4xl mt-4">verified_user</span>
                </div>
                <div className="md:col-span-2 bg-secondary-fixed p-8 rounded-2xl flex items-center gap-8">
                  <div className="hidden sm:block w-32 h-32 flex-shrink-0 bg-white/20 rounded-full backdrop-blur-md border border-white/30 p-2">
                    <img className="w-full h-full object-cover rounded-full" data-alt="Clean minimalist data visualization screen" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPxS6emZ7b_DSNo-gohcNPGWsXjLY4XwMx1Kf0Gue1OURuherozow0AknGC49bdYnw_Dqs78ZKZx8nnvsEjURgYVALebT6I1Ky0bPXR5ZdB-qFwbtke-yeTjwidQ46LFl0D8jXaDdnxXtC6UUw3mpcetsY50ykah1ohW-qb5W9OGVof9A2GYRgNFMl9ROBtKGwmDOTgxHijmxXPLCX6z7NMTQ-jgfs-IxWxdhWCeh3FTzOeGc8h4zVUoug5FqPKpVmhgOXpwQ10-wD"/>
                  </div>
                  <div>
                    <h3 className="text-xl font-headline font-bold text-on-secondary-fixed">Dự báo nhu cầu nhân lực</h3>
                    <p className="text-on-secondary-fixed-variant mt-2">Chúng tôi không chỉ nói về hiện tại, chúng tôi cho bạn thấy nghề nghiệp nào sẽ bùng nổ trong 5-10 năm tới.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Experts Section */}
          <section className="py-24 md:py-32 max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div className="max-w-2xl space-y-4">
                <h2 className="text-3xl md:text-5xl font-headline font-bold">Đội ngũ Chuyên gia &amp; Cố vấn</h2>
                <p className="text-on-surface-variant">Sự kết hợp giữa các nhà khoa học dữ liệu hàng đầu và các chuyên gia nhân sự kỳ cựu từ các tập đoàn đa quốc gia.</p>
              </div>
              <button className="text-primary font-bold flex items-center gap-2 group">
                Xem tất cả cộng sự <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="group">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-surface-container mb-6">
                  <img className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-100 group-hover:scale-105" data-alt="Portrait of Dr. Nguyen Lan Anh" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCl99R9rWbA1UBLHjuObVDeoX5b2AFZERG_4Sv4EVxFJbLuMeH58SoqCgjRXnVfvyjW2mSBvVmRiK6hEXODxHx52EaXAxZtG-Kx0S2zUGZRel_qjE3Bnr5pSJEI4z2fn7l0P8wxW2by_tYJDKPGf80V8Uf91CHAmBjI5IlgGG4fFWw1HEPcDo6v97rqWMOS147m8btbVuxEWTA84lX0Y9QwMJQsBLMTLZwWerBdZn6g-bGhF7-aKjyjbL1jwu4LQiMupRQa4bJp3RPY"/>
                </div>
                <h4 className="text-lg font-headline font-bold">Tiến sĩ Nguyễn Lan Anh</h4>
                <p className="text-sm text-tertiary font-medium mb-2">Trưởng bộ phận Nghiên cứu AI</p>
                <p className="text-xs text-on-surface-variant">Cựu chuyên gia tại Google Brain với hơn 15 năm nghiên cứu học máy.</p>
              </div>
              <div className="group">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-surface-container mb-6">
                  <img className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-100 group-hover:scale-105" data-alt="Portrait of Tran Minh Hoang" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZE1QE9Zh6JccocA8IHwtZQNb8qHttjIMp-7gmxxYwLoOKv8E8yOMgeKi-tc2r80mI5BceITEdHO8KAm1tUmb9C982h-nMfU6pd_rdrsQN9eFM8uD3PaSss6NNCJu17oBNoR-LHuzetedhA2OH8EtfaAC17PcSn9AFDLKvjdImqGfPySKAcYZ2-28ArwM04CJZxZwoX1qphiFTjtiSG0wKDIUi6BQNGxAaBMXoLirZa51-6h7OXjKL2G31eQiCMBFcZePBEGPqBrMi"/>
                </div>
                <h4 className="text-lg font-headline font-bold">Trần Minh Hoàng</h4>
                <p className="text-sm text-tertiary font-medium mb-2">Giám đốc Chiến lược Sự nghiệp</p>
                <p className="text-xs text-on-surface-variant">Chuyên gia tư vấn chiến lược nhân sự cho các công ty Fortune 500.</p>
              </div>
              <div className="group">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-surface-container mb-6">
                  <img className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-100 group-hover:scale-105" data-alt="Portrait of Le Thuy Chi" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGVZYxQNtBoQVQxitiSXUabzHeWasr8WMyWUCKj6FOlc3EPs-dfwY90Mig4w_UmcH5RLGUzr-hnQFiPTgluX0es7jqs-bPfsWURZ1L3AxdDL9Fl-sovAzxaKbYFnl905vA_U8kWK0bYnshM6KD_uikkBCC24zomnXsTb7x6GO1nSsekJ-bCHWgzgAlPQgmeL2ax4RTnuwFNFTHWKAmoFdRIJmOf1oLPP74CrqPHXfVkQVkgXnnQyFQolM-WeZFnclYRyv3cj9wb0jo"/>
                </div>
                <h4 className="text-lg font-headline font-bold">Lê Thùy Chi</h4>
                <p className="text-sm text-tertiary font-medium mb-2">Trưởng bộ phận Big Data</p>
                <p className="text-xs text-on-surface-variant">Chuyên gia phân tích dữ liệu quy mô lớn, cựu thành viên LinkedIn Data Team.</p>
              </div>
              <div className="group">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-surface-container mb-6">
                  <img className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-100 group-hover:scale-105" data-alt="Portrait of David Pham" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZBmTqHcPhbzP_1a5iaeckMKneWUPxW2_y_6dhKN0PGUxciQVMZh8vR9Ftr8V2cLnbGLd07_ltNG88ghIr0va324fyTyDpmOfxxc-w4SBBOX7UxpHk3DEu0qtzNfFtC6UxKdzjIBt_00_0MSTldTqN_A7CHAWr1W829isnoT-4YItgiM31_Jzeg0_8SAVa8UVvuJuxGWa31jHwe-wMVBm-p9mPe2xwOXOlC09KIFzMOC7BGinYnhtfDNWPX1RAULbT2tbZoUUjENn1"/>
                </div>
                <h4 className="text-lg font-headline font-bold">David Phạm</h4>
                <p className="text-sm text-tertiary font-medium mb-2">Chính sách &amp; Đạo đức AI</p>
                <p className="text-xs text-on-surface-variant">Luật sư chuyên ngành công nghệ, đảm bảo tính công bằng và đạo đức của thuật toán.</p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="mb-24 px-6 max-w-7xl mx-auto">
            <div className="bg-gradient-to-br from-primary to-primary-container rounded-[2rem] p-12 md:p-20 text-center relative overflow-hidden">
              <div className="relative z-10 space-y-8">
                <h2 className="text-3xl md:text-5xl font-headline font-bold text-white max-w-3xl mx-auto">Sẵn sàng để làm chủ tương lai của chính bạn?</h2>
                <p className="text-primary-container text-lg md:text-xl max-w-2xl mx-auto opacity-90">Tham gia cùng hàng ngàn chuyên gia đang sử dụng trí tuệ nhân tạo để bứt phá trong sự nghiệp.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button className="bg-white text-primary px-8 py-4 rounded-xl font-bold shadow-xl hover:scale-105 transition-transform">Bắt đầu ngay hôm nay</button>
                  <button className="bg-primary-container/20 text-white border border-white/20 backdrop-blur-md px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition-colors">Tìm hiểu về Dự báo</button>
                </div>
              </div>
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <svg fill="none" height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
                  <pattern height="40" id="grid" patternunits="userSpaceOnUse" width="40">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" stroke-width="0.5"></path>
                  </pattern>
                  <rect fill="url(#grid)" height="100%" width="100%"></rect>
                </svg>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-slate-100 dark:bg-slate-900 w-full py-12 mt-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:justify-between items-start w-full px-8 max-w-7xl mx-auto gap-8">
            <div className="space-y-4">
              <div className="font-['Manrope'] font-black text-lg text-slate-900 dark:text-white uppercase tracking-tighter">Career Authority</div>
              <p className="max-w-xs text-slate-500 text-sm font-body">© 2024 Predictive Career Authority. Kiến trúc sư tầm nhìn của tăng trưởng chuyên môn.</p>
            </div>
            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-4">
                <h5 className="text-blue-800 dark:text-blue-300 font-bold text-xs uppercase tracking-widest">Khám phá</h5>
                <ul className="space-y-2">
                  <li><a className="text-slate-500 hover:text-blue-600 transition-colors text-sm" href="#">Danh mục</a></li>
                  <li><a className="text-slate-500 hover:text-blue-600 transition-colors text-sm" href="#">Dự báo</a></li>
                  <li><a className="text-slate-500 hover:text-blue-600 transition-colors text-sm" href="#">Phân tích</a></li>
                </ul>
              </div>
              <div className="space-y-4">
                <h5 className="text-blue-800 dark:text-blue-300 font-bold text-xs uppercase tracking-widest">Pháp lý</h5>
                <ul className="space-y-2">
                  <li><a className="text-slate-500 hover:text-blue-600 transition-colors text-sm" href="#">Chính sách Bảo mật</a></li>
                  <li><a className="text-slate-500 hover:text-blue-600 transition-colors text-sm" href="#">Điều khoản Dịch vụ</a></li>
                  <li><a className="text-slate-500 hover:text-blue-600 transition-colors text-sm" href="#">Đạo đức AI</a></li>
                  <li><a className="text-slate-500 hover:text-blue-600 transition-colors text-sm" href="#">Liên hệ</a></li>
                </ul>
              </div>
            </div>
            <div className="space-y-4">
              <h5 className="text-blue-800 dark:text-blue-300 font-bold text-xs uppercase tracking-widest">Đăng ký bản tin</h5>
              <div className="flex gap-2">
                <input className="bg-white border-none rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-primary w-full" placeholder="Email của bạn" type="email"/>
                <button className="bg-primary text-white p-2 rounded-md">
                  <span className="material-symbols-outlined text-sm">send</span>
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default SeekerAbout;