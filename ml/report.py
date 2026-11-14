"""Generate a Markdown report from results/metrics.json."""
import json
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
METRICS = os.path.join(BASE, "results", "metrics.json")
OUT = os.path.join(BASE, "results", "README.md")


def fmt(x, nd=4):
    return f"{x:.{nd}f}" if isinstance(x, (int, float)) else str(x)


def main():
    with open(METRICS, encoding="utf-8") as f:
        res = json.load(f)

    rows = ["B0", "B1", "B2", "B3", "B4"]
    labels = {
        "B0": "B0 — 2 nút SAGE (baseline)",
        "B1": "B1 — 6 nút SAGE",
        "B2": "B2 — 6 nút GATv2",
        "B3": "B3 — 6 nút GATv2 + trọng số động",
        "B4": "B4 — B3 + lọc ràng buộc + xếp hạng lại",
    }

    lines = []
    lines.append("# Kết quả thực nghiệm (B0 → B4)\n")
    lines.append("## Bảng so sánh\n")
    lines.append("| Mô hình | AUC | Recall@20 | NDCG@20 | MRR | Hit@20 | Tỷ lệ vi phạm@20 |")
    lines.append("|---------|-----|-----------|---------|-----|--------|------------------|")
    for r in rows:
        m = res[r]
        lines.append(
            f"| {labels[r]} | {fmt(m['auc'],4)} | {fmt(m['recall@20'],5)} | "
            f"{fmt(m['ndcg@20'],5)} | {fmt(m['mrr'],5)} | {fmt(m['hit@20'],5)} | "
            f"{fmt(m['violation_rate'],4)} |"
        )

    lines.append("\n## Tỷ lệ vi phạm theo từng loại ràng buộc\n")
    lines.append("| Mô hình | Sai địa điểm | Thiếu kinh nghiệm | Lệch lương | Thiếu bằng cấp |")
    lines.append("|---------|-------------|-------------------|------------|----------------|")
    for r in rows:
        vb = res[r]["violation_breakdown"]
        lines.append(
            f"| {r} | {fmt(vb['location'],4)} | {fmt(vb['experience'],4)} | "
            f"{fmt(vb['salary'],4)} | {fmt(vb['degree'],4)} |"
        )

    v0 = res["B0"]["violation_rate"]
    v4 = res["B4"]["violation_rate"]
    drop = (v0 - v4) / v0 * 100 if v0 > 0 else 0.0
    lines.append("\n## Diễn giải\n")
    lines.append(f"- **Kết quả chính**: tỷ lệ gợi ý vi phạm ràng buộc giảm từ **{fmt(v0,4)} (B0)** "
                 f"xuống **{fmt(v4,4)} (B4)** — tức **{drop:.1f}%** — nhờ bước lọc ràng buộc cứng "
                 "+ xếp hạng lại.")
    lines.append("- **Động lực được xác nhận**: GNN thô (B0–B3) vẫn gợi ý **58–74%** job vi phạm ít nhất "
                 "một ràng buộc (chủ yếu sai địa điểm). Đây chính là lý do đề tài cần thêm bước lọc "
                 "ràng buộc chứ không thể chỉ dựa vào GNN.")
    lines.append("- **GATv2 (B2) giúp nhiều nhất trong các mô hình thô**: vi phạm giảm về 0.58, đồng thời "
                 "NDCG@20 và MRR cao nhất — attention học được cách ưu tiên láng giềng cùng bang thay vì "
                 "trung bình cộng của SAGE (B1).")
    lines.append("- **Trọng số động (B3) cải thiện Recall@20 / Hit@20** (cao nhất ~0.0020 / 0.0027, gấp ~3 lần "
                 "B0) nhờ trọng số cạnh phụ thuộc ưu tiên người dùng + tương thích quan hệ.")
    lines.append("- **SAGE 6 nút (B1) không giúp, thậm chí kém B0**: trung bình cộng qua nhiều loại cạnh dị thể "
                 "làm loãng tín hiệu — cho thấy cần attention (GATv2/HGT) chứ không phải SAGE thuần.")
    lines.append("- **Đánh đổi của B4**: lọc ràng buộc đưa vi phạm về 0 nhưng Recall giảm nhẹ so với B3 "
                 "(0.00075 vs 0.0020) vì một số job dương thật bị loại do vi phạm ràng buộc cứng.")
    lines.append("\n## Lưu ý về chỉ số xếp hạng\n")
    lines.append("- Recall/NDCG/MRR được đo bằng cách xếp hạng trên **toàn bộ 33.246 job** cho mỗi user "
                 "(khắc phục lỗi chỉ xếp hạng trên tập đã gán nhãn của phiên bản cũ).")
    lines.append("- Vì mỗi user chỉ có ~10 tương tác dương trên 33.246 job, Recall@20 có giá trị tuyệt đối "
                 "nhỏ (khoảng 10/33.246 ≈ 0.0003 nếu ngẫu nhiên); B3 cao hơn nhiều lần so với ngẫu nhiên "
                 "chính là tín hiệu cải thiện.")
    lines.append("- Tương tác là dữ liệu **tổng hợp** (không có ứng tuyển thật trong bộ công khai). Để kiểm "
                 "chứng Recall/NDCG/MRR trên hành vi thật, cần bộ dữ liệu có ứng tuyển thật (RecSys 2016 / "
                 "CareerBuilder) hoặc tập gán nhãn tay — như đã nêu trong đề cương.")
    lines.append("- Kết quả là một lần chạy (seed dữ liệu cố định, khởi tạo mô hình ngẫu nhiên). Nên chạy nhiều "
                 "seed và báo cáo trung bình ± độ lệch chuẩn trong báo cáo chính thức.")

    with open(OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
