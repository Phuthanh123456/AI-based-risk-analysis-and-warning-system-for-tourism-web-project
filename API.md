# REST API — Vietnam Travel Risk

Base local: `http://127.0.0.1:8000`. Swagger `/docs`, ReDoc `/redoc`, schema `/openapi.json` sinh trực tiếp từ route và Pydantic schema của server. Đây là tài liệu API có thể thử request, không chỉ là mô tả README. Public base URL chưa triển khai/xác nhận cho bản cập nhật.

## Đăng nhập và phân quyền

`POST /api/auth/register` và `POST /api/auth/login` nhận JSON:

```json
{"email":"student@example.com","password":"your-own-password"}
```

Response thành công có `token` và `user`. Đăng ký có thể trả 409 email tồn tại, 422 dữ liệu không hợp lệ. Mật khẩu tối thiểu 6 ký tự, tối đa 72 byte UTF-8 để tránh bcrypt cắt mật khẩu. Không sử dụng mật khẩu mẫu làm mật khẩu thật.

Sau đăng nhập, bấm **Authorize** trong Swagger và dán token cho các route yêu cầu Bearer. Với curl gửi header `Authorization: Bearer <token>`.
`GET /api/auth/me` trả người dùng hiện tại; token thiếu/sai/hết hạn trả 401.

## Địa điểm và hành trình

| Method / path | Input chính | Output / ghi chú |
| --- | --- | --- |
| GET `/api/locations/search` | `q`, tùy chọn `lat`, `lon` | `items[]`: label, lat/lon, provider và ID khi từ OSM. Chọn đúng mục; không gửi tên mơ hồ thay tọa độ đã chọn |
| GET `/trip` | `destination`, `lat`, `lon`, `destination_lat`, `destination_lon`, `trip_purpose`; tùy chọn `refresh` | `from`, `to`, `weather`, `traffic`, `risk`, `recommendation`. Tọa độ xuất phát và đích được giữ độc lập |
| GET `/traffic/route` | Xem query schema trong Swagger | Tuyến đường, khoảng cách, thời gian ước tính và metadata nhà cung cấp |
| GET `/api/news/recent` | `place` | Mẫu tin mới, nguồn/link, thời gian và phân loại mức lưu ý |
| GET `/risk`, `/risk/events`, `/risk/compare`, `/risk/trend` | `place`/bộ lọc theo từng route | Phân tích corpus đã thu thập; xem ngày dữ liệu, không mặc định là tin trực tiếp |

Ví dụ tra cứu đúng hai điểm đã biết tọa độ (curl trên Linux/macOS; Windows dùng `curl.exe` và chuyển thành một dòng):

```bash
curl --get 'http://127.0.0.1:8000/trip' \
  --data-urlencode 'destination=Ho Hoan Kiem, Ha Noi' \
  --data-urlencode 'lat=10.7769' --data-urlencode 'lon=106.7009' \
  --data-urlencode 'destination_lat=21.0288313' \
  --data-urlencode 'destination_lon=105.8525357' \
  --data-urlencode 'trip_purpose=family'
```

`/trip` cho phép tra cứu công khai. Nếu có token hợp lệ, API lưu lịch sử của tài khoản. Frontend yêu cầu đủ xuất phát/đích/ngày/mục đích trước phân tích; API giữ tương thích client cũ, `trip_purpose` có thể mặc định standard. `/trip` trả thời tiết **hiện tại**; frontend lấy dự báo riêng để đánh giá ngày đi đã chọn. Không hiểu recommendation hiện tại là prediction cho mọi ngày tương lai.

## Thời tiết và model

| Method / path | Input | Ý nghĩa |
| --- | --- | --- |
| POST `/weather/ai` | JSON WeatherAIPayload trong Swagger | Inference offline từ chỉ số người gọi cung cấp, không tự lấy thời tiết |
| POST `/weather/ai/live` | `{"city":"Hanoi","trip_purpose":"family"}` | Geocode, lấy thời tiết hiện tại, transform, predict |
| GET `/weather/ai/forecast` | `city`, `days` (1–16), `trip_purpose`, cặp `lat`/`lon` đã chọn | `daily[]` đúng ngày, `coordinates`, `forecast_days`, thông tin không khí |
| POST `/weather/ai/batch` | `{"cities":["Hanoi","Da Nang"]}` | Đánh giá nhiều địa phương |

UI giới hạn hôm nay và 7 ngày tiếp theo, dù API có thể yêu cầu tối đa 16 ngày nếu nguồn đáp ứng. Ngày khác không được cộng vào điểm ngày đang đánh giá. Nếu chưa có dự báo ngày đi, tổng quan chuyển về đánh giá hôm nay và ghi rõ ngày áp dụng.

## Đọc response đúng

`weather.risk_score` là điểm model chuẩn hóa 0–10; `model_score_0_20` là điểm gốc; `risk_level` là lớp, không phải xác suất. `adjusted_risk_score` có điều chỉnh quy tắc theo mục đích. `detection_method` phân biệt XGBoost và safety gate.

`air_quality.pm25` chỉ có giá trị hiển thị khi status available; kiểm tra source và observed_at. Giá trị impute dùng nội bộ model khi nguồn không khí thiếu không được trình bày thành quan trắc. Forecast PM2.5 chỉ được hiển thị ở ngày nguồn thực sự có dữ liệu.

`traffic.route_available` cho biết có route; `route_polyline` và provider/type dùng vẽ bản đồ. Thời gian là ước tính tuyến ô tô, không phải dự báo kẹt xe. `traffic_score` giữ null để tương thích; tính năng chấm ùn tắc đã bỏ.

`risk.data_status=stale` nghĩa corpus cũ. `historical_risk_score` chỉ là lịch sử. `risk.recent_news` là tra cứu RSS mới, mẫu tối đa 12 tiêu đề trong 7 ngày. `assessment.score` là quy tắc mức lưu ý, **không phải xác suất sự cố hoặc model inference trên bài mới**. Recovery/positive không chứng minh địa điểm an toàn và không tự xóa tin bất lợi.

Không có nguồn không đồng nghĩa điểm 0. Với lỗi nguồn, response có thể thiếu phần đánh giá tương ứng; các phần khác vẫn dùng được. Lỗi model không tạo điểm 10 giả.

## Lịch sử, cảnh báo và kiểm tra hoạt động

`GET /api/trip-history`, `DELETE /api/trip-history/{history_id}` yêu cầu token và chỉ truy cập bản ghi của chính người dùng. `/api/notifications/*` quản lý đăng ký push và thao tác kiểm tra thời tiết; xem tên route/body chính xác trong schema đang chạy. Không gọi route kiểm tra push trên tài khoản thật khi chỉ muốn đọc docs vì có thể gửi thông báo đã đăng ký.

`GET /health` là liveness. Docs/schema có HTTP 200 không chứng minh mọi nguồn dữ liệu bên ngoài đang hoạt động. 422 cho input sai, 401 auth, 409 trùng tài khoản; nguồn ngoài lỗi có thể trả 502, model inference lỗi 503, lỗi nội bộ 500. `/trip` có thể vẫn trả 200 với kết quả từng phần, nên client phải đọc trạng thái từng yếu tố.
