# 02 — Technical Architecture

## 1. Nguyên tắc

Xây dựng ứng dụng chạy hoàn toàn ở frontend:
- HTML: cấu trúc trang.
- CSS: layout, responsive, light theme.
- JavaScript ES Modules: routing, state, validation, CRUD, chart rendering.
- SQLite: `sql.js` chạy trong browser qua WebAssembly.
- IndexedDB: lưu bytes của các database để dữ liệu còn sau khi refresh/đóng trình duyệt.

Không tạo API backend.

## 2. SQLite trong trình duyệt

Không thể dùng JavaScript thuần để gọi trực tiếp SQLite native trên máy người dùng. Dùng `sql.js`:
- Load thư viện JavaScript và file WASM.
- Khởi tạo database từ bytes nếu đã có trong IndexedDB.
- Nếu chưa có, khởi tạo database mới và chạy schema.
- Sau mỗi thao tác ghi, export database thành `Uint8Array` và lưu vào IndexedDB.
- Khi khởi động lần sau, đọc bytes từ IndexedDB và nạp lại vào `SQL.Database`.

Ví dụ luồng:
1. `DatabaseService.init()`
2. Đọc `users.db` và `videos.db` từ IndexedDB.
3. Nếu chưa tồn tại, tạo mới và chạy schema tương ứng.
4. Thực hiện query qua service.
5. Sau lệnh INSERT/UPDATE/DELETE, gọi persist để export và lưu IndexedDB.

**Quan trọng:** `users.db` và `videos.db` trong thiết kế này là hai database SQLite độc lập được lưu dưới dạng bytes trong IndexedDB. Người dùng có thể export chúng thành file `.db`.

## 3. Cấu trúc dữ liệu

### users.db
- `users`
- `user_sessions` (tùy chọn; phiên đăng nhập cục bộ)

### videos.db
- `videos`
- `categories`
- `video_view_stats`

Không tách `categories` thành database thứ ba trong phiên bản đầu. SQLite không hỗ trợ foreign key thông thường giữa hai database độc lập; để categories trong `videos.db` giúp dùng foreign key, transaction và backup dễ hơn.

## 4. Data access layer

Tạo các service riêng:
- `DatabaseService`: init, load, export, import, persist.
- `UserRepository`: register, login lookup, update password.
- `VideoRepository`: list, getById, create, update, delete.
- `CategoryRepository`: list/create/update/delete category.
- `StatsRepository`: KPI, Top 10, views by day/month.

Không viết SQL trực tiếp trong event handler hoặc component. Event handler gọi repository/service.

## 5. Authentication local

- Không lưu password dạng plain text.
- Dùng Web Crypto API (`crypto.subtle`) để tạo hash với salt riêng cho từng user.
- Lưu `password_hash` và `password_salt`.
- Không lưu password vào localStorage, IndexedDB hoặc log.
- Session local có thể lưu user ID và thời điểm hết hạn trong sessionStorage.
- Logout phải xóa session.

Đây chỉ là mô phỏng luồng đăng nhập. Vì toàn bộ mã và database nằm phía client, người dùng có kỹ năng vẫn có thể sửa dữ liệu hoặc vượt qua kiểm tra. Không dùng để bảo vệ dữ liệu nhạy cảm.

## 6. Storage strategy

- IndexedDB là nơi lưu bền vững các database bytes.
- localStorage chỉ dành cho cài đặt nhỏ như theme hoặc lựa chọn sidebar; không dùng lưu video hoặc password.
- Video binary không lưu vào SQLite. Chỉ lưu metadata: file name, MIME type, size, optional local reference.
- `URL.createObjectURL()` có thể dùng để preview file được chọn; thu hồi URL bằng `URL.revokeObjectURL()` khi không còn dùng.

## 7. Charts

Có thể dùng Chart.js qua CDN hoặc lưu thư viện local:
- Bar chart: Top 10 videos.
- Line chart: daily/monthly views.
- Nếu không muốn thêm thư viện, dùng SVG thuần; tuy nhiên Chart.js giúp triển khai nhanh và dễ tùy chỉnh.

Biểu đồ phải đọc dữ liệu từ `StatsRepository`, không hard-code số liệu trong UI.

## 8. Routing

Dùng hash routing để không cần server cấu hình rewrite:
- `#/login`
- `#/register`
- `#/forgot-password`
- `#/dashboard`
- `#/videos`
- `#/videos/new`
- `#/videos/:id/edit`

Route bảo vệ:
- Nếu chưa có session, route dashboard/videos chuyển về login.
- Nếu đã login và truy cập login/register, có thể chuyển về dashboard.
- Đây chỉ là kiểm soát giao diện client, không phải bảo mật server.

## 9. Static hosting / local run

Có thể mở qua static server đơn giản hoặc VS Code Live Server để tải module và WASM ổn định. Static server không xử lý nghiệp vụ, không có API và không phải backend ứng dụng.

Nếu mở trực tiếp bằng `file://` gặp lỗi module/WASM, chạy static server local là cách khắc phục phù hợp.

## 10. Thư viện đề xuất

- `sql.js`: SQLite in browser.
- `Chart.js`: charts.
- Không cần framework frontend.
- Có thể dùng Google Fonts, nhưng nên có font fallback hệ thống.
- Ưu tiên CDN trong giai đoạn học; ghi rõ phiên bản và phương án tải local khi cần chạy offline.
