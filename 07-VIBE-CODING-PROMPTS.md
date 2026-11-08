# 07 — Vibe Coding Prompts

Sử dụng lần lượt từng prompt. Không yêu cầu AI tạo toàn bộ ứng dụng trong một lần vì dễ sinh code thiếu nhất quán và khó debug.

## Prompt 1 — Đọc đặc tả và lập kế hoạch

```text
Bạn là Senior Frontend Engineer. Hãy đọc toàn bộ tài liệu Markdown trong thư mục docs/specs của dự án.

Mục tiêu: xây dựng Video Admin frontend-only bằng HTML, CSS, JavaScript thuần và SQLite chạy trong browser bằng sql.js. Không tạo backend.

Trước khi code:
1. Tóm tắt kiến trúc.
2. Xác nhận cấu trúc thư mục.
3. Liệt kê các module và trách nhiệm.
4. Nêu các rủi ro kỹ thuật.
5. Chia công việc thành từng milestone nhỏ.

Không tự ý thay đổi yêu cầu công nghệ. Nếu có điểm bất khả thi, hãy giải thích và đề xuất giải pháp frontend-only phù hợp.
```

## Prompt 2 — Tạo nền tảng giao diện

```text
Hãy triển khai Phase 1 theo IMPLEMENTATION-PLAN.md.

Yêu cầu:
- HTML, CSS, JavaScript thuần, ES Modules.
- Light mode, nền trắng, phong cách modern minimal admin.
- Responsive desktop/tablet/mobile.
- Tạo SPA hash router.
- Tạo sidebar, topbar, page header và content container.
- Tạo các route: login, register, forgot-password, dashboard, videos, add/edit video, settings.
- Tạo CSS variables và component styles dùng chung.

Chỉ triển khai nền tảng giao diện và routing ở bước này. Không tạo dữ liệu giả rải rác trong UI. Sau khi hoàn tất, liệt kê file đã tạo và cách chạy.
```

## Prompt 3 — Tích hợp SQLite frontend-only

```text
Hãy triển khai SQLite layer theo TECHNICAL-ARCHITECTURE.md và DATABASE-DESIGN.md.

Bắt buộc:
- Dùng sql.js chạy SQLite trong browser.
- Tạo users.db và videos.db độc lập.
- Dùng IndexedDB để lưu database bytes sau mỗi thao tác ghi.
- Khởi động lại ứng dụng phải nạp database từ IndexedDB.
- Nếu chưa có database, tự tạo và chạy schema.
- Tách DatabaseService và các Repository.
- Dùng parameterized queries.
- Tạo seed data có đánh dấu demo.

Không dùng backend, API server, Node.js server hoặc localStorage để lưu database. Hãy kiểm tra dữ liệu còn sau khi refresh.
```

## Prompt 4 — Authentication

```text
Triển khai Login, Register, Forgot Password theo PRODUCT-REQUIREMENTS.md.

- User lưu trong users.db.
- Không lưu mật khẩu plain text.
- Dùng Web Crypto API để hash mật khẩu với salt riêng.
- Validate email, password tối thiểu 8 ký tự và confirm password.
- Email không được trùng.
- Login sai hiển thị lỗi phù hợp.
- Session chỉ là local client session.
- Forgot Password phải ghi rõ không gửi email thật và chỉ là demo local flow.
- Bảo vệ route ở mức UI.

Không mô tả chức năng này là authentication an toàn cho production.
```

## Prompt 5 — Video CRUD

```text
Triển khai trang List Video và form Add/Edit Video.

Các cột bắt buộc: ID, Title, Thumbnail, Views, Actions (Edit, Delete).

Bổ sung:
- Search title.
- Filter category.
- Sort.
- Pagination.
- Add/Edit/Delete thực sự đọc ghi videos.db.
- Delete có confirmation modal.
- Validate title, views, file size và thumbnail URL.
- Thumbnail preview.
- Toast success/error.
- Persist vào IndexedDB sau mỗi thao tác ghi.

Tách SQL vào repository, không viết SQL trong UI event handler.
```

## Prompt 6 — Dashboard

```text
Triển khai Dashboard lấy dữ liệu thực từ SQLite.

KPI:
- Total Videos.
- Total Views.
- Storage Used.

Charts:
- Bar chart Top 10 videos theo views giảm dần.
- Line chart views theo ngày (30 ngày gần nhất).
- Line chart views theo tháng (12 tháng gần nhất).
- Có lựa chọn Daily/Monthly.

Dùng Chart.js hoặc SVG. Không hard-code số liệu trong Dashboard.
Nếu chưa có view stats, hiển thị empty state thay vì tự tạo lịch sử giả.
Dashboard phải cập nhật sau khi thêm/sửa/xóa video.
```

## Prompt 7 — Backup, kiểm thử và hoàn thiện

```text
Hãy hoàn thiện Settings và kiểm thử toàn bộ ứng dụng.

- Export users.db và videos.db thành file riêng.
- Import database có validate và cảnh báo trước khi ghi đè.
- Reset demo data có xác nhận.
- Kiểm tra dữ liệu tồn tại sau refresh.
- Kiểm tra toàn bộ CRUD.
- Kiểm tra login/register/logout.
- Kiểm tra biểu đồ Daily/Monthly.
- Kiểm tra responsive.
- Kiểm tra SQL injection cơ bản bằng parameterized queries.
- Kiểm tra XSS cơ bản: không render user input trực tiếp qua innerHTML.
- Sửa lỗi console và lỗi runtime.

Cuối cùng, cung cấp báo cáo: chức năng đã hoàn thành, chức năng còn giới hạn do không có backend, cách chạy và cách backup dữ liệu.
```

## Prompt 8 — Code review

```text
Hãy review toàn bộ source code như một Senior Frontend Engineer.

Tập trung:
1. Kiến trúc module và trách nhiệm từng file.
2. Tính nhất quán của dữ liệu SQLite và IndexedDB.
3. Các thao tác async và xử lý lỗi.
4. SQL parameterization.
5. XSS và xử lý input.
6. Quản lý session local.
7. Memory leak từ event listener, chart instance và object URL.
8. Responsive và accessibility.
9. Khả năng export/import database.

Không viết lại toàn bộ dự án nếu không cần. Liệt kê lỗi theo mức độ Critical/High/Medium/Low, giải thích và sửa từng nhóm.
```
