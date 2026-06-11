import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';

const LoginSeeker = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email.trim() || !password) {
      setError('Vui lòng nhập email và mật khẩu');
      setLoading(false);
      return;
    }

    try {
      const res = await API.post('/auth/seeker/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      const user = {
        ...res.data.user,
        token: res.data.token,
        access_token: res.data.token,
      };

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', res.data.token);
      localStorage.removeItem('employerToken');

      navigate('/seeker/home');
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Không thể đăng nhập';

      setError(message);
      setLoading(false);
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
        .bg-auth-gradient { background: linear-gradient(135deg, #00488d 0%, #005fb8 100%); }
        .glass-panel { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); }
      `}</style>

      <div className="min-h-screen flex items-center justify-center p-4 bg-surface">
        <button 
          onClick={() => navigate('/')}
          className="fixed top-4 left-4 p-2 hover:bg-surface-container rounded-full transition-colors z-50"
          title="Quay lại"
        >
          <span className="material-symbols-outlined text-on-surface text-lg">arrow_back</span>
        </button>
        
       
        <div className="w-full max-w-6xl grid md:grid-cols-2 bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(25,28,33,0.06)]">
          {/* Branding & Visual Side */}
          <div className="hidden md:flex flex-col justify-center p-12 hero-gradient text-on-primary relative overflow-hidden">
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
            
            {/* Absolute decorative element */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-400/30 rounded-full blur-3xl"></div>
          </div>

          {/* Login Form Side */}
          <div className="p-8 md:p-16 flex flex-col justify-center">
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
              </header>

              {/* Main Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <p className="text-red-600 font-semibold text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-md">
                    {error}
                  </p>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Địa chỉ Email</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">mail</span>
                    <input
                      type="email"
                      className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border-none rounded-md focus:ring-1 focus:ring-blue-500 focus:bg-surface-container-lowest transition-all text-on-surface placeholder:text-gray-400"
                      placeholder="email@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
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
                      disabled={loading}
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
                  disabled={loading}
                  className="w-full bg-auth-gradient text-white py-4 rounded-md font-bold text-sm tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP VÀO HỆ THỐNG'}
                </button>
              </form>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => navigate('/login-employer')}
                  className="w-full py-3 rounded-md border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Đăng nhập với tư cách Nhà tuyển dụng
                </button>
              </div>

              <footer className="mt-6 text-center">
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

        {/* Background Decoration for the whole page
        <div className="fixed top-0 left-0 w-full h-full -z-10 opacity-40 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[100px]"></div>
        </div> */}
      </div>
    </>
  );
};

export default LoginSeeker;
