> Bản ghi giao diện 18/11. Giao diện desktop hiện tại, cảnh Three.js và kết quả kiểm thử nằm trong [báo cáo ngày 19/11](docs/REDESIGN_IMPLEMENTATION_REPORT.md).

# Giao diện tham khảo TripGuardian — 18/11/2026

Tham khảo trực tiếp trang chủ và trang đăng nhập tại https://tripguardian.visioncare-host.uk/.
Giữ thương hiệu Vietnam Travel Risk AI, danh mục Việt Nam, API và cách đánh giá của dự án hiện tại. Không thêm các tuyên bố về 1.773 điểm Đà Lạt, Google login, lịch từng giờ hay mô hình 3D điểm đến của website mẫu vì dự án này chưa có các chức năng đó.

## Thiết kế được áp dụng

- Be Vietnam Pro cho giao diện, Playfair Display ở khung đăng nhập; font phục vụ từ local.
- Nền trung tính #f6f6f6, chữ #191919, điểm nhấn cam đất #b4532a, nút chính #2b2720. Đăng nhập dùng xanh lá #15513f và nền sage.
- Thanh điều hướng nổi, bo tròn, kính mờ; dropdown, menu mobile, ngôn ngữ VI/EN và điều hướng bàn phím.
- Trang chủ kể chuyện theo cuộn: nền cảnh quan nhiều lớp chuyển ảnh/zoom nhẹ, năm chương, nút chuyển chương, thẻ ảnh, FAQ và CTA.
- Khung đăng nhập/đăng ký giữa màn hình, ảnh phong cảnh, nhân vật phản hồi khi nhập mật khẩu; nút hiện/ẩn mật khẩu và đường quay về trang chủ.
- Thanh công cụ bên trái ở desktop cho khu vực đăng nhập; panel, biểu mẫu, thời tiết, bản đồ, tin, lịch sử và so sánh dùng cùng theme. Trên tablet/mobile dùng menu gọn và bố cục dọc.
- Respect prefers-reduced-motion: tắt hiệu ứng lặp và chuyển chương tức thì; luôn giữ văn bản/nút chức năng.

## Phạm vi nền chuyển động

Nền trang chủ là ảnh WebP nhiều lớp cùng hiệu ứng scroll/parallax, **không phải mô hình địa hình WebGL có thể xoay/tương tác 3D**. Không sử dụng nó như bản đồ thật hoặc bằng chứng vị trí địa điểm. Bản đồ hành trình vẫn dùng dữ liệu và polyline dịch vụ hiện có.

## Tệp chính

`LandingPage.jsx/css`, `GuardianTheme.css`, `WorkspaceNavigation.jsx`, `AuthLayout.jsx/css`, `SiteChrome.jsx`, theme MUI trong `TravelPortal.jsx`, `i18n/guardian.en.json`.
Nguồn ảnh tham khảo được ghi tại `public/images/guardian/ASSET_SOURCES.json`; không tự nhận quyền tác giả hoặc tự gán giấy phép mới cho ảnh. Font Playfair Display giữ OFL gốc trong `public/fonts/guardian/OFL.txt`; Be Vietnam Pro dùng package @fontsource đã có trong dự án.

Chỉ thay giao diện và tương tác trình bày. Không sửa dataset, model, trọng số, rule kết luận, API backend hay dữ liệu tài khoản. Chưa deploy bản redesign.

## Kiểm tra bản redesign

30 bài frontend test đạt; ESLint và production build đạt. Chrome: 18 kiểm tra trang/VI–EN và giữ tọa độ, 8 kiểm tra auth/Back/Forward/menu mobile/hiện mật khẩu/reduced-motion, 2 kiểm tra bản đồ desktop/mobile đều đạt. Bản đồ tải 9 tile thật cùng tuyến/marker. Không ghi nhận runtime JavaScript exception trong các lượt đạt.

Ảnh giao diện và profile browser thử nghiệm được lưu ngoài repository. Khi ổ C hết dung lượng, profile/cache kiểm thử và npm cache được chuyển sang thư mục QA trên ổ D bằng cấu hình của phiên chạy; không xóa dữ liệu cá nhân hoặc thay cấu hình hệ thống toàn cục.
