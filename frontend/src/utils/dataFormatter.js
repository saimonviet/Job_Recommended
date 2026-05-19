/**
 * Data Formatter Utils
 * Xử lý dữ liệu từ API để hiển thị trên giao diện một cách chuẩn
 */

import React from 'react';

/**
 * Format text từ API - xử lý các delimiter khác nhau
 * Hỗ trợ:
 * - Dấu "-" để xuống dòng
 * - Dấu "●" để xuống dòng
 * - Các từ nối (Nhưng, Và, Hoặc, Tuy nhiên, etc.) - xuống dòng nếu không có khoảng cách trước
 * - Căn lề 2 bên (justify)
 * 
 * @param {string} text - Text cần format
 * @returns {JSX.Element|string} - Text đã format hoặc React fragments
 */
export const formatJobDescription = (text) => {
  if (!text || typeof text !== 'string') return '';

  // Các từ nối cần chú ý
  const connectorWords = ['Nhưng', 'Và', 'Hoặc', 'Tuy nhiên', 'Mặc dù', 'Vì vậy', 'Do đó', 'Bởi vậy', 'Hơn nữa', 'Ngoài ra'];
  
  // Bước 1: Split theo dấu "-" (với khoảng trắng)
  let lines = text.split(/\s*-\s+/);
  
  // Bước 2: Với mỗi dòng, split theo dấu "●"
  lines = lines.flatMap(line => {
    return line.split(/\s*●\s*/).filter(item => item.trim());
  });

  // Bước 3: Xử lý các từ nối
  lines = lines.flatMap(line => {
    // Kiểm tra nếu dòng bắt đầu bằng từ nối mà không có khoảng trắng trước
    for (const word of connectorWords) {
      // Pattern: không có khoảng trắng trước từ nối
      const pattern = new RegExp(`([^\\s])${word}`, 'g');
      if (pattern.test(line)) {
        // Thay thế bằng: ký tự + xuống dòng + từ nối
        line = line.replace(
          new RegExp(`([^\\s])${word}`, 'g'),
          `$1\n${word}`
        );
      }
    }
    return line.split('\n').filter(item => item.trim());
  });

  return lines.map((line, index) => (
    <React.Fragment key={index}>
      <div className="text-justify mb-3">{line.trim()}</div>
    </React.Fragment>
  ));
};

/**
 * Format text đơn giản - chỉ xử lý xuống dòng, không cần React elements
 * @param {string} text
 * @returns {string}
 */
export const formatTextSimple = (text) => {
  if (!text || typeof text !== 'string') return '';

  const connectorWords = ['Nhưng', 'Và', 'Hoặc', 'Tuy nhiên', 'Mặc dù', 'Vì vậy', 'Do đó'];
  
  // Split theo "-"
  let lines = text.split(/\s*-\s+/);
  
  // Split theo "●"
  lines = lines.flatMap(line => line.split(/\s*●\s*/)).filter(item => item.trim());

  // Xử lý từ nối
  lines = lines.flatMap(line => {
    for (const word of connectorWords) {
      const pattern = new RegExp(`([^\\s])${word}`, 'g');
      if (pattern.test(line)) {
        line = line.replace(
          new RegExp(`([^\\s])${word}`, 'g'),
          `$1\n${word}`
        );
      }
    }
    return line.split('\n').filter(item => item.trim());
  });

  return lines.join('\n');
};

const parseNumericValue = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const normalized = Number(String(value).replace(/[^0-9-]/g, ''));
  return Number.isNaN(normalized) ? null : normalized;
};

const formatSalaryAmount = (value) => {
  const amount = parseNumericValue(value);
  if (amount === null) return '';

  const absolute = Math.abs(amount);
  if (absolute >= 1000000) {
    const millions = amount / 1000000;
    const formatted = Number.isInteger(millions)
      ? millions.toLocaleString('vi-VN')
      : millions.toLocaleString('vi-VN', { maximumFractionDigits: 1 });
    return `${formatted} Triệu VND`;
  }

  return `${amount.toLocaleString('vi-VN')} VND`;
};

/**
 * Format salary range
 * @param {number|string} min - Mức lương tối thiểu
 * @param {number|string} max - Mức lương tối đa
 * @returns {string}
 */
export const formatSalaryRange = (min, max) => {
  const minAmount = parseNumericValue(min);
  const maxAmount = parseNumericValue(max);

  if (minAmount === null && maxAmount === null) {
    return 'Thoả thuận';
  }

  if (minAmount !== null && maxAmount !== null) {
    if (minAmount === maxAmount) {
      return formatSalaryAmount(minAmount);
    }

    const minText = formatSalaryAmount(minAmount).replace(/\s+(Triệu VND|VND)$/, '');
    const maxText = formatSalaryAmount(maxAmount).replace(/\s+(Triệu VND|VND)$/, '');
    const unit = Math.abs(minAmount) >= 1000000 || Math.abs(maxAmount) >= 1000000 ? 'Triệu VND' : 'VND';
    return `${minText} - ${maxText} ${unit}`;
  }

  if (minAmount !== null) {
    return `Từ ${formatSalaryAmount(minAmount)}`;
  }

  return `Đến ${formatSalaryAmount(maxAmount)}`;
};

/**
 * Format salary range for form previews where values are already in display units.
 * @param {number|string} min
 * @param {number|string} max
 * @param {string} currency
 * @returns {string}
 */
export const formatSalaryInputRange = (min, max, currency = 'VND') => {
  const minText = min === null || min === undefined || min === '' ? '?' : min;
  const maxText = max === null || max === undefined || max === '' ? '?' : max;
  const suffix = currency === 'USD' ? 'USD' : 'Triệu VND';

  if (minText === '?' && maxText === '?') {
    return 'Thoả thuận';
  }

  if (minText === maxText) {
    return `${minText} ${suffix}`;
  }

  if (minText === '?') {
    return `Đến ${maxText} ${suffix}`;
  }

  if (maxText === '?') {
    return `Từ ${minText} ${suffix}`;
  }

  return `${minText} - ${maxText} ${suffix}`;
};

/**
 * Format date to Vietnamese format
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date) return 'Chưa cập nhật';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return 'Chưa cập nhật';
  }
};

/**
 * Format experience range
 * @param {number} min
 * @param {number} max
 * @returns {string}
 */
export const formatExperienceRange = (min, max) => {
  const minValue = parseNumericValue(min);
  const maxValue = parseNumericValue(max);

  if (minValue === null && maxValue === null) return 'Chưa cập nhật';
  if (minValue !== null && maxValue !== null) {
    if (minValue === maxValue) return `${minValue} năm`;
    return `${minValue} - ${maxValue} năm`;
  }
  if (minValue !== null) return `Từ ${minValue} năm`;
  if (maxValue !== null) return `Đến ${maxValue} năm`;
  return 'Chưa cập nhật';
};

/**
 * Format employment type (loại hợp đồng)
 * @param {string} type
 * @returns {string}
 */
export const formatEmploymentType = (type) => {
  const types = {
    'FULL_TIME': 'Toàn thời gian',
    'PART_TIME': 'Bán thời gian',
    'CONTRACT': 'Hợp đồng',
    'TEMPORARY': 'Tạm thời',
    'FREELANCE': 'Tự do',
    'INTERNSHIP': 'Thực tập'
  };
  return types[type] || type || 'Chưa cập nhật';
};

/**
 * Format job location/city names
 * @param {string} location
 * @returns {string}
 */
export const formatLocation = (location) => {
  if (!location) return 'Chưa cập nhật';
  
  // Loại bỏ các ký tự đặc biệt không cần thiết
  return location.trim();
};

/**
 * Normalize job data từ API
 * @param {object} job - Raw job data from API
 * @returns {object} - Normalized job data
 */
export const normalizeJobData = (job) => {
  if (!job) return null;

  return {
    id: job.id,
    title: job.title || job.job_title || '',
    company: job.company || job.company_name || '',
    location: formatLocation(job.location || job.job_address || ''),
    detailAddress: job.job_detail_address || job.detail_address || '',
    salary: formatSalaryRange(job.salary_min ?? job.min_salary, job.salary_max ?? job.max_salary),
    salaryMin: Number(String(job.salary_min ?? job.min_salary ?? 0).replace(/[^0-9]/g, '')) || 0,
    salaryMax: Number(String(job.salary_max ?? job.max_salary ?? 0).replace(/[^0-9]/g, '')) || 0,
    description: job.description || '',
    requirement: job.requirement || '',
    benefits: job.benefits || '',
    deadline: formatDate(job.deadline),
    deadlineRaw: job.deadline,
    employmentType: formatEmploymentType(job.employmentType || job.employment_type),
    experienceRange: formatExperienceRange(job.exp_min, job.exp_max),
    expMin: job.exp_min || 0,
    expMax: job.exp_max || 0,
    jobFunction: job.jobFunction || job.job_function || '',
    industries: job.industries || [],
    skills: job.skills || [],
    postDate: formatDate(job.post_date || job.created_at),
    matchScore: job.matchScore || job.match_score || 0,
  };
};

/**
 * Format text với xuống dòng và căn lề 2 bên (React component)
 * Dùng cho phần mô tả công việc, yêu cầu, etc.
 * @param {string} text
 * @returns {JSX.Element}
 */
export const formatTextWithJustify = (text) => {
  if (!text) return null;

  const connectorWords = ['Nhưng', 'Và', 'Hoặc', 'Tuy nhiên', 'Mặc dù', 'Vì vậy', 'Do đó', 'Bởi vậy', 'Hơn nữa', 'Ngoài ra'];
  
  // Split theo "-" hoặc "+" (cả ở đầu dòng lẫn giữa dòng)
  let lines = text.split(/\s*[-+]\s*/);
  
  // Split theo "●"
  lines = lines.flatMap(line => line.split(/\s*●\s*/)).filter(item => item.trim());

  // Xử lý từ nối
  lines = lines.flatMap(line => {
    for (const word of connectorWords) {
      const pattern = new RegExp(`([^\\s])${word}`, 'g');
      if (pattern.test(line)) {
        line = line.replace(
          new RegExp(`([^\\s])${word}`, 'g'),
          `$1\n${word}`
        );
      }
    }
    return line.split('\n').filter(item => item.trim());
  });

  // Xử lý chữ hoa bị dính (chữ thường + chữ hoa = xuống dòng)
  // Pattern: chữ cái viết thường (bao gồm tiếng Việt) theo sau bởi chữ cái viết hoa
  lines = lines.flatMap(line => {
    // Kiểm tra nếu có chữ thường dính với chữ hoa
    const pattern = /([a-zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ])([A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ])/g;
    if (pattern.test(line)) {
      line = line.replace(
        /([a-zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ])([A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ])/g,
        `$1\n$2`
      );
    }
    return line.split('\n').filter(item => item.trim());
  });

  return (
    <>
      {lines.map((line, index) => (
        <p key={index} className="text-justify mb-3 leading-relaxed">
          {line.trim()}
        </p>
      ))}
    </>
  );
};

export default {
  formatJobDescription,
  formatTextSimple,
  formatSalaryRange,
  formatDate,
  formatExperienceRange,
  formatEmploymentType,
  formatLocation,
  normalizeJobData,
  formatTextWithJustify,
};
