# Báo cáo kiểm tra trước triển khai — 13/11/2026

## Phạm vi và kết luận

Đã chạy kiểm thử chức năng, tích hợp model, gọi dữ liệu thật, giao diện Chrome và build/chạy Linux Docker. Đợt này sửa lỗi và chuẩn bị mã nguồn, **không deploy website lên hosting**. Kết quả dưới đây là tại thời điểm kiểm tra, không bảo đảm mọi nhà cung cấp sẽ luôn đáp ứng hoặc chứng minh từng dòng code không còn lỗi.

## Kiểm thử tự động

| Phần | Kết quả |
| --- | --- |
| Backend Windows, Python 3.12 | **221 passed**; 1 cảnh báo deprecation của PyVi/NumPy |
| Backend Docker Linux, Python 3.11 | **220 passed, 1 skipped**; bỏ qua kiểm tra word segmentation vì PyVi là dependency training tùy chọn, không có trong runtime image |
| Frontend Node tests | **30 passed** |
| ESLint / Vite production build | Đạt |
| Docker backend / nginx frontend build | Đạt; chạy với APP_ENV=production, DB QA riêng và cổng chỉ bind localhost |
| Dependency consistency trong Docker | `pip check`: không có dependency bị hỏng |
| npm audit runtime dependencies | 0 lỗ hổng được registry báo trong lượt kiểm tra; không thay thế security audit |
| Audit catalogue | 90 nội dung, 34 tỉnh/thành, 81 ràng buộc vùng; kiểm tra ID/mapping/nguồn, không phải xác minh thực địa |

Máy Windows dùng Python dùng chung có xung đột click của package `browser-use` không thuộc dự án. Không sửa môi trường dùng chung; image Python sạch của dự án qua pip check và pytest. Khuyến nghị cài bằng venv hoặc Docker như README.

Kiểm thử backend bao gồm auth, token sai/hết hạn, giới hạn mật khẩu, lịch sử theo người dùng, vị trí/alias/địa chỉ sai vùng, nguồn routing thiếu, ngày tin và độ cũ, PM2.5 thiếu, song song I/O, feature/model thực và chuẩn hóa điểm. Các lỗi nguồn được mô phỏng ở unit test để có thể lặp lại; gọi mạng thật được kiểm tra riêng bên dưới.

## Gọi API dữ liệu thật

Chạy hai lượt cho 34 tỉnh/thành, mỗi lượt có lần gọi `/trip` đầu và gọi lại. Lượt thứ hai bắt đầu 21:02:54 giờ Việt Nam; dùng tọa độ tham chiếu công khai và tài khoản QA tách biệt nếu cần đăng nhập, không dùng địa chỉ nhà của người dùng.

- **34/34** request hành trình trả HTTP 200, có kết quả thời tiết từ Open-Meteo qua `AI_XGBOOST`.
- **34/34** có PM2.5 khả dụng và **34/34** tra cứu RSS khả dụng. “Khả dụng” không có nghĩa sự cố trong tiêu đề đã được xác minh hoặc mọi địa phương có bài phù hợp.
- Tọa độ đích API giữ nguyên lựa chọn. Kiểm tra này chứng minh không đổi đích trong pipeline, không chứng minh mọi đối tượng trên OSM đều được gắn tên/vị trí đúng ngoài thực địa.
- 33 tuyến có dữ liệu ở lượt xuất phát cố định TP.HCM; trường hợp TP.HCM trùng điểm đầu/đích không tạo route. Đã gọi lại TP.HCM từ Hà Nội và nhận route thật, **1.494 km**. Không tự tạo tuyến cho hai điểm trùng nhau.
- 16 trường hợp dự báo: 4 địa phương × 4 mục đích; tất cả trả **8 ngày**. PM2.5 theo ngày chỉ có **6/8 ngày** ở lượt kiểm tra, hai ngày còn lại không được điền giá trị giả để hiển thị.
- Tìm địa điểm cụ thể: Hồ Hoàn Kiếm, Chợ Bến Thành, Chợ Đà Lạt, Núi Bà Đen, Trường tiểu học Chu Văn An trả danh sách lựa chọn. Chuỗi địa điểm không tồn tại thử nghiệm trả danh sách rỗng, không bịa kết quả.
- Corpus model tin tức của 34 trường hợp đều **stale**. Điểm lịch sử không được lấy làm tín hiệu hiện tại; tin mới trong lượt này là phân tích tiêu đề RSS theo quy tắc.

Thời gian trên localhost + nhà cung cấp mạng thật, không phải cam kết tốc độ hosting:

| Lượt thứ hai | Median | P95 nearest-rank | Max |
| --- | ---: | ---: | ---: |
| `/trip` lần đầu | 5,313 s | 9,343 s | 9,656 s |
| Gọi lại | 0,016 s | 0,032 s | 7,469 s |
| Tìm tên tỉnh tham chiếu | 0,016 s | 0,047 s | 0,062 s |

Lượt đầu có median `/trip` 1,844 s; nguồn ngoài biến động theo thời gian. Gọi lại hai điểm trùng nhau không cache kết quả thiếu tuyến nên chậm hơn các kết quả đầy đủ. Tìm tỉnh tham chiếu là dữ liệu local; không dùng số đó quảng bá tốc độ tìm mọi địa chỉ chi tiết. Các phép đo là smoke/performance check, chưa là benchmark chịu tải production.

Số liệu rút gọn được lưu tại [live-summary-2026-11-13.json](docs/qa/live-summary-2026-11-13.json).

## Dữ liệu đi qua model

Đã tải lại artifact và đánh giá lại holdout bằng `python -m scripts.evaluate_release_models --output <report.json>`. Không fit, không đổi checkpoint hoặc dữ liệu huấn luyện.

| Model | Holdout | Metric thực |
| --- | --- | --- |
| XGBClassifier thời tiết | 68.985 dòng năm 2025, train trước đó năm 2023–2024, seed 42 | Balanced accuracy **0,9324108**, macro F1 **0,9533176** |
| TF-IDF/LogReg tin tức | 542 bài sau loại trùng với train, ngưỡng 0,5 | Precision/Recall/F1 **0,9002375**, average precision **0,9557772** |

SHA-256 artifact và metric từng lớp nằm trong [model-evaluation-2026-11-13.json](docs/qa/model-evaluation-2026-11-13.json). Lớp thời tiết 4 có 19 mẫu, recall **0,6842**, cần thêm đánh giá độc lập cho rủi ro hiếm. Không có cơ sở gọi đây là “độ chính xác an toàn du lịch 95%”. Chưa chứng minh tính đúng của tất cả nhãn hoặc hiệu quả ngoài thực địa.

Kiểm thử xác nhận feature engineering/encoding, thang 0–20 đổi sang 0–10, safety gate, suy luận model được tải, điều chỉnh mục đích không hạ cảnh báo nghiêm trọng, ngày được chọn không bị trộn với ngày khác. Tin RSS mới không chạy PhoBERT; tuyến đường không có model AI ùn tắc; tổng quan là quy tắc, không phải model tổng hợp đã huấn luyện.

## Frontend và API docs

Chrome kiểm tra bản dev và bản production nginx, gồm 18 trường hợp VI/EN/public/protected/mobile, 5 luồng đăng nhập/Back/Forward/đăng xuất, 2 kiểm tra form bắt buộc, 2 kiểm tra bản đồ desktop/mobile và 5 kiểm tra menu Tools/keyboard. Các lượt đạt không ghi nhận runtime JavaScript exception. Một lượt Chrome chạy song song không khởi động được; chạy lại độc lập đã đạt, không coi lượt không chạy là kết quả đạt.

Bản đồ đã tải 9 raster tile thực cùng tuyến/marker trong kiểm tra. Không dùng CARTO tile đòi key. Đây không phải xác nhận quyền/công suất sử dụng tile cho dịch vụ thương mại hoặc tải lớn.

Nginx production trả 200 cho các trang SPA được thử, `/health`, `/docs`, `/redoc`, `/openapi.json`. Schema có **33 paths**, BearerAuth và khai báo security cho lịch sử. Đăng ký QA, đăng nhập, `/me`, `/trip` có auth và đọc lịch sử chạy qua API/nginx thành công. Unit test bao phủ quyền đọc/xóa lịch sử. Cập nhật [API.md](API.md) để giải thích ý nghĩa dữ liệu và lỗi từng phần.

## Lỗi đã sửa trong đợt này

1. Model crash/NaN từng có thể bị đổi thành thời tiết nguy hiểm tối đa; nay trả unavailable/503. Safety gate chỉ dùng điều kiện thực sự đạt ngưỡng.
2. Response thời tiết thiếu chỉ số chính từng được điền giá trị mặc định thuận lợi; nay không tạo kết quả giả. Ngày dự báo thiếu dữ liệu không được tự dựng chỉ số.
3. Điểm tin đã phân loại còn mới chưa được tổng quan xét nhất quán; đã xét mức vừa/cao, đồng thời không dùng điểm corpus stale hoặc tiêu đề chưa xác minh để tự kết luận no-go.
4. Loại bỏ kết nối Vercel trỏ cứng backend Railway cũ; dùng VITE_API_BASE_URL khi build riêng frontend. Thêm proxy API docs qua nginx.
5. Production từ chối JWT secret mặc định/yếu, DB hoặc model không khởi động được; chặn endpoint debug trong production. Token payload sai bị từ chối; mật khẩu quá giới hạn bcrypt không bị cắt ngầm.
6. Hoàn thiện các thay đổi UI đang có: chọn địa chỉ, ngày/mục đích bắt buộc, lời khuyên trong trang chi tiết, bản đồ/tuyến, menu Tools, VI/EN, đường quay về trang chủ từ login.
7. README viết lại đúng môn Phát triển ứng dụng Web, cập nhật AI/runtime, hướng dẫn local/Docker/API docs và giới hạn hiện tại.

## Còn cần làm trước vận hành online

**Chưa deploy theo yêu cầu người dùng.** Backend Railway cũ trả 404; URL frontend cũ còn trả HTML nhưng không đủ xác nhận hệ thống online hoạt động. Cần chọn hosting, cấu hình backend/HTTPS/domain, secret thật, lưu trữ SQLite bền vững và frontend API base, rồi test lại từ Internet.

Web Push đã có unit test và UI, chưa kiểm tra gửi tới thiết bị thật ở HTTPS production; chưa có scheduler định kỳ. Lịch sử là snapshot `/trip` hiện tại, không phải lưu trọn kết luận dự báo tương lai của frontend. Dịch vụ bản đồ/geocoding/routing/không khí có thể thiếu hoặc chậm; không cam kết luôn đủ mọi trường.

Chưa thực hiện pentest, kiểm thử mọi thiết bị/trình duyệt hoặc thử tải dài hạn. Các dependency/nhà cung cấp ngoài có thể thay đổi. Không có bộ test nào chứng minh toàn bộ mã nguồn không còn sai sót. Các giới hạn này được nêu để phân biệt điều đã chạy với điều chưa kiểm chứng, không tự bịa kết quả nghiệm thu.

Không thêm checkpoint hoặc thay artifact. Model v4 cũ hơn 100 MB đã được quản lý Git LFS từ lịch sử (Git lưu pointer 134 byte), không dùng trong runtime và không được stage lại như blob thường. `.env`, SQLite, cache, môi trường ảo, node_modules và log QA không nằm trong commit.
