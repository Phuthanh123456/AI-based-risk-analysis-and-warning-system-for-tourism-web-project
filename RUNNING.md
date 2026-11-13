# Chạy lại ứng dụng và chuẩn bị vận hành

## Trên máy Windows

Sau khi tắt hoặc khởi động lại máy, Python/Uvicorn và Vite đều dừng. Mở lại tab
trình duyệt không khởi động backend. Trong thư mục dự án, bấm đúp `START-WEB.cmd`.
Script tự xác định thư mục dự án, mở backend và frontend ở nền, đợi cả API trực
tiếp và proxy frontend trả `/health` thành công rồi mới mở `http://localhost:5180`.
Chạy lại script không tạo thêm tiến trình khi các cổng đã có đúng ứng dụng.
Nếu cổng thuộc ứng dụng khác, script báo lỗi thay vì tắt ứng dụng đó.

Yêu cầu đã cài Python cùng `requirements.txt`, Node.js và đã chạy `npm ci` trong
`travel-ui`. Script ưu tiên `.venv`, sau đó Python 3.12 trong LocalAppData và lệnh
`python` trên PATH. Không tải thêm thư viện hoặc thay đổi `.env` khi khởi động.

```powershell
# Khởi động lại cả hai dịch vụ, không mở thêm tab trình duyệt
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/Start-Local.ps1 -Restart -NoBrowser

# Tùy chọn: tự chạy ở nền khi người dùng này đăng nhập Windows
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/Start-Local.ps1 -InstallAutoStart

# Gỡ tùy chọn tự chạy
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/Start-Local.ps1 -RemoveAutoStart
```

Tự chạy được thực hiện bằng shortcut riêng trong thư mục Startup của người dùng,
không phải Windows service. Nó chạy sau khi đăng nhập, không chạy khi máy tắt,
không tự bật máy hoặc khởi động trước đăng nhập. Tùy chọn này chưa tự bật chỉ vì
file được thêm vào dự án. Log nằm tại `%LOCALAPPDATA%\VietnamTravelRisk\logs`.
Nếu worker bị dừng sau khi đã khởi động, chạy lại launcher; launcher local chưa
phải bộ giám sát tiến trình chạy liên tục.

## Phục hồi dữ liệu trên giao diện

Trang kết quả có thể khôi phục kết quả thiếu nguồn đã lưu trong trình duyệt.
Ứng dụng hiện tự thử tra cứu lại khi mở các trang chi tiết, mạng trở lại hoặc
quay lại tab. Chỉ chạy với hành trình có tọa độ đã chọn, tab đang hiển thị và có
đăng nhập. Giới hạn ba lần tự thử mỗi đợt/hành trình, cách ít nhất một phút;
sau đó người dùng vẫn có thể bấm cập nhật. Không gửi thêm lịch sử hành trình
cho các lượt tự phục hồi. Không tự điền điểm khi nguồn chưa phản hồi.

Kết quả thiếu thời tiết, thiếu tuyến hoặc nguồn tin chưa khả dụng không được
lưu vào cache tổng quan năm phút của backend. Cache riêng của nguồn lỗi vẫn có
thời hạn ngắn để tránh gọi dồn. Thời tiết dùng hai lần thử với timeout kết nối
3 giây/đọc 6 giây mỗi lần, tránh chuỗi ba lượt đợi 20 giây trước đây vượt thời
gian chờ của trình duyệt. Đây không phải cam kết nguồn bên ngoài luôn có dữ liệu.

## Khi deploy thật

Backend cần chạy trên máy chủ có Internet và được duy trì hoạt động. Frontend
phải dùng API public của server qua reverse proxy hoặc `VITE_API_BASE_URL` được
đặt lúc build. Trình duyệt khách không được trỏ API production về localhost của
chính khách. Khi server độc lập vẫn hoạt động, tắt laptop phát triển không làm
website production dừng.

Docker Compose hiện có `restart: unless-stopped`, health check cho backend và
proxy frontend, cùng thứ tự khởi động chờ backend healthy. Chạy trên server đã
cài Docker:

```sh
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 backend frontend
```

Backend ở cổng 8000, frontend Compose ở cổng 5173 (launcher Windows dùng 5180).
Docker daemon phải tự khởi động cùng server. Chính sách restart xử lý container
thoát; trạng thái `unhealthy` tự nó không làm Docker Compose khởi động lại
container. Cần giám sát/cảnh báo bên ngoài hoặc cơ chế liveness của hosting cho
tiến trình bị treo. `/health` kiểm tra ứng dụng/proxy đang phục vụ, không gọi mọi
nhà cung cấp và không bảo đảm dữ liệu thời tiết/tin tức luôn sẵn sàng.

Giữ `.env` riêng trên server, JWT secret ổn định, API key có quota phù hợp và dữ
liệu SQLite trên storage bền vững, có backup. Compose bind-mount `./data` giữ
trạng thái qua việc tạo lại container trên cùng máy; vẫn cần backup và ổ đĩa
bền vững của host. Không sao chép bí mật vào image hoặc repository.

Blueprint Render có `healthCheckPath: /health`, nhưng vẫn đặt `plan: free` để
không tự chuyển sang gói tính phí. Gói Free có thể ngủ sau 15 phút không có
traffic và filesystem tạm không giữ SQLite qua restart/redeploy. Nếu cần chạy
liên tục phải chọn instance không ngủ và storage bền vững; cấu hình hiện tại
chưa triển khai hoặc mua gói nào thay bạn.

Không thể bảo đảm 100% luôn hoạt động: server, mạng, quota và nhà cung cấp bên
ngoài đều có thể gặp sự cố. Mục tiêu vận hành là tự khởi động, giám sát, phục hồi
có giới hạn và hiển thị trung thực khi thiếu nguồn, thay vì coi dữ liệu cũ là mới.

Nguồn: [Render Free](https://render.com/docs/free),
[Render health checks](https://render.com/docs/health-checks),
[Docker Compose services](https://docs.docker.com/reference/compose-file/services/).
