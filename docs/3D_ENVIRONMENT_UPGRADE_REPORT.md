# Môi trường 3D của Vietnam Travel Risk AI

## Cách trải nghiệm

Mở trang chủ trên trình duyệt máy tính. Cuộn lên hoặc xuống để đi qua sáu chương của câu chuyện. Chọn **Khám phá 360°** để mở sa bàn. Ba bưu ảnh trên trang chủ cũng đưa người xem thẳng đến một điểm dừng.

Trong sa bàn, kéo chuột để xoay trọn vòng, cuộn để thay đổi khoảng cách và giữ Shift khi kéo để di chuyển ngang. Trên màn hình cảm ứng có thể xoay bằng một ngón, thu phóng hoặc di chuyển bằng hai ngón. Bàn phím có thể điều khiển khi khung cảnh nhận tiêu điểm. Các phím mũi tên xoay góc nhìn, Shift kết hợp phím mũi tên di chuyển tâm nhìn, phím cộng và trừ thay đổi khoảng cách.

Chọn bưu ảnh hoặc tên Sa Pa, Đà Lạt, Tràng An để bay đến điểm dừng và mở cẩm nang tương ứng. Hai góc **Cầu qua sông** và **Rừng núi** dành cho người muốn xem địa hình gần hơn. **Tham quan tự động** lần lượt đi qua các làng. Thao tác kéo tiếp quản camera ngay. **Toàn cảnh** trở về góc rộng, **Về trang chủ** hoặc Esc trở lại phần đang đọc. Nút toàn màn hình dùng API của trình duyệt khi được hỗ trợ.

## Từ ảnh tham khảo đến cảnh mới

Ở góc mở đầu của TripGuardian, phần chữ nằm bên trái, làng và rừng chiếm nửa phải và lớp núi xa nhạt dần. Bốn ảnh người dùng cung cấp bổ sung chi tiết về tầng địa hình, ruộng bậc thang và tỷ lệ nhà so với núi. Cảnh cũ của dự án dùng một lưới đồi, các tầng hình nón cho cây, một mặt phẳng nước và vài khối mây. Cảnh mới dùng một thung lũng có dòng sông, cầu và đường dẫn tới các cụm dân cư. Các ảnh nhỏ ở trang chủ mở trực tiếp góc nhìn bên trong sa bàn.

## Địa hình, công trình và chuyển động

Lưới địa hình chia thành 25 mảnh. Vùng trung tâm có độ phân giải cao nhất. Các lớp nhiễu nhiều tần số làm lệch đường sống núi, tạo biến thiên sườn dốc và lòng sông. Mặt nước mở rộng thành hồ, ruộng có cao độ bậc và hàng trồng men theo đường đồng mức. Vật liệu pha màu đất, bờ sông, đá và cây theo độ dốc, độ cao và vùng canh tác. Đường dùng spline và lấy mẫu trên chính các tam giác hiển thị để giảm hiện tượng xuyên mặt đất khi đổi chất lượng.

Cây lá kim, cây lá rộng, tre, cây hoa, bụi, cỏ và đá dùng các mẫu hình học tái sử dụng. Bộ sinh cố định hạt giống để làng và rừng nằm đúng chỗ giữa các lần mở. Các cụm cây được chia theo không gian để cắt phần ngoài khung nhìn và đổi độ chi tiết theo khoảng cách. Gió làm lệch ngọn cây và lá cỏ trong vertex shader.

Nhà được ghép từ thân, mái dốc, hàng ngói, cửa, hiên và trụ. Cụm dân cư có đèn ven đường, cầu có lan can và trụ đỡ. Bến ven nước có thuyền nhỏ. Nhà kính nằm ở cụm cao nguyên. Xe chạy theo đường cong, cửa sổ và đèn sáng dần về đêm. Lộ trình được tô dần khi chọn một điểm đến. Đường này minh họa chuyến tham quan sa bàn. Người dùng xem đường đi thực tế của chuyến đi ở trang Bản đồ.

## Ánh sáng, nước và thời tiết

Cảnh dùng nắng định hướng, ánh sáng bán cầu, ACES filmic tone mapping, bóng đổ ở các mức đồ họa từ Vừa trở lên và màu che bóng được đưa vào tán lá. Sắc trời, mật độ sương, cường độ sáng và độ ướt của đất chuyển dần theo lựa chọn. Các lớp mây và sương thấp dùng họa tiết nhiễu có độ trong suốt. Nước dùng shader mô phỏng dòng chảy, gợn, màu nước nông, ánh phản chiếu theo góc nhìn và phản quang mặt trời.

Có 12 lựa chọn gồm trời quang, bình minh, nắng chiều, hoàng hôn, chạng vạng, ban đêm, nhiều mây, gió mạnh, sương mù, mưa, mưa lớn và giông. Vệt mưa được tính trên GPU. Giông tăng mưa và gió, với thay đổi ánh sáng chậm. Cảnh đêm có sao, đèn đường và cửa sổ sáng. Người dùng được thông báo đây là thời tiết minh họa.

## Dữ liệu đánh giá

Ở phiên đăng nhập có kết quả đánh giá, sa bàn dùng bộ tổng hợp hiện có của trang Kết quả cho ba yếu tố thời tiết, đường đi và tin địa phương. Nếu phản hồi có tọa độ phù hợp và có ít nhất một yếu tố khả dụng, mục **Chuyến đi đã đánh giá** mở hình Việt Nam với điểm đánh dấu đúng kinh độ, vĩ độ. Bảng bên cạnh hiện tên điểm đến thực tế, ngày áp dụng và kết luận của chuyến đi. Điểm thời tiết chỉ xuất hiện khi có giá trị. Khi điểm thực tế ở gần một trong ba điểm dừng minh họa, bưu ảnh tương ứng cũng hiển thị kết luận. Đánh giá chỉ áp dụng cho chuyến đi đã tra cứu.

## Hiệu năng và nguồn tài sản

| Đồ họa | Số cây mục tiêu | Lượt rải cỏ | Độ phân giải bóng |
| --- | ---: | ---: | ---: |
| Thấp | 1.500 | 1.400 | Tắt |
| Vừa | 3.600 | 4.300 | 1.024 |
| Cao | 6.800 | 9.000 | 2.048 |
| Rất cao | 10.400 | 16.000 | 2.048 |

Các số trên mô tả ngân sách dựng cảnh. Số cây nhìn thấy trong mỗi khung hình phụ thuộc góc máy. Chế độ tự động xét kích thước màn hình, số luồng CPU và bộ dựng hình phần mềm, rồi có thể hạ độ phân giải nếu các khung liên tiếp mất nhiều thời gian. Bộ dựng chỉ tải khi cần và dừng vòng vẽ khi cảnh ra khỏi màn hình hoặc tab bị ẩn. Trang chủ và chế độ khám phá dùng chung canvas. Đổi mức đồ họa sẽ dựng lại tài nguyên theo ngân sách mới.

Hình học, shader, họa tiết mây, mái nhà, vân đất và các chuyển động được tạo trong mã của dự án. Bưu ảnh dùng ảnh đã có trong danh mục du lịch. Thông tin nguồn ảnh được lưu tại [danh mục media](../travel-ui/src/tourism/catalog/media.json). Hình bản đồ sử dụng [đường bao có sẵn trong dự án](../travel-ui/src/tourism/geography/vietnam.json). Không bổ sung mô hình hoặc hình ảnh tải từ TripGuardian.

## Kiểm tra và giới hạn

Các lần duyệt bằng Chrome trên localhost bao gồm góc mở đầu, chuyển giữa trang và hộp khám phá, góc rộng, làng, cầu, rừng, ảnh điểm đến, quay camera, tham quan tự động, đổi thời tiết, toàn màn hình, chế độ ảnh và màn hình hẹp. Trong lần tinh chỉnh hình ảnh, sắc nước bình minh được giảm lóa, đường bám theo lưới địa hình hiển thị, vật liệu mái được bổ sung đường ngói và các ruộng có thêm hàng trồng.

Bộ kiểm thử frontend chạy đủ 30 bài. Bộ backend chạy đủ 224 bài với hai cảnh báo. ESLint và Vite production build được chạy riêng. Dự án JavaScript hiện không khai báo lệnh type-check riêng. Kiểm tra trình duyệt dùng Chrome với SwiftShader. FPS trên GPU thật, điều khiển cảm ứng trên máy thật và tải nhiều người dùng trên máy chủ triển khai cần được đo riêng.

Sa bàn là phong cảnh sáng tác lấy cảm hứng từ các điểm đến. Tên làng, nhà, cự ly và đường trong cảnh phục vụ trải nghiệm minh họa. Bề mặt nước và sương dùng xấp xỉ thời gian thực trên trình duyệt. Ảnh kiểm tra lớp đánh giá sử dụng một phản hồi API đã lưu trong môi trường kiểm thử riêng. [Xem các ảnh kiểm tra](./3d-environment-preview/).


**Đối chiếu trên trình duyệt.** Cả bốn mức dựng được lần lượt 1.500, 3.600, 6.800 và 10.400 cây. Khi chuyển thủ công sang mức Rất cao, Chrome dùng SwiftShader mất khoảng 21–25 giây trong hai lượt kiểm tra. Phép đo bao gồm thời gian đổi cảnh và dựng khung đầu tiên. Trên môi trường này, thiết lập Tự động chọn mức Thấp. Trình duyệt xác nhận toàn màn hình hoạt động, kéo chuột dừng tour và chế độ giảm chuyển động mở được giao diện ảnh. Trong phiên phát triển, thư viện chuyển động có một thông báo về định vị phần tử theo dõi cuộn. Các thao tác cuộn và quay lại trang chủ đã được thử trực tiếp.

Ảnh tiêu biểu gồm [trang chủ desktop](3d-environment-preview/hero.jpg), [khu làng ở mức Rất cao](3d-environment-preview/ultra-settlement.jpg), [rừng ở mức Cao](3d-environment-preview/high-forest.jpg), [cầu và sông](3d-environment-preview/bridge.jpg), [cảnh đêm](3d-environment-preview/night.jpg) và [kiểm tra lớp đánh giá bằng phản hồi API đã lưu](3d-environment-preview/risk-overlay.jpg).