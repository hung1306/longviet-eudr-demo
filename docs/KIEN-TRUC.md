# Kiến trúc: một lõi, nhiều ngành, nhiều công ty

Nguyên tắc: **lõi không biết ngành nào, công ty nào**. Khác biệt nằm ở cấu hình. Nâng cấp lõi một lần, mọi công ty cùng có.

## Ba tầng

| Tầng | Vị trí | Sửa khi | Ai dùng |
| --- | --- | --- | --- |
| Lõi EUDR | `src/engine/`, `src/components/`, `src/app/` | Luật EU đổi, thêm tính năng chung | Mọi công ty |
| Gói ngành | `src/config/industries.ts` | Thêm nhóm, đổi công đoạn mẫu | Theo nhóm |
| Công ty | `src/config/tenant.ts` | Khách mới, tên, nhà máy, ngành được dùng | Một công ty |

**Luật kiểm tra PR:** trong `src/engine/` không được có `if (nganh === ...)` hay tên công ty. Cần khác biệt thì thêm trường vào gói ngành. Test `không còn dấu vết của khách hàng khảo sát` chặn lọt tên.

## Triển khai công ty mới

1. Thêm dòng vào `TENANTS` trong `tenant.ts`, khóa ngành: `industries: ["noi-that"]`.
2. Build với `NEXT_PUBLIC_TENANT=<slug>`, deploy riêng.
3. Danh mục máy, ô kho, quy cách: nhập qua Quản Trị, không sửa mã.

Cập nhật: mọi công ty build từ cùng nhánh `main`. **Không fork lõi.**

Việc riêng thật sự (kết nối cân, ERP, báo cáo riêng): chưa có điểm mở rộng. Nên chốt sau khi có yêu cầu thật từ khách đầu tiên, tránh đoán trước.

## Thêm nhóm ngành

Thêm một mục vào `INDUSTRIES` và `IndustryId`. Test tự chạy toàn bộ luồng trên nhóm mới. Cần có: `process` đủ 6 bước, `stages` kết thúc bằng bước `qc`, `specs`, `recovery`.

Bước đổi đơn vị (ví dụ lá sang tấm): đặt `outUnit` khác bước trước, hệ thống không so số vào ra ở bước đó.

## Kế thừa từ Web_ThienHung (EUDR cao su)

| Cao su (model) | Gỗ | Trạng thái |
| --- | --- | --- |
| `M_PlaceMark`, `M_SurveyBatch`, `M_SurveyFarm` | Thửa đất, đợt kiểm kê | Có, bản demo |
| `M_Farmer`, `M_FarmerChild` | Nông hộ, thương lái | Có, bản demo |
| `M_TransportMaterial`, `M_TransportMaterialPlaceMark` | Phiếu cân, tiếp nhận, gắn thửa | Có, bản demo |
| `M_MaterialPool`, `M_MaterialPoolLog`, `M_MaterialPoolTransportTank` | Ô kho, lô, kiện | Có, bản demo |
| `M_FinishedProduct`, `M_FinishedProductPoolLog` | Lô thành phẩm, phả hệ | Có, bản demo |
| `M_Pallet`, `M_PalletDetail` | Kiện, pallet | Có, bản demo |
| `M_Order`, `M_OrderItem`, `PassCode`, `M_OrderVerifyLog`, `M_OrderVerifyFail` | Đơn, tra cứu QR, lịch sử xem | Có, bản demo |
| `GroupPermit`, `M_AccessLog`, `M_LogExportData` | Phân quyền, nhật ký | Mới có giao diện, chưa có máy chủ |

Bỏ: `DRC`, `TSC`, `NH3`, `TypeLatex`, `StorageTank`, `ShavingSession`.

Mới so với cao su: công đoạn theo cấu hình (thay bồn mủ đồng nhất), lô cha nhiều nguồn cho sản phẩm ghép, ba bộ hồ sơ theo nguồn.

Cao su là ASP.NET MVC. Bản này là Next.js. Kế thừa mô hình nghiệp vụ, không dùng lại mã.

## Trạng thái: bản demo, chưa vận hành thật

Chưa có, bắt buộc trước khi chạy thật:

- Máy chủ, cơ sở dữ liệu, đăng nhập, phân quyền phía máy chủ. Hiện dữ liệu nằm trong trình duyệt.
- Nhật ký chống sửa thật ở máy chủ. Mã băm FNV-1a hiện tại chỉ để minh họa, không chống giả mạo có chủ đích.
- Lưu chứng từ gốc, sao lưu, lưu trữ 5 năm.
- Đối chiếu bản đồ rừng tự động (JRC GFC2020). Hiện ghi tay.
- Ranh giới quốc gia thật thay khung tọa độ gần đúng.
- Đối chiếu GeoJSON và API với tài liệu chính thức Hệ thống thông tin EUDR.
- Thay `xlsx` 0.18.5 (lỗ hổng mức cao, chưa có bản vá trên npm) trước khi nhận tệp từ người ngoài.

## Giả định cần xác nhận

- Nhóm 1 và 2: tài liệu nguồn chỉ có slide nhóm 3, 4, 5. Nhóm 1 (gỗ xẻ, dăm, viên nén) và nhóm 2 (ván bóc, ván ép) là suy luận.
- Định mức thu hồi và thông số công đoạn trong gói ngành là giá trị mẫu, cần công ty xác nhận.
- Phạm vi mã HS và hạn 30/06/2027 lấy từ nguồn thứ cấp, chưa đọc được bản EUR-Lex của Quy định ủy quyền (EU) 2026/2102.

## Lệnh

```
npm run dev        # phát triển
npm run typecheck && npm run lint && npm test
npm run test:e2e   # chạy mọi trang trên cả 5 nhóm
```
