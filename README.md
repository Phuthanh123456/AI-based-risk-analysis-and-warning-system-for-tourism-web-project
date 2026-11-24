# Vietnam Travel Risk AI

**Đồ án môn Phát triển ứng dụng Web — Trường Đại học Công nghệ Thông tin, ĐHQG-HCM (UIT)**

Giảng viên: **Nguyễn Thanh Bình**. Thành viên: **Thái Nguyễn Thanh Phú**.

[![CI](https://github.com/Phuthanh123456/AI-based-risk-analysis-and-warning-system-for-tourism-web-project/actions/workflows/ci.yml/badge.svg)](https://github.com/Phuthanh123456/AI-based-risk-analysis-and-warning-system-for-tourism-web-project/actions/workflows/ci.yml)

**Demo:** [https://vietjourney.id.vn/](https://vietjourney.id.vn/) · **API:** [https://travel-risk-api.onrender.com](https://travel-risk-api.onrender.com) · **API docs:** [Swagger UI](https://travel-risk-api.onrender.com/docs) · **Health:** [https://travel-risk-api.onrender.com/health](https://travel-risk-api.onrender.com/health)

Repository môn học: [Phuthanh123456/AI-based-risk-analysis-and-warning-system-for-tourism-web-project](https://github.com/Phuthanh123456/AI-based-risk-analysis-and-warning-system-for-tourism-web-project).
Ứng dụng giúp du khách khám phá Việt Nam và cân nhắc chuyến đi qua **thời tiết/không khí, tuyến đường và tin tức địa phương**. Kết quả mang tính tham khảo, không phải xác nhận an toàn hay thông báo chính thức.

## Demo và môi trường production

| Thành phần | Nền tảng | URL / ghi chú |
| --- | --- | --- |
| Web frontend | Vercel | [vietjourney.id.vn](https://vietjourney.id.vn/) |
| REST API | Render | [travel-risk-api.onrender.com](https://travel-risk-api.onrender.com) |
| Tài liệu API | FastAPI Swagger UI | [Mở `/docs`](https://travel-risk-api.onrender.com/docs) |
| Kiểm tra API | FastAPI health endpoint | [`/health`](https://travel-risk-api.onrender.com/health) |
| Cơ sở dữ liệu production | Neon PostgreSQL | Được cấu hình qua `DATABASE_URL`; không công khai thông tin kết nối |
| DNS tên miền | Cloudflare | `vietjourney.id.vn` trỏ tới frontend Vercel |

Các URL trên được kiểm tra ngày **24/11/2026**: web, `/health` và `/docs` trả HTTP 200. Render Free có thể đưa API vào trạng thái ngủ khi ít truy cập; yêu cầu đầu tiên sau thời gian nhàn rỗi có thể phản hồi chậm. `/health` xác nhận tiến trình API đang trả lời, không bảo đảm mọi nhà cung cấp dữ liệu bên ngoài đều hoạt động.

## Chức năng

| Nhóm | Hành vi hiện có |
| --- | --- |
| Khám phá | Danh mục 34 tỉnh/thành, đối chiếu địa phương cũ; điểm đến, văn hóa, ẩm thực và nhóm trải nghiệm |
| Tài khoản | Đăng ký, đăng nhập JWT, đăng xuất; PostgreSQL trên production hoặc SQLite local lưu người dùng, lịch sử và đăng ký cảnh báo |
| Hành trình | Bắt buộc chọn xuất phát, đích có tọa độ, ngày đi và mục đích; gợi ý tìm địa chỉ, GPS |
| Ngày đi | Mặc định hôm nay theo giờ Việt Nam; chọn hôm nay và 7 ngày tiếp theo |
| Tổng quan | NÊN ĐI / CẦN LƯU Ý TRƯỚC KHI ĐI / KHÔNG NÊN ĐI; xét ba yếu tố, không tạo điểm tổng hợp giả |
| Thời tiết | Điểm 0–10 đúng ngày, dự báo từng ngày, PM2.5 khi nguồn có dữ liệu, gợi ý theo mục đích chuyến đi |
| Di chuyển | Bản đồ bên trái, thông tin bên phải; hình tuyến, quãng đường và thời gian ô tô ước tính; không chấm ùn tắc |
| Tin tức | Tra cứu RSS theo yêu cầu; tối đa 12 tiêu đề trong mẫu 7 ngày, lọc theo địa danh/từ khóa; hiển thị nguồn, mức lưu ý tạm tính và đường dẫn bài gốc để xác minh |
| Khám phá 360° | Sa bàn tương tác Three.js/WebGL cho phép chọn điểm dừng, xoay và phóng cảnh quan; hiệu ứng thời tiết trong sa bàn là minh họa, không phải đầu ra dự báo |
| Tiện ích | So sánh tin điểm đến, lịch sử tra cứu, theo dõi thời tiết và kiểm tra cảnh báo |
| Giao diện | VI/EN, sáng/tối, desktop/mobile; giữ tên món ăn và thuật ngữ văn hóa đặc trưng khi cần |

Lịch sử lưu snapshot tại thời điểm gọi `/trip`, không phải kết quả dự báo tương lai đã kiểm chứng. Web Push cần HTTPS, VAPID, quyền người dùng và trình duyệt hỗ trợ. Hiện có nút kiểm tra cảnh báo; **chưa có scheduler tự động định kỳ**.

## Kiến trúc

```mermaid
flowchart LR
  UI[React / Vite / MUI / Leaflet / Three.js] --> API[FastAPI / Uvicorn on Render]
  API --> DB[(Neon PostgreSQL in production<br/>SQLite for local development)]
  API --> GEO[Photon / OpenStreetMap search]
  API --> ROUTE[TrackAsia / OSRM routing]
  API --> WEATHER[Open-Meteo weather]
  API --> AIR[OpenWeatherMap / Open-Meteo air quality]
  WEATHER --> ML[XGBoost + safety rules]
  AIR --> ML
  API --> NEWS[RSS headlines + rules]
  API --> OLD[Historical features + classifier probabilities]
```

Backend Python/FastAPI, frontend JavaScript/React 19. Production dùng Neon PostgreSQL; local development/test dùng SQLite khi không đặt `DATABASE_URL`. Schema và lớp tương thích cơ sở dữ liệu nằm trong `src/api/db.py`. Môn học cho phép lựa chọn framework; API server này không dùng Node/Express. Mật khẩu băm bcrypt, token HS256 có thời hạn. `.env`, token và dữ liệu tài khoản không đưa vào Git.
Giữ nguyên dữ liệu/nhãn và tên tỉnh lịch sử trong `data/`; không tự gán nguồn hay giấy phép cho dữ liệu.

## AI và cách đánh giá thực tế

| Thành phần | Triển khai | Giới hạn |
| --- | --- | --- |
| Thời tiết | XGBClassifier 5 lớp, artifact `weather_risk_v5_classifier.pkl`, thứ tự feature từ `model_features.json`; safety gates cho cực đoan; điểm gốc 0–20 đổi thành 0–10 | Độ khớp nhãn không phải xác suất an toàn; điều chỉnh mục đích là quy tắc |
| Tin lịch sử | TF-IDF + Logistic Regression; xác suất đã tính trong `news_baseline_predictions.jsonl`, ghép article ID với feature/rule severity | Corpus hiện cũ, không dùng điểm lịch sử làm cảnh báo hiện tại |
| Tin RSS mới | Quy tắc tiêu đề, từ khóa, tuổi tin | Chưa chạy PhoBERT trên RSS mới; chưa xác minh toàn văn và sự cố thực tế |
| PhoBERT | Có pipeline và kết quả CPU smoke test | Chưa có checkpoint fine-tune đầy đủ được dùng trong runtime |
| Tuyến đường | Dịch vụ routing, hình tuyến và thời gian tham khảo | Không có model AI giao thông; không tự suy ra ùn tắc |
| Tổng quan | Quy tắc tổng hợp ba yếu tố, xét thiếu nguồn | Chưa train model tổng hợp ba yếu tố; không cộng/trung bình những thang đo khác bản chất |

Đánh giá lại artifact ngày 13/11/2026, **không train lại hoặc thay artifact**:

| Model | Tập đánh giá | Kết quả |
| --- | --- | --- |
| Thời tiết | 68.985 dòng năm 2025; train ban đầu 2023–2024, seed 42 | Balanced accuracy 0,9324; macro F1 0,9533 |
| Tin TF-IDF/LogReg | 542 bài validation loại trùng với 2.217 bài train; ngưỡng 0,5 | Precision/Recall/F1 0,9002; average precision 0,9558 |

Lớp thời tiết mức 4 chỉ có **19 mẫu validation, recall 0,6842**. Chưa có đánh giá thực địa chứng minh giảm sự cố. Chi tiết: [TRAINING.md](TRAINING.md), [ASSESSMENT.md](ASSESSMENT.md), [RELEASE_TEST_REPORT.md](RELEASE_TEST_REPORT.md).

## Cài đặt và chạy local

Khuyến nghị Python 3.11/3.12, Node 20.19+ hoặc 22.12+, npm và Git.

Dataset thời tiết và model v4 cũ đã dùng Git LFS từ trước. Cài Git LFS nếu cần lấy dataset để đánh giá/train; chạy `git lfs pull --include="src/integrations/weather/FINAL_DATASET_WITH_RISK-2.csv"`. Runtime dùng model v5 nhỏ, không cần tải model v4 hơn 100 MB. Không thêm lại file lớn thành Git blob thường.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
cd travel-ui
npm ci
cd ..
```

Điền cấu hình riêng trong `.env`. Trên Windows chạy **`START-WEB.cmd`**, hoặc:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/Start-Local.ps1 -NoBrowser
```

Frontend: **http://localhost:5180**. Backend: **http://127.0.0.1:8000**. Tắt máy sẽ dừng server local; chạy launcher lại sau khi bật máy. Log/khởi động lại: [RUNNING.md](RUNNING.md).

Chạy thủ công trong hai terminal:

```powershell
python -m uvicorn src.api.app:app --host 127.0.0.1 --port 8000
```

```powershell
cd travel-ui
npm run dev -- --host 127.0.0.1 --port 5180
```

## API docs

- Swagger UI: **http://127.0.0.1:8000/docs** — tham số, body, status, thử request.
- ReDoc: **http://127.0.0.1:8000/redoc**.
- OpenAPI JSON: **http://127.0.0.1:8000/openapi.json**.
- Endpoint, mẫu request, ý nghĩa kết quả: [API.md](API.md).

Đăng nhập qua `/api/auth/login`; gửi `Authorization: Bearer <token>` cho lịch sử/cảnh báo. `/trip` cho phép tra cứu công khai, token hợp lệ thì lưu lịch sử riêng. Không dùng tài khoản/key thật trong tài liệu công khai. `/health` kiểm tra tiến trình API, không chứng minh mọi nhà cung cấp dữ liệu đang đáp ứng.

## Kiểm thử

```powershell
python -m pytest -q
python -m scripts.evaluate_release_models --output model-evaluation.local.json
node scripts/audit-location-catalog.mjs
cd travel-ui
npm test
npm run lint
npm run build
```

Không cần commit output `.local.json`. GitHub CI chạy pytest, frontend tests, lint và build. Xem kết quả kiểm thử thật và giới hạn trong [RELEASE_TEST_REPORT.md](RELEASE_TEST_REPORT.md).

## Docker và tự triển khai

Production demo hiện chạy trên Vercel, Render và Neon như bảng ở trên. Các lệnh dưới đây dành cho chạy thử bằng Docker hoặc tự triển khai; địa chỉ localhost không phải public demo.

Tạo `.env` từ mẫu, đặt **JWT_SECRET riêng ngẫu nhiên ít nhất 32 byte**. Compose bật `APP_ENV=production`, từ chối secret mặc định/yếu.

```powershell
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

Frontend: **http://localhost:5173**; backend: **http://localhost:8000**; Swagger qua nginx: **http://localhost:5173/docs**. Compose giữ `./data:/app/data`, có restart policy/healthcheck. Đây là cấu hình chạy local, không phải URL production. Nếu tự host, cần cấu hình HTTPS, lưu trữ dữ liệu bền vững, backup và giám sát.

Nếu frontend ở Vercel riêng backend: root `travel-ui`, đặt **`VITE_API_BASE_URL=https://<backend-da-trien-khai>` trước build**, redeploy frontend. `vercel.json` chỉ giữ SPA rewrite, không trỏ cứng Railway cũ. Docs online nằm ở `<backend>/docs`; Docker nginx cũng proxy docs. `render.yaml` là cấu hình mẫu cho Render; dùng PostgreSQL/Neon hoặc storage bền vững cho dữ liệu production, không phụ thuộc SQLite tạm trong filesystem của container.

Các nhà cung cấp có thể chậm, giới hạn hoặc gián đoạn; cache/deadline/retry không bảo đảm uptime tuyệt đối. Bản môn học dùng tile OSM/FOSSGIS; phục vụ tải lớn cần dịch vụ và điều kiện sử dụng phù hợp, không tải tile hàng loạt hoặc coi nguồn cộng đồng là SLA.

## Cấu trúc mã nguồn

```text
configs/                  Tỉnh, alias và ràng buộc vùng tìm kiếm
data/                     Dữ liệu, feature, prediction và artifact tin
src/api/                  REST API, auth, DB, thời tiết, tin, cảnh báo
src/integrations/          Kết nối nguồn thời tiết, địa điểm, routing
src/train/                Pipeline huấn luyện model
travel-ui/src/            React, catalogue, i18n
travel-ui/tests/          Kiểm thử logic frontend
tests/                    Kiểm thử backend
scripts/                  Launcher, audit danh mục, đánh giá artifact
.github/workflows/ci.yml  Kiểm thử tự động
```

Tài liệu: [I18N.md](I18N.md), [LOCATION_SEARCH.md](LOCATION_SEARCH.md), [PERFORMANCE.md](PERFORMANCE.md).

### Google sign-in

Create a Google OAuth web client and register the exact frontend origin (for example http://localhost:5180) under Authorized JavaScript origins. Set GOOGLE_CLIENT_ID in the backend environment and VITE_GOOGLE_CLIENT_ID in travel-ui/.env.local to the same public client ID. Restart the backend and Vite, or rebuild the frontend for production. Docker Compose passes the backend client ID to the frontend build. The Google button appears when the frontend ID is configured.

The configured database stores the verified Google subject, display name and account email. Successful password and Google logins each add a UTC timestamp and provider to login_events. ID tokens are verified on the server and are not stored. A pre-existing password account with the same email keeps its original sign-in method.
