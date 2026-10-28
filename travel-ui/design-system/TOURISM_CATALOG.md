# Danh mục du lịch theo 34 tỉnh/thành

## Phạm vi và nguồn

Danh mục hiện có 34 tỉnh/thành hiện hành (28 tỉnh, 6 thành phố trực thuộc trung ương), đối chiếu Nghị quyết 202/2025/QH15 trên Cổng thông tin Chính phủ. 63 tên tỉnh/thành trong dữ liệu cũ được gán đúng một lần vào địa phương hiện hành. Huế được xử lý riêng theo Nghị quyết 175/2024/QH15, trên cơ sở tỉnh Thừa Thiên Huế; không mô tả đây là một vụ hợp nhất năm 2025.

- Nghị quyết 202: https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-quyet-so-202-2025-qh15-ve-sap-xep-don-vi-hanh-chinh-cap-tinh-119250612174148722.htm
- Huế: https://baochinhphu.vn/thanh-lap-thanh-pho-hue-truc-thuoc-trung-uong-102241205150328922.htm

90 bài giới thiệu được biên tập riêng cho dự án, mỗi tỉnh có ít nhất hai gợi ý. Đây là danh mục chọn lọc, không phải toàn bộ điểm du lịch Việt Nam. Nguồn tham khảo gồm Vietnam Tourism/Cục Du lịch Quốc gia Việt Nam, cổng du lịch Khánh Hòa, nguồn nhà nước, báo địa phương và Wikipedia; từng bài hiển thị liên kết cụ thể. Các nguồn bài địa danh được đối chiếu qua MediaWiki và đọc phần giới thiệu; các nguồn chính thức thay thế được kiểm tra riêng. Không đưa giá vé, giờ mở cửa hoặc cam kết an toàn chưa được xác minh vào nội dung.

Rà soát nguồn đã phát hiện và sửa các tên trùng/chuyển hướng: Mai Châu sang địa danh ở Trung Quốc, Biển Hồ sang trang định hướng, Pu Sam Cáp sang xã hành chính, Mộc Châu/Mù Cang Chải sang trang định hướng, bánh ít lá gai sang bánh gai miền Bắc. Ảnh không đúng đã được loại bỏ; một số bài dùng ảnh khu vực có nhãn và chú thích rõ.

78 ảnh Commons được lưu WebP, kèm tên tác giả, trang gốc, giấy phép và mô tả thay đổi trong `public/images/explore/PHOTO_CREDITS.json` và `src/tourism/catalog/media.json`. Chỉ nhận CC BY, CC BY-SA, CC0 hoặc public domain. Ảnh món ăn minh họa loại món, không xác nhận quán ăn hay nơi chụp. Ảnh không có giấy phép rõ không được tải vào dự án. Không sao chép ảnh/logo/mã nguồn Discover HCMC.

## Cấu trúc và điều hướng

- `src/tourism/catalog/provinces.js`: danh mục hiện hành, đối chiếu tên cũ, tìm không dấu và adapter điểm bản đồ.
- `src/tourism/catalog/places.js`: bài địa điểm, món ăn, văn hóa; khu vực dữ liệu lịch sử và nguồn tham khảo.
- `src/tourism/catalog/media.json`: thông tin nguồn ảnh và giấy phép.
- `ExploreComponents.jsx`, `ExploreGuide.css`: năm nhóm trải nghiệm, thẻ tỉnh/địa điểm, banner, nguồn và bảng địa giới.
- `/explore`: danh mục 34 tỉnh, tìm theo tên mới/cũ, lọc vùng, phân trang và bảng đối chiếu.
- `/explore/:provinceId`: phần giới thiệu tỉnh, địa phương cấu thành, các gợi ý và lọc trải nghiệm.
- `/explore/:provinceId/:placeId`: nội dung chi tiết, hoạt động tìm hiểu, nguồn, ảnh, liên kết bản đồ và đánh giá khu vực.
- `/experiences/:categoryId`: đô thị, di sản, ẩm thực, thiên nhiên, văn hóa/làng nghề; lọc tỉnh và từ khóa.

Các trang khám phá mở công khai; thao tác đánh giá đưa người chưa đăng nhập qua luồng đăng nhập hiện có và giữ lại khu vực đã chọn. Trang chủ sử dụng cùng lưới trải nghiệm 3 thẻ phía trên, 2 thẻ căn giữa phía dưới ở desktop, thích ứng sang mobile.

## Tương thích dữ liệu rủi ro

Không đổi dữ liệu nguồn, config tỉnh lịch sử, trọng số model, nhãn hoặc công thức risk score. API `/map/points` vẫn trả 66 bản ghi có sẵn; giao diện ánh xạ thành 34 mốc hiện hành và bỏ các bản ghi vùng tổng hợp khỏi danh sách hành chính. Tọa độ là điểm tham chiếu từ một khu vực cũ, không phải đường ranh giới hay trung tâm hành chính mới được khảo sát.

Mỗi mốc giữ `dataProvince` để truy vấn `/risk` theo đúng khu vực cũ. Không tự cộng/trung bình hóa điểm rủi ro các tỉnh thành một điểm mới. Lớp nhiệt và nguồn tin vẫn ghi phạm vi lịch sử. Danh sách điểm xuất phát dùng 34 tên hiện hành, giữ GPS để chọn vị trí thật.

Ví dụ: Hội An được đặt trong trang Đà Nẵng hiện hành nhưng nút đánh giá gửi `Quảng Nam`, đúng vùng dữ liệu cũ và có giải thích trên trang. Bánh pía nằm trong Cần Thơ hiện hành, còn phạm vi tra cứu là Sóc Trăng cũ. Thông tin không được trình bày như dự báo riêng cho từng điểm tham quan.

## Kiểm tra và cập nhật

`node scripts/check-tourism-catalog.mjs` kiểm tra 34 địa phương/6 thành phố/63 tên cũ, tính duy nhất, phạm vi bài, nguồn và giấy phép, file ảnh, tìm tên cũ không dấu và adapter lịch sử. `npm run lint`, `npm run build` kiểm tra frontend.

`node scripts/visual-review.mjs --catalog` chạy kiểm tra browser ở các route mới khi preview localhost:4173 đang chạy. Fixture chỉ tồn tại trong browser profile kiểm tra; không trở thành dữ liệu ứng dụng. Báo cáo browser và ảnh chụp nằm trong thư mục artifacts được Git bỏ qua.

Script thu thập nguồn/ảnh: xuất `places` từ places.js thành `artifacts/tourism-guide/places.json`, rồi chạy `python scripts/collect-tourism-media.py`. Cần requests và Pillow; không thêm dependency frontend. Đây là công cụ hỗ trợ kiểm tra nguồn, không thay thế rà soát thủ công về đúng địa danh/nội dung ảnh. Giữ lựa chọn ảnh thủ công có chú thích trong manifest đã commit.
