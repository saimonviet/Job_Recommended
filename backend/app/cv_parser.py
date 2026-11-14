"""Local CV text extraction and profile draft parsing."""

import re
import unicodedata
from datetime import datetime
from io import BytesIO


class CVParserError(ValueError):
    """Raised when a CV cannot be parsed."""


def _ascii_fold(value):
    normalized = unicodedata.normalize("NFD", (value or "").replace("Đ", "D").replace("đ", "d"))
    return "".join(char for char in normalized if unicodedata.category(char) != "Mn").lower()


def _clean_lines(text):
    lines = []
    for raw_line in (text or "").splitlines():
        line = re.sub(r"\s+", " ", raw_line).strip()
        if line:
            lines.append(line)
    return lines


def _extract_pdf(data):
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise CVParserError("Backend chưa cài thư viện đọc PDF. Hãy cài pypdf.") from exc

    try:
        reader = PdfReader(BytesIO(data))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception as exc:
        raise CVParserError("Không thể đọc nội dung PDF. CV có thể là ảnh scan.") from exc


def _extract_docx(data):
    try:
        from docx import Document
    except ImportError as exc:
        raise CVParserError("Backend chưa cài thư viện đọc DOCX. Hãy cài python-docx.") from exc

    try:
        document = Document(BytesIO(data))
        paragraphs = [paragraph.text for paragraph in document.paragraphs]
        for table in document.tables:
            for row in table.rows:
                paragraphs.append(" ".join(cell.text for cell in row.cells))
        return "\n".join(paragraphs)
    except Exception as exc:
        raise CVParserError("Không thể đọc nội dung DOCX.") from exc


def _find_section(lines, names):
    folded_names = tuple(_ascii_fold(name) for name in names)
    start = None
    for index, line in enumerate(lines):
        folded = _ascii_fold(line).strip(" :-")
        if any(folded == name or folded.startswith(name + ":") for name in folded_names):
            start = index + 1
            break
    if start is None:
        return []

    result = []
    section_headers = (
        "muc tieu", "objective", "summary", "tom tat", "kinh nghiem",
        "experience", "hoc van", "education", "ky nang", "skills",
        "du an", "projects", "lien he", "contact",
    )
    for line in lines[start:]:
        folded = _ascii_fold(line).strip(" :-")
        if folded in section_headers:
            break
        result.append(line)
    return result


def _first_match(pattern, text, flags=re.IGNORECASE):
    match = re.search(pattern, text or "", flags)
    return match.group(1).strip() if match else ""


def _parse_salary(text):
    match = re.search(
        r"(\d+(?:[.,]\d+)?)\s*(?:-|–|đến|to)\s*(\d+(?:[.,]\d+)?)\s*"
        r"(?:triệu|trieu|million|m|vnd|usd)",
        text,
        re.IGNORECASE,
    )
    if match:
        low = float(match.group(1).replace(",", "."))
        high = float(match.group(2).replace(",", "."))
        for value, code in ((("0", "5"), "0-5"), (("5", "10"), "5-10"), (("10", "15"), "10-15"),
                            (("15", "20"), "15-20"), (("20", "30"), "20-30"), (("30", "50"), "30-50")):
            if low >= float(value[0]) and high <= float(value[1]):
                return code
        if low >= 50:
            return "50+"
    single = re.search(
        r"(\d+(?:[.,]\d+)?)\s*(?:triệu|trieu|million|m|vnd|usd)",
        text,
        re.IGNORECASE,
    )
    if single:
        value = float(single.group(1).replace(",", "."))
        if value < 5:
            return "0-5"
        if value < 10:
            return "5-10"
        if value < 15:
            return "10-15"
        if value < 20:
            return "15-20"
        if value < 30:
            return "20-30"
        if value < 50:
            return "30-50"
        return "50+"
    return ""


def _parse_labeled_salary(lines):
    salary_labels = ("muc luong", "salary", "thu nhap", "income", "expected pay")
    context = []
    for index, line in enumerate(lines):
        folded = _ascii_fold(line)
        if any(label in folded for label in salary_labels):
            context.append(line)
            if index + 1 < len(lines):
                context.append(lines[index + 1])
    return _parse_salary("\n".join(context))


def _parse_gender(lines):
    pattern = re.compile(
        r"(?:gioi tinh|gender)\s*[:\-]\s*(nam|nu|male|female|khac|other)\b",
        re.IGNORECASE,
    )
    for line in lines:
        match = pattern.search(_ascii_fold(line))
        if not match:
            continue
        value = match.group(1).lower()
        if value in ("nam", "male"):
            return "Nam"
        if value in ("nu", "female"):
            return "Nữ"
        return "Khác"
    return ""


def _parse_experience(lines):
    date_pattern = re.compile(
        r"(?P<start>\d{4}(?:[-/]\d{1,2})?)\s*(?:-|–|to|đến)\s*"
        r"(?P<end>\d{4}(?:[-/]\d{1,2})?|present|current|hiện tại|nay)",
        re.IGNORECASE,
    )
    experiences = []
    for index, line in enumerate(lines):
        match = date_pattern.search(line)
        if not match:
            continue
        before_date = line[:match.start()].strip(" -|,")
        after_date = line[match.end():].strip(" -|,")
        context = before_date or (lines[index - 1] if index else "")
        parts = [part.strip() for part in re.split(r"\s+[|,]\s+", context) if part.strip()]
        company = parts[0] if parts else ""
        position = parts[1] if len(parts) > 1 else context
        experiences.append({
            "id": index + 1,
            "company": company,
            "position": position,
            "startDate": match.group("start").replace("/", "-"),
            "endDate": match.group("end").lower().replace("current", "present").replace("nay", "present"),
            "description": after_date,
            "skills": [],
        })
    return experiences[:10]


def parse_cv(data, extension):
    extension = extension.lower()
    if extension == ".pdf":
        text = _extract_pdf(data)
    elif extension == ".docx":
        text = _extract_docx(data)
    else:
        raise CVParserError("Chỉ hỗ trợ CV định dạng PDF hoặc DOCX.")

    lines = _clean_lines(text)
    if not lines:
        raise CVParserError("Không tìm thấy văn bản trong CV. Nếu là PDF scan, cần bổ sung OCR.")

    full_text = "\n".join(lines)
    folded_text = _ascii_fold(full_text)
    skills_catalog = (
        "Python", "Java", "JavaScript", "TypeScript", "React", "Node.js", "Flask",
        "Django", "SQL", "MySQL", "PostgreSQL", "MongoDB", "Docker", "Git",
        "AWS", "Excel", "Figma", "C++", "C#", "PHP", "Kotlin", "Flutter",
    )
    skills = [skill for skill in skills_catalog if _ascii_fold(skill) in folded_text]

    province_names = (
        "Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Cần Thơ", "Hải Phòng",
        "Bình Dương", "Đồng Nai", "Quảng Ninh", "Thừa Thiên Huế",
    )
    location = next((name for name in province_names if _ascii_fold(name) in folded_text), "")
    degree = next(
        (value for value in ("Tiến sĩ", "Thạc sĩ", "Đại học", "Cao đẳng", "Trung cấp")
         if _ascii_fold(value) in folded_text),
        "",
    )
    industry = ""
    industry_map = {
        "Công nghệ thông tin": ("cong nghe thong tin", "software", "developer", "programmer", "it "),
        "Marketing - Truyền thông": ("marketing", "truyen thong", "content"),
        "Tài chính - Kế toán": ("tai chinh", "ke toan", "finance", "accounting"),
        "Kinh doanh - Bán hàng": ("kinh doanh", "ban hang", "sales", "business development"),
    }
    for label, keywords in industry_map.items():
        if any(keyword in folded_text for keyword in keywords):
            industry = label
            break

    contact_lines = "\n".join(lines[: min(12, len(lines))])
    email = _first_match(r"([\w.+-]+@[\w-]+\.[\w.-]+)", full_text)
    phone = _first_match(r"((?:\+84|0)\s*(?:\d[\s.-]*){8,10})", contact_lines)
    phone = re.sub(r"[\s.-]", "", phone)
    age = _first_match(r"(?:tuoi|age)\s*[:\-]?\s*(\d{2})", folded_text)
    gender = _parse_gender(lines)
    desired_job = next(
        (line for line in lines[:20] if any(keyword in _ascii_fold(line) for keyword in
                                           ("developer", "engineer", "designer", "manager", "nhan vien", "chuyen vien"))),
        "",
    )
    target_lines = _find_section(lines, ("Mục tiêu nghề nghiệp", "Objective", "Summary", "Tóm tắt"))
    experience_lines = _find_section(lines, ("Kinh nghiệm", "Experience"))
    experiences = _parse_experience(experience_lines or lines)

    return {
        "email": email,
        "phone": phone,
        "workplace_desired": location,
        "desired_job": desired_job,
        "desired_salary": _parse_labeled_salary(lines),
        "target": "\n".join(target_lines).strip(),
        "age": age,
        "gender": gender,
        "degree": degree,
        "industry": industry,
        "skills": ", ".join(skills),
        "experience": experiences,
        "exp_min": "0",
        "exp_max": str(max(0, datetime.utcnow().year - min(
            [int(item["startDate"][:4]) for item in experiences if item.get("startDate", "")[:4].isdigit()] or [datetime.utcnow().year]
        ))),
    }
