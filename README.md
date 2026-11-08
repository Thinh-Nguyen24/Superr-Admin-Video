# Video Admin Dashboard — Vibe Coding Project

Bộ tài liệu đặc tả để xây dựng website quản trị video bằng **HTML, CSS, JavaScript và SQLite**, không có backend.

## 1. Mục tiêu

Xây dựng một website admin chạy trực tiếp trên trình duyệt, giao diện sáng (light mode), nền trắng, hỗ trợ:
- Dashboard thống kê video, lượt xem và dung lượng lưu trữ.
- Biểu đồ Top 10 video theo lượt xem.
- Biểu đồ lượt xem theo ngày/tháng.
- Danh sách video, tìm kiếm, lọc, thêm, sửa và xóa.
- Login, Register và Forgot Password.
- Quản lý dữ liệu bằng SQLite ở phía trình duyệt.

## 2. Đọc tài liệu theo thứ tự

1. `01-PRODUCT-REQUIREMENTS.md` — phạm vi và chức năng.
2. `02-TECHNICAL-ARCHITECTURE.md` — kiến trúc frontend-only và giới hạn kỹ thuật.
3. `03-DATABASE-DESIGN.md` — thiết kế SQLite và SQL schema.
4. `04-UI-UX-SPECIFICATION.md` — giao diện, trang và hành vi.
5. `05-IMPLEMENTATION-PLAN.md` — cấu trúc thư mục và thứ tự triển khai.
6. `06-ACCEPTANCE-CRITERIA.md` — tiêu chí nghiệm thu.
7. `07-VIBE-CODING-PROMPTS.md` — prompt theo từng giai đoạn để dùng với AI coding agent.

## 3. Quyết định kỹ thuật quan trọng

Trình duyệt **không thể tự mở và thao tác trực tiếp với file SQLite tùy ý như một backend**. Dự án dùng thư viện `sql.js` (SQLite biên dịch sang WebAssembly) để chạy SQLite trong trình duyệt.

- Dữ liệu được lưu bền vững bằng cách xuất database thành bytes và lưu trong IndexedDB.
- Có chức năng Import/Export database để sao lưu.
- Không cần API server, Node.js backend hay PHP backend.
- Có thể cần một static local server để phục vụ file HTML/WASM; đây chỉ là web server tĩnh, không phải backend nghiệp vụ.
- `users.db` và `videos.db` là hai database độc lập. Bảng danh mục nên đặt trong `videos.db` để bảo đảm quan hệ và giao dịch dữ liệu đơn giản.

## 4. Giới hạn phải hiểu trước khi triển khai

Đây là ứng dụng frontend-only phù hợp học tập, demo hoặc sử dụng cá nhân trên một trình duyệt/máy tính. Không phù hợp để triển khai hệ thống nhiều người dùng thực tế.

- Login chỉ là mô phỏng xác thực cục bộ; không bảo vệ được dữ liệu trước người có quyền truy cập trình duyệt.
- Không thể gửi email reset password nếu không có backend hoặc dịch vụ bên ngoài.
- Không nên lưu mật khẩu dạng plain text. Dùng Web Crypto API để băm mật khẩu vẫn không biến ứng dụng thành hệ thống xác thực an toàn.
- File video lớn không nên nhúng trực tiếp vào SQLite/IndexedDB. Lưu metadata và đường dẫn/định danh file; video có thể được chọn từ máy người dùng để xem trước.
- Thống kê lượt xem là dữ liệu demo hoặc dữ liệu được nhập thủ công; không có cơ chế đo lượt xem toàn cầu khi không có backend.
