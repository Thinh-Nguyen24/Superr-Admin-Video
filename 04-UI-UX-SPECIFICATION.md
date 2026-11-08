# 04 — UI/UX Specification

## 1. Visual direction

- Phong cách: modern, clean, minimal admin dashboard.
- Theme: light mode only.
- Main background: trắng hoặc xám rất nhạt.
- Sidebar: trắng, có đường viền xám nhạt.
- Cards: trắng, border mảnh, shadow rất nhẹ.
- Primary color: xanh dương hoặc indigo; dùng nhất quán.
- Text chính: xám đậm gần đen.
- Text phụ: xám trung tính.
- Tránh gradient quá mạnh, hiệu ứng glassmorphism và màu neon.
- Bo góc vừa phải (8–12px).
- Font: Inter hoặc system font fallback.

## 2. Main application layout

Desktop:
- Sidebar cố định bên trái, khoảng 240px.
- Main content chiếm phần còn lại.
- Topbar gồm breadcrumb/page title, search hoặc quick action, avatar/menu user.
- Content có padding rộng và khoảng cách nhất quán.

Mobile:
- Sidebar chuyển thành drawer hoặc navigation menu.
- KPI cards xếp 1–2 cột.
- Bảng video có horizontal scroll hoặc chuyển thành cards.
- Form xếp một cột.

## 3. Sidebar navigation

- Dashboard
- Videos
- Categories (khuyến nghị)
- Settings

Phần cuối sidebar:
- User profile.
- Logout.

## 4. Dashboard wireframe

```text
+--------------------------------------------------------------+
| Sidebar | Topbar: Dashboard                    Search  User |
|         |----------------------------------------------------|
|         | Welcome back                                      |
|         | [Total Videos] [Total Views] [Storage Used]       |
|         |                                                    |
|         | [ Top 10 Videos — Bar Chart                       ]|
|         |                                                    |
|         | [ Views Over Time — Line Chart ] [Daily/Monthly]  |
+--------------------------------------------------------------+
```

KPI card:
- Icon nhỏ.
- Label.
- Giá trị lớn.
- Optional helper text.

## 5. Video list wireframe

```text
+--------------------------------------------------------------+
| Videos                                      [ + Add Video ]  |
| [Search videos...] [Category filter] [Sort by]              |
|--------------------------------------------------------------|
| ID | Thumbnail | Title | Views | Category | Actions         |
| 01 | [image]   | ...   | 1,250 | ...      | Edit  Delete    |
| 02 | [image]   | ...   | 980   | ...      | Edit  Delete    |
|--------------------------------------------------------------|
| Showing 1–10 of N                          Pagination        |
+--------------------------------------------------------------+
```

- Thumbnail tỷ lệ 16:9, kích thước đồng nhất.
- Title có thể hiển thị tối đa 2 dòng.
- Views căn phải hoặc hiển thị dạng số có phân cách.
- Action dùng icon button có tooltip và accessible label.
- Delete dùng modal xác nhận, không xóa ngay khi click.

## 6. Video create/edit form

Fields:
- Title.
- Description.
- Thumbnail URL hoặc chọn thumbnail file.
- Video file (optional).
- Category dropdown.
- Views.
- File size.
- Status.

Có thể chia form thành:
- Basic information.
- Media.
- Metadata.

Nút:
- Save.
- Cancel.

Hiển thị loading/disabled state trong lúc lưu database, sau đó cập nhật giao diện.

## 7. Auth pages

Login/Register/Forgot Password dùng layout riêng, không có sidebar:
- Form đặt giữa màn hình.
- Card nền trắng.
- Logo/tên ứng dụng.
- Tiêu đề và mô tả ngắn.
- Input cao vừa phải, label rõ.
- Primary CTA full width.
- Link điều hướng giữa các trang.
- Error/success message dễ nhận biết.

## 8. Components cần tái sử dụng

- `Sidebar`
- `Topbar`
- `PageHeader`
- `KpiCard`
- `DataTable`
- `SearchInput`
- `SelectFilter`
- `Pagination`
- `Modal`
- `Toast`
- `EmptyState`
- `FormField`
- `ConfirmDialog`
- `LoadingState`

## 9. Accessibility

- Mỗi input có label.
- Nút icon có `aria-label`.
- Không chỉ dùng màu để biểu đạt lỗi/trạng thái.
- Có focus state nhìn thấy được.
- Hỗ trợ thao tác bàn phím cơ bản.
- Đảm bảo độ tương phản văn bản.
