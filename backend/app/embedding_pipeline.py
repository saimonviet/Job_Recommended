import os
import re
import logging
import pickle

import numpy as np
import warnings
warnings.filterwarnings(
    "ignore",
    message="X does not have valid feature names, but RobustScaler was fitted with feature names*",
    category=UserWarning,
)

import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.data import HeteroData
from torch_geometric.nn import SAGEConv, HeteroConv

logger = logging.getLogger(__name__)

# ============================================================
# Artifact paths
# ============================================================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_PREPROCESSORS_PATH = os.path.join(BASE_DIR, 'preprocessors.pkl')
_TFIDF_PATH         = os.path.join(BASE_DIR, 'tfidf.pkl')
MODEL_PATH          = os.path.join(BASE_DIR, 'best_model1.pt')

_prep  = None
_tfidf = None
_recommendation_model = None


# ============================================================
# Load artifacts (singleton)
# ============================================================
def _load_artifacts():
    global _prep, _tfidf
    if _prep is not None and _tfidf is not None:
        return _prep, _tfidf
    try:
        with open(_PREPROCESSORS_PATH, 'rb') as f:
            _prep = pickle.load(f)
        with open(_TFIDF_PATH, 'rb') as f:
            _tfidf = pickle.load(f)
        logger.info("[_load_artifacts] Loaded preprocessors + tfidf OK")
    except Exception as e:
        logger.error(f"[_load_artifacts] Lỗi load artifacts: {e}")
        _prep  = {}
        _tfidf = None
    return _prep, _tfidf


# ============================================================
# Tiền xử lý text
# ============================================================
def advanced_clean_text(text):
    if not text:
        return ""
    text = str(text).lower()
    text = re.sub(r'\bc#\b', 'csharp', text)
    text = re.sub(r'\.net\b', 'dotnet', text)
    text = re.sub(r'(?<!\d)\.|\\.(?!\d)', ' . ', text)
    text = re.sub(r'[^\w\s\.]', ' ', text)
    words = [w for w in text.split() if len(w) > 1 or w == '.']
    return " ".join(words).strip()


province_aliases = {
    'TP.HCM': 'Hồ Chí Minh', 'TP HCM': 'Hồ Chí Minh', 'Sài Gòn': 'Hồ Chí Minh',
    'HCMC': 'Hồ Chí Minh', 'Vũng Tàu': 'Bà Rịa - Vũng Tàu', 'Huế': 'Thừa Thiên Huế',
    'Dak Lak': 'Đắk Lắk',
}
provinces_list = [
    'Hà Nội','Hồ Chí Minh','Đà Nẵng','Hải Phòng','Cần Thơ','An Giang',
    'Bà Rịa - Vũng Tàu','Bắc Giang','Bắc Kạn','Bạc Liêu','Bắc Ninh','Bến Tre',
    'Bình Định','Bình Dương','Bình Phước','Bình Thuận','Cà Mau','Cao Bằng',
    'Đắk Lắk','Đắk Nông','Điện Biên','Đồng Nai','Đồng Tháp','Gia Lai','Hà Giang',
    'Hà Nam','Hà Tĩnh','Hải Dương','Hậu Giang','Hòa Bình','Hưng Yên','Khánh Hòa',
    'Kiên Giang','Kon Tum','Lai Châu','Lâm Đồng','Lạng Sơn','Lào Cai','Long An',
    'Nam Định','Nghệ An','Ninh Bình','Ninh Thuận','Phú Thọ','Quảng Bình','Quảng Nam',
    'Quảng Ngãi','Quảng Ninh','Quảng Trị','Sóc Trăng','Sơn La','Tây Ninh','Thái Bình',
    'Thái Nguyên','Thanh Hóa','Thừa Thiên Huế','Tiền Giang','Trà Vinh','Tuyên Quang',
    'Vĩnh Long','Vĩnh Phúc','Yên Bái','Phú Yên',
]

def extract_province(addr):
    if not addr: return 'Khác'
    addr_str = str(addr).lower()
    for alias, formal in province_aliases.items():
        if alias.lower() in addr_str: return formal
    for p in provinces_list:
        if p.lower() in addr_str: return p
    if any(k in addr_str for k in ['toàn quốc','tất cả','linh hoạt']): return 'Toàn quốc'
    if any(k in addr_str for k in ['nước ngoài','singapore','japan','usa','nhật bản']): return 'Nước ngoài'
    if any(k in addr_str for k in ['tại nhà','làm việc từ xa','remote']): return 'Tại Nhà'
    return 'Khác'

def map_industry_group(main_industry):
    if not main_industry: return 'Khác'
    text = str(main_industry).lower()
    if any(k in text for k in ['it','cntt','phần mềm','phần cứng','lập trình','developer','mạng','tester','seo']): return 'Công nghệ thông tin'
    if any(k in text for k in ['kế toán','kiểm toán','tài chính','ngân hàng','chứng khoán','bảo hiểm','đầu tư']): return 'Tài chính - Kế toán'
    if any(k in text for k in ['bán hàng','kinh doanh','sale','telesale','thương mại điện tử','bán lẻ','phát triển thị trường']): return 'Kinh doanh - Bán hàng'
    if any(k in text for k in ['marketing','tiếp thị','quảng cáo','truyền thông','đối ngoại','pr','copywriter','content']): return 'Marketing - Truyền thông'
    if any(k in text for k in ['kỹ thuật','cơ khí','ô tô','điện','điện tử','tự động hóa','sản xuất','vận hành','qa','qc']): return 'Kỹ thuật - Sản xuất'
    if any(k in text for k in ['xây dựng','kiến trúc','nội thất','ngoại thất','bất động sản','nhà đất','địa chính']): return 'Xây dựng - BĐS'
    if any(k in text for k in ['khách sạn','nhà hàng','du lịch','thực phẩm','đồ uống','f&b','pha chế','đầu bếp']): return 'Dịch vụ - F&B - Làm đẹp'
    if any(k in text for k in ['vận tải','vận chuyển','logistics','kho vận','giao nhận','xuất nhập khẩu','lái xe']): return 'Vận tải - Logistics'
    if any(k in text for k in ['y tế','dược','bác sĩ','y tá','điều dưỡng','sinh học','hóa học','mỹ phẩm']): return 'Y tế - Dược'
    if any(k in text for k in ['nhân sự','hành chính','văn phòng','thư ký','trợ lý','luật','pháp lý','biên phiên dịch']): return 'Hành chính - Nhân sự'
    if any(k in text for k in ['giáo dục','đào tạo','giảng viên','giáo viên','trợ giảng','học vụ']): return 'Giáo dục - Đào tạo'
    if any(k in text for k in ['công nhân','lao động phổ thông','giúp việc','tạp vụ','bảo vệ','an ninh']): return 'Lao động phổ thông'
    if any(k in text for k in ['nông nghiệp','lâm nghiệp','thủy sản','hải sản','chăn nuôi','thú y','trồng trọt']): return 'Nông - Lâm - Ngư nghiệp'
    return 'Khác'

def _extract_degree(text):
    if not text: return 'other'
    t = str(text).lower()
    if any(k in t for k in ['thạc sĩ','master']):     return 'master'
    if any(k in t for k in ['tiến sĩ','phd']):        return 'phd'
    if any(k in t for k in ['đại học','university']): return 'university'
    if any(k in t for k in ['cao đẳng','college']):   return 'college'
    if any(k in t for k in ['trung cấp','dạy nghề']): return 'vocational'
    if any(k in t for k in ['thpt','trung học']):     return 'highschool'
    return 'other'

def _safe_encode(le, val, default='Khác'):
    try:
        v = val or default
        if v in le.classes_:
            return int(le.transform([v])[0])
        return int(le.transform([default])[0])
    except Exception:
        return 0

def _parse_salary_nums(sal_str):
    if not sal_str:
        return 0.0, 0.0
    nums = [float(x) for x in re.findall(r'\d+\.?\d*', str(sal_str))]
    def scale(v):
        if v < 1000:
            return v * 1_000_000
        return v
    if len(nums) >= 2:
        a, b = scale(nums[0]), scale(nums[1])
        return min(a, b), max(a, b)
    elif len(nums) == 1:
        v = scale(nums[0])
        return v, v * 1.2
    return 0.0, 0.0

def _parse_salary_type(sal_str):
    if not sal_str: return 3
    s = str(sal_str).lower()
    if any(k in s for k in ['thỏa thuận','cạnh tranh','thương lượng','negotiable']): return 3
    return 1


# ============================================================
# GNN Model (khớp model_train.ipynb)
# ============================================================
class GNNEncoder(nn.Module):
    def __init__(self, hidden_channels=128, out_channels=64, dropout=0.3):
        super().__init__()
        self.dropout = dropout
        self.proj = nn.ModuleDict({
            'user': nn.Linear(267, hidden_channels),
            'job':  nn.Linear(265, hidden_channels),
        })
        self.conv1 = HeteroConv({
            ('user','applies','job'):      SAGEConv((hidden_channels, hidden_channels), hidden_channels),
            ('job','rev_applies','user'):  SAGEConv((hidden_channels, hidden_channels), hidden_channels),
        }, aggr='mean')
        self.conv2 = HeteroConv({
            ('user','applies','job'):      SAGEConv((hidden_channels, hidden_channels), out_channels),
            ('job','rev_applies','user'):  SAGEConv((hidden_channels, hidden_channels), out_channels),
        }, aggr='mean')
        self.out_proj = nn.ModuleDict({
            'user': nn.Linear(hidden_channels, out_channels),
            'job':  nn.Linear(hidden_channels, out_channels),
        })

    def forward(self, x_dict, edge_index_dict):
        proj_dict = {k: F.relu(self.proj[k](v)) for k, v in x_dict.items()}
        conv1_out = self.conv1(proj_dict, edge_index_dict)
        x1 = {}
        for k in proj_dict:
            if k in conv1_out and conv1_out[k] is not None:
                x1[k] = F.relu(conv1_out[k])
            else:
                x1[k] = proj_dict[k]
        x1 = {k: F.dropout(v, p=self.dropout, training=self.training) for k, v in x1.items()}
        conv2_out = self.conv2(x1, edge_index_dict)
        x2 = {}
        for k in x1:
            if k in conv2_out and conv2_out[k] is not None:
                x2[k] = conv2_out[k]
            else:
                x2[k] = self.out_proj[k](x1[k])
        return x2


class EdgePredictor(nn.Module):
    def __init__(self, in_channels=64):
        super().__init__()
        self.lin = nn.Sequential(
            nn.Linear(in_channels * 2, in_channels),
            nn.ReLU(),
            nn.Linear(in_channels, 1),
        )

    def forward(self, z_user, z_job, edge_label_index):
        u = z_user[edge_label_index[0]]
        j = z_job[edge_label_index[1]]
        return self.lin(torch.cat([u, j], dim=-1)).squeeze(-1)


class RecommendationScorer(nn.Module):
    def __init__(self, hidden_channels=128, out_channels=64, dropout=0.3):
        super().__init__()
        self.encoder = GNNEncoder(hidden_channels, out_channels, dropout)
        self.decoder = EdgePredictor(out_channels)


def _get_recommendation_model():
    global _recommendation_model
    if _recommendation_model is not None:
        return _recommendation_model
    model = RecommendationScorer()
    try:
        state = torch.load(MODEL_PATH, map_location='cpu', weights_only=False)
        if isinstance(state, dict) and 'state_dict' in state:
            state = state['state_dict']

        # Robust load cho trường hợp mismatch kích thước layer
        # (ví dụ do bạn đang dùng model cấu hình hidden_channels khác với checkpoint)
        # state_dict() của model có thể chứa một số buffer/param chưa được khởi tạo hết.
        # Duyệt và chỉ load phần match về shape để tránh crash.
        model_sd = model.state_dict()

        # Tạo danh sách keys match shape một cách an toàn
        filtered = {}
        for k, v in state.items():
            if k not in model_sd:
                continue
            try:
                if model_sd[k].shape == v.shape:
                    filtered[k] = v
            except Exception:
                continue

        model.load_state_dict(filtered, strict=False)
        logger.info(
            "[_get_recommendation_model] Model loaded OK (filtered mismatched params). "
            f"Loaded={len(filtered)}/{len(model_sd)} params"
        )
    except Exception as e:
        logger.warning(f"[_get_recommendation_model] Không thể load {MODEL_PATH}: {e}")
    model.eval()
    _recommendation_model = model
    return _recommendation_model


# ============================================================
# Build raw feature vectors (267D / 265D)
# ============================================================

def _build_user_feat(user, infor) -> torch.Tensor:
    _load_artifacts()

    # skills     = (infor.skills  or '') if infor else ''
    target     = (infor.target  or '') if infor else ''
    
    exp_text = ""
    if infor and infor.experience:
        try:
            exp_list = json.loads(infor.experience)
            for exp in exp_list:
                pos = exp.get('position', '')
                desc = exp.get('description', '')
                exp_skills = " ".join(exp.get('skills', []))
                exp_text += f" {pos} {desc} {exp_skills}"
        except Exception as e:
            logger.warning(f"[_build_user_feat] Lỗi parse experience JSON: {e}")
            exp_text = str(infor.experience) # Fallback nếu không phải JSON
            
    clean_text = advanced_clean_text(f"{target} {exp_text}")

    if _tfidf is not None:
        text_emb = _tfidf.transform([clean_text]).toarray().astype(np.float32)
    else:
        logger.warning("[_build_user_feat] TF-IDF chưa load, dùng zero vector")
        text_emb = np.zeros((1, 256), dtype=np.float32)

    age     = float(np.clip(float(infor.age or 0), 16, 65)) if (infor and infor.age) else 0.0
    exp_min = float(infor.exp_min or 0) if infor else 0.0
    exp_max = float(infor.exp_max or 0) if infor else 0.0
    sal_str = (infor.desired_salary or '') if infor else ''
    sal_min, sal_max = _parse_salary_nums(sal_str)
    if sal_max == 0 and sal_min > 0:
        sal_max = sal_min * 1.2

    num_raw = np.array([[age, exp_min, exp_max, sal_min, sal_max]], dtype=np.float32)
    if _prep and 'scaler_user' in _prep:
        try:
            num = _prep['scaler_user'].transform(num_raw).astype(np.float32)
        except Exception as e:
            logger.warning(f"[_build_user_feat] scaler_user lỗi: {e}")
            num = num_raw
    else:
        num = num_raw

    province = extract_province(infor.workplace_desired if infor else '')
    industry = map_industry_group(infor.industry if infor else '')
    degree   = _extract_degree(infor.degree if infor else '')
    gender   = (infor.gender   or 'Khác') if infor else 'Khác'
    marriage = (infor.marriage or 'Khác') if infor else 'Khác'
    sal_type = _parse_salary_type(sal_str)

    if _prep:
        cat = np.array([[
            _safe_encode(_prep.get('le_gender'), gender),
            _safe_encode(_prep.get('le_degree'), degree),
            _safe_encode(_prep.get('le_marr'),   marriage),
            _safe_encode(_prep.get('le_ind'),    industry),
            _safe_encode(_prep.get('le_prov'),   province),
            sal_type,
        ]], dtype=np.float32)
    else:
        cat = np.zeros((1, 6), dtype=np.float32)

    X_user = np.hstack([num, cat, text_emb])
    assert X_user.shape[1] == 267, f"X_user shape sai: {X_user.shape}"
    return torch.tensor(X_user, dtype=torch.float32).squeeze(0)


def _build_job_feat(job) -> torch.Tensor:
    """Tạo X_job (265,): [4 num | 5 cat | 256 TF-IDF]"""
    _load_artifacts()

    desc     = (job.job_description or '') if hasattr(job, 'job_description') else ''
    req      = (job.job_requirement  or '') if hasattr(job, 'job_requirement')  else ''
    job_text = f"{desc} {req}".strip()

    if _tfidf is not None:
        text_emb = _tfidf.transform([job_text]).toarray().astype(np.float32)
    else:
        logger.warning("[_build_job_feat] TF-IDF chưa load, dùng zero vector")
        text_emb = np.zeros((1, 256), dtype=np.float32)

    try:
        sal_min = float(job.salary_min) if job.salary_min not in (None, '') else 0.0
    except (ValueError, TypeError):
        sal_min, _ = _parse_salary_nums(str(job.salary_min or ''))
    try:
        sal_max = float(job.salary_max) if job.salary_max not in (None, '') else 0.0
    except (ValueError, TypeError):
        _, sal_max = _parse_salary_nums(str(job.salary_max or ''))

    if sal_max == 0 and sal_min > 0:
        sal_max = sal_min * 1.2

    exp_min  = float(getattr(job, 'exp_min', 0) or 0)
    exp_max  = float(getattr(job, 'exp_max', 0) or 0)
    num_raw  = np.array([[sal_min, sal_max, exp_min, exp_max]], dtype=np.float32)

    if _prep and 'scaler_job' in _prep:
        try:
            num = _prep['scaler_job'].transform(num_raw).astype(np.float32)
        except Exception as e:
            logger.warning(f"[_build_job_feat] scaler_job lỗi: {e}")
            num = num_raw
    else:
        num = num_raw

    province = extract_province(getattr(job, 'job_address', '') or '')
    industry = map_industry_group(getattr(job, 'industries', '') or '')
    emp_type = getattr(job, 'employment_type', 'full_time') or 'full_time'
    func     = getattr(job, 'job_function', 'Nhân viên') or 'Nhân viên'
    sal_type = _parse_salary_type(str(job.salary_min or ''))

    if _prep:
        cat = np.array([[
            sal_type,
            _safe_encode(_prep.get('le_emp'),  emp_type),
            _safe_encode(_prep.get('le_func'), func),
            _safe_encode(_prep.get('le_ind'),  industry),
            _safe_encode(_prep.get('le_prov'), province),
        ]], dtype=np.float32)
    else:
        cat = np.zeros((1, 5), dtype=np.float32)

    X_job = np.hstack([num, cat, text_emb])
    assert X_job.shape[1] == 265, f"X_job shape sai: {X_job.shape}"
    return torch.tensor(X_job, dtype=torch.float32).squeeze(0)


# ============================================================
# Encode — dùng model như pure encoder (KHÔNG cần edges)
# ============================================================

def encode_user(user, infor) -> np.ndarray | None:
    """
    Chạy raw features (267D) qua proj + out_proj của model đã train.
    Trả về numpy array (64,) float32, hoặc None nếu lỗi.

    Đây là embedding dùng để lưu DB và để chấm điểm sau này.
    KHÔNG dùng SAGEConv (cần edges) — chỉ dùng linear layers.
    """
    try:
        model = _get_recommendation_model()
        feat  = _build_user_feat(user, infor)          # (267,)

        with torch.no_grad():
            x     = feat.unsqueeze(0)                  # (1, 267)
            h     = F.relu(model.encoder.proj['user'](x))      # (1, 128)
            z     = model.encoder.out_proj['user'](h)           # (1, 64)

        return z.squeeze(0).cpu().numpy().astype(np.float32)   # (64,)

    except Exception as e:
        logger.exception(f"[encode_user] lỗi: {e}")
        return None


def encode_job(job) -> np.ndarray | None:
    """
    Chạy raw features (265D) qua proj + out_proj của model đã train.
    Trả về numpy array (64,) float32, hoặc None nếu lỗi.
    """
    try:
        model = _get_recommendation_model()
        feat  = _build_job_feat(job)                   # (265,)

        with torch.no_grad():
            x     = feat.unsqueeze(0)                  # (1, 265)
            h     = F.relu(model.encoder.proj['job'](x))       # (1, 128)
            z     = model.encoder.out_proj['job'](h)            # (1, 64)

        return z.squeeze(0).cpu().numpy().astype(np.float32)   # (64,)

    except Exception as e:
        logger.exception(f"[encode_job] lỗi: {e}")
        return None


# ============================================================
# Score — dùng decoder chấm điểm từ pre-computed embeddings
# ============================================================

def _cosine_fallback_tfidf(x_user: np.ndarray, x_job: np.ndarray) -> np.ndarray:
    """
    Cosine similarity chỉ trên phần TF-IDF (256D cuối).
    User: (1, 267) → slice [-256:]
    Job:  (K, 265) → slice [-256:]
    """
    u = x_user[:, -256:]   # (1, 256)
    j = x_job[:,  -256:]   # (K, 256)
    u_norm = u / (np.linalg.norm(u, axis=1, keepdims=True) + 1e-12)
    j_norm = j / (np.linalg.norm(j, axis=1, keepdims=True) + 1e-12)
    sims   = (j_norm @ u_norm.T).flatten()
    scores = ((np.clip(sims, -1, 1) + 1.0) / 2.0).astype(np.float32)
    logger.info(f"[cosine_tfidf] min={scores.min():.4f}, max={scores.max():.4f}")
    return scores

def score_jobs_for_user(user, infor, jobs) -> np.ndarray:
    if not jobs:
        return np.array([], dtype=np.float32)

    # Build raw features để lấy TF-IDF 256D cuối
    try:
        x_user = _build_user_feat(user, infor).unsqueeze(0).numpy()  # (1, 267)
    except Exception as e:
        logger.error(f"[score_jobs_for_user] _build_user_feat lỗi: {e}")
        return np.zeros(len(jobs), dtype=np.float32)

    job_feats = []
    for job in jobs:
        try:
            job_feats.append(_build_job_feat(job).numpy())
        except Exception:
            job_feats.append(np.zeros(265, dtype=np.float32))

    x_job = np.stack(job_feats)  # (K, 265)

    return _cosine_fallback_tfidf(x_user, x_job)

def _load_embedding(obj, field: str, expected_dim: int) -> np.ndarray | None:
    """
    Đọc embedding JSON từ một model field.
    Trả về numpy array (expected_dim,) hoặc None nếu không có / sai chiều.
    """
    try:
        raw = getattr(obj, field, None)
        if not raw:
            return None
        arr = np.array(json.loads(raw), dtype=np.float32)
        if arr.shape != (expected_dim,):
            # logger.warning(
            #     f"[_load_embedding] {field} có shape {arr.shape}, "
            #     f"mong đợi ({expected_dim},) — bỏ qua"
            # )
            return None
        return arr
    except Exception:
        return None


def _cosine_fallback(z_user: np.ndarray, z_job: np.ndarray) -> np.ndarray:
    u_norm = z_user / (np.linalg.norm(z_user, axis=1, keepdims=True) + 1e-12)
    j_norm = z_job  / (np.linalg.norm(z_job,  axis=1, keepdims=True) + 1e-12)
    sims   = (j_norm @ u_norm.T).flatten()
    scores = ((np.clip(sims, -1, 1) + 1.0) / 2.0).astype(np.float32)
    logger.info(f"[_cosine_fallback] min={scores.min():.4f}, max={scores.max():.4f}")
    return scores


# import json cần cho _load_embedding
import json