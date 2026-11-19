# Vietnam Travel Risk AI · Bản desktop

Bản ngày 19/11/2026 dùng trang chủ 3D để giới thiệu chức năng, rồi chuyển sang biểu mẫu và bản đồ để người dùng kiểm tra một chuyến đi thật. Khi demo trên trình duyệt, mở trang chủ, cuộn đến thẻ **Gia đình**, chọn hai địa điểm rồi mở đánh giá. Từ kết quả có thể đối chiếu thời tiết, tuyến đường và tin tức.

## Giao diện và kiến trúc

| Khu vực | Thay đổi |
| --- | --- |
| Trang chủ | Một cảnh Three.js xuyên suốt sáu chương. Camera di chuyển theo tiến độ cuộn. Trên desktop, nội dung nằm bên trái và thanh chuyển chương nằm bên phải. Phím mũi tên, Home và End hoạt động khi thanh chuyển chương có focus. |
| Phong cảnh | Địa hình, nước, rừng dùng instancing, cầu, chim, mây, sương và mưa. Có tuyến đường cùng vòng đánh dấu minh họa, chế độ ban đêm và sa bàn Việt Nam có ghim điểm đến ở chương cuối. |
| Khám phá | Thư viện ảnh có bốn sa bàn dựng riêng cho Hà Nội, Hội An, Hạ Long và TP.HCM. Có thể xoay, thu phóng, đổi góc nhìn, mở rộng và quay về bài giới thiệu. Bộ thẻ trải nghiệm hỗ trợ chuột, bàn phím và liên kết đến địa danh trong danh mục. |
| Trang khám phá nội bộ | Tìm tỉnh ngay đầu trang. Gõ từ khóa sẽ hiện danh mục khớp. Trên màn hình rộng, lịch nằm ở cột riêng. Khi ngữ cảnh có chuyến đi, cột này có đường dẫn đến kết quả và các dữ liệu tương ứng. |
| Bản đồ | Danh sách tỉnh, bộ lọc và lớp điểm dùng cùng tập dữ liệu. Chọn một tỉnh sẽ đổi điểm sáng, hiển thị ảnh và đưa bản đồ về địa phương đó. Khi đã có chuyến đi, màn hình bản đồ dùng hình tuyến của nhà cung cấp. Nền địa lý giản lược được đóng gói cục bộ để hiển thị trong khi tải bản đồ đường phố. |
| Lập kế hoạch, kết quả, thời tiết | Chọn loại chuyến đi ở trang chủ sẽ điền lựa chọn đó vào biểu mẫu. Kết luận hiện ngay với màu tương ứng. Trang thời tiết dùng dự báo của ngày đang xem và hiện lời khuyên theo đúng mục đích đã chọn. Hiệu ứng mưa trên trang dự báo phụ thuộc vào lượng mưa có trong kết quả. |
| Tài khoản và tiện ích | Trang đăng nhập dùng ảnh Hội An trong thư viện dự án. Trang lịch sử dùng trục thời gian. Trang so sánh hiện thang điểm báo chí lịch sử khi có số liệu. Tin tức, cảnh báo, hướng dẫn điểm đến và chủ đề trải nghiệm sử dụng chung điều hướng và kiểu trình bày. |

React Router và TravelContext tiếp tục quản lý phiên đăng nhập, thông tin chuyến đi và các yêu cầu đến FastAPI. Cảnh minh họa có vòng đời riêng. Three.js và OrbitControls được tải khi cần. Trình xem sa bàn kết xuất khi tương tác, thay đổi kích thước hoặc đổi góc nhìn. Khi ra khỏi cảnh hoặc ẩn tab, vòng vẽ cảnh nền tạm dừng. Khi đóng hoặc rời trang, các tài nguyên WebGL được giải phóng. Phiên bản Three.js trong manifest là `^0.187.0`. Các gói React, MUI, Leaflet và Framer Motion đã có trong ứng dụng.

## Hình ảnh và ý nghĩa dữ liệu

Các mô hình được tạo từ hình học trong mã nguồn. Hình Việt Nam ở cảnh cuối dùng đường biên khái quát tỷ lệ 1:110 triệu. Các kịch bản mưa, đêm và vùng màu ở trang chủ có nhãn minh họa. Tuyến, nhiệt độ và tin trong kết quả chuyến đi đến từ API hiện có. Lớp nhiệt trên bản đồ dùng điểm có cường độ hợp lệ của dữ liệu báo chí lịch sử.

Ảnh sử dụng nguồn đã ghi trong thư viện dự án. Bộ ảnh tham khảo cũ đã được lưu bên ngoài thư mục phục vụ web. [Nguồn ảnh trang chủ](../travel-ui/public/images/landing/PHOTO_CREDITS.md) · [Nguồn ảnh khám phá](../travel-ui/public/images/explore/PHOTO_CREDITS.json) · [Nguồn đường biên Natural Earth](../travel-ui/src/tourism/geography/SOURCE.md)

## Kiểm thử

| Phép kiểm | Kết quả |
| --- | --- |
| Frontend | ESLint, 30 bài kiểm thử Node và Vite production build thành công. Dự án dùng JavaScript và không khai báo lệnh typecheck riêng. |
| Backend | 224 bài pytest đạt. Hai kiểm thử ban đầu gặp lỗi quyền thư mục tạm của Windows. Chạy lại bằng thư mục tạm riêng hoàn tất toàn bộ bộ kiểm thử. |
| Luồng thật | Chọn **Gia đình** ở trang chủ, chọn điểm đi và đến qua autocomplete, gửi yêu cầu, xem kết luận, mở bản đồ và xem lời khuyên thời tiết. API trả về nhiệt độ, hình tuyến và trạng thái nguồn tin mới. Trình duyệt hiển thị cả nền địa lý cục bộ và tile đường phố. |
| Phủ các trang | 59 lượt ghi nhận khung nhìn Chrome ở 390, 820 và 1440 px. Đã sửa tràn ngang ở danh sách bản đồ và dịch nhãn mưa còn sót. Lần chạy lại không ghi nhận ngoại lệ JavaScript hay tràn ngang trong các mẫu này. |
| 3D và hỗ trợ truy cập | Kiểm tra canvas hoạt động, sáu chương, bốn trình xem sa bàn, chế độ giảm chuyển động, đóng hộp thoại bằng Escape và chuyển ngôn ngữ mà tọa độ điểm đến được giữ đúng. |
| Hiệu năng | First Contentful Paint đo trên Chrome localhost qua 59 lượt ghi nhận có trung vị 204 ms, khoảng 164–568 ms. Phép đo dùng cùng máy, nhiều lượt dùng cache. Chỉ số phản ánh lần vẽ đầu, không đo thời gian API hoàn tất hay hiệu năng máy người dùng thật. |

Ảnh được chụp từ bản chạy cục bộ. [Sáu chương trên desktop](cinematic-preview/journey-desktop.jpg) · [Các sa bàn và tương tác](cinematic-preview/interactions.jpg) · [Danh mục màn hình](ROUTE_COVERAGE.md)

## Kiểm tra riêng cho trình duyệt desktop

Đã dựng và thử trang chủ ở 1280 × 720, 1440 × 900 và 1920 × 1080. Cả ba khung giữ được tiêu đề trong vùng nhìn, hiện thanh chương và không tràn ngang. Phím End chuyển focus tới chương cuối. Trên Chrome headless, trình xem ở chế độ mở rộng chiếm 1905 px chiều rộng nội dung của cửa sổ 1920 px. Khi trình duyệt giới hạn Fullscreen API, ứng dụng mở rộng trong khung trang.

Ở phép thử tắt WebGL, trình xem hiển thị ảnh và vẫn mở rộng được. Phép thử trang so sánh cố ý làm một yêu cầu trả HTTP 503 rồi gửi lại qua API thật. Lần thử lại hiện kết quả. Với luồng chọn Gia đình từ trang chủ, bản đồ đường đi vẽ bảy đường viền địa lý nền và tải được tile đường phố.

Đã kiểm tra thêm Khám phá, Bản đồ và Lên hành trình ở cả ba kích thước. Ở 1280 px, lần đầu ảnh đầu trang Khám phá tràn sang cột lịch. Sau khi chỉnh khoảng cách hai cột, cả chín lượt kiểm tra bố cục đều đạt.

[Bố cục ba trang nội bộ](cinematic-preview/desktop-app.jpg) · [Ba kích thước desktop](cinematic-preview/desktop-widths.jpg) · [Trình xem và các luồng dữ liệu](cinematic-preview/desktop-workflows.jpg)

## Chạy để demo

Tại thư mục gốc repository trên Windows, chạy lệnh dưới đây. Frontend phát triển ở cổng 5180 và FastAPI ở cổng 8000. Lệnh kiểm thử giao diện là `npm run lint`, `npm test` và `npm run build` trong `travel-ui`. Các điều kiện về môi trường Python, Node và khóa dịch vụ có trong [hướng dẫn chạy](../RUNNING.md).

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/Start-Local.ps1 -NoBrowser
```

[Trang chủ cục bộ](http://localhost:5180/) · [API cục bộ](http://localhost:8000/docs)

## Phạm vi xác nhận

Ảnh và số liệu kiểm tra thuộc Chrome trên Windows. Hiệu năng GPU trên máy thật khác, mức độ tương thích Safari/Firefox và kết quả Lighthouse production chưa được đo. Các sa bàn thể hiện hình dáng gợi nhớ điểm đến. Lớp đường biên khái quát vẫn cần dịch vụ tile bên ngoài để xem chi tiết tên đường. OAuth Google, giao nhận Web Push bên ngoài và độ chính xác thống kê của mô hình trên dữ liệu thực địa cần kiểm tra riêng. Các thao tác xóa lịch sử, đăng ký nhận thông báo thật và triển khai công khai nằm ngoài lần kiểm thử giao diện này.
