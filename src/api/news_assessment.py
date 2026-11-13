"""Transparent headline attention rubric, not incident verification or ML confidence."""
import re
import unicodedata
from datetime import timezone


def _plain(text):
    text = unicodedata.normalize("NFKD", text.casefold().replace("đ", "d"))
    return " ".join("".join(c for c in text if not unicodedata.combining(c)).split())


def headline_attention(title, published, now):
    text = _plain(title)
    recovery = bool(re.search(r"da thong xe|thong xe tro lai|khac phuc xong|het ngap|khong con ngap|mo cua tro lai|da duoc khong che|da duoc dap tat", text))
    mixed = recovery and bool(re.search(r"\bnhung\b|\btuy nhien\b|van con|tiep tuc|tu vong|thiet mang|bi thuong|mat tich|so tan", text))
    prospective = bool(re.search(r"du bao|nguy co|co the|de phong|canh bao|du kien|giai phap|giai quyet|thuc trang|de xuat|ke hoach|tang cuong|ra soat|phong chong|phong chay|huong dan|bai hoc|kiem tra", text))
    disruption = bool(re.search(r"cam duong|phong toa|so tan|chia cat|dong cua|sat lo|lu quet|thiet mang|tu vong", text))
    age_hours = max(0, (now - published.astimezone(timezone.utc)).total_seconds() / 3600)
    if recovery and not mixed:
        score, impact = 0, "supportive"
        reason = "Tiêu đề nêu việc khắc phục hoặc mở lại; chưa xác nhận điều kiện tại điểm đến."
    elif prospective:
        score, impact = 3, "uncertain"
        reason = "Tiêu đề bàn về cảnh báo, nguy cơ, giải pháp hoặc dự kiến; chưa xác nhận một sự cố đang diễn ra."
    else:
        score, impact = (7 if disruption else 5), "adverse"
        reason = "Tiêu đề nêu gián đoạn/nguy hại đáng lưu ý." if disruption else "Tiêu đề nêu sự cố có thể bất lợi cho hoạt động du lịch."
        if mixed:
            score, reason = max(score, 5), "Tiêu đề vừa nêu khắc phục vừa nêu ảnh hưởng còn lại; cần đọc toàn văn."
    if age_hours > 48 and score > 3:
        score = 3
        reason += " Bài đã hơn 48 giờ nên giảm mức ưu tiên; chưa rõ ảnh hưởng còn tiếp diễn."
    return {"score": score, "impact": impact, "reason": reason, "age_hours": round(age_hours, 1),
            "method": "headline_attention_v1", "verified": False}


def summarize_attention(events):
    assessed = [event["attention"] for event in events if event.get("attention")]
    counts = {key: sum(a["impact"] == key for a in assessed) for key in ("adverse", "supportive", "uncertain")}
    return {"score": max((a["score"] for a in assessed), default=None), "scale_max": 10,
            "method": "headline_attention_v1", "counts": counts, "sample_size": len(assessed),
            "provisional": True, "aggregation": "max_attention_in_returned_sample",
            "note": "Mức cần lưu ý từ tối đa 12 tiêu đề trong 7 ngày, không phải điểm an toàn hay xác suất sự cố. Tin khắc phục không triệt tiêu tin bất lợi khác."}
