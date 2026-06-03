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

      <div className="min-h-screen bg-surface text-on-surface">
        <header className="sticky top-0 z-50 bg-slate-50/80 backdrop-blur-xl shadow-sm">
          <nav className="flex justify-between items-center w-full px-6 py-3 max-w-screen-2xl mx-auto">
            <button
              onClick={() => navigate('/')}
              className="text-2xl font-bold text-orange-600 font-headline tracking-tight cursor-pointer bg-transparent border-none p-0"
            >
              Career Authority
            </button>

            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => navigate('/')}
                className="hidden sm:inline-flex text-slate-600 hover:text-orange-600 transition-colors font-medium bg-transparent border-none p-0"
              >
                Dành cho Người tìm việc
              </button>
              <button
                onClick={() => navigate('/login-employer')}
                className="text-on-surface-variant font-medium px-4 py-2 hover:bg-surface-container-high rounded-lg transition-all"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => navigate('/register-employer')}
                className="bg-orange-600 text-white px-5 py-2.5 rounded-md font-semibold text-sm hover:bg-orange-700 transition-all shadow-sm"
              >
                Đăng ký ngay
              </button>
            </div>
          </nav>
        </header>

        <main className="px-6 py-20 lg:py-28">
          <section className="max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-14 items-center">
            <div>
              <span className="inline-flex px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-widest mb-6">
                Kỷ nguyên Tuyển dụng Mới
              </span>
              <h1 className="text-5xl lg:text-7xl font-extrabold leading-[1.08] mb-8 tracking-tight">
                Đề xuất ứng viên phù hợp cho <span className="text-orange-600 italic">từng việc làm.</span>
              </h1>
              <p className="text-lg text-on-surface-variant max-w-xl mb-10 leading-relaxed">
                Sử dụng trí tuệ nhân tạo để phân tích tin tuyển dụng và đề xuất những ứng viên phù hợp nhất cho từng vị trí của doanh nghiệp bạn.
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate('/login-employer')}
                  className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-8 py-4 rounded-md font-bold text-lg hover:shadow-lg transition-all active:scale-95"
                >
                  Bắt đầu miễn phí
                </button>
                <button
                  onClick={() => navigate('/register-employer')}
                  className="bg-surface-container-high text-on-surface-variant px-8 py-4 rounded-md font-bold text-lg hover:bg-surface-container-highest transition-all"
                >
                  Đăng ký ngay
                </button>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-2xl border border-outline-variant/10">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-orange-600">person_search</span>
                  <span className="font-bold text-sm">Đề xuất ứng viên theo việc làm</span>
                </div>
                <span className="text-xs bg-surface-container text-on-surface-variant px-2 py-1 rounded">
                  Cập nhật 2 phút trước
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-surface-container-low p-5 rounded-lg">
                  <p className="text-xs text-on-surface-variant mb-2">Độ phù hợp</p>
                  <p className="text-3xl font-extrabold text-orange-600 tracking-tight">98.4%</p>
                </div>
                <div className="bg-surface-container-low p-5 rounded-lg">
                  <p className="text-xs text-on-surface-variant mb-2">Rút ngắn tuyển dụng</p>
                  <p className="text-3xl font-extrabold text-orange-600 tracking-tight">42%</p>
                </div>
                <div className="bg-surface-container-low p-5 rounded-lg">
                  <p className="text-xs text-on-surface-variant mb-2">Ứng viên đề xuất</p>
                  <p className="text-3xl font-extrabold text-orange-600 tracking-tight">500+</p>
                </div>
              </div>

              <div className="mt-6 rounded-lg bg-orange-50 border border-orange-100 p-4">
                <p className="text-sm font-semibold text-orange-700 mb-1">Đề xuất nhanh</p>
                <p className="text-sm text-slate-600">
                  Đăng tin tuyển dụng để hệ thống đề xuất ứng viên phù hợp ngay trong bảng điều khiển nhà tuyển dụng.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default EmployerHome;
