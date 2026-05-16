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

/**
 * Format salary range
 * @param {number|string} min - Mức lương tối thiểu
 * @param {number|string} max - Mức lương tối đa
 * @returns {string}
 */
export const formatSalaryRange = (min, max) => {
  const parseNumeric = (val) => {
    if (!val) return null;
    const num = Number(String(val).replace(/[^0-9]/g, ''));
    return Number.isNaN(num) ? null : num;
  };

  const formatNumber = (num) => {
    if (!num) return '';
    // Nếu là triệu (chia hết cho 1,000,000)
    if (num >= 1000000 && num % 1000000 === 0) {
      return `${(num / 1000000).toLocaleString('vi-VN')} Triệu`;
    }
    return num.toLocaleString('vi-VN');
  };

  const minNum = parseNumeric(min);
  const maxNum = parseNumeric(max);

  if (minNum && maxNum) {
    return `${formatNumber(minNum)} - ${formatNumber(maxNum)}`;
  } else if (minNum) {
    return `Từ ${formatNumber(minNum)}`;
  } else if (maxNum) {
    return `Đến ${formatNumber(maxNum)}`;
  }
  return 'Thoả thuận';
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
  if (!min && !max) return 'Chưa cập nhật';
  if (min && max) return `${min} - ${max} năm`;
  if (min) return `Từ ${min} năm`;
  if (max) return `Đến ${max} năm`;
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
    salary: formatSalaryRange(job.salary_min || job.min_salary, job.salary_max || job.max_salary),
    salaryMin: Number(String(job.salary_min || job.min_salary || 0).replace(/[^0-9]/g, '')) || 0,
    salaryMax: Number(String(job.salary_max || job.max_salary || 0).replace(/[^0-9]/g, '')) || 0,
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
