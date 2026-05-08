import React from 'react';
import { useNavigate } from 'react-router-dom';
import GuestTopNavBar from '../../components/GuestTopNavBar';

const SeekerCompany = () => {
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

      <div className=" text-on-surface min-h-screen flex flex-col">
        {/* TopNavBar */}
        <GuestTopNavBar currentPage="companies" />

        <main className="mt-24 flex-grow container mx-auto px-6 max-w-7xl">
          {/* Hero Search Section */}
          <section className="mb-12">
            <div className="bg-surface-container-low rounded-xl p-8 md:p-12 text-center relative overflow-hidden">
              <div className="relative z-10">
                <h1 className="text-4xl md:text-5xl font-extrabold font-headline tracking-tight text-on-surface mb-4">Khám phá các tổ chức hàng đầu</h1>
                <p className="text-on-surface-variant max-w-2xl mx-auto mb-8 font-body">Tìm kiếm và kết nối với những công ty đang kiến tạo tương lai sự nghiệp của bạn.</p>
                <div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-3 p-2 bg-surface-container-lowest rounded-xl shadow-sm">
                  <div className="flex-grow flex items-center px-4 gap-3 bg-surface-container-low rounded-lg">
                    <span className="material-symbols-outlined text-outline">search</span>
                    <input className="w-full bg-transparent border-none focus:ring-0 py-3 text-on-surface placeholder:text-outline" placeholder="Tên công ty, từ khóa kỹ năng..." type="text"/>
                  </div>
                  <div className="flex items-center px-4 gap-3 bg-surface-container-low rounded-lg md:w-1/3">
                    <span className="material-symbols-outlined text-outline">location_on</span>
                    <input className="w-full bg-transparent border-none focus:ring-0 py-3 text-on-surface placeholder:text-outline" placeholder="Địa điểm" type="text"/>
                  </div>
                  <button className="bg-primary text-on-primary px-8 py-3 rounded-lg font-bold font-headline hover:bg-primary-container transition-all">Tìm kiếm</button>
                </div>
              </div>
              {/* Decorative element */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            </div>
          </section>

          <div className="flex flex-col lg:flex-row gap-8 pb-20">
            {/* Left Filters */}
            <aside className="w-full lg:w-72 flex-shrink-0">
              <div className="sticky top-28 space-y-8">
                <div>
                  <h3 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">filter_list</span> Bộ lọc tìm kiếm
                  </h3>
                  <div className="space-y-6">
                    {/* Category Filter */}
                    <div>
                      <label className="block text-sm font-semibold text-on-surface-variant mb-3 uppercase tracking-wider font-label">Ngành nghề</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20 bg-surface-container" type="checkbox"/>
                          <span className="text-on-surface-variant group-hover:text-primary transition-colors font-body">Công nghệ thông tin</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input checked="" className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20 bg-surface-container" type="checkbox"/>
                          <span className="text-on-surface group-hover:text-primary transition-colors font-body">Tài chính &amp; Ngân hàng</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20 bg-surface-container" type="checkbox"/>
                          <span className="text-on-surface-variant group-hover:text-primary transition-colors font-body">Marketing &amp; Creative</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20 bg-surface-container" type="checkbox"/>
                          <span className="text-on-surface-variant group-hover:text-primary transition-colors font-body">Sản xuất &amp; Công nghiệp</span>
                        </label>
                      </div>
                    </div>
                    {/* Scale Filter */}
                    <div>
                      <label className="block text-sm font-semibold text-on-surface-variant mb-3 uppercase tracking-wider font-label">Quy mô công ty</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button className="py-2 px-3 rounded-md bg-primary text-on-primary text-xs font-semibold text-center">100 - 500</button>
                        <button className="py-2 px-3 rounded-md bg-surface-container-high text-on-surface-variant text-xs font-semibold text-center hover:bg-surface-container-highest transition-all">500 - 1000</button>
                        <button className="py-2 px-3 rounded-md bg-surface-container-high text-on-surface-variant text-xs font-semibold text-center hover:bg-surface-container-highest transition-all">1000 - 5000</button>
                        <button className="py-2 px-3 rounded-md bg-surface-container-high text-on-surface-variant text-xs font-semibold text-center hover:bg-surface-container-highest transition-all">5000+</button>
                      </div>
                    </div>
                    {/* Location Filter */}
                    <div>
                      <label className="block text-sm font-semibold text-on-surface-variant mb-3 uppercase tracking-wider font-label">Địa điểm phổ biến</label>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 rounded-full bg-surface-container-high text-xs font-medium cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors">TP. Hồ Chí Minh</span>
                        <span className="px-3 py-1 rounded-full bg-surface-container-high text-xs font-medium cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors">Hà Nội</span>
                        <span className="px-3 py-1 rounded-full bg-surface-container-high text-xs font-medium cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors">Đà Nẵng</span>
                        <span className="px-3 py-1 rounded-full bg-surface-container-high text-xs font-medium cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors">Singapore</span>
                      </div>
                    </div>
                  </div>
                  <button className="w-full mt-8 py-3 rounded-lg border border-outline-variant/30 text-on-surface-variant text-sm font-semibold hover:bg-surface-container transition-all">Xóa tất cả bộ lọc</button>
                </div>
              </div>
            </aside>

            {/* Company List Grid */}
            <div className="flex-grow">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-headline text-xl font-bold">248 Kết quả tìm thấy</h2>
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <span>Sắp xếp theo:</span>
                  <select className="bg-transparent border-none font-bold text-primary focus:ring-0 py-0 pr-8 cursor-pointer">
                    <option>Nổi bật nhất</option>
                    <option>Mới nhất</option>
                    <option>Nhiều việc làm nhất</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                {/* Company Card 1 */}
                <div className="bg-surface-container-lowest rounded-xl p-6 flex flex-col hover:shadow-[0_20px_40px_rgba(25,28,33,0.06)] transition-all group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-16 h-16 rounded-xl bg-surface-container p-2 flex items-center justify-center">
                      <img alt="TechFlow Logo" className="w-full h-full object-contain" data-alt="A clean, minimalist company logo featuring geometric shapes in shades of professional blue and grey, set against a pristine white background." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCke3RdYuNbtwQKKfy8z0BhdX79xxasIGLlPerz1Duzig-WKkWrKe41wcWcCa4p3EnG0W01YYdFR0q1lZmBRpaFzj3qQB1vIQRpH4fRxV_aT4JU5Xi1U-dzaUr-PWDtCr2HsTz_5rpGAtPGUI3yrbp7ZjIoVHqsH828GqnshAw40kec3gZZRHQn1Bu8ejkLYrm9MtQRGjDcuqYfxhdm8tGY_co2LkX5uQ25qo3GAJ7JQu1ML01gL__VlQ1xN3dVEIS78dw8-gUJs1hi"/>
                    </div>
                    <span className="px-3 py-1 bg-tertiary text-on-primary text-[10px] font-bold rounded-full uppercase tracking-widest">Đề xuất</span>
                  </div>
                  <div className="mb-6">
                    <h3 className="font-headline font-bold text-xl text-on-surface mb-1 group-hover:text-primary transition-colors">TechFlow Systems</h3>
                    <p className="text-on-surface-variant text-sm font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">domain</span> Phần mềm &amp; Dịch vụ IT
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-on-surface-variant mb-8">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">location_on</span>
                      <span>TP. Hồ Chí Minh</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">groups</span>
                      <span>150 - 300 nhân viên</span>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-outline-variant/10">
                    <div className="text-primary font-bold text-sm">12 Việc làm đang tuyển</div>
                    <button className="px-4 py-2 rounded-md bg-surface-container-high text-primary font-bold text-xs hover:bg-primary hover:text-on-primary transition-all">Xem chi tiết</button>
                  </div>
                </div>
                {/* Company Card 2 */}
                <div className="bg-surface-container-lowest rounded-xl p-6 flex flex-col hover:shadow-[0_20px_40px_rgba(25,28,33,0.06)] transition-all group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-16 h-16 rounded-xl bg-surface-container p-2 flex items-center justify-center">
                      <img alt="Vantage Logo" className="w-full h-full object-contain" data-alt="A sophisticated corporate logo for a financial firm, using dark navy and metallic gold accents." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjkdhkxow0Cun7ZmuZ6f8m9a7r7y1H9a2e3-BZn871DbdHnSH1zBVmKGLsS8odZ-CYbrOkb0BP01R9Izq3e4R4zMQYkYRGhxel1X3-QKWhGk3IVe9xX35upzHl-HVmvpItI2ckqSs9EVOXB5bDSIJCNQ97Lf1RUErDPH0QTjoJUsL1lFsbIFjMSPI33Ry58v7W-JM_uln91Ckp7DuFylhIPAnmXWidEI0EbonszemSxfcFgS6SSb4Y_wnUBO1iRI2EsOm03uITO4Cu"/>
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-container text-outline">
                      <span className="material-symbols-outlined text-[18px]">bookmark</span>
                    </div>
                  </div>
                  <div className="mb-6">
                    <h3 className="font-headline font-bold text-xl text-on-surface mb-1 group-hover:text-primary transition-colors">Vantage Financial Group</h3>
                    <p className="text-on-surface-variant text-sm font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">account_balance</span> Tài chính &amp; Đầu tư
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-on-surface-variant mb-8">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">location_on</span>
                      <span>Hà Nội</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">groups</span>
                      <span>500+ nhân viên</span>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-outline-variant/10">
                    <div className="text-primary font-bold text-sm">8 Việc làm đang tuyển</div>
                    <button className="px-4 py-2 rounded-md bg-surface-container-high text-primary font-bold text-xs hover:bg-primary hover:text-on-primary transition-all">Xem chi tiết</button>
                  </div>
                </div>
                {/* Company Card 3 */}
                <div className="bg-surface-container-lowest rounded-xl p-6 flex flex-col hover:shadow-[0_20px_40px_rgba(25,28,33,0.06)] transition-all group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-16 h-16 rounded-xl bg-surface-container p-2 flex items-center justify-center">
                      <img alt="Nexus Logo" className="w-full h-full object-contain" data-alt="A tech-forward startup logo with vibrant blue gradients." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUq1YFotBSG-1dtwob6iLM4r_MfXduDl4P5xQLU0Iwtwg7xvQppKJ8-nSz-4tKKD9qlzt6DWYNm3y1Yk6SCyD9Y2tjsd6nwdonvApghtOpR3zjSef0qrdzDnIr5vp4CqzNrEk6cZz_9Cda1F3iTvL0R8I1kGcL-y-HuG3RnxH743dObILd-HFLftj2mj5tJh3pxZgv0-F9vPoYVSFBUzWV2L_WMgGK4IRfCvTKTQhV32ncvd42XvnC2cn7TgwWBcUmWgkH14nZhci3"/>
                    </div>
                  </div>
                  <div className="mb-6">
                    <h3 className="font-headline font-bold text-xl text-on-surface mb-1 group-hover:text-primary transition-colors">Nexus Creative Agency</h3>
                    <p className="text-on-surface-variant text-sm font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">palette</span> Truyền thông &amp; Quảng cáo
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-on-surface-variant mb-8">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">location_on</span>
                      <span>Đà Nẵng</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">groups</span>
                      <span>50 - 100 nhân viên</span>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-outline-variant/10">
                    <div className="text-primary font-bold text-sm">5 Việc làm đang tuyển</div>
                    <button className="px-4 py-2 rounded-md bg-surface-container-high text-primary font-bold text-xs hover:bg-primary hover:text-on-primary transition-all">Xem chi tiết</button>
                  </div>
                </div>
                {/* Company Card 4 */}
                <div className="bg-surface-container-lowest rounded-xl p-6 flex flex-col hover:shadow-[0_20px_40px_rgba(25,28,33,0.06)] transition-all group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-16 h-16 rounded-xl bg-surface-container p-2 flex items-center justify-center">
                      <img alt="Logistics Logo" className="w-full h-full object-contain" data-alt="A bold industrial logo featuring strong, clean lines representing movement." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDQHU6F4VXhR3qKaGiqU5b_cPSjQ3253iEVZulkif-GWWgbRY6YClVYcjEVfTJ5Lava1fZFQHVvhfZOzO4poDkDFdDNltA4UGINZ4vPxNpNfiQoqvFF3ONylymeDxEF1-Acj15pPYGsmqdqODFN-NXufz7WMW85lGaM29VHBzmZWah-fu4oIxuXNPr_3NCRhuIcQ9hllFPydwJBQAn3gD2kWdRU7u5Gl8_J8vcZ8HAa8l_3sgXsg13F0lkUM-dl_NisDmgYFmixqvI"/>
                    </div>
                  </div>
                  <div className="mb-6">
                    <h3 className="font-headline font-bold text-xl text-on-surface mb-1 group-hover:text-primary transition-colors">Global Logistics Solutions</h3>
                    <p className="text-on-surface-variant text-sm font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">local_shipping</span> Vận tải &amp; Kho vận
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-on-surface-variant mb-8">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">location_on</span>
                      <span>Bình Dương</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">groups</span>
                      <span>1000+ nhân viên</span>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-outline-variant/10">
                    <div className="text-primary font-bold text-sm">24 Việc làm đang tuyển</div>
                    <button className="px-4 py-2 rounded-md bg-surface-container-high text-primary font-bold text-xs hover:bg-primary hover:text-on-primary transition-all">Xem chi tiết</button>
                  </div>
                </div>
              </div>
              {/* Pagination */}
              <div className="mt-12 flex justify-center items-center gap-2">
                <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-primary hover:text-on-primary transition-all">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-on-primary font-bold">1</button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-primary hover:text-on-primary transition-all">2</button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-primary hover:text-on-primary transition-all">3</button>
                <span className="px-2">...</span>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-primary hover:text-on-primary transition-all">10</button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-primary hover:text-on-primary transition-all">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default SeekerCompany;