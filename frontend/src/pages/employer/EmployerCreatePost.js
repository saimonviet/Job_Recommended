import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EmployerSideNavBar from "../../components/EmployerSideNavBar";
import EmployerTopNavBar from "../../components/EmployerTopNavBar";

function EmployerCreatePost() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('employerToken');
    if (!token) {
      navigate('/employer/login');
    }
  }, [navigate]);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    jobTitle: "",
    level: "",
    jobType: "",
    salaryFrom: "",
    salaryTo: "",
    location: "",
    description: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <EmployerSideNavBar />

      <main className="ml-64 w-full">
        <EmployerTopNavBar />

        <div className="pt-24 pb-12 px-8 min-h-screen">
          <div className="max-w-7xl mx-auto">
            {/* Stepper */}
            <div className="flex items-center justify-between mb-12 max-w-3xl mx-auto">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      step <= currentStep
                        ? "bg-blue-600 text-white"
                        : "border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {step}
                  </div>
                  <span className={`text-xs font-bold ${step <= currentStep ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`}>
                    {step === 1 && "Thông tin chung"}
                    {step === 2 && "Mô tả công việc"}
                    {step === 3 && "Cài đặt bài đăng"}
                  </span>

                  {step < 3 && (
                    <div className={`flex-1 h-[2px] mx-4 -mt-6 ${step < currentStep ? "bg-blue-600 dark:bg-blue-400" : "bg-slate-300 dark:bg-slate-700"}`}></div>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-12 gap-8 items-start">
              {/* Form Section */}
              <div className="col-span-12 lg:col-span-7 space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {currentStep === 1 && "Bước 1: Thông tin chung"}
                      {currentStep === 2 && "Bước 2: Mô tả công việc"}
                      {currentStep === 3 && "Bước 3: Cài đặt bài đăng"}
                    </h3>
                  </div>

                  <form className="space-y-6">
                    {/* Step 1: General Info */}
                    {currentStep === 1 && (
                      <>
                        {/* Job Title */}
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Tên công việc</label>
                          <div className="relative group">
                            <input
                              type="text"
                              name="jobTitle"
                              value={formData.jobTitle}
                              onChange={handleChange}
                              placeholder="Ví dụ: Senior Product Designer"
                              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border-none focus:ring-2 focus:ring-blue-600/20 focus:bg-slate-50 dark:focus:bg-slate-600 rounded-lg transition-all outline-none text-slate-900 dark:text-white"
                            />
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:opacity-80" type="button">
                              <span className="material-symbols-outlined text-base">lightbulb</span>
                              Gợi ý
                            </button>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Gợi ý: "Senior UX/UI Designer" có lượt tìm kiếm cao hơn 40%</p>
                        </div>

                        {/* Level & Job Type */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Cấp bậc</label>
                            <select
                              name="level"
                              value={formData.level}
                              onChange={handleChange}
                              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border-none rounded-lg outline-none focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white"
                            >
                              <option>Chọn cấp bậc</option>
                              <option>Intern / Fresher</option>
                              <option>Junior</option>
                              <option>Middle</option>
                              <option>Senior</option>
                              <option>Lead / Manager</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Hình thức làm việc</label>
                            <select
                              name="jobType"
                              value={formData.jobType}
                              onChange={handleChange}
                              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border-none rounded-lg outline-none focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white"
                            >
                              <option>Chọn hình thức</option>
                              <option>Toàn thời gian</option>
                              <option>Bán thời gian</option>
                              <option>Freelance</option>
                              <option>Remote</option>
                            </select>
                          </div>
                        </div>

                        {/* Salary Range */}
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Mức lương (VND)</label>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400">Từ</span>
                              <input
                                type="number"
                                name="salaryFrom"
                                value={formData.salaryFrom}
                                onChange={handleChange}
                                placeholder="15.000.000"
                                className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-700 border-none rounded-lg outline-none focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white"
                              />
                            </div>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400">Đến</span>
                              <input
                                type="number"
                                name="salaryTo"
                                value={formData.salaryTo}
                                onChange={handleChange}
                                placeholder="25.000.000"
                                className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-700 border-none rounded-lg outline-none focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white"
                              />
                            </div>
                          </div>
                          <label className="flex items-center gap-2 mt-2 cursor-pointer">
                            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                            <span className="text-xs text-slate-600 dark:text-slate-400">Thỏa thuận</span>
                          </label>
                        </div>

                        {/* Location */}
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Địa điểm làm việc</label>
                          <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">location_on</span>
                            <input
                              type="text"
                              name="location"
                              value={formData.location}
                              onChange={handleChange}
                              placeholder="Ví dụ: Tòa nhà Bitexco, Quận 1, TP.HCM"
                              className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-700 border-none rounded-lg outline-none focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Step 2: Description */}
                    {currentStep === 2 && (
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Mô tả công việc</label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          placeholder="Nhập mô tả chi tiết về công việc..."
                          rows="10"
                          className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border-none rounded-lg outline-none focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
                        />
                      </div>
                    )}

                    {/* Step 3: Settings */}
                    {currentStep === 3 && (
                      <div className="space-y-6">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="text-sm text-blue-900 dark:text-blue-300">
                            <span className="font-bold">✓ Bài đăng sẵn sàng</span> - Tất cả thông tin đã hoàn tất. Nhấn "Xuất bản" để đăng bài.
                          </p>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-700 rounded-lg">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">Đăng trên hồ sơ công ty</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Tin tuyển dụng sẽ hiển thị công khai</p>
                          </div>
                          <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-slate-300 text-blue-600" />
                        </div>
                      </div>
                    )}
                  </form>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center">
                  <button
                    onClick={handlePrevStep}
                    className="px-6 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors rounded-lg"
                  >
                    {currentStep === 1 ? "Hủy bỏ" : "Quay lại"}
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="px-8 py-3 bg-gradient-to-br from-blue-600 to-blue-500 text-white text-sm font-bold rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    {currentStep === 3 ? (
                      <>
                        Xuất bản
                        <span className="material-symbols-outlined text-lg">publish</span>
                      </>
                    ) : (
                      <>
                        Tiếp tục
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Preview Section */}
              <div className="col-span-12 lg:col-span-5 sticky top-24">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-4">Xem trước</h4>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
                    <div>
                      <h5 className="font-bold text-base text-blue-600 dark:text-blue-400">{formData.jobTitle || "Tên công việc"}</h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">TechVantage Corp</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-full">
                        {formData.level || "Cấp bậc"}
                      </span>
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-full">
                        {formData.jobType || "Hình thức"}
                      </span>
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-full">
                        {formData.location || "Địa điểm"}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Mức lương:</p>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {formData.salaryFrom && formData.salaryTo 
                          ? `${formData.salaryFrom} - ${formData.salaryTo} VND` 
                          : "Chưa cập nhật"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default EmployerCreatePost;
