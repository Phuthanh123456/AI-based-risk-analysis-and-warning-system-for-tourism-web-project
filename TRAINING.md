# Huấn luyện model

Giai đoạn này bổ sung pipeline phân loại tin tức rủi ro bằng PhoBERT. Pipeline dùng trực tiếp hai CSV đã có trong `data/datasets/`; không tạo lại nhãn hay dữ liệu. Model pretrained `vinai/phobert-base` được tải từ Hugging Face khi chạy lần đầu và lưu trong cache ngoài repository.

## Cài đặt

Từ thư mục gốc repository:

```powershell
python -m pip install -r requirements-training.txt
```

PyTorch dùng CPU nếu không có CUDA. `requirements-training.txt` chỉ gồm các thư viện cần cho pipeline tin tức; thư viện backend và crawl không cần thiết.

## Train và đánh giá PhoBERT

```powershell
python -m training.news.train_phobert
```

Lệnh mặc định dùng cấu hình trong `configs/training.yaml`: seed `42`, tối đa 256 token, batch size 16, 3 epoch, learning rate `2e-5`, weight decay `0.01`, threshold `0.5`. Pipeline đọc `stage1_train.csv` và `stage1_val.csv` như hai split cố định; script không tạo split ngẫu nhiên hoặc split theo thời gian. Script bỏ dòng thiếu trường, loại trùng theo `id`/`input_text`, và loại các mẫu validation trùng chính xác với train. Thứ tự batch train được xáo trộn có seed.

Nhãn là nhị phân: `0 = no_risk`, `1 = risk` (`risk_any`). Hàm loss là BCE có trọng số cho lớp dương. Sau mỗi epoch, script tính precision, recall, F1 và average precision trên validation. Checkpoint mặc định nằm ở `data/outputs/checkpoints/stage1_risk_any/`; metrics JSON ở `data/outputs/training/phobert_stage1_metrics.json`. Hai thư mục output này bị Git ignore.

Đánh giá checkpoint đã train mà không cập nhật trọng số:

```powershell
python -m training.news.train_phobert --evaluate-only --checkpoint data/outputs/checkpoints/stage1_risk_any
```

## Smoke test trên CPU

Để kiểm tra đọc dữ liệu, word segmentation, tải PhoBERT, backpropagation và metric mà không ghi checkpoint lớn:

```powershell
python -m training.news.train_phobert --epochs 1 --batch-size 8 --max-length 64 --train-limit 64 --validation-limit 128 --no-save --metrics-path training/reports/phobert_cpu_smoke.json
```

Hai giới hạn lấy mẫu phân tầng từ các split đã commit; đây là smoke test, không phải kết quả đánh giá cuối cùng của model. Giữ nguyên kết quả smoke trong `training/reports/` nếu muốn lưu metric cùng code.

### Kết quả lần chạy trong môi trường này

Ngày 09/10/2026, đã chạy đúng lệnh smoke ở trên với PyTorch `2.13.0+cpu`, Transformers `5.13.1`, Python `3.12.4` và seed `42`. Model đã tải revision `01daacda68afe13d83023d16ec647239e344a1e6`, train 1 epoch trên 64 mẫu (8 optimizer steps), rồi đánh giá trên 128 mẫu validation phân tầng:

| Metric | Giá trị |
| --- | ---: |
| Precision | 0.7895 |
| Recall | 0.7576 |
| F1 | 0.7732 |
| Average precision | 0.8107 |

Đây là metric của smoke subset, không đại diện cho model đã train đầy đủ trên 2.217 mẫu train. Chưa chạy full fine-tuning; môi trường chỉ có CPU. Không lưu hoặc push checkpoint PhoBERT. Report JSON của lần chạy được lưu tại `training/reports/phobert_cpu_smoke.json`.

## Dữ liệu và giới hạn phạm vi

CSV train có 11.608 dòng và validation có 2.902 dòng. Sau khi loại trùng, train còn 2.217 mẫu; validation còn 586 mẫu và loại thêm 44 mẫu trùng với train, còn 542 mẫu. Script giữ nguyên split được cung cấp; các file hiện tại không cho biết đủ thông tin để xác minh cách tạo split ban đầu.

Pipeline XGBoost thời tiết chưa được thêm: dataset có các trường đầu vào thời tiết và `risk_level_num` không có trong repository môn học. `data/outputs/agg_province_daily.csv` chỉ có ngày, tỉnh, số bài viết và các tổng hợp rủi ro tin tức nên không thể dùng thay cho dataset thời tiết. Không sao chép dataset từ repository gốc, train XGBoost hoặc báo metric cho giai đoạn này.

PhoBERT có thể chạy trên CPU nhưng fine-tune toàn bộ tập với cấu hình mặc định sẽ chậm hơn đáng kể so với GPU. Smoke test không tạo checkpoint và không được xem là một model đã train đầy đủ. Checkpoint đầy đủ có thể vượt giới hạn 100 MB của GitHub; checkpoint bị ignore và không được stage/push trong giai đoạn này.
