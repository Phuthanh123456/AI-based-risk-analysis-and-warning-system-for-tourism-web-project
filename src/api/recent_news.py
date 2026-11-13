"""Read recent RSS headlines without changing historical training data.

Headlines are source links for verification, not confirmed incidents, full-text
ML classifications or evidence that an incident is still ongoing.
"""
import hashlib
import re
import threading
import time
import unicodedata
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from urllib.parse import urlparse

import requests
from src.api.news_assessment import headline_attention, summarize_attention

_cache = {}
_lock = threading.Lock()
_ALIASES = {
    "Lâm Đồng": ["Đà Lạt"], "Khánh Hòa": ["Nha Trang"], "Quảng Nam": ["Hội An"],
    "TP Hồ Chí Minh": ["TP HCM", "TP.HCM", "TPHCM", "Sài Gòn"],
    "TP. Hồ Chí Minh": ["TP HCM", "TP.HCM", "TPHCM", "Sài Gòn"],
    "Thừa Thiên Huế": ["Huế"], "Bà Rịa - Vũng Tàu": ["Vũng Tàu"],
    "Kiên Giang": ["Phú Quốc"], "Lào Cai": ["Sa Pa"],
}
_GROUPS = {
    "Natural_Disaster": ["bão", "lũ", "lụt", "ngập", "sạt lở", "mưa lớn", "áp thấp", "sóng lớn"],
    "Fire_Accident_Risk": ["tai nạn", "cháy", "hỏa hoạn", "đuối nước", "va chạm"],
    "Safety_Security": ["lừa đảo", "cướp", "trộm", "hành hung", "ngộ độc", "cấm đường", "phong tỏa"],
    "Pricing_Issue": ["chặt chém"],
    "Environmental_Cleanliness": ["ô nhiễm", "bụi mịn"],
}


def _plain(value):
    value = unicodedata.normalize("NFKD", value.casefold().replace("đ", "d"))
    return re.sub(r"[^a-z0-9]+", " ", "".join(c for c in value if not unicodedata.combining(c))).strip()


def _parse_feed(content, place, now):
    root = ET.fromstring(content)
    names = [place, *_ALIASES.get(place, [])]
    events, seen = [], set()
    for item in root.findall("./channel/item")[:100]:
        title = (item.findtext("title") or "").strip()
        source_node = item.find("source")
        source = source_node.text if source_node is not None else None
        # A publisher name must not make an out-of-area story match a place.
        if source and title.endswith(" - " + source):
            title = title[:-(len(source) + 3)]
        plain_title = f" {_plain(title)} "
        canonical_match = f" {_plain(place)} " in plain_title
        alias_match = any(re.search((r"\b" if _plain(name) in {"tp hcm", "tphcm"} else r"(?:^|\b(?:o|tai|thanh pho|tp)\s+)") + re.escape(_plain(name)) + r"\b", _plain(title)) for name in names[1:])
        if not canonical_match and not alias_match:
            continue
        if re.search(r"diễn tập|tập huấn|giả định|phòng ngừa|tuyên truyền", title, re.IGNORECASE):
            continue
        groups = [group for group, terms in _GROUPS.items()
                  if any(re.search(r"\b" + re.escape(term) + r"\b", title, re.IGNORECASE) for term in terms)]
        recovery = re.search(r"thông xe trở lại|đã thông xe|mở cửa trở lại|khắc phục xong", title, re.IGNORECASE)
        if not groups and not recovery:
            continue
        try:
            published = parsedate_to_datetime(item.findtext("pubDate") or "")
            if published.tzinfo is None:
                published = published.replace(tzinfo=timezone.utc)
        except (ValueError, TypeError, OverflowError):
            continue
        if not now - timedelta(days=7) <= published <= now:
            continue
        url = item.findtext("link") or ""
        if urlparse(url).scheme not in {"https", "http"}:
            continue
        source = source or urlparse(url).hostname
        identity = _plain(title)
        if identity in seen:
            continue
        seen.add(identity)
        events.append({"id": hashlib.sha256(url.encode()).hexdigest()[:20], "title": title,
                       "date": published.astimezone(timezone(timedelta(hours=7))).date().isoformat(),
                       "published_at": published.isoformat(), "url": url, "source": source,
                       "risk_groups": groups, "risk_score": None, "verified": False,
                       "analysis_method": "headline_keywords",
                       "attention": headline_attention(title, published, now)})
    return sorted(events, key=lambda event: event["published_at"], reverse=True)[:12]


def fetch_recent_news(place):
    if not place:
        return {"status": "no_location", "events": [], "count": 0}
    with _lock:
        cached = _cache.get(place)
        if cached and time.monotonic() - cached[0] < (600 if cached[1]["status"] == "available" else 30):
            return cached[1]
    now = datetime.now(timezone.utc)
    # Keep RSS queries short: long alias/keyword OR expressions were returning
    # old stories despite when:7d. Enforce date/place/topic again on the server.
    query_names = {"TP Hồ Chí Minh": ["TP.HCM"], "TP. Hồ Chí Minh": ["TP.HCM"],
                   "Thừa Thiên Huế": ["Huế"]}.get(place, [place, *_ALIASES.get(place, [])][:2])
    query = "(" + " OR ".join(f'"{name}"' for name in query_names) + ") when:7d"
    result = {"place": place, "events": [], "count": 0, "status": "unavailable",
              "provider": "Google News RSS", "window_days": 7, "checked_at": now.isoformat(),
              "analysis_method": "headline_keywords", "verified": False, "scope": "province",
              "scope_note": "Tin theo địa bàn tỉnh; không khẳng định sự việc xảy ra ngay tại địa điểm đã chọn."}
    try:
        response = requests.get("https://news.google.com/rss/search", params={"q": query, "hl": "vi", "gl": "VN", "ceid": "VN:vi"},
                                timeout=(3, 6), headers={"User-Agent": "VietnamTravelRiskAI-coursework/1.0"})
        response.raise_for_status()
        if len(response.content) > 2_000_000:
            raise ValueError("RSS response too large")
        events = _parse_feed(response.content, place, now)
        result.update(status="available", events=events, count=len(events), assessment=summarize_attention(events))
    except (requests.RequestException, ET.ParseError, ValueError, TypeError):
        pass
    with _lock:
        if len(_cache) >= 100:
            _cache.pop(next(iter(_cache)))
        _cache[place] = (time.monotonic(), result)
    return result
