# 06 — Acceptance Criteria

## 1. Project and layout
- [ ] Ứng dụng chỉ dùng HTML, CSS và JavaScript thuần.
- [ ] Không có backend/API server nghiệp vụ.
- [ ] Giao diện light mode, nền sáng, responsive.
- [ ] Sidebar và topbar hiển thị đúng ở desktop.
- [ ] Navigation hoạt động giữa các trang.

## 2. Database
- [ ] Tạo được `users.db` và `videos.db` trong trình duyệt.
- [ ] Schema được khởi tạo tự động khi database chưa tồn tại.
- [ ] Database bytes được lưu trong IndexedDB.
- [ ] Dữ liệu tồn tại sau khi refresh.
- [ ] Export được từng file `.db`.
- [ ] Import database có kiểm tra file hợp lệ.
- [ ] Không lưu password dạng plain text.

## 3. Authentication
- [ ] Register tạo user mới.
- [ ] Không cho phép email trùng.
- [ ] Validate email và password.
- [ ] Login đúng thông tin thì vào Dashboard.
- [ ] Login sai thì hiển thị lỗi.
- [ ] Logout xóa local session.
- [ ] Forgot Password nói rõ đây là demo local, không gửi email.

## 4. Video management
- [ ] Hiển thị đúng ID, title, thumbnail, views và actions.
- [ ] Search theo title hoạt động.
- [ ] Filter category hoạt động.
- [ ] Sort hoạt động.
- [ ] Pagination hoạt động.
- [ ] Add tạo record trong SQLite.
- [ ] Edit cập nhật đúng record.
- [ ] Delete có xác nhận và xóa record.
- [ ] Các thay đổi còn sau refresh.

## 5. Dashboard
- [ ] Total Videos lấy từ SQLite.
- [ ] Total Views lấy từ SQLite.
- [ ] Storage Used tính từ `file_size_bytes`.
- [ ] Bar chart hiển thị tối đa 10 video views cao nhất.
- [ ] Daily line chart nhóm theo ngày.
- [ ] Monthly line chart nhóm theo tháng.
- [ ] Không giả lập lịch sử lượt xem khi không có dữ liệu.
- [ ] Dashboard cập nhật sau khi video thay đổi.

## 6. Security and data handling
- [ ] Dùng parameterized SQL queries.
- [ ] Không render user input không an toàn bằng `innerHTML`.
- [ ] Không log password hoặc hash.
- [ ] Không tuyên bố xác thực client-side là bảo mật production.
- [ ] Không tuyên bố gửi email nếu không có email service.

## 7. UX
- [ ] Có loading state.
- [ ] Có empty state.
- [ ] Có error state.
- [ ] Có success toast.
- [ ] Delete có confirmation.
- [ ] Form có lỗi validation rõ ràng.
- [ ] Có thể thao tác cơ bản bằng bàn phím.
