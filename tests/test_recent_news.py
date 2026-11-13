from datetime import datetime, timezone
from unittest.mock import patch
from src.api import recent_news as news
from src.api.news_assessment import headline_attention, summarize_attention


def item(title, date="Wed, 11 Nov 2026 06:00:00 GMT", url="https://news.google.com/articles/example"):
    return f"<item><title>{title}</title><pubDate>{date}</pubDate><link>{url}</link><source>Example News</source></item>"


def test_recent_headlines_require_matching_place_date_and_risk_without_claiming_verified_incidents():
    now = datetime(2026, 11, 11, 15, tzinfo=timezone.utc)
    xml = "<rss><channel>" + "".join([
        item("Đà Lạt: mưa lớn gây ngập đường"),
        item("Đà Lạt: mưa lớn gây ngập đường"),
        item("Hà Nội: mưa lớn gây ngập đường", url="https://news.google.com/articles/other"),
        item("Đà Lạt khai trương nhà hàng"),
        item("Đà Lạt diễn tập chữa cháy"),
        item("Quảng Trị có mưa lớn - Báo Lâm Đồng").replace("<source>Example News</source>", "<source>Báo Lâm Đồng</source>"),
        item("Cháy quán lẩu Đà Lạt tại Hạ Long"),
        item("Lâm Đồng tăng cường phòng ngừa tai nạn"),
        item("Đà Lạt có mưa lớn", "Wed, 01 Oct 2025 06:00:00 GMT"),
        item("Đà Lạt có mưa lớn", "Wed, 18 Nov 2026 06:00:00 GMT"),
    ]) + "</channel></rss>"
    events = news._parse_feed(xml.encode(), "Lâm Đồng", now)
    assert len(events) == 1
    assert events[0]["verified"] is False
    assert events[0]["risk_score"] is None
    assert events[0]["analysis_method"] == "headline_keywords"


def test_news_provider_failure_differs_from_successful_search_with_no_matching_news(monkeypatch):
    monkeypatch.setattr(news, "_cache", {})
    with patch.object(news.requests, "get", side_effect=news.requests.Timeout()):
        failed = news.fetch_recent_news("Lâm Đồng")
    assert failed["status"] == "unavailable"
    monkeypatch.setattr(news, "_cache", {})
    class Response:
        content = b"<rss><channel/></rss>"
        def raise_for_status(self):
            pass
    with patch.object(news.requests, "get", return_value=Response()):
        empty = news.fetch_recent_news("Lâm Đồng")
    assert empty["status"] == "available" and empty["count"] == 0


def test_recent_news_endpoint_resolves_province(client):
    with patch("src.api.app.fetch_recent_news", return_value={"status": "available", "events": [], "count": 0}) as fetch:
        response = client.get("/api/news/recent", params={"place": "Đà Lạt"})
    assert response.status_code == 200
    fetch.assert_called_once_with("Lâm Đồng")


def test_attention_distinguishes_recovery_warning_disruption_and_age():
    now = datetime(2026, 11, 12, 15, tzinfo=timezone.utc)
    assert headline_attention("Hà Nội đã thông xe trở lại sau ngập", now, now)["score"] == 0
    assert headline_attention("Hà Nội cảnh báo nguy cơ ngập", now, now)["impact"] == "uncertain"
    assert headline_attention("Hà Nội giải quyết úng ngập từ trách nhiệm điều hành", now, now)["impact"] == "uncertain"
    assert headline_attention("Thực trạng ô nhiễm không khí tại Hà Nội: Giải pháp", now, now)["score"] == 3
    assert headline_attention("Hà Nội cấm đường do sạt lở", now, now)["score"] == 7
    old = datetime(2026, 11, 9, 15, tzinfo=timezone.utc)
    assert headline_attention("Hà Nội cấm đường do sạt lở", old, now)["score"] == 3


def test_recovery_does_not_cancel_remaining_harm_or_other_articles():
    now = datetime(2026, 11, 12, 15, tzinfo=timezone.utc)
    mixed = headline_attention("Cháy ở Hà Nội đã được dập tắt nhưng có người bị thương", now, now)
    assert mixed["impact"] == "adverse" and mixed["score"] >= 5
    events = [{"attention": headline_attention(title, now, now)} for title in
              ["Hà Nội đã thông xe trở lại", "Hà Nội cấm đường do sạt lở"]]
    summary = summarize_attention(events)
    assert summary["score"] == 7 and summary["counts"]["supportive"] == 1
    assert summary["provisional"] is True
    assert summarize_attention([])["score"] is None


def test_feed_preserves_recovery_with_source_and_provisional_reason():
    now = datetime(2026, 11, 12, 15, tzinfo=timezone.utc)
    xml = "<rss><channel>" + item("Hà Nội đã thông xe trở lại sau ngập", "Thu, 12 Nov 2026 06:00:00 GMT") + "</channel></rss>"
    event = news._parse_feed(xml.encode(), "Hà Nội", now)[0]
    assert event["attention"]["impact"] == "supportive"
    assert event["risk_score"] is None and event["verified"] is False
    assert event["url"].startswith("https://")


def test_hcm_alias_in_middle_of_headline_and_short_feed_query(monkeypatch):
    now = datetime.now(timezone.utc)
    date = now.strftime("%a, %d %b %Y %H:%M:%S GMT")
    xml = "<rss><channel>" + item("Thông tin cháy tại trung tâm TP.HCM được cập nhật", date) + "</channel></rss>"
    assert len(news._parse_feed(xml.encode(), "TP Hồ Chí Minh", now)) == 1
    monkeypatch.setattr(news, "_cache", {})
    class Response:
        content = xml.encode()
        def raise_for_status(self):
            pass
    with patch.object(news.requests, "get", return_value=Response()) as get:
        result = news.fetch_recent_news("TP Hồ Chí Minh")
    assert result["count"] == 1 and result["assessment"]["score"] == 5
    query = get.call_args.kwargs["params"]["q"]
    assert query == '("TP.HCM") when:7d'
