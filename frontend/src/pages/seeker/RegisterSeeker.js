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
      const response = await fetch('http://127.0.0.1:5000/auth/seeker/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.fullName,
          email: formData.email,
          password: formData.password,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = data.error || data.message || (Array.isArray(data.errors) && data.errors[0]) || 'Đăng ký thất bại!';
        console.error('Register failed:', data);
        setError(errMsg);
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
        <button 
          onClick={() => navigate('/')}
          className="fixed top-4 left-4 p-2 hover:bg-surface-container rounded-full transition-colors z-50"
          title="Quay lại"
        >
          <span className="material-symbols-outlined text-on-surface text-lg">arrow_back</span>
        </button>

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
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}


       

              {/* Input Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Họ tên</label>
                  <input 
                    type="text"
                    name="fullName"
                    className="w-full px-4 py-3 rounded-md bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-gray-400 disabled:opacity-50"
                    placeholder="Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Email công việc</label>
                  <input 
                    type="email"
                    name="email"
                    className="w-full px-4 py-3 rounded-md bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-gray-400 disabled:opacity-50"
                    placeholder="email@gmail.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Mật khẩu</label>
                    <input 
                      type="password"
                      name="password"
                      className="w-full px-4 py-3 rounded-md bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-gray-400 disabled:opacity-50"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Xác nhận</label>
                    <input 
                      type="password"
                      name="confirmPassword"
                      className="w-full px-4 py-3 rounded-md bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-gray-400 disabled:opacity-50"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={loading}
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
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
                <label htmlFor="terms" className="text-xs text-gray-600 leading-relaxed">
                  Tôi đồng ý với <a className="text-blue-600 font-bold hover:underline" href="#terms">Điều khoản Dịch vụ</a> và <a className="text-blue-600 font-bold hover:underline" href="#privacy">Chính sách Bảo mật</a> của Career Authority.
                </label>
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

   
    </>
  );
};

export default RegisterSeeker;
