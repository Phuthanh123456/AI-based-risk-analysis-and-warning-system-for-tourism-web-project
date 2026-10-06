# Vietnam Travel Risk AI — dữ liệu nền tảng

Repository này chứa snapshot dữ liệu và các cấu hình YAML cho giai đoạn nền tảng.

## Dữ liệu

- `data/raw/articles_raw.jsonl`: bản ghi bài viết dạng JSONL.
- `data/clean/articles_clean.jsonl`: bản ghi bài viết đã xử lý.
- `data/features/articles_features.jsonl`: bản ghi đặc trưng.
- `data/datasets/stage1_train.csv` và `stage1_val.csv`: tập train và validation giai đoạn 1.
- `data/external/accidents.csv`: dữ liệu tai nạn.
- `data/outputs/agg_province_daily.csv`: dữ liệu tổng hợp theo tỉnh và ngày.

## Cấu hình

- `configs/provinces.yaml`: danh sách và thông tin cấu hình tỉnh.
- `configs/keywords.yaml`: cấu hình từ khóa.
- `configs/sources.yaml` và `configs/gnews_queries.yaml`: cấu hình nguồn và truy vấn thu thập.

Mô tả này không xác nhận giấy phép hay xuất xứ đầy đủ của dữ liệu. Các trường nguồn có sẵn trong tệp được giữ nguyên. Giai đoạn này chưa có model, ứng dụng, API hoặc giao diện người dùng.
