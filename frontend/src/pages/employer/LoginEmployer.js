import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginEmployer = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mock authentication - replace with real API call
    if (email && password) {
      try {
        // Simulate API call
        const response = await new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              success: true,
              token: 'employer_token_' + Date.now(),
              company: 'TechVantage'
            });
          }, 500);
        });

        if (response.success) {
          // Save token to localStorage
          localStorage.setItem('employerToken', response.token);
          localStorage.setItem('employerCompany', response.company);
          
          // Redirect to dashboard
          navigate('/employer/dashboard');
        }
      } catch (error) {
        console.error('Login error:', error);
      }
    }
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
        .hero-gradient { background: linear-gradient(135deg, #00488d 0%, #005fb8 100%); }
      `}</style>

      <div className="min-h-screen flex items-center justify-center p-4 bg-surface">
        <div className="w-full max-w-6xl grid md:grid-cols-2 bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(25,28,33,0.06)]">
          {/* Left Panel (AI Features) */}
          <div className="hidden md:flex flex-col justify-center p-12 hero-gradient text-on-primary relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-4xl font-extrabold font-headline leading-tight tracking-tight mb-6">
                Kiến tạo đội ngũ <br/>với sức mạnh AI
              </h1>
              <p className="text-on-primary-container text-lg mb-10 max-w-md">
                Hệ thống dự báo nhân tài hàng đầu giúp bạn tìm kiếm, đánh giá và kết nối với những ứng viên tiềm năng nhất một cách khoa học.
              </p>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <span className="material-symbols-outlined bg-white/20 p-2 rounded-lg">insights</span>
                  <div>
                    <h3 className="font-bold font-headline">Phân tích dự báo</h3>
                    <p className="text-sm opacity-80">Dự đoán mức độ phù hợp của ứng viên với văn hóa doanh nghiệp.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="material-symbols-outlined bg-white/20 p-2 rounded-lg">auto_awesome</span>
                  <div>
                    <h3 className="font-bold font-headline">Tự động hóa tuyển dụng</h3>
                    <p className="text-sm opacity-80">Tiết kiệm 60% thời gian sàng lọc hồ sơ bằng thuật toán thông minh.</p>
                  </div>
                </div>
              </div>
            </div>
            <img 
              alt="Corporate Recruitment" 
              className="absolute bottom-0 right-0 w-2/3 opacity-10 mix-blend-overlay grayscale" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSn_lMI1gh4BF69FnH1hNxoLuoR_Cc9tuJTo9EC8iUUHQBXgmz8WbQJD8TNsklq1_3s4wAr0xDKNxxSmKG0F-QOe6HgGYLaSbxGIT5aSd4mj6h0q48jUeKHODBiSXxByrBRH7uBA7sOGFCTehFK9SyFGX331eC2TfabQYvts7w0t1r0CzcsRtBqN3wN-42I6KOA5B9EoB_4Ene_Ihgy7h5_fgh2IS6vnsv6NFrV1nP4HhYWvt6__Rht_AmaK4sQmkjc3RJQLpsjMTE"
            />
          </div>

          {/* Right Panel (Login Form) */}
          <div className="p-8 md:p-16 flex flex-col justify-center">
            <div className="mb-8">
              <div 
                className="text-2xl font-extrabold text-primary font-headline tracking-tight mb-10 cursor-pointer hover:opacity-80 transition-all"
                onClick={() => navigate('/employer')}
              >
                Career Authority
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-extrabold font-headline text-on-surface mb-4">Đăng nhập Nhà tuyển dụng</h2>
                <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg mb-4">
                  <span className="material-symbols-outlined text-primary text-lg">business</span>
                  <p className="text-primary font-headline font-bold text-base">Quản lý tuyển dụng thông minh</p>
                </div>
                <p className="text-on-surface-variant">Vui lòng nhập thông tin để truy cập vào bảng điều khiển của bạn.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-2 ml-1">Email doanh nghiệp</label>
                <input 
                  type="email"
                  className="w-full px-4 py-4 bg-surface-container-low border border-transparent rounded-md focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:border-primary/30 transition-all placeholder:text-outline-variant"
                  placeholder="example@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2 ml-1">
                  <label className="block text-sm font-semibold text-on-surface-variant">Mật khẩu</label>
                  <a className="text-xs font-semibold text-primary hover:underline cursor-pointer">Quên mật khẩu?</a>
                </div>
                <input 
                  type="password"
                  className="w-full px-4 py-4 bg-surface-container-low border border-transparent rounded-md focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:border-primary/30 transition-all placeholder:text-outline-variant"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input 
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <label htmlFor="remember" className="text-sm text-on-surface-variant">Ghi nhớ đăng nhập trên thiết bị này</label>
              </div>

              <button 
                type="submit"
                className="w-full py-4 hero-gradient text-on-primary rounded-md font-headline font-extrabold tracking-wide hover:shadow-lg hover:opacity-95 transition-all duration-300"
              >
                ĐĂNG NHẬP VÀO HỆ THỐNG
              </button>
            </form>

            <p className="mt-12 text-center text-on-surface-variant text-sm">
              Chưa có tài khoản Nhà tuyển dụng? 
              <button 
                onClick={() => navigate('/register-employer')}
                className="text-primary font-bold hover:underline ml-1 bg-none border-none cursor-pointer p-0"
              >
                Đăng ký ngay
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginEmployer;
