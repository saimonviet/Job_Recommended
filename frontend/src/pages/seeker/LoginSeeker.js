import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';

const LoginSeeker = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      alert('Vui lòng nhập email và mật khẩu');
      return;
    }

    API.get('/users')
      .then((res) => {
        const matchedUser = (res.data || []).find((u) => u.email === email || u.username === email);

        if (!matchedUser) {
          alert('Không tìm thấy tài khoản, vui lòng đăng ký trước');
          return;
        }

        const user = {
          id: matchedUser.id,
          username: matchedUser.username,
          email: matchedUser.email,
          token: 'demo_token_' + Date.now(),
        };

        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', user.token);
        navigate('/seeker/home');
      })
      .catch(() => {
        alert('Không thể kết nối đến máy chủ');
      });
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
        .bg-auth-gradient { background: linear-gradient(135deg, #00488d 0%, #005fb8 100%); }
        .glass-panel { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); }
      `}</style>

      <div className="bg-surface font-body text-on-surface min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-[1200px] grid grid-cols-1 md:grid-cols-12 overflow-hidden rounded-xl shadow-[0_20px_40px_rgba(25,28,33,0.06)] bg-surface-container-lowest">
          {/* Branding & Visual Side */}
          <div className="hidden md:flex md:col-span-5 bg-auth-gradient p-12 flex-col justify-between relative overflow-hidden">
            {/* Decorative Grain/Texture */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: 'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23000" width="100" height="100"/><circle fill="%23fff" cx="50" cy="50" r="2"/></svg>\')'}}></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-12">
                <span className="material-symbols-outlined text-white text-3xl" style={{fontVariationSettings: "'FILL' 1"}}>architecture</span>
                <span className="font-headline font-bold text-2xl text-white tracking-tight">Career Authority</span>
              </div>
              <h1 className="font-headline text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6 tracking-tight">
                Thiết Kế <br/>Tương Lai <br/><span className="text-secondary-container">Sự Nghiệp.</span>
              </h1>
              <p className="text-white/80 text-lg leading-relaxed max-w-sm">
                Tiếp cận các phân tích thị trường dự báo và công cụ định hướng nghề nghiệp tầm nhìn được các chuyên gia đầu ngành tin dùng.
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-4">
              <div className="flex -space-x-3">
                <img className="w-10 h-10 rounded-full border-2 border-white" alt="user1" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkOkIPXT0WfMuwB0gNzI43tkcrOYifldWDVzZs9OmXo_8bvl9BByq4eS2bQdNBbtZTkBs4N7_rEhm-agihGCmHMKhlDZuJGIP2QEREE5DbdDJHPDgBPv6ESu29oZEY-w8mjOWTCz1iqyxHv5wfa7etCzArziv8j2pS9tTR1po3Xl9ojPPxXiz577I_SBq6P6lmIEaZpV2cZL1rBKwrjgKqx9mVoOqsukCkmS016fhZSe2pG1vxk47PPJ3YxLBbHsv2xhRojyEi-8HG"/>
                <img className="w-10 h-10 rounded-full border-2 border-white" alt="user2" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMHAYAPiu6AUrJ_CtLHvjHNnX3BL8R79RRf2mLEkyVaz1f0TiB_GVzmOJ_KQVr6AZaaAj6GUjcstf4oSY76KYEEdHsEzJFOn8-rG7SGCuMAHlGyQeqHIZ5rJkF0jQ5ZkkyP0WhOhlBwYXmkAgCFp-tbMcpVbxEDHaHjx1uBRSGDArN12x_-5wq18HmxcXqoD6awlSD59W7u2BnSZzwrWIQpoPyaQ6eVYWxH6LPgK-VeJVRZbsr8OfCET4SpriQ99UzXJn7_U6eEMha"/>
                <img className="w-10 h-10 rounded-full border-2 border-white" alt="user3" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1jRCbgwZyXnG1ggnwPaZIgZCBUmrNJ3R8hSLzKSKQVKzBUM0JcqLqx48yIgAdfeXPHL0zD4GbimHDiAw47YVdaAcy4yYDiiOuYnjRd4wysK-rlqTknt8hU7bGhCVvs0p7K3sf-VHyJGrDSE_m_A9Jc7gfEowE44sUerHLkKii5JeOxrOf4V9LGvhFH8oqf8ar-GuyLMkOC7uG_OooBJDJhDwRrhuYiOOK29SB7pVFiyWJ_dEzGrIlDC7t54Xhy6k31GsVZpEepmnI"/>
              </div>
              <span className="text-white text-sm font-medium">+10k Thành viên Authority</span>
            </div>
            
            {/* Absolute decorative element */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-400/30 rounded-full blur-3xl"></div>
          </div>

          {/* Login Form Side */}
          <div className="col-span-1 md:col-span-7 p-8 md:p-16 lg:p-24 flex flex-col justify-center">
            {/* Mobile Logo */}
            <div className="md:hidden flex items-center gap-2 mb-8">
              <span className="material-symbols-outlined text-primary text-3xl" style={{fontVariationSettings: "'FILL' 1"}}>architecture</span>
              <span className="font-headline font-bold text-2xl text-primary tracking-tight">Career Authority</span>
            </div>

            <div className="max-w-md w-full mx-auto">
              <header className="mb-10">
                <h2 className="font-headline text-3xl font-bold text-on-surface mb-4">Chào mừng trở lại</h2>
                <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg mb-4">
                  <span className="material-symbols-outlined text-primary text-lg">person_search</span>
                  <p className="text-primary font-headline font-bold text-base">Đăng nhập với tư cách là Người tìm việc</p>
                </div>
                <p className="text-on-surface-variant font-body">Vui lòng nhập thông tin đăng nhập của bạn để truy cập hệ thống.</p>
              </header>

              {/* Social Login Cluster */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button className="flex items-center justify-center gap-3 py-3 px-4 bg-surface-container-high rounded-md hover:bg-surface-variant transition-colors duration-200 group">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"></path>
                  </svg>
                  <span className="text-sm font-semibold text-on-surface-variant group-hover:text-on-surface">Google</span>
                </button>
                <button className="flex items-center justify-center gap-3 py-3 px-4 bg-surface-container-high rounded-md hover:bg-surface-variant transition-colors duration-200 group">
                  <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
                  </svg>
                  <span className="text-sm font-semibold text-on-surface-variant group-hover:text-on-surface">Facebook</span>
                </button>
              </div>

              <div className="relative flex items-center mb-8">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 text-xs font-medium text-gray-500 uppercase tracking-widest">Hoặc tiếp tục với email</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              {/* Main Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Địa chỉ Email</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">mail</span>
                    <input 
                      type="email"
                      className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border-none rounded-md focus:ring-1 focus:ring-blue-500 focus:bg-surface-container-lowest transition-all text-on-surface placeholder:text-gray-400"
                      placeholder="ten@congty.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Mật khẩu</label>
                    <a href="#forgot" className="text-xs font-semibold text-primary hover:text-blue-700 transition-colors">Quên mật khẩu?</a>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">lock</span>
                    <input 
                      type="password"
                      className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border-none rounded-md focus:ring-1 focus:ring-blue-500 focus:bg-surface-container-lowest transition-all text-on-surface placeholder:text-gray-400"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input 
                    type="checkbox"
                    id="remember"
                    className="w-4 h-4 text-primary bg-surface-container-low border-gray-300 rounded"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <label htmlFor="remember" className="ml-2 text-sm text-on-surface-variant font-medium select-none">Ghi nhớ thiết bị này</label>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-auth-gradient text-white py-4 rounded-md font-bold text-sm tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                  ĐĂNG NHẬP VÀO HỆ THỐNG
                </button>
              </form>

              <footer className="mt-12 text-center">
                <p className="text-on-surface-variant text-sm">
                  Chưa có tài khoản? 
                  <button 
                    onClick={() => navigate('/register-seeker')}
                    className="text-primary font-bold ml-1 hover:underline bg-none border-none cursor-pointer p-0"
                  >
                    Gia nhập Authority
                  </button>
                </p>
              </footer>
            </div>
          </div>
        </div>

        {/* Background Decoration for the whole page */}
        <div className="fixed top-0 left-0 w-full h-full -z-10 opacity-40 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[100px]"></div>
        </div>
      </div>
    </>
  );
};

export default LoginSeeker;
