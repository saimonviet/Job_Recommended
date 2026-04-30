import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RegisterSeeker = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu không trùng khớp!');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://127.0.0.1:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.email,
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Đăng ký thất bại!');
        setLoading(false);
        return;
      }

      // Đăng ký thành công, điều hướng đến login
      alert('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login-seeker');
    } catch (error) {
      console.error('Registration error:', error);
      setError('Lỗi kết nối! Vui lòng thử lại.');
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
      `}</style>

      <div className="min-h-screen flex items-center justify-center p-6 md:p-12 relative overflow-hidden bg-white">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-blue-50 rounded-bl-full -z-10 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-100/20 rounded-tr-full -z-10"></div>

        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 shadow-2xl rounded-xl overflow-hidden bg-white">
          {/* Left Side: Editorial Context */}
          <div className="hidden md:flex flex-col justify-between p-12 bg-auth-gradient text-white relative">
            <div className="z-10">
              <h2 className="font-headline text-2xl font-bold tracking-tight mb-8">Career Authority</h2>
              <h1 className="font-headline text-5xl font-extrabold tracking-tighter leading-tight mb-6">
                Thiết kế lộ trình <br/> sự nghiệp của bạn.
              </h1>
              <p className="font-body text-lg opacity-90 max-w-md leading-relaxed">
                Gia nhập cộng đồng kiến tạo tương lai. Sử dụng AI để dự báo thị trường và tối ưu hóa hồ sơ năng lực của bạn ngay hôm nay.
              </p>
            </div>
            
            <div className="z-10 bg-white/10 backdrop-blur-md p-6 rounded-lg border border-white/10">
              <div className="flex items-center gap-4 mb-4">
                <span className="material-symbols-outlined text-yellow-200" style={{fontVariationSettings: "'FILL' 1"}}>insights</span>
                <span className="font-headline font-bold text-sm tracking-widest uppercase">Dự báo 2024</span>
              </div>
              <p className="text-sm font-medium italic opacity-80">
                "Ngành Công nghệ đang chuyển dịch sang các mô hình kiến trúc AI chuyên sâu. Hãy chuẩn bị kỹ năng từ bây giờ."
              </p>
            </div>

            {/* Background Image Layer */}
            <div className="absolute inset-0 z-0 opacity-20 overflow-hidden">
              <img 
                className="w-full h-full object-cover" 
                alt="Modern building" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNHtagmTQg8IJL9y07DfnBqmIqQZOYSeQFqAXj6dywLggOsiszbrxsNeks1Lnjnj1KLiMDX6ax6E_ZROMgcf2L2NmIdr0TUkb8DaELCVSaBQKE_im87O2y50pK8uSdozHfoawnmGDASVyVjJQWP0ZGP5QurfZbKpCDf8Xxoxj_8x52-VGN9CHhRiJq_7DfqPVwc2-AeD9su8S8jenOfqTNLAqJlj46qui_uwunmQclJtfgq9S-duperPn1a6TOhNMZ1PyZjaP_uoS7"
              />
            </div>
          </div>

          {/* Right Side: Registration Form */}
          <div className="p-8 md:p-16 flex flex-col justify-center bg-white">
            <div className="mb-10">
              <h2 className="font-headline text-3xl font-bold text-on-surface mb-4">Tạo tài khoản mới</h2>
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg mb-4">
                <span className="material-symbols-outlined text-primary text-lg">person_add</span>
                <p className="text-primary font-headline font-bold text-base">Gia nhập cộng đồng Người tìm việc</p>
              </div>
              <p className="text-gray-500">Bắt đầu hành trình chinh phục sự nghiệp cùng Career Authority.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Social Registration */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button 
                  type="button"
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 rounded-md hover:bg-gray-200 transition-all text-sm font-semibold"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"></path>
                  </svg>
                  Google
                </button>
                <button 
                  type="button"
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 rounded-md hover:bg-gray-200 transition-all text-sm font-semibold"
                >
                  <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
                  </svg>
                  Facebook
                </button>
              </div>

              <div className="relative flex items-center mb-8">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Hoặc đăng ký với Email</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              {/* Input Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Họ tên</label>
                  <input 
                    type="text"
                    name="fullName"
                    className="w-full px-4 py-3 rounded-md bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-gray-400"
                    placeholder="Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Email công việc</label>
                  <input 
                    type="email"
                    name="email"
                    className="w-full px-4 py-3 rounded-md bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-gray-400"
                    placeholder="ten@congty.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Mật khẩu</label>
                    <input 
                      type="password"
                      name="password"
                      className="w-full px-4 py-3 rounded-md bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-gray-400"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Xác nhận</label>
                    <input 
                      type="password"
                      name="confirmPassword"
                      className="w-full px-4 py-3 rounded-md bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-gray-400"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 py-2">
                <input 
                  type="checkbox"
                  id="terms"
                  name="agreeTerms"
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  required
                />
                <label htmlFor="terms" className="text-xs text-gray-600 leading-relaxed">
                  Tôi đồng ý với <a className="text-blue-600 font-bold hover:underline" href="#terms">Điều khoản Dịch vụ</a> và <a className="text-blue-600 font-bold hover:underline" href="#privacy">Chính sách Bảo mật</a> của Career Authority.
                </label>

                            {error && (
                              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                                {error}
                              </div>
                            )}
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-auth-gradient text-white font-headline font-bold rounded-md shadow-lg hover:shadow-xl transition-all active:scale-[0.98] mt-4 disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : 'Đăng ký tài khoản'}
              </button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-sm text-gray-600">
                Đã có tài khoản? 
                <button 
                  onClick={() => navigate('/login-seeker')}
                  className="text-blue-600 font-extrabold ml-1 hover:underline tracking-tight bg-none border-none cursor-pointer p-0"
                >
                  Đăng nhập ngay
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Component */}
      <footer className="flex flex-col md:flex-row justify-between items-center px-12 py-12 gap-8 bg-gray-50 font-body text-xs uppercase tracking-widest border-t">
        <div className="text-lg font-black text-on-surface">Career Authority</div>
        <div className="flex flex-wrap justify-center gap-6">
          <a className="text-gray-500 hover:underline transition-all opacity-80 hover:opacity-100" href="#privacy">Chính sách Bảo mật</a>
          <a className="text-gray-500 hover:underline transition-all opacity-80 hover:opacity-100" href="#terms">Điều khoản Dịch vụ</a>
          <a className="text-gray-500 hover:underline transition-all opacity-80 hover:opacity-100" href="#support">Hỗ trợ khách hàng</a>
          <a className="text-gray-500 hover:underline transition-all opacity-80 hover:opacity-100" href="#method">Phương pháp AI</a>
        </div>
        <div className="text-gray-500 normal-case text-center md:text-right">
          © 2024 The Predictive Career Authority. Bảo lưu mọi quyền.
        </div>
      </footer>
    </>
  );
};

export default RegisterSeeker;
