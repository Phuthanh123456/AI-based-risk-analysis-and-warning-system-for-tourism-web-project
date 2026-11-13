# Tốc độ tìm địa điểm và đánh giá chuyến đi

Kiểm tra tại máy phát triển Windows ngày 12/11/2026 với FastAPI chạy một process,
frontend Vite và các dịch vụ bản đồ/thời tiết thật. Đây là số đo local, không phải
cam kết thời gian phản hồi trên hosting hay kiểm thử toàn bộ địa chỉ ở Việt Nam.

## Nguyên nhân và thay đổi

Trước đây, các lượt tìm địa điểm cùng chờ một khóa toàn cục giữ xuyên suốt lúc
gọi HTTP và nghỉ giữa các lượt. Các truy vấn cũ vì thế có thể chặn truy vấn mới.
Endpoint tìm kiếm còn dùng chung thread pool với việc đánh giá chuyến đi.

Hiện tìm kiếm chạy bằng HTTP bất đồng bộ với kết nối tái sử dụng, không giữ khóa
trong lúc gọi mạng. Truy vấn trùng nhau dùng chung một tác vụ. Cache thành công
ở backend có hạn sáu giờ, tối đa 1.000 mục; kết quả rỗng chỉ giữ năm giây và lỗi
dịch vụ không được cache. Các điểm tham chiếu tỉnh/thành được lấy từ cấu hình.

Frontend đợi 220 ms sau khi gõ, hủy lượt tìm cũ và cache tối đa 200 mục trong bộ
nhớ trình duyệt trong mười phút. Viết hoa hoặc bỏ dấu vẫn tận dụng cùng cache.
Không lưu cache địa chỉ vào localStorage. Chỉ giữ gợi ý cũ còn khớp nội dung tìm;
người dùng phải chọn địa điểm với địa chỉ và tọa độ cụ thể.

Mỗi lượt gọi nhà cung cấp có ngân sách tổng mặc định 2,5 giây. Tối đa tám truy vấn
khác nhau chạy đồng thời trên mỗi process; vượt mức trả trạng thái `busy` để thử
lại, thay vì xếp hàng không giới hạn. Frontend có deadline 3,4 giây, thử lại một
lần khi bận trong deadline đó, và hiển thị nút thử lại khi dịch vụ không sẵn sàng.
TrackAsia được ưu tiên; Photon được gọi sau 300 ms nếu cần. Khi có kết quả, lượt
còn lại bị hủy. HTTP 429 kích hoạt khoảng nghỉ theo Retry-After; các lỗi liên tiếp
cũng kích hoạt khoảng nghỉ. Demo provider có giới hạn nhịp gọi riêng mỗi process.
Kết quả trùng mức độ khớp được sắp theo khoảng cách với điểm xuất phát; thông tin
địa phương trong câu tìm vẫn được ưu tiên. Không tự tạo tọa độ cho địa chỉ thiếu.

Đánh giá chuyến đi nạp dữ liệu tin tức một lần, có khóa để tránh nhiều lần đọc
đồng thời. Parser ngày dùng ISO/RFC trước khi fallback pandas, giữ nguyên ngày
theo dữ liệu gốc. Việc đọc dữ liệu không còn chặn khởi chạy thời tiết/tuyến đường.
Thời tiết và chất lượng không khí được lấy song song; việc thiếu dữ liệu vẫn
được thông báo rõ, không điền số giả để làm kết quả có vẻ đầy đủ.

## Kết quả đo thực tế

| Tình huống | Kết quả |
| --- | --- |
| Bốn địa điểm khác nhau tìm đồng thời, chưa cache | Trước: 9,562 s; sau: 1,437 s cho cả nhóm, đủ 4/4 kết quả |
| 34 tỉnh/thành từ cấu hình | 34/34 có kết quả; chậm nhất 31 ms |
| 12 lượt tìm địa điểm đại diện, chưa cache | 12/12 có kết quả; trung vị 258 ms, chậm nhất 860 ms |
| Lặp lại 12 địa điểm đã cache | 12/12 có kết quả; chậm nhất 16 ms |
| 20 lượt cùng một truy vấn mới | 20/20 có kết quả; chậm nhất 328 ms |
| 30 health check trong khi tìm kiếm đồng thời | 30/30 HTTP 200; chậm nhất 32 ms |
| Gõ nhanh Hồ Hoàn Kiếm trên trình duyệt | Một request cho cả câu; 356 ms và 1.720 ms sau phím cuối ở hai lần đo |
| Gõ lại tên bỏ dấu/viết hoa trên trình duyệt | 89–101 ms; không phát sinh request mới |
| Nạp lạnh 8.378 bản ghi tin tức, đo riêng | 5,302 s xuống 0,745 s |
| Luồng trình duyệt chọn địa điểm đến kết quả, lần đầu | 18,417 s xuống 4,556 s |

Các địa điểm thử gồm Hồ Hoàn Kiếm, Hồ Tây, Chợ Bến Thành, Chợ Đà Lạt, Đại Nội,
Cầu Rồng, Cầu Trường Tiền, Chùa Thiên Mụ, Dinh Độc Lập, Hồ Xuân Hương, Tràng An
và địa chỉ 2 Nguyễn Huệ, TP.HCM. Đây là mẫu kiểm tra đại diện, không bao phủ mọi
ngõ/hẻm hoặc mọi địa chỉ. Độ trễ mạng và giới hạn nhà cung cấp có thể thay đổi.

Kiểm tra tự động: 199 test backend, 14 test logic frontend và bốn kiểm tra trình
duyệt đều đạt. Các test tìm kiếm dùng dịch vụ giả lập có kiểm soát để kiểm tra
deadline, hủy tác vụ, truy vấn trùng, quá tải, lỗi provider và HTTP 429; không cần
gây tải lớn lên API công cộng.

Chạy từ thư mục gốc repository:

```powershell
python -m pytest -q
cd travel-ui
npm test
npm run lint
npm run build
```

## Khi triển khai

Đặt `TRACKASIA_SEARCH_KEY` bằng key riêng trên server. `public_key` chỉ phục vụ
thử nghiệm; Photon công cộng cũng có năng lực giới hạn. Có thể đặt `PHOTON_API_URL`
trỏ tới dịch vụ Photon riêng. `PLACE_SEARCH_BUDGET_SECONDS` điều chỉnh ngân sách
backend; nếu tăng quá deadline frontend thì phải điều chỉnh client tương ứng.
Key không được đưa vào biến `VITE_*` hoặc mã phía trình duyệt.

Cache, giới hạn đồng thời và khoảng nghỉ hiện nằm trong bộ nhớ từng process,
không phải Redis dùng chung. Khi chạy nhiều worker/replica cần quota tổng ở
gateway hoặc dịch vụ cache/rate limit dùng chung, cùng kế hoạch phù hợp của nhà
cung cấp. Cần đo lại tải theo lượng người dùng dự kiến trên hosting thực tế.
Các số đo ở trên không xác nhận tải production, uptime hoặc SLA.

Hosting miễn phí có thể ngủ và gây cold start; tối ưu này không loại bỏ thời gian
đánh thức server. Khuyến nghị instance luôn hoạt động cho buổi demo. Với cấu hình
Render hiện tại, SQLite trên filesystem tạm cũng chưa đảm bảo dữ liệu tài khoản
tồn tại qua redeploy; cần storage bền vững trước khi dùng chính thức.
