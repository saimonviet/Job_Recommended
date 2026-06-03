import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';

const LoginEmployer = () => {
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

    if (!email || !password) {
      setError('Vui lòng nhập email và mật khẩu');
      setLoading(false);
      return;
    }

    try {
      const response = await API.post('/auth/employer/login', { email, password });
      
      const user = {
        ...response.data.user,
        token: response.data.token,
        access_token: response.data.token,
      };

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('employerToken', response.data.token);
      navigate('/employer/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể đăng nhập');
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
        .hero-gradient { background: linear-gradient(135deg, #f4510b 0%, #ff6a14 100%); }
      `}</style>

      <div className="min-h-screen flex items-center justify-center p-4 bg-surface">
        <button 
          onClick={() => navigate('/employer')}
          className="fixed top-4 left-4 p-2 hover:bg-surface-container rounded-full transition-colors z-50"
          title="Quay lại"
        >
          <span className="material-symbols-outlined text-on-surface text-lg">arrow_back</span>
        </button>

        <div className="w-full max-w-6xl grid md:grid-cols-2 bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(25,28,33,0.06)]">
          {/* Left Panel (AI Features) */}
          <div className="hidden md:flex flex-col justify-center p-12 hero-gradient text-white relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-4xl font-extrabold font-headline leading-tight tracking-tight mb-6">
                Kiến tạo đội ngũ <br/>với sức mạnh AI
              </h1>

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
          </div>

          {/* Right Panel (Login Form) */}
          <div className="p-8 md:p-16 flex flex-col justify-center">
            <header className="mb-10">
                <h2 className="font-headline text-3xl font-bold text-on-surface mb-4">Chào mừng trở lại</h2>
                <div className="inline-flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-lg mb-4">
                  <span className="material-symbols-outlined text-orange-600 text-lg">person_search</span>
                  <p className="text-orange-600 font-headline font-bold text-base">Đăng nhập với tư cách là Nhà tuyển dụng</p>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-2 ml-1">Email doanh nghiệp</label>
                <input 
                  type="email"
                  className="w-full px-4 py-4 bg-surface-container-low border border-transparent rounded-md focus:ring-2 focus:ring-orange-600/20 focus:bg-surface-container-lowest focus:border-orange-600/30 transition-all placeholder:text-outline-variant"
                  placeholder="example@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2 ml-1">
                  <label className="block text-sm font-semibold text-on-surface-variant">Mật khẩu</label>
                  <a className="text-xs font-semibold text-orange-600 hover:underline cursor-pointer">Quên mật khẩu?</a>
                </div>
                <input 
                  type="password"
                  className="w-full px-4 py-4 bg-surface-container-low border border-transparent rounded-md focus:ring-2 focus:ring-orange-600/20 focus:bg-surface-container-lowest focus:border-orange-600/30 transition-all placeholder:text-outline-variant"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input 
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 rounded border-outline-variant text-orange-600 focus:ring-orange-600"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  disabled={loading}
                />
                <label htmlFor="remember" className="text-sm text-on-surface-variant">Ghi nhớ đăng nhập trên thiết bị này</label>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 hero-gradient text-white rounded-md font-headline font-extrabold tracking-wide hover:shadow-lg hover:opacity-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP VÀO HỆ THỐNG'}
              </button>
            </form>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => navigate('/login-seeker')}
                className="w-full py-3 rounded-md border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Đăng nhập với tư cách Người tìm việc
              </button>
            </div>

            <p className="mt-6 text-center text-on-surface-variant text-sm">
              Chưa có tài khoản Nhà tuyển dụng? 
              <button 
                onClick={() => navigate('/register-employer')}
                className="text-orange-600 font-bold hover:underline ml-1 bg-none border-none cursor-pointer p-0"
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
