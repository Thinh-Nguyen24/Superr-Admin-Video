# 01 — Product Requirements

## 1. Tổng quan

**Tên dự án:** Video Admin  
**Loại ứng dụng:** Single Page Application (SPA), frontend-only  
**Công nghệ bắt buộc:** HTML5, CSS3, JavaScript thuần, SQLite thông qua `sql.js`  
**Không sử dụng:** Backend, REST API tự xây dựng, Node.js server, PHP, Python server, framework frontend bắt buộc.  
**Giao diện:** Light mode, nền trắng, tối giản, hiện đại, responsive.

## 2. Vai trò người dùng

Phiên bản hiện tại chỉ có một vai trò:
- **Admin:** quản lý video, xem dashboard và quản lý tài khoản cục bộ.

Lưu ý: Vì không có backend, tài khoản chỉ tồn tại trên trình duyệt và thiết bị đang sử dụng. Không có đồng bộ tài khoản giữa nhiều máy.

## 3. Danh sách trang

| Route/View | Tên trang | Mục đích |
|---|---|---|
| `/login` | Login | Đăng nhập tài khoản cục bộ |
| `/register` | Register | Tạo tài khoản cục bộ |
| `/forgot-password` | Forgot Password | Quy trình đặt lại mật khẩu mô phỏng |
| `/dashboard` | Dashboard | Thống kê tổng quan |
| `/videos` | List Video | Danh sách và thao tác video |
| `/videos/new` | Add Video | Thêm video |
| `/videos/:id/edit` | Edit Video | Chỉnh sửa video |
| `/settings` | Settings (khuyến nghị) | Sao lưu/khôi phục database và cài đặt |

Có thể triển khai bằng SPA router JavaScript đơn giản hoặc điều hướng view bằng hash route.

## 4. Dashboard

### 4.1 KPI cards

Hiển thị tối thiểu:
1. **Total Videos:** tổng số video chưa bị xóa.
2. **Total Views:** tổng lượt xem của tất cả video.
3. **Storage Used:** tổng dung lượng video theo metadata đã lưu.

Quy tắc:
- Định dạng số có dấu phân tách hàng nghìn.
- Dung lượng hiển thị tự động theo B, KB, MB, GB.
- Nếu chưa có dữ liệu, hiển thị 0 và empty state phù hợp.

### 4.2 Top 10 videos

- Biểu đồ cột hiển thị tối đa 10 video có lượt xem cao nhất.
- Trục X: tiêu đề video (rút gọn nếu quá dài).
- Trục Y: lượt xem.
- Sắp xếp giảm dần theo views.
- Tooltip hiển thị title đầy đủ và số lượt xem.
- Có empty state khi chưa có video.

### 4.3 Views over time

- Biểu đồ line thể hiện lượt xem theo thời gian.
- Có lựa chọn `Daily` và `Monthly`.
- Daily: nhóm theo ngày trong khoảng 30 ngày gần nhất.
- Monthly: nhóm theo tháng trong 12 tháng gần nhất.
- Dữ liệu cần lấy từ bảng `video_view_stats`.
- Không tự suy diễn lượt xem theo ngày từ tổng lượt xem hiện tại. Nếu chưa có dữ liệu thống kê, hiển thị trạng thái “Chưa có dữ liệu lượt xem theo thời gian”.

## 5. List Video

### 5.1 Bảng danh sách

Các cột bắt buộc:
- ID
- Title
- Thumbnail
- Views
- Actions: Edit, Delete

Nên bổ sung:
- Category
- File size
- Created date
- Status

### 5.2 Chức năng

- Hiển thị danh sách có phân trang.
- Tìm kiếm theo title.
- Lọc theo category.
- Sắp xếp theo title, views, created date.
- Nút Add Video.
- Edit mở form chỉnh sửa.
- Delete yêu cầu xác nhận trước khi xóa.
- Thông báo thành công/thất bại bằng toast.
- Khi không có dữ liệu, hiển thị empty state có nút Add Video.

### 5.3 Form thêm/sửa video

Trường dữ liệu:
- Title (bắt buộc).
- Description (không bắt buộc).
- Thumbnail (chọn ảnh từ máy hoặc nhập URL).
- Video file (không bắt buộc; chỉ lưu metadata/đường dẫn trong phiên bản frontend-only).
- Category.
- Views (giá trị demo/nhập thủ công).
- File size (bytes).
- Status: Active / Draft / Archived.

Validation:
- Title không được để trống.
- Views là số nguyên không âm.
- File size là số không âm.
- URL thumbnail phải hợp lệ nếu người dùng chọn nhập URL.
- Hiển thị lỗi ngay dưới trường tương ứng.

## 6. Authentication screens

### Login
- Email.
- Password.
- Show/hide password.
- Remember me (chỉ lưu trạng thái phiên cục bộ, không phải bảo mật).
- Link Register.
- Link Forgot Password.
- Validate dữ liệu và hiển thị lỗi rõ ràng.

### Register
- Full name.
- Email.
- Password.
- Confirm password.
- Validate email, mật khẩu tối thiểu 8 ký tự và password confirmation.
- Không cho phép email trùng trong `users.db`.

### Forgot Password
Do không có backend/email service:
- Không gửi email thật.
- Có thể xây dựng luồng demo: nhập email đã đăng ký, hiển thị hướng dẫn đặt lại mật khẩu cục bộ hoặc cho phép đổi mật khẩu sau khi xác nhận thông tin demo.
- Gắn nhãn rõ “Local demo flow — không gửi email”.
- Không tuyên bố đã gửi email nếu không thực sự gửi.

## 7. Database và dữ liệu

- `users.db`: tài khoản người dùng cục bộ.
- `videos.db`: video, categories và thống kê lượt xem.
- Có dữ liệu mẫu để kiểm tra dashboard và bảng.
- Có chức năng export/import database.
- Có nút Reset Demo Data, yêu cầu xác nhận hai lần hoặc xác nhận rõ ràng.

## 8. Ngoài phạm vi

- Đăng nhập nhiều thiết bị.
- Phân quyền an toàn ở server.
- Upload video lên cloud.
- Streaming/transcoding video.
- Thu thập lượt xem thực tế từ người xem trên internet.
- Gửi email xác minh hoặc reset password thật.
- Chia sẻ dữ liệu realtime giữa nhiều admin.
