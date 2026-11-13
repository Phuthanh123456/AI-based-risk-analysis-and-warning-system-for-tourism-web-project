# Cách đọc kết quả đánh giá hành trình

## Tổng quan ba yếu tố

Khung đầu trang kết quả là **Kết quả tổng quan hành trình**, xét thời tiết của ngày đang đánh giá, tuyến đường tham khảo và tin địa phương. Không phải dashboard riêng thời tiết và không có mô hình được huấn luyện để cộng ba yếu tố thành một điểm chung.

- **NÊN ĐI:** thời tiết dưới 4, có tuyến, tra cứu tin khả dụng và chưa có tín hiệu cần lưu ý theo quy tắc hiện có. Không có nghĩa chắc chắn an toàn.
- **CẦN LƯU Ý TRƯỚC KHI ĐI:** thời tiết từ 4 đến dưới 7, có tiêu đề cần xác minh, thiếu tuyến/nguồn tin/thời tiết hoặc chưa có dự báo đúng ngày yêu cầu.
- **KHÔNG NÊN ĐI:** thời tiết từ 7 hoặc thuộc lớp nguy hiểm/safety gate; hoặc điểm từ corpus tin đã phân loại còn mới từ 7. Đây là gợi ý cân nhắc điều chỉnh, không ép người dùng quyết định.

Điểm tiêu đề RSS mới chưa xác minh không tự tạo kết luận KHÔNG NÊN ĐI. Tin lịch sử cũ không tham gia như cảnh báo hiện tại. Thang đo thời tiết, mức lưu ý tiêu đề và thời gian tuyến khác bản chất nên không cộng/trung bình chúng. Các trường không có số liệu không được biến thành số 0 hoặc hiển thị giá trị tưởng tượng.

## Phạm vi ngày

Ngày đi mặc định hôm nay theo múi giờ Việt Nam; UI cho chọn hôm nay và 7 ngày tiếp theo. Tổng quan dùng thời tiết đúng ngày đã chọn, không lấy ngày rủi ro nhất của tuần. Nếu ngày yêu cầu chưa có dự báo, tổng quan chuyển sang hôm nay và ghi rõ ngày thực sự áp dụng. Kết luận vẫn cần lưu ý vì chưa đánh giá được ngày yêu cầu.

Tuyến đường và tin là dữ liệu ở lần tra cứu hiện tại, không phải dự báo tình trạng giao thông/tin tức cho ngày tương lai. Lịch sử là snapshot `/trip` tại thời điểm tra cứu; không phải đánh giá thực tế sau chuyến đi.

## Thời tiết và không khí

XGBoost dự đoán lớp từ những chỉ số đầu vào; class đại diện được ánh xạ điểm gốc 0–20, rồi chia hai về 0–10. Quy tắc mưa/gió/tầm nhìn cực đoan ưu tiên hơn model. Feature dẫn xuất và thứ tự cột thống nhất với script training. Mục đích hẹn hò/gia đình/phiêu lưu/một mình có điều chỉnh quy tắc; sở thích không được hạ điểm thời tiết nghiêm trọng xuống mức thuận lợi.

Thang điểm hiển thị: **0–4: Thấp; 4–7: Cần lưu ý; 7–10: Cao**. Biên tính toán: dưới 4, từ 4 đến dưới 7, từ 7 trở lên. Điểm này không phải xác suất tai nạn hoặc tỷ lệ an toàn.

PM2.5 lấy nguồn không khí riêng, kèm nguồn/trạng thái/thời gian; không tự lấy PM hiện tại làm quan trắc cho ngày tương lai. Khi thiếu PM, model có thể dùng baseline nội bộ để inference nhưng giá trị đó không được hiển thị như dữ liệu thật. Những ngày xa hơn phạm vi PM forecast không được điền giả.

Response thời tiết thiếu chỉ số chính không được thay bằng nhiệt độ/mưa mặc định để chấm thuận lợi. Lỗi inference trả unavailable/503 thay vì điểm nguy hiểm 10. Lời khuyên trong trang thời tiết chỉ hiển thị phần phù hợp mục đích đang chọn, không lặp thêm đoạn tổng quát.

## Tuyến đường và bản đồ

Chỉ vẽ polyline dịch vụ trả về, giữ tọa độ đã chọn; không tạo đường lái xe giả nối thẳng hai điểm. Bản đồ bên trái và thông tin bên phải trên màn hình rộng, xếp dọc khi mobile. Có nút xem toàn tuyến/điểm xuất phát và đối chiếu Google Maps.

Khoảng cách/thời gian phản ánh tuyến ô tô tham khảo, không đại diện phương tiện khác hoặc tình trạng kẹt xe. Chấm điểm ùn tắc đã bỏ; `traffic_score=null` giữ tương thích API. Hành trình dài có gợi ý chia chặng, nghỉ và kiểm tra tuyến, không suy luận đường thông thoáng chỉ vì có route. Điểm xuất phát trùng điểm đến có thể không tạo route; chọn hai điểm khác nhau để đánh giá di chuyển.

## Tin tức địa phương

Mẫu Google News RSS tối đa 12 tiêu đề, cửa sổ 7 ngày, có link và thời gian. Phân loại quy tắc hiện tại: dấu hiệu khắc phục/mở lại, bất lợi, hoặc chưa rõ ảnh hưởng. Mức lưu ý nội bộ có các giá trị đại diện: khắc phục 0, cảnh báo/nguy cơ/tin cũ hơn 48 giờ 3, sự cố 5, gián đoạn đáng kể 7. UI ưu tiên nhãn dễ hiểu; số này không phải xác suất và không phải model đã đọc toàn văn.

Tin khắc phục không tự triệt tiêu tin bất lợi. Không tìm được tin phù hợp không chứng minh địa điểm an toàn. Không khẳng định sự cố còn diễn ra ở điểm cụ thể chỉ từ tiêu đề. Người dùng cần mở bài gốc để đối chiếu phạm vi, thời gian và thông báo địa phương.

Corpus tin lịch sử có xác suất TF-IDF/LogReg được ghép theo ID; nếu có PhoBERT predictions hợp lệ thì có thể override. Corpus đang cũ phải được ghi trạng thái lịch sử; RSS hiện tại không chạy PhoBERT. Mô tả này phân biệt dữ liệu runtime với khả năng pipeline trong repository.

## Quyền lựa chọn của người dùng

Tổng quan đưa một gợi ý ngắn, dữ kiện có nguồn và nút xem chi tiết. Lời khuyên từng yếu tố nằm ở trang trong. Không gán nhận định trên UI cho AI, không hứa độ an toàn tuyệt đối và không ép người dùng nghe theo. Lần tra cứu, ngày áp dụng và giới hạn nguồn giữ trong phần giải thích để đối chiếu.
