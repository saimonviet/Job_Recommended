# Job Recommendation — GNN đồ thị dị thể với trọng số động

Đồ án **"GNN đồ thị dị thể với trọng số động cho gợi ý việc làm"**. Hệ thống xây dựng đồ thị
6 loại nút và dùng Heterogeneous GNN + trọng số quan hệ động + lọc ràng buộc cứng để giảm
tỷ lệ gợi ý "không khả thi" (sai địa điểm / thiếu kinh nghiệm / lệch lương / thiếu bằng cấp).

## Kiến trúc

```
ml/
  dataset.py    # tải & làm sạch job, sinh user, dựng đồ thị 6 loại nút, chia train/val/test + hard negative
  features.py   # TF-IDF + numeric + categorical -> X_user/X_job (265D), one-hot cho nút thuộc tính
  models.py     # B0-B4 (GNNEncoder + EdgePredictor + DynamicWeight)
  train.py      # huấn luyện & đánh giá (AUC, Recall/NDCG/MRR@K, tỷ lệ vi phạm)
  rerank.py     # lọc ràng buộc cứng + chấm điểm đa tiêu chí + đo tỷ lệ vi phạm
  serve.py      # inference: load B3 + áp B4 (lọc + xếp hạng lại)
backend/        # Flask app, blueprint /api/recommend/* gọi ml.serve
import_db/      # import dữ liệu mới vào SQLite
data/           # raw (LinkedIn) + processed (CSV, graph.pt, splits.pt, models/B*.pt)
results/        # metrics.json
```

## Đồ thị 6 loại nút

| Nút | Số nút | Cạnh user | Cạnh job |
|-----|--------|-----------|----------|
| user | 8000 | — | `applies` (mục tiêu dự đoán) |
| job  | 33246 | `applies` | — |
| experience | 6 (0, 1-2, 3-5, 6-10, 10+, any) | `has_exp` | `requires_exp` |
| location   | 53 (50 bang Mỹ + Remote + National) | `prefers_loc` | `located_in` |
| salary     | 6 (<40k … 120k+, negotiable) | `expects_sal` | `offers_sal` |
| degree     | 6 (highschool…phd, any) | `holds_degree` | `requires_degree` |

Các nút thuộc tính còn nối nhau (`near`) để "gần" có nghĩa: khoảng kinh nghiệm/lương liền kề,
bậc học liền kề, các bang cùng vùng (census region). Mọi cạnh có chiều đều có cạnh ngược cho
message passing.

## Mô hình B0–B4

| Mô hình | Đồ thị | Tích chập | Trọng số động | Lọc + xếp hạng lại |
|---------|--------|-----------|---------------|--------------------|
| B0 | 2 nút (user, job) | SAGE | — | — |
| B1 | 6 nút | SAGE | — | — |
| B2 | 6 nút | GATv2 | — | — |
| B3 | 6 nút | GATv2 | ✓ `w = σ(g_r(p_u, φ(u,j)))` | — |
| B4 | 6 nút | GATv2 (B3) | ✓ | ✓ (ràng buộc cứng + đa tiêu chí) |

Trọng số động: `w_{u,j} = σ(g_r(p_u, φ_r(u,j)))` với `p_u` = vector ưu tiên người dùng
(sẵn sàng chuyển tỉnh, mức lương kỳ vọng, bậc học) và `φ_r` = đặc trưng tương thích quan hệ
(cùng tỉnh, chênh lệch kinh nghiệm, độ chồng lấp lương, chênh lệch bằng cấp). `g_r` là MLP nhỏ.

## Dữ liệu

- **Jobs**: LinkedIn Job Postings (Hugging Face `xanderios/linkedin-job-postings`, 33.246 tin thật)
  có tiêu đề, mô tả, lương (min/med/max), địa điểm, mức kinh nghiệm, loại hình.
- **Users**: 8.000 hồ sơ tổng hợp (state, ngành, kinh nghiệm, lương, bằng cấp) — vì bộ dữ liệu
  công khai không có hồ sơ ứng viên (theo hướng dẫn của đề cương).
- **Tương tác**: 80.025 cạnh `applies` sinh theo mô hình khả thi + nhiễu.
- **Hard negative**: 50% mẫu âm là "cùng ngành khác tỉnh" hoặc "đòi kinh nghiệm vượt người dùng".

> Ghi chú: dữ liệu gốc tiếng Việt cũ (`COMBINED_DATA_PROCESSED*.csv`, `USER_DATA_PROCESSED*.csv`)
> không được dùng lại theo yêu cầu.

## Cài đặt & chạy

```bash
# 1. Thư viện (Python 3.11)
pip install -r backend/requirements.txt

# 2. File .env (đã tạo sẵn theo .env.example) — trỏ SQLite
#    DATABASE_URL=sqlite:///.../backend/instance/job_recommend.db

# 3. Tải dữ liệu + dựng dataset (download LinkedIn, sinh user, dựng graph)
python -m ml.dataset
python -m ml.features

# 4. Huấn luyện B0-B4 + đánh giá (kết quả -> results/metrics.json)
python -m ml.train

# 5. Nạp dữ liệu vào SQLite
cd import_db
python import_new_data.py

# 6. Chạy backend
cd ../backend
python run.py

# 7. (tuỳ chọn) frontend
cd ../frontend
npm install
npm start
```

## API gợi ý (backend)

- `GET  /api/recommend/health` — trạng thái model.
- `GET  /api/recommend/user/<id>?top_k=20&rerank=1` — gợi ý cho user có sẵn.
- `POST /api/recommend/profile` — gợi ý cold-start từ hồ sơ (JSON: state, degree, exp_min/max,
  salary_min/max, industry, willing_relocate).

## Kết quả (xem `results/metrics.json`)

Chỉ số chính là **tỷ lệ vi phạm@20** (sai địa điểm / thiếu kinh nghiệm / lệch lương / thiếu bằng cấp).
Xem `results/README.md` để có bảng so sánh B0 → B4 và phân tích.
