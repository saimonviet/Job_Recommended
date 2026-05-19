import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EmployerSideNavBar from "../../components/EmployerSideNavBar";
import EmployerTopNavBar from "../../components/EmployerTopNavBar";
import API from "../../services/api";
import { getEmployerToken } from "../../utils/authStorage";
import {
  PROVINCES_LIST,
  INDUSTRIES_LIST,
  EMPLOYMENT_TYPES,
  SALARY_RANGES
} from "../../constants/dropdownOptions";
import { formatExperienceRange, formatSalaryInputRange } from "../../utils/dataFormatter";
const TODAY = new Date();
const TODAY_DATE = new Date(TODAY.getTime() - TODAY.getTimezoneOffset() * 60000)
  .toISOString()
  .split("T")[0];

const EMPLOYER_PROFILE_CACHE_KEY_PREFIX = "employer_profile_cache";
const EMPLOYER_PROFILE_CACHE_DURATION = 10 * 60 * 1000;

const getEmployerProfileCacheKey = (token) => `${EMPLOYER_PROFILE_CACHE_KEY_PREFIX}:${token || "anonymous"}`;

const readEmployerProfileCache = (token) => {
  try {
    const raw = sessionStorage.getItem(getEmployerProfileCacheKey(token));
    if (!raw) return null;

    const cached = JSON.parse(raw);
    if (Date.now() - cached.timestamp > EMPLOYER_PROFILE_CACHE_DURATION) {
      sessionStorage.removeItem(getEmployerProfileCacheKey(token));
      return null;
    }

    return cached.data || null;
  } catch {
    return null;
  }
};

function EmployerCreatePost() {
  const navigate = useNavigate();
  const [employerName, setEmployerName] = useState("Nhà tuyển dụng");
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
    const [errors, setErrors] = useState({});

  // Fields map đúng với backend Job model
  const [formData, setFormData] = useState({
    job_title: "",
    exp_min: "",
    exp_max: "",
    employment_type: "",
    salary_min: "",
    salary_max: "",
    salary_currency: "VND",
    job_address: "",
    job_detail_address: "",
    deadline: "",
    industries: "",
    job_description: "",
    job_requirement: "",
    benefits: "",
  });

  useEffect(() => {
    const token = getEmployerToken();
    if (!token) {
      navigate("/login-employer");
      return;
    }

    let cancelled = false;

    const cachedProfile = readEmployerProfileCache(token);
    if (cachedProfile) {
      setEmployerName(cachedProfile.company_name || cachedProfile.username || "Nhà tuyển dụng");
      return () => { cancelled = true; };
    }

    const loadEmployerProfile = async () => {
      try {
        const response = await API.get("/auth/me");
        if (!cancelled && response.data) {
          setEmployerName(
            response.data.company_name || response.data.username || "Nhà tuyển dụng"
          );
          try {
            sessionStorage.setItem(
              getEmployerProfileCacheKey(token),
              JSON.stringify({ data: response.data, timestamp: Date.now() })
            );
          } catch {
            // ignore storage quota errors
          }
        }
      } catch {
        if (!cancelled) setEmployerName("Nhà tuyển dụng");
      }
    };

    loadEmployerProfile();
    return () => { cancelled = true; };
  }, [navigate]);

  // Tính toán mức lương thực tế
  const calcSalary = (val, currency) => {
    if (!val) return null;
    let salary = parseFloat(val);
    if (currency === "USD") {
      salary *= 26335;
    } else {
      // Nhân 1 triệu nếu số nhỏ
      if (salary < 1000) {
        salary *= 1_000_000;
      }
    }
    return salary;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
      // Clear error for this field when user starts typing
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
  };

  const handleNextStep = () => {
      // Validate Step 1
      if (currentStep === 1) {
        const newErrors = {};
        const expMinValue = parseInt(formData.exp_min, 10);
        const expMaxValue = parseInt(formData.exp_max, 10);
        if (!formData.job_title.trim()) newErrors.job_title = "Vui lòng nhập tên công việc";
        if (!formData.job_address.trim()) newErrors.job_address = "Vui lòng chọn tỉnh/thành phố";
        if (!formData.employment_type.trim()) newErrors.employment_type = "Vui lòng chọn hình thức làm việc";
        if (!formData.industries.trim()) newErrors.industries = "Vui lòng chọn ngành nghề";
        if (!formData.exp_min.trim()) newErrors.exp_min = "Vui lòng nhập kinh nghiệm tối thiểu";
        if (!formData.exp_max.trim()) newErrors.exp_max = "Vui lòng nhập kinh nghiệm tối đa";
        if (formData.exp_min.trim() && (Number.isNaN(expMinValue) || expMinValue < 0)) {
          newErrors.exp_min = "Kinh nghiệm tối thiểu phải lớn hơn hoặc bằng 0";
        }
        if (formData.exp_max.trim() && (Number.isNaN(expMaxValue) || expMaxValue < 0)) {
          newErrors.exp_max = "Kinh nghiệm tối đa phải lớn hơn hoặc bằng 0";
        }
        if (
          formData.exp_min.trim() &&
          formData.exp_max.trim() &&
          !Number.isNaN(expMinValue) &&
          !Number.isNaN(expMaxValue) &&
          expMaxValue < expMinValue
        ) {
          newErrors.exp_max = "Kinh nghiệm tối đa phải lớn hơn hoặc bằng kinh nghiệm tối thiểu";
        }
        if (!formData.deadline.trim()) newErrors.deadline = "Vui lòng chọn hạn nộp hồ sơ";
      
        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          return;
        }
        setErrors({});
      }
    
      // Validate Step 2
      if (currentStep === 2) {
        const newErrors = {};
        if (!formData.job_description.trim()) newErrors.job_description = "Vui lòng nhập mô tả công việc";
        if (!formData.job_requirement.trim()) newErrors.job_requirement = "Vui lòng nhập yêu cầu ứng viên";
        if (!formData.benefits.trim()) newErrors.benefits = "Vui lòng nhập quyền lợi";
      
        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          return;
        }
        setErrors({});
      }
    
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    else navigate("/employer/jobs");
  };

  const handleSubmit = async () => {
    if (!formData.job_title.trim()) {
      setSubmitError("Vui lòng nhập tên công việc.");
      setCurrentStep(1);
      return;
    }

    if (!formData.job_address.trim()) {
      setSubmitError("Vui lòng chọn tỉnh/thành phố.");
      setCurrentStep(1);
      return;
    }

    if (!formData.employment_type.trim()) {
      setSubmitError("Vui lòng chọn hình thức làm việc.");
      setCurrentStep(1);
      return;
    }

      // Validate all required fields
      const newErrors = {};
        const expMinValue = parseInt(formData.exp_min, 10);
        const expMaxValue = parseInt(formData.exp_max, 10);
      if (!formData.industries.trim()) newErrors.industries = "Vui lòng chọn ngành nghề";
      if (!formData.exp_min.trim()) newErrors.exp_min = "Vui lòng nhập kinh nghiệm tối thiểu";
      if (!formData.exp_max.trim()) newErrors.exp_max = "Vui lòng nhập kinh nghiệm tối đa";
        if (formData.exp_min.trim() && (Number.isNaN(expMinValue) || expMinValue < 0)) {
        newErrors.exp_min = "Kinh nghiệm tối thiểu phải lớn hơn hoặc bằng 0";
      }
        if (formData.exp_max.trim() && (Number.isNaN(expMaxValue) || expMaxValue < 0)) {
        newErrors.exp_max = "Kinh nghiệm tối đa phải lớn hơn hoặc bằng 0";
      }
      if (
        formData.exp_min.trim() &&
        formData.exp_max.trim() &&
          !Number.isNaN(expMinValue) &&
          !Number.isNaN(expMaxValue) &&
          expMaxValue < expMinValue
      ) {
        newErrors.exp_max = "Kinh nghiệm tối đa phải lớn hơn hoặc bằng kinh nghiệm tối thiểu";
      }
      if (!formData.deadline.trim()) newErrors.deadline = "Vui lòng chọn hạn nộp hồ sơ";
      if (!formData.job_description.trim()) newErrors.job_description = "Vui lòng nhập mô tả công việc";
      if (!formData.job_requirement.trim()) newErrors.job_requirement = "Vui lòng nhập yêu cầu ứng viên";
      if (!formData.benefits.trim()) newErrors.benefits = "Vui lòng nhập quyền lợi";
    
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setSubmitError("Vui lòng điền đầy đủ tất cả các trường bắt buộc.");
        return;
      }

    setSubmitting(true);
    setSubmitError("");

    try {
      // Build payload — chỉ gửi các field có giá trị
      const payload = {
        job_title: formData.job_title.trim(),
        employment_type: formData.employment_type || null,
        salary_min: calcSalary(formData.salary_min, formData.salary_currency),
        salary_max: calcSalary(formData.salary_max, formData.salary_currency),
        job_address: formData.job_address || null,
        job_detail_address: formData.job_detail_address || null,
        exp_min: formData.exp_min || null,
        exp_max: formData.exp_max || null,
        industries: formData.industries || null,
        job_description: formData.job_description || null,
        job_requirement: formData.job_requirement || null,
        benefits: formData.benefits || null,
        deadline: formData.deadline || null,
      };

      await API.post("/employer/jobs", payload);
      navigate("/employer/jobs");
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        "Đăng bài thất bại, vui lòng thử lại.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <EmployerSideNavBar />
      <EmployerTopNavBar />

      <main className="ml-64 w-full">

        <div className="pt-24 pb-12 px-8 min-h-screen">
          <div className="max-w-7xl mx-auto">
            {submitError && (
              <div className="mb-6 max-w-3xl mx-auto p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-400">
                {submitError}
              </div>
            )}

            <div className="grid grid-cols-12 gap-8 items-start">
              {/* Form Section */}
              <div className="col-span-12 lg:col-span-7 space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {currentStep === 1 && "Bước 1: Thông tin chung"}
                      {currentStep === 2 && "Bước 2: Mô tả công việc"}
                      {currentStep === 3 && "Bước 3: Xem trước & Đăng"}
                    </h3>
                  </div>

                  <div className="space-y-6">
                    {/* Step 1: General Info */}
                    {currentStep === 1 && (
                      <>
                        {/* Job Title */}
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Tên công việc <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="job_title"
                            value={formData.job_title}
                            onChange={handleChange}
                            placeholder="Ví dụ: Senior Product Designer"
                            className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border-none focus:ring-2 focus:ring-blue-600/20 rounded-lg outline-none text-slate-900 dark:text-white"
                          />
                            {errors.job_title && (
                              <p className="text-red-500 text-xs mt-1">{errors.job_title}</p>
                            )}
                        </div>

                        {/* Employment Type & Industries */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                              Hình thức làm việc <span className="text-red-500">*</span>
                            </label>
                            <select
                              name="employment_type"
                              value={formData.employment_type}
                              onChange={handleChange}
                              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border-none rounded-lg outline-none focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white"
                            >
                              <option value="">Chọn hình thức</option>
                              {EMPLOYMENT_TYPES.map((type) => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                              {errors.employment_type && (
                                <p className="text-red-500 text-xs mt-1">{errors.employment_type}</p>
                              )}
                          </div>

                          <div className="space-y-2">
                              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Ngành nghề <span className="text-red-500">*</span>
                              </label>
                            <select
                              name="industries"
                              value={formData.industries}
                              onChange={handleChange}
                              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border-none rounded-lg outline-none focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white"
                            >
                              <option value="">Chọn ngành nghề</option>
                              {INDUSTRIES_LIST.map((industry) => (
                                <option key={industry} value={industry}>{industry}</option>
                              ))}
                            </select>
                              {errors.industries && (
                                <p className="text-red-500 text-xs mt-1">{errors.industries}</p>
                              )}
                          </div>
                        </div>

                        {/* Experience */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Kinh nghiệm tối thiểu <span className="text-red-500">*</span>
                              </label>
                            <input
                              type="number"
                              name="exp_min"
                              value={formData.exp_min}
                              onChange={handleChange}
                              placeholder="Ví dụ: 1"
                              min="1"
                              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border-none rounded-lg outline-none focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white"
                            />
                              {errors.exp_min && (
                                <p className="text-red-500 text-xs mt-1">{errors.exp_min}</p>
                              )}
                          </div>
                          <div className="space-y-2">
                              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Kinh nghiệm tối đa <span className="text-red-500">*</span>
                              </label>
                            <input
                              type="number"
                              name="exp_max"
                              value={formData.exp_max}
                              onChange={handleChange}
                              placeholder="Ví dụ: 3"
                              min="1"
                              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border-none rounded-lg outline-none focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white"
                            />
                              {errors.exp_max && (
                                <p className="text-red-500 text-xs mt-1">{errors.exp_max}</p>
                              )}
                          </div>
                        </div>

                        {/* Salary Range */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                              Mức lương tối thiểu
                            </label>
                            <input
                              type="number"
                              name="salary_min"
                              value={formData.salary_min}
                              onChange={handleChange}
                              placeholder="Ví dụ: 20"
                              min="0"
                              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border-none rounded-lg outline-none focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                              Mức lương tối đa
                            </label>
                            <input
                              type="number"
                              name="salary_max"
                              value={formData.salary_max}
                              onChange={handleChange}
                              placeholder="Ví dụ: 50"
                              min="0"
                              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border-none rounded-lg outline-none focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                              Đơn vị tiền tệ
                            </label>
                            <select
                              name="salary_currency"
                              value={formData.salary_currency}
                              onChange={handleChange}
                              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border-none rounded-lg outline-none focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white"
                            >
                              <option value="VND">VND (Triệu)</option>
                              <option value="USD">USD</option>
                            </select>
                          </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Tỉnh/Thành phố <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="job_address"
                            value={formData.job_address}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border-none rounded-lg outline-none focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white"
                          >
                            <option value="">Chọn tỉnh/thành phố</option>
                            {PROVINCES_LIST.map((province) => (
                              <option key={province} value={province}>{province}</option>
                            ))}
                          </select>
                            {errors.job_address && (
                              <p className="text-red-500 text-xs mt-1">{errors.job_address}</p>
                            )}
                        </div>

                        {/* Detail Address */}
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Địa chỉ chi tiết
                          </label>
                          <input
                            type="text"
                            name="job_detail_address"
                            value={formData.job_detail_address}
                            onChange={handleChange}
                            placeholder="Ví dụ: Tầng 10, Tòa nhà Bitexco, Quận 1"
                            className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border-none rounded-lg outline-none focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white"
                          />
                        </div>

                        {/* Deadline */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                              Hạn nộp hồ sơ <span className="text-red-500">*</span>
                            </label>
                          <input
                            type="date"
                            name="deadline"
                            value={formData.deadline}
                            onChange={handleChange}
                            min={TODAY_DATE}
                            className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border-none rounded-lg outline-none focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white"
                          />
                            {errors.deadline && (
                              <p className="text-red-500 text-xs mt-1">{errors.deadline}</p>
                            )}
                        </div>
                      </>
                    )}

                    {/* Step 2: Description & Requirements */}
                    {currentStep === 2 && (
                      <>
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                              Mô tả công việc <span className="text-red-500">*</span>
                            </label>
                          <textarea
                            name="job_description"
                            value={formData.job_description}
                            onChange={handleChange}
                            placeholder="Nhập mô tả chi tiết về công việc, nhiệm vụ, trách nhiệm..."
                            rows="8"
                            className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border-none rounded-lg outline-none focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white placeholder:text-slate-500"
                          />
                            {errors.job_description && (
                              <p className="text-red-500 text-xs mt-1">{errors.job_description}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                              Yêu cầu ứng viên <span className="text-red-500">*</span>
                            </label>
                          <textarea
                            name="job_requirement"
                            value={formData.job_requirement}
                            onChange={handleChange}
                            placeholder="Trình độ học vấn, kỹ năng, kinh nghiệm yêu cầu..."
                            rows="6"
                            className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border-none rounded-lg outline-none focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white placeholder:text-slate-500"
                          />
                            {errors.job_requirement && (
                              <p className="text-red-500 text-xs mt-1">{errors.job_requirement}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                              Quyền lợi <span className="text-red-500">*</span>
                            </label>
                          <textarea
                            name="benefits"
                            value={formData.benefits}
                            onChange={handleChange}
                            placeholder="Bảo hiểm, thưởng, du lịch, môi trường làm việc..."
                            rows="4"
                            className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border-none rounded-lg outline-none focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-white placeholder:text-slate-500"
                          />
                            {errors.benefits && (
                              <p className="text-red-500 text-xs mt-1">{errors.benefits}</p>
                            )}
                        </div>
                      </>
                    )}

                    {/* Step 3: Preview & Publish */}
                    {currentStep === 3 && (
                      <div className="space-y-6">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="text-sm text-blue-900 dark:text-blue-300">
                            <span className="font-bold">✓ Kiểm tra lại thông tin</span> — Xem lại bài đăng trước khi xuất bản.
                          </p>
                        </div>

                        {/* Summary */}
                        <div className="space-y-3 text-sm">
                          {[
                            { label: "Tên công việc", value: formData.job_title },
                            { label: "Hình thức", value: formData.employment_type },
                            { label: "Tỉnh/Thành phố", value: formData.job_address },
                            { label: "Địa chỉ chi tiết", value: formData.job_detail_address },
                            { label: "Ngành nghề", value: formData.industries },
                            {
                              label: "Mức lương",
                              value:
                                formData.salary_min || formData.salary_max
                                  ? formatSalaryInputRange(formData.salary_min, formData.salary_max, formData.salary_currency)
                                  : "",
                            },
                            {
                              label: "Kinh nghiệm",
                              value:
                                formData.exp_min || formData.exp_max
                                  ? formatExperienceRange(formData.exp_min, formData.exp_max)
                                  : "",
                            },
                            { label: "Hạn nộp", value: formData.deadline },
                          ].map(({ label, value }) =>
                            value ? (
                              <div key={label} className="flex gap-4 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                <span className="text-slate-500 dark:text-slate-400 w-32 shrink-0">{label}:</span>
                                <span className="font-semibold text-slate-900 dark:text-white">{value}</span>
                              </div>
                            ) : null
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center">
                  <button
                    onClick={handlePrevStep}
                    disabled={submitting}
                    className="px-6 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors rounded-lg disabled:opacity-50"
                  >
                    {currentStep === 1 ? "Hủy bỏ" : "Quay lại"}
                  </button>
                  <button
                    onClick={currentStep === 3 ? handleSubmit : handleNextStep}
                    disabled={submitting}
                    className="px-8 py-3 bg-gradient-to-br from-blue-600 to-blue-500 text-white text-sm font-bold rounded-lg hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>
                        Đang đăng...
                      </>
                    ) : currentStep === 3 ? (
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

              {/* Live Preview */}
              <div className="col-span-12 lg:col-span-5 sticky top-24">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-4">Xem trước</h4>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
                    <div>
                      <h5 className="font-bold text-base text-blue-600 dark:text-blue-400">
                        {formData.job_title || "Tên công việc"}
                      </h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{employerName}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-full">
                        {formData.employment_type || "Hình thức"}
                      </span>
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-full">
                        {formData.job_address || "Địa điểm"}
                      </span>
                      {formData.industries && (
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-full">
                          {formData.industries}
                        </span>
                      )}
                      {formData.exp_min && (
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-full">
                          {formatExperienceRange(formData.exp_min, formData.exp_max)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Mức lương:</p>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {formData.salary_min || formData.salary_max
                          ? formatSalaryInputRange(formData.salary_min, formData.salary_max, formData.salary_currency)
                          : "Thỏa thuận"}
                      </p>
                    </div>
                    {formData.deadline && (
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Hạn nộp:</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {new Date(formData.deadline).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                    )}
                    {formData.job_description && (
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Mô tả:</p>
                        <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-4">
                          {formData.job_description}
                        </p>
                      </div>
                    )}
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