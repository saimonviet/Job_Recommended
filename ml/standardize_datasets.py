"""
Standardization script to harmonize MedaJob and VietJob datasets into a single unified schema.
Both datasets are transformed into the exact same column structure and data formats:

Unified Schema:
- job_id: Unique string identifier (MEDA_xxxxx or VIET_xxxxx)
- source: 'medajob' | 'vietjob'
- original_id: ID from original dataset
- job_title: Job title string
- company_name: Company name string
- province: Standardized Vietnamese province (Hà Nội, Hồ Chí Minh, Đà Nẵng, etc.)
- job_location: Raw location string
- salary_min: Float in million VND / month (e.g. 15.0), NaN if negotiable
- salary_max: Float in million VND / month (e.g. 22.0), NaN if negotiable
- salary_text: Human-readable display salary string
- salary_bucket: Categorical bucket ('<10tr', '10-20tr', '20-35tr', '35-50tr', '50tr+', 'thoa_thuan')
- exp_min: Float years of minimum experience (e.g. 1.0)
- exp_max: Float years of maximum experience (e.g. 2.0)
- exp_bucket: Categorical bucket ('0', '1-2', '3-5', '6-10', '10+', 'any')
- degree: Standardized degree requirement ('Không yêu cầu', 'THPT', 'Trung cấp', 'Cao đẳng', 'Đại học', 'Thạc sĩ', 'Tiến sĩ')
- employment_type: 'Toàn thời gian', 'Bán thời gian', 'Thực tập', 'Cộng tác viên', 'Linh hoạt'
- industry: Standardized Vietnamese industry category
- skills: Comma-separated list of clean skills
- benefits: Clean benefits text
- job_description: Detailed description
- job_requirement: Detailed requirements
"""

import ast
import json
import os
import re
import unicodedata
from typing import Tuple

import numpy as np
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
PROC_DIR = os.path.join(BASE_DIR, "data", "processed")
os.makedirs(PROC_DIR, exist_ok=True)

MEDA_RAW = os.path.join(RAW_DIR, "medajob.csv")
VIET_RAW = os.path.join(RAW_DIR, "vietjob.csv")

# ---------------------------------------------------------------------------
# 1. Location / Province Normalizer (63 provinces + Remote/ToanQuoc)
# ---------------------------------------------------------------------------
PROVINCES_63 = [
    "Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ",
    "Bình Dương", "Đồng Nai", "Bắc Ninh", "Hưng Yên", "Tây Ninh",
    "Hải Dương", "Vĩnh Phúc", "Long An", "Tiền Giang", "Khánh Hòa",
    "Nghệ An", "Thanh Hóa", "Quảng Nam", "Quảng Ngãi", "Thừa Thiên Huế",
    "Lâm Đồng", "Đắk Lắk", "Gia Lai", "Bình Định", "Kiên Giang",
    "An Giang", "Cà Mau", "Bà Rịa - Vũng Tàu", "Phú Thọ", "Thái Nguyên",
    "Nam Định", "Ninh Bình", "Bắc Giang", "Quảng Ninh", "Bình Thuận",
    "Bến Tre", "Trà Vinh", "Vĩnh Long", "Đồng Tháp", "Sóc Trăng",
    "Bạc Liêu", "Hậu Giang", "Bình Phước", "Đắk Nông", "Kon Tum",
    "Phú Yên", "Ninh Thuận", "Quảng Bình", "Quảng Trị", "Hà Tĩnh",
    "Hà Nam", "Thái Bình", "Hòa Bình", "Sơn La", "Điện Biên",
    "Lai Châu", "Lào Cai", "Yên Bái", "Tuyên Quang", "Hà Giang",
    "Cao Bằng", "Bắc Kạn", "Lạng Sơn"
]

DISTRICT_ALIAS_MAP = {
    # HCM & districts
    "tp.hcm": "Hồ Chí Minh", "tphcm": "Hồ Chí Minh", "tp hcm": "Hồ Chí Minh",
    "hcm": "Hồ Chí Minh", "sai gon": "Hồ Chí Minh", "sài gòn": "Hồ Chí Minh",
    "thu duc": "Hồ Chí Minh", "thủ đức": "Hồ Chí Minh", "binh thanh": "Hồ Chí Minh",
    "bình thạnh": "Hồ Chí Minh", "tan binh": "Hồ Chí Minh", "tân bình": "Hồ Chí Minh",
    "go vap": "Hồ Chí Minh", "gò vấp": "Hồ Chí Minh", "phu nhuan": "Hồ Chí Minh",
    "phú nhuận": "Hồ Chí Minh", "binh tan": "Hồ Chí Minh", "bình tân": "Hồ Chí Minh",
    "hoc mon": "Hồ Chí Minh", "hóc môn": "Hồ Chí Minh", "cu chi": "Hồ Chí Minh",
    "củ chi": "Hồ Chí Minh", "nha be": "Hồ Chí Minh", "nhà bè": "Hồ Chí Minh",
    "binh chanh": "Hồ Chí Minh", "bình chánh": "Hồ Chí Minh", "quan 1": "Hồ Chí Minh",
    "quận 1": "Hồ Chí Minh", "quan 7": "Hồ Chí Minh", "quận 7": "Hồ Chí Minh",
    # Ha Noi & districts
    "ha noi": "Hà Nội", "hà nội": "Hà Nội", "ha dong": "Hà Nội", "hà đông": "Hà Nội",
    "bac tu liem": "Hà Nội", "bắc từ liêm": "Hà Nội", "nam tu liem": "Hà Nội",
    "nam từ liêm": "Hà Nội", "cau giay": "Hà Nội", "cầu giấy": "Hà Nội",
    "dong da": "Hà Nội", "đống đa": "Hà Nội", "ba dinh": "Hà Nội", "ba đình": "Hà Nội",
    "hoan kiem": "Hà Nội", "hoàn kiếm": "Hà Nội", "hai ba trung": "Hà Nội",
    "hai bà trưng": "Hà Nội", "hoang mai": "Hà Nội", "hoàng mai": "Hà Nội",
    "thanh xuan": "Hà Nội", "thanh xuân": "Hà Nội", "long bien": "Hà Nội",
    "long biên": "Hà Nội", "tay ho": "Hà Nội", "tây hồ": "Hà Nội",
    "gia lam": "Hà Nội", "gia lâm": "Hà Nội", "dong anh": "Hà Nội", "đông anh": "Hà Nội",
    "soc son": "Hà Nội", "sóc sơn": "Hà Nội", "hoai duc": "Hà Nội", "hoài đức": "Hà Nội",
    "thach that": "Hà Nội", "thạch thất": "Hà Nội",
    # Da Nang
    "da nang": "Đà Nẵng", "đà nẵng": "Đà Nẵng", "hai chau": "Đà Nẵng", "hải châu": "Đà Nẵng",
    "thanh khe": "Đà Nẵng", "thanh khê": "Đà Nẵng", "son tra": "Đà Nẵng", "sơn trà": "Đà Nẵng",
    "ngu hanh son": "Đà Nẵng", "ngũ hành sơn": "Đà Nẵng", "lien chieu": "Đà Nẵng",
    "liên chiểu": "Đà Nẵng", "cam le": "Đà Nẵng", "cẩm lệ": "Đà Nẵng",
    # Other cities / centers
    "bien hoa": "Đồng Nai", "biên hoà": "Đồng Nai", "biên hòa": "Đồng Nai",
    "long thanh": "Đồng Nai", "nhon trach": "Đồng Nai",
    "thu dau mot": "Bình Dương", "thủ dầu một": "Bình Dương", "thuan an": "Bình Dương",
    "thuận an": "Bình Dương", "di an": "Bình Dương", "dĩ an": "Bình Dương",
    "ben cat": "Bình Dương", "bến cát": "Bình Dương", "tan uyen": "Bình Dương",
    "vinh": "Nghệ An", "tp vinh": "Nghệ An",
    "vung tau": "Bà Rịa - Vũng Tàu", "vũng tàu": "Bà Rịa - Vũng Tàu", "ba ria": "Bà Rịa - Vũng Tàu",
    "nha trang": "Khánh Hòa", "cam ranh": "Khánh Hòa",
    "da lat": "Lâm Đồng", "đà lạt": "Lâm Đồng", "bao loc": "Lâm Đồng",
    "quy nhon": "Bình Định", "quy nhơn": "Bình Định",
    "buon ma thuot": "Đắk Lắk", "buôn ma thuột": "Đắk Lắk", "bmt": "Đắk Lắk",
    "phan thiet": "Bình Thuận", "phan thiết": "Bình Thuận",
    "pleiku": "Gia Lai",
    "long xuyen": "An Giang", "long xuyên": "An Giang", "chau doc": "An Giang",
    "my tho": "Tiền Giang", "mỹ tho": "Tiền Giang",
    "tan an": "Long An", "tân an": "Long An",
    "viet tri": "Phú Thọ", "việt trì": "Phú Thọ",
    "ha long": "Quảng Ninh", "hạ long": "Quảng Ninh", "cam pha": "Quảng Ninh",
    "rach gia": "Kiên Giang", "rạch giá": "Kiên Giang", "phu quoc": "Kiên Giang", "phú quốc": "Kiên Giang",
    # Remote / Toàn quốc
    "remote": "Remote", "tu xa": "Remote", "từ xa": "Remote",
    "toan quoc": "Toàn quốc", "toàn quốc": "Toàn quốc", "viet nam": "Toàn quốc", "việt nam": "Toàn quốc"
}


def remove_diacritics(text: str) -> str:
    text = unicodedata.normalize("NFD", str(text))
    return "".join([c for c in text if unicodedata.category(c) != "Mn"]).lower()


def standardize_province(loc: str) -> str:
    if not isinstance(loc, str) or not loc.strip():
        return "Toàn quốc"
    raw_lower = loc.lower().strip()
    raw_no_diacritics = remove_diacritics(raw_lower)

    # 1. Alias lookup
    for alias, prov in DISTRICT_ALIAS_MAP.items():
        if alias in raw_lower or remove_diacritics(alias) in raw_no_diacritics:
            return prov

    # 2. Province exact / substring match
    for p in PROVINCES_63:
        if p.lower() in raw_lower or remove_diacritics(p) in raw_no_diacritics:
            return p

    return "Khác"


# ---------------------------------------------------------------------------
# 2. Salary Normalizer (Million VND / Month)
# ---------------------------------------------------------------------------
USD_VND_RATE = 25.0  # 1 USD = 25,000 VND (1000 USD = 25 million VND)


def parse_salary_value(val) -> float:
    """Parse single numeric value to float million VND."""
    if val is None or pd.isna(val):
        return np.nan
    s = str(val).strip().replace(",", ".")
    # Clean non-numeric except dot
    m = re.search(r"(\d+(?:\.\d+)?)", s)
    if not m:
        return np.nan
    num = float(m.group(1))
    if num <= 0:
        return np.nan
    # Raw VND: e.g. 15,000,000 or 50000000
    if num >= 1_000_000:
        return num / 1_000_000.0
    # Already in million VND (typical range: 1 to 500)
    if num < 300:
        return num
    # USD (e.g. 500 - 10000 USD)
    if num >= 300 and num < 1_000_000:
        return (num * USD_VND_RATE) / 1000.0
    return num


def parse_salary_range(s_min, s_max, s_text="") -> Tuple[float, float, str, str]:
    """
    Returns (salary_min_m, salary_max_m, salary_bucket, salary_text_clean).
    Units for min/max: Million VND / month.
    """
    combined = f"{s_min or ''} {s_max or ''} {s_text or ''}".strip()
    low = combined.lower()

    if any(k in low for k in ["cạnh tranh", "thỏa thuận", "thoa thuan", "thương lượng", "negotiable"]):
        if not re.search(r"\d+", low):
            return np.nan, np.nan, "thoa_thuan", "Thỏa thuận"

    # Look for range expression: e.g. '20 - 30 Triệu VND' or '15.0 - 22.0 triệu' or '100 - 150 USD'
    m_range = re.search(r"(\d+(?:[\.,]\d+)?)\s*[-–—đếnto]\s*(\d+(?:[\.,]\d+)?)\s*(triệu|tr|usd|\$)?", combined, re.IGNORECASE)
    if m_range:
        v1 = float(m_range.group(1).replace(",", "."))
        v2 = float(m_range.group(2).replace(",", "."))
        unit = (m_range.group(3) or "").lower()

        if "usd" in unit or "$" in combined.lower() or (v1 >= 200 and "tr" not in low and "triệu" not in low and v1 < 10000):
            # USD range
            v1_m = (v1 * USD_VND_RATE) / 1000.0
            v2_m = (v2 * USD_VND_RATE) / 1000.0
            text = f"{v1:.0f} - {v2:.0f} USD"
        elif v1 >= 1_000_000:
            # Full VND
            v1_m = v1 / 1_000_000.0
            v2_m = v2 / 1_000_000.0
            text = f"{v1_m:.1f} - {v2_m:.1f} triệu"
        else:
            # Million VND
            v1_m = v1
            v2_m = v2
            text = f"{v1_m:.1f} - {v2_m:.1f} triệu"

        v1_fin = min(v1_m, v2_m)
        v2_fin = max(v1_m, v2_m)
        bucket = get_salary_bucket(v1_fin, v2_fin)
        return v1_fin, v2_fin, bucket, text

    # Parse separate min and max
    p_min = parse_salary_value(s_min)
    p_max = parse_salary_value(s_max)

    if pd.isna(p_min) and pd.isna(p_max):
        return np.nan, np.nan, "thoa_thuan", "Thỏa thuận"

    if pd.notna(p_min) and pd.isna(p_max):
        p_max = p_min * 1.3
        text = f"Từ {p_min:.1f} triệu"
    elif pd.isna(p_min) and pd.notna(p_max):
        p_min = p_max * 0.75
        text = f"Lên tới {p_max:.1f} triệu"
    else:
        text = f"{p_min:.1f} - {p_max:.1f} triệu"

    p_min_fin = min(p_min, p_max)
    p_max_fin = max(p_min, p_max)
    bucket = get_salary_bucket(p_min_fin, p_max_fin)
    return p_min_fin, p_max_fin, bucket, text


def get_salary_bucket(sal_min: float, sal_max: float) -> str:
    if pd.isna(sal_min) and pd.isna(sal_max):
        return "thoa_thuan"
    mid = (sal_min + sal_max) / 2.0 if (pd.notna(sal_min) and pd.notna(sal_max)) else (sal_min if pd.notna(sal_min) else sal_max)
    if mid < 10.0:
        return "<10tr"
    if mid < 20.0:
        return "10-20tr"
    if mid < 35.0:
        return "20-35tr"
    if mid < 50.0:
        return "35-50tr"
    return "50tr+"


# ---------------------------------------------------------------------------
# 3. Experience Normalizer
# ---------------------------------------------------------------------------
def parse_experience(exp_val, desc_text="") -> Tuple[float, float, str]:
    """Returns (exp_min, exp_max, exp_bucket)."""
    s = f"{exp_val or ''} {desc_text or ''}".lower()

    if any(k in s for k in ["không yêu cầu", "khong yeu cau", "fresher", "intern", "thực tập", "sinh viên"]):
        return 0.0, 1.0, "0"

    # Match numeric years e.g. "1 năm", "2 năm", "3-5 năm", "tối thiểu 2 năm"
    m_range = re.search(r"(\d+(?:\.\d+)?)\s*[-–—đếnto]\s*(\d+(?:\.\d+)?)\s*năm", s)
    if m_range:
        e1 = float(m_range.group(1))
        e2 = float(m_range.group(2))
        return min(e1, e2), max(e1, e2), get_exp_bucket(max(e1, e2))

    m_single = re.search(r"(\d+(?:\.\d+)?)\s*năm", s)
    if m_single:
        yrs = float(m_single.group(1))
        return yrs, yrs + 1.0, get_exp_bucket(yrs)

    m_months = re.search(r"(\d+)\s*tháng", s)
    if m_months:
        yrs = float(m_months.group(1)) / 12.0
        return max(0.0, yrs - 0.2), yrs + 0.5, "0"

    # Role levels
    if "senior" in s or "trưởng nhóm" in s or "lead" in s or "quản lý" in s:
        return 5.0, 10.0, "6-10"
    if "mid" in s or "chuyên viên" in s:
        return 2.0, 5.0, "3-5"
    if "junior" in s:
        return 1.0, 3.0, "1-2"

    return 0.0, 2.0, "any"


def get_exp_bucket(exp_max: float) -> str:
    if exp_max <= 1.0:
        return "0"
    if exp_max <= 2.5:
        return "1-2"
    if exp_max <= 5.0:
        return "3-5"
    if exp_max <= 10.0:
        return "6-10"
    return "10+"


# ---------------------------------------------------------------------------
# 4. Degree Normalizer
# ---------------------------------------------------------------------------
def parse_degree(text: str) -> str:
    if not isinstance(text, str):
        return "Không yêu cầu"
    t = text.lower()
    if re.search(r"\btiến sĩ\b|\bphd\b|\bdoctorate\b", t):
        return "Tiến sĩ"
    if re.search(r"\bthạc sĩ\b|\bmaster\b|\bmba\b|\bcao học\b", t):
        return "Thạc sĩ"
    if re.search(r"\bđại học\b|\bđh\b|\bcử nhân\b|\bkỹ sư\b|\bbachelor\b", t):
        return "Đại học"
    if re.search(r"\bcao đẳng\b|\bcđ\b|\bassociate\b", t):
        return "Cao đẳng"
    if re.search(r"\btrung cấp\b|\bnghề\b|\bchứng chỉ nghề\b", t):
        return "Trung cấp"
    if re.search(r"\bthpt\b|\bcấp 3\b|\bphổ thông\b", t):
        return "THPT"
    return "Không yêu cầu"


# ---------------------------------------------------------------------------
# 5. Employment Type Normalizer
# ---------------------------------------------------------------------------
def parse_employment_type(val: str) -> str:
    if not isinstance(val, str):
        return "Toàn thời gian"
    s = val.lower()
    if "thực tập" in s or "intern" in s:
        return "Thực tập"
    if "bán thời gian" in s or "part-time" in s or "part time" in s:
        return "Bán thời gian"
    if "cộng tác viên" in s or "freelance" in s or "thời vụ" in s:
        return "Cộng tác viên"
    if "remote" in s or "linh hoạt" in s or "hybrid" in s:
        return "Toàn thời gian (Linh hoạt)"
    return "Toàn thời gian"


# ---------------------------------------------------------------------------
# 6. Industry Category Normalizer
# ---------------------------------------------------------------------------
VIET_CATEGORY_MAP = {
    "kinh_doanh_bán_hàng_chăm_sóc_khách_hàng": "Kinh doanh / Bán hàng / CSKH",
    "sản_xuất_lao_động_phổ_thông_cơ_khí": "Sản xuất / Cơ khí / Lao động",
    "marketing_truyền_thông_quảng_cáo_nội_dung": "Marketing / Truyền thông",
    "tài_chính_kế_toán_ngân_hàng_bảo_hiểm": "Tài chính / Kế toán / Ngân hàng",
    "du_lịch_nhà_hàng_khách_sạn_dịch_vụ": "Du lịch / Nhà hàng / Khách sạn",
    "thiết_kế_nghệ_thuật_giải_trí_truyền_hình_báo_chí": "Thiết kế / Sáng tạo / Nghệ thuật",
    "nhân_sự_hành_chính_pháp_chế_tư_vấn": "Nhân sự / Hành chính / Pháp chế",
    "xây_dựng_kiến_trúc_bất_động_sản": "Xây dựng / Bất động sản",
    "công_nghệ_thông_tin_kỹ_thuật_số": "Công nghệ thông tin / Phần mềm",
    "logistics_vận_tải_chuỗi_cung_ứng": "Logistics / Vận tải / Kho bãi",
    "kỹ_thuật_điện_điện_tử_viễn_thông": "Kỹ thuật Điện / Điện tử / Viễn thông",
    "giáo_dục_đào_tạo_nghiên_cứu": "Giáo dục / Đào tạo",
    "y_tế_dược_chăm_sóc_sức_khỏe_công_nghệ_sinh_học": "Y tế / Dược phẩm / Chăm sóc sức khỏe",
    "ngôn_ngữ_dịch_thuật": "Biên phiên dịch / Ngôn ngữ",
    "nông_nghiệp_năng_lượng_môi_trường": "Nông nghiệp / Môi trường",
    "nhóm_nghề_khác": "Ngành nghề khác"
}


def parse_meda_industry(title: str, sector: str) -> str:
    s = f"{title or ''} {sector or ''}".lower()
    if any(k in s for k in ["software", "developer", "engineer", "data", "it ", "devops", "cloud",
                           "frontend", "backend", "full stack", "lập trình", "phần mềm", "tester", "qa", "qc"]):
        return "Công nghệ thông tin / Phần mềm"
    if any(k in s for k in ["sales", "kinh doanh", "bán hàng", "cskh", "tư vấn"]):
        return "Kinh doanh / Bán hàng / CSKH"
    if any(k in s for k in ["marketing", "seo", "media", "content", "quảng cáo"]):
        return "Marketing / Truyền thông"
    if any(k in s for k in ["kế toán", "kiểm toán", "tài chính", "ngân hàng"]):
        return "Tài chính / Kế toán / Ngân hàng"
    if any(k in s for k in ["nhân sự", "hr", "tuyển dụng", "hành chính"]):
        return "Nhân sự / Hành chính / Pháp chế"
    if str(sector).lower() == "it":
        return "Công nghệ thông tin / Phần mềm"
    return "Ngành nghề khác"


# ---------------------------------------------------------------------------
# 7. Skills & Benefits Extractor
# ---------------------------------------------------------------------------
def clean_list_or_text(val) -> str:
    """Turn JSON array string or comma string into clean readable text."""
    if val is None or pd.isna(val):
        return ""
    s = str(val).strip()
    if not s:
        return ""
    # Try parsing as JSON or AST literal
    if s.startswith("[") and s.endswith("]"):
        try:
            items = ast.literal_eval(s)
            if isinstance(items, list):
                return "; ".join([str(x).strip() for x in items if str(x).strip()])
        except Exception:
            pass
        try:
            items = json.loads(s)
            if isinstance(items, list):
                return "; ".join([str(x).strip() for x in items if str(x).strip()])
        except Exception:
            pass
    # Clean brackets if still present
    s = re.sub(r"[\[\]'\"]", "", s)
    return s.strip()


# ---------------------------------------------------------------------------
# 8. Transform MedaJob
# ---------------------------------------------------------------------------
def standardize_medajob(df: pd.DataFrame) -> pd.DataFrame:
    print(f"Standardizing MedaJob ({len(df)} rows)...")
    out = []
    for idx, row in df.iterrows():
        orig_id = str(row.get("id", idx))
        job_id = f"MEDA_{int(orig_id) if orig_id.isdigit() else idx:05d}"
        job_title = str(row.get("job_title") or "Tuyển dụng").strip()
        company_name = str(row.get("company_name") or "Doanh nghiệp tuyển dụng").strip()
        raw_loc = str(row.get("job_location") or "Hồ Chí Minh").strip()
        province = standardize_province(raw_loc)

        s_min_raw = row.get("salary_min")
        s_max_raw = row.get("salary_max")
        sal_min, sal_max, sal_bucket, sal_text = parse_salary_range(s_min_raw, s_max_raw)

        exp_raw = row.get("experience_level")
        req_raw = row.get("job_applyrequirement")
        exp_min, exp_max, exp_bucket = parse_experience(exp_raw, req_raw)

        desc_raw = str(row.get("job_description") or "")
        degree = parse_degree(f"{req_raw or ''} {desc_raw}")
        emp_type = parse_employment_type(str(row.get("job_type") or ""))
        industry = parse_meda_industry(job_title, str(row.get("sector_code") or ""))

        skills = clean_list_or_text(row.get("job_skills"))
        benefits = clean_list_or_text(row.get("benefits"))

        out.append({
            "job_id": job_id,
            "source": "medajob",
            "original_id": orig_id,
            "job_title": job_title,
            "company_name": company_name,
            "province": province,
            "job_location": raw_loc,
            "salary_min": sal_min,
            "salary_max": sal_max,
            "salary_text": sal_text,
            "salary_bucket": sal_bucket,
            "exp_min": exp_min,
            "exp_max": exp_max,
            "exp_bucket": exp_bucket,
            "degree": degree,
            "employment_type": emp_type,
            "industry": industry,
            "skills": skills,
            "benefits": benefits,
            "job_description": desc_raw,
            "job_requirement": str(req_raw or ""),
        })

    return pd.DataFrame(out)


# ---------------------------------------------------------------------------
# 9. Transform VietJob
# ---------------------------------------------------------------------------
def standardize_vietjob(df: pd.DataFrame) -> pd.DataFrame:
    print(f"Standardizing VietJob ({len(df)} rows)...")
    out = []
    for idx, row in df.iterrows():
        job_id = f"VIET_{idx + 1:05d}"
        job_title = str(row.get("job_title") or "Tuyển dụng").strip()
        company_name = "Doanh nghiệp tuyển dụng"  # VietJob crawler does not include company name
        raw_loc = str(row.get("location") or "Toàn quốc").strip()
        province = standardize_province(raw_loc)

        s_min_raw = row.get("salary_min")
        s_max_raw = row.get("salary_max")
        s_text_raw = row.get("salary")
        sal_min, sal_max, sal_bucket, sal_text = parse_salary_range(s_min_raw, s_max_raw, s_text_raw)

        exp_raw = row.get("experience_required")
        req_raw = str(row.get("requirements_text") or "")
        exp_min, exp_max, exp_bucket = parse_experience(exp_raw, req_raw)

        qual_raw = str(row.get("qualifications") or "")
        desc_raw = str(row.get("description") or "")
        degree = parse_degree(f"{qual_raw} {req_raw} {desc_raw}")
        emp_type = parse_employment_type(str(row.get("contract_type") or ""))

        cat_raw = str(row.get("category") or "").strip()
        industry = VIET_CATEGORY_MAP.get(cat_raw, "Ngành nghề khác")

        tech = clean_list_or_text(row.get("technical_skills"))
        soft = clean_list_or_text(row.get("soft_skills"))
        skills = "; ".join([x for x in [tech, soft] if x])
        benefits = clean_list_or_text(row.get("benefits"))

        out.append({
            "job_id": job_id,
            "source": "vietjob",
            "original_id": str(idx),
            "job_title": job_title,
            "company_name": company_name,
            "province": province,
            "job_location": raw_loc,
            "salary_min": sal_min,
            "salary_max": sal_max,
            "salary_text": sal_text,
            "salary_bucket": sal_bucket,
            "exp_min": exp_min,
            "exp_max": exp_max,
            "exp_bucket": exp_bucket,
            "degree": degree,
            "employment_type": emp_type,
            "industry": industry,
            "skills": skills,
            "benefits": benefits,
            "job_description": desc_raw,
            "job_requirement": req_raw,
        })

    return pd.DataFrame(out)


# ---------------------------------------------------------------------------
# 10. Main Pipeline
# ---------------------------------------------------------------------------
def main():
    print("=" * 60)
    print("HARMONIZING MEDAJOB AND VIETJOB DATASETS")
    print("=" * 60)

    # Auto-fallback for MedaJob
    meda_path = MEDA_RAW
    if not os.path.exists(meda_path):
        repo_meda = os.path.join(BASE_DIR, "data", "medajob_raw", "job.csv")
        if os.path.exists(repo_meda):
            meda_path = repo_meda
        else:
            ext_meda = r"F:\OneDrive\HK9\DSS\Phan6_MEDAJob\medajob_data\job.csv"
            if os.path.exists(ext_meda):
                meda_path = ext_meda

    # Auto-download VietJob from Hugging Face if missing
    viet_path = VIET_RAW
    if not os.path.exists(viet_path):
        os.makedirs(RAW_DIR, exist_ok=True)
        print(f"File {viet_path} not found.")
        print("Downloading VietJobs (48k postings) from Hugging Face...")
        url = "https://huggingface.co/datasets/dinhieufam/VietJobs/resolve/main/VietJobs.csv"
        import urllib.request
        urllib.request.urlretrieve(url, viet_path)
        print(f"Downloaded VietJobs successfully ({os.path.getsize(viet_path)} bytes).")

    # 1. Load raw data
    print(f"Loading MedaJob from {meda_path}...")
    df_meda_raw = pd.read_csv(meda_path)
    print(f"Loading VietJob from {viet_path}...")
    df_viet_raw = pd.read_csv(viet_path)

    # 2. Standardize
    df_meda_std = standardize_medajob(df_meda_raw)
    df_viet_std = standardize_vietjob(df_viet_raw)

    # 3. Combine
    print("Merging standardized datasets...")
    df_combined = pd.concat([df_meda_std, df_viet_std], ignore_index=True)

    # 4. Save
    meda_out = os.path.join(PROC_DIR, "medajob_standardized.csv")
    viet_out = os.path.join(PROC_DIR, "vietjob_standardized.csv")
    comb_out = os.path.join(PROC_DIR, "jobs_combined.csv")
    jobs_out = os.path.join(PROC_DIR, "jobs.csv")

    df_meda_std.to_csv(meda_out, index=False, encoding="utf-8-sig")
    df_viet_std.to_csv(viet_out, index=False, encoding="utf-8-sig")
    df_combined.to_csv(comb_out, index=False, encoding="utf-8-sig")
    df_combined.to_csv(jobs_out, index=False, encoding="utf-8-sig")

    print("\n✅ Successfully standardized and exported:")
    print(f"  1. MedaJob Standardized : {meda_out} ({len(df_meda_std)} jobs)")
    print(f"  2. VietJob Standardized : {viet_out} ({len(df_viet_std)} jobs)")
    print(f"  3. Combined Jobs Dataset: {comb_out} ({len(df_combined)} jobs)")
    print(f"  4. Main Jobs Dataset    : {jobs_out} ({len(df_combined)} jobs)")

    # 5. Schema verification
    print("\n📊 Schema Verification:")
    print(f"  Columns count : {len(df_combined.columns)}")
    print(f"  Column names  : {df_combined.columns.tolist()}")
    print("\nTop 10 Provinces:")
    print(df_combined["province"].value_counts().head(10).to_string())
    print("\nIndustries Breakdown:")
    print(df_combined["industry"].value_counts().to_string())
    print("\nSalary Bucket Breakdown:")
    print(df_combined["salary_bucket"].value_counts().to_string())
    print("\nExperience Bucket Breakdown:")
    print(df_combined["exp_bucket"].value_counts().to_string())
    print("\nDegree Breakdown:")
    print(df_combined["degree"].value_counts().to_string())


if __name__ == "__main__":
    main()

