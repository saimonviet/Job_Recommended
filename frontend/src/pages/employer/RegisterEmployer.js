import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';

const RegisterEmployer = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
    address: '',
    companySize: '',
    contactName: '',
    contactPhone: '',
    agreeTerms: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.agreeTerms) {
      setError('Vui lòng đồng ý với Điều khoản Dịch vụ');
      setLoading(false);
      return;
    }

    try {
      const response = await API.post('/auth/employer/register', {
        username: formData.companyName,
        email: formData.email,
        password: formData.password,
        company_name: formData.companyName,
        company_address: formData.address,
        company_size: formData.companySize,
        contact_name: formData.contactName,
        contact_phone: formData.contactPhone,
      });

      if (response.data.token) {
        const user = {
          ...response.data.user,
          token: response.data.token,
          access_token: response.data.token,
        };
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', response.data.token);
        alert('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.');
        navigate('/employer/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng ký thất bại. Vui lòng thử lại.');
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
        select {
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          background-size: 1em;
        }
      `}</style>

      <div className="bg-surface-container text-on-surface min-h-screen flex items-center justify-center p-4">
        <button 
          onClick={() => navigate('/employer')}
          className="fixed top-4 left-4 p-2 hover:bg-surface-container rounded-full transition-colors z-50"
          title="Quay lại"
        >
          <span className="material-symbols-outlined text-on-surface text-lg">arrow_back</span>
        </button>

        <div className="w-full max-w-6xl bg-surface-container-lowest rounded-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Branding/Value Proposition Section */}
            <div className="lg:col-span-5 hidden lg:block bg-surface-container-low p-12 space-y-8">
              <div className="space-y-4">
                <span className="text-tertiary font-headline font-bold tracking-wider uppercase text-xs">AI-Powered Recruitment</span>
                <h1 className="text-5xl font-extrabold text-primary leading-tight tracking-tighter">Xây dựng đội ngũ tương lai.</h1>
                <p className="text-on-surface-variant text-lg leading-relaxed">Kết nối với những ứng viên xuất sắc nhất thông qua hệ thống dự đoán và phân tích dữ liệu chuyên sâu của chúng tôi.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="bg-surface-container-lowest p-6 rounded-xl space-y-3 shadow-sm border border-outline-variant/10">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">rocket_launch</span>
                    <span className="font-headline font-bold text-primary">Tuyển dụng nhanh hơn 60%</span>
                  </div>
                  <p className="text-sm text-on-surface-variant">Quy trình sàng lọc AI giúp bạn tiếp cận ứng viên phù hợp ngay lập tức.</p>
                </div>
                <div className="bg-surface-container-lowest p-6 rounded-xl space-y-3 shadow-sm border border-outline-variant/10">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">query_stats</span>
                    <span className="font-headline font-bold text-primary">Phân tích dự đoán</span>
                  </div>
                  <p className="text-sm text-on-surface-variant">Dự báo nhu cầu nhân sự và biến động thị trường trong ngành của bạn.</p>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden h-64 shadow-xl">
                <img 
                  alt="Modern office collaborative environment" 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDq9YHiTdb4LZtiVwl4NL1qvOepGGX1UXOWdctY5OHLXLzeqbv0IpERM_PVKiwv1vuFPtNEo_HGSRuNHe1MDNavWUuwTn_FqXTZNGrMN5ASGuRmBN6p07mGj5tdPrR1H8zEdFdaAExwIU7FPsZCx_T7d3GV8yTE4Uep7eABuuRb1Gi7V5aTyczi_v_QuLFVERmtGxgF2UcwrPz8hyxG_WTm94FC7lZseqfP9G3I-lkJ8rN7d9DPSucwoZHuvIPVbxGVXAyup_AN5q_E"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent"></div>
              </div>
            </div>

            {/* Registration Form Card */}
            <div className="lg:col-span-7 p-8 md:p-12">
              <div className="max-w-2xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div 
                    className="text-2xl font-extrabold text-primary font-headline tracking-tight cursor-pointer hover:opacity-80 transition-all"
                    onClick={() => navigate('/employer')}
                  >
                    Career Authority
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 font-label text-xs">Đã có tài khoản?</span>
                    <button 
                      onClick={() => navigate('/login-employer')}
                      className="text-primary font-bold font-headline text-sm hover:underline bg-none border-none cursor-pointer p-0"
                    >
                      Đăng nhập
                    </button>
                  </div>
                </div>

                <div className="text-center lg:text-left">
                  <h2 className="text-3xl font-extrabold text-on-surface font-headline tracking-tight mb-4">Tạo tài khoản Nhà tuyển dụng</h2>
                  <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg mb-4">
                    <span className="material-symbols-outlined text-primary text-lg">business</span>
                    <p className="text-primary font-headline font-bold text-base">Bắt đầu tuyển dụng thông minh</p>
                  </div>
                  <p className="text-on-surface-variant">Vui lòng cung cấp thông tin doanh nghiệp để bắt đầu.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-md text-sm">
                      {error}
                    </div>
                  )}
                  
                  {/* Login Information */}
                  <div className="space-y-5">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-outline-variant/30 pb-2">1. Thông tin đăng nhập</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Email doanh nghiệp</label>
                        <input 
                          type="email"
                          name="email"
                          className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-300 rounded-md py-3 px-4 text-sm disabled:opacity-50"
                          placeholder="name@company.com"
                          value={formData.email}
                          onChange={handleChange}
                          disabled={loading}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Mật khẩu</label>
                        <input 
                          type="password"
                          name="password"
                          className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-300 rounded-md py-3 px-4 text-sm disabled:opacity-50"
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={handleChange}
                          disabled={loading}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Business Information */}
                  <div className="space-y-5">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-outline-variant/30 pb-2">2. Thông tin doanh nghiệp</h3>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Tên công ty</label>
                      <input 
                        type="text"
                        name="companyName"
                        className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-300 rounded-md py-3 px-4 text-sm disabled:opacity-50"
                        placeholder="Ví dụ: Công ty Cổ phần Công nghệ Toàn cầu"
                        value={formData.companyName}
                        onChange={handleChange}
                        disabled={loading}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Địa chỉ công ty</label>
                        <input 
                          type="text"
                          name="address"
                          className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-300 rounded-md py-3 px-4 text-sm disabled:opacity-50"
                          placeholder="Số nhà, tên đường, Quận/Huyện, Tỉnh/TP"
                          value={formData.address}
                          onChange={handleChange}
                          disabled={loading}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Quy mô nhân viên</label>
                        <select 
                          name="companySize"
                          className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-300 rounded-md py-3 px-4 text-sm disabled:opacity-50"
                          value={formData.companySize}
                          onChange={handleChange}
                          disabled={loading}
                          required
                        >
                          <option value="">Chọn quy mô</option>
                          <option value="1-10">1 - 10 nhân viên</option>
                          <option value="11-50">11 - 50 nhân viên</option>
                          <option value="51-200">51 - 200 nhân viên</option>
                          <option value="201-500">201 - 500 nhân viên</option>
                          <option value="500+">Trên 500 nhân viên</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-5">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-outline-variant/30 pb-2">3. Người liên hệ</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Họ và tên</label>
                        <input 
                          type="text"
                          name="contactName"
                          className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-300 rounded-md py-3 px-4 text-sm disabled:opacity-50"
                          placeholder="Ví dụ: Nguyễn Văn A"
                          value={formData.contactName}
                          onChange={handleChange}
                          disabled={loading}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Số điện thoại liên hệ</label>
                        <input 
                          type="tel"
                          name="contactPhone"
                          className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-300 rounded-md py-3 px-4 text-sm disabled:opacity-50"
                          placeholder="Ví dụ: 0901234567"
                          value={formData.contactPhone}
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
                      className="mt-1 rounded border-outline-variant text-primary focus:ring-primary disabled:opacity-50"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                    <label htmlFor="terms" className="text-xs text-on-surface-variant leading-relaxed">
                      Tôi đồng ý với <a className="text-primary hover:underline font-semibold cursor-pointer">Điều khoản Dịch vụ</a> và <a className="text-primary hover:underline font-semibold cursor-pointer">Chính sách Bảo mật</a> của Career Authority.
                    </label>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-bold rounded-md shadow-md hover:shadow-lg hover:opacity-90 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? 'ĐANG ĐĂNG KÝ...' : 'Đăng ký tài khoản doanh nghiệp'}
                  </button>
                </form>

                <div className="text-center pt-4 border-t border-outline-variant/10">
                  <p className="text-xs text-on-surface-variant">
                    © 2024 The Predictive Career Authority. Tất cả các quyền được bảo lưu.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterEmployer;
