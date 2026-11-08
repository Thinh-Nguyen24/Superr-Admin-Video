# 05 — Implementation Plan

## 1. Suggested folder structure

```text
video-admin/
├── index.html
├── README.md
├── assets/
│   ├── css/
│   │   ├── reset.css
│   │   ├── variables.css
│   │   ├── layout.css
│   │   ├── components.css
│   │   └── pages.css
│   ├── js/
│   │   ├── app.js
│   │   ├── router.js
│   │   ├── state.js
│   │   ├── config/
│   │   │   └── database-config.js
│   │   ├── db/
│   │   │   ├── database-service.js
│   │   │   ├── schema-users.js
│   │   │   └── schema-videos.js
│   │   ├── repositories/
│   │   │   ├── user-repository.js
│   │   │   ├── video-repository.js
│   │   │   ├── category-repository.js
│   │   │   └── stats-repository.js
│   │   ├── services/
│   │   │   ├── auth-service.js
│   │   │   ├── storage-service.js
│   │   │   └── validation-service.js
│   │   ├── components/
│   │   │   ├── sidebar.js
│   │   │   ├── topbar.js
│   │   │   ├── modal.js
│   │   │   ├── toast.js
│   │   │   └── data-table.js
│   │   └── pages/
│   │       ├── login.js
│   │       ├── register.js
│   │       ├── forgot-password.js
│   │       ├── dashboard.js
│   │       ├── videos.js
│   │       ├── video-form.js
│   │       └── settings.js
│   └── images/
│       └── placeholder-thumbnail.svg
├── vendor/
│   ├── sql-wasm.js
│   ├── sql-wasm.wasm
│   └── chart.umd.js
└── docs/
    ├── users-schema.sql
    └── videos-schema.sql
```

Có thể dùng CDN trong lúc phát triển. Nếu cần chạy offline, tải các thư viện về `vendor/` và cấu hình đường dẫn WASM chính xác.

## 2. Development phases

### Phase 1 — Project foundation
- Tạo `index.html`.
- Thiết lập CSS variables, reset, typography và responsive layout.
- Tạo SPA router.
- Tạo shell gồm Sidebar và Topbar.
- Tạo các route/view rỗng.

### Phase 2 — SQLite layer
- Tích hợp sql.js.
- Tạo IndexedDB wrapper để lưu database bytes.
- Khởi tạo `users.db`, `videos.db`.
- Tạo schema và seed demo data.
- Kiểm tra dữ liệu còn sau refresh.

### Phase 3 — Authentication
- Register: validate và insert user.
- Login: tìm user theo email, xác minh password hash.
- Logout: xóa session.
- Forgot Password: local demo flow, không gửi email.
- Bảo vệ route ở mức giao diện.

### Phase 4 — Video CRUD
- Video list.
- Search, filter, sort, pagination.
- Add video.
- Edit video.
- Delete confirmation.
- Thumbnail preview.
- Toast và validation.

### Phase 5 — Dashboard
- KPI cards lấy từ SQLite.
- Top 10 bar chart.
- Daily/monthly line chart.
- Empty state khi thiếu dữ liệu thống kê.
- Refresh chart sau khi dữ liệu thay đổi.

### Phase 6 — Settings and backup
- Export `users.db`.
- Export `videos.db`.
- Import database có validate.
- Reset demo data có confirm.
- Hiển thị thông tin dung lượng database.

### Phase 7 — QA
- Kiểm tra desktop/tablet/mobile.
- Kiểm tra refresh và dữ liệu persistence.
- Kiểm tra form validation.
- Kiểm tra dữ liệu rỗng và lỗi database.
- Kiểm tra không có password plain text.

## 3. Coding rules

- JavaScript thuần, dùng ES Modules.
- Ưu tiên `const`, chỉ dùng `let` khi cần.
- Tách UI, business logic và data access.
- Không viết SQL trong file UI.
- Dùng parameterized queries, không nối chuỗi input trực tiếp vào SQL.
- Dùng `textContent` khi render nội dung người dùng nhập; tránh đưa input thẳng vào `innerHTML`.
- Có xử lý lỗi cho thao tác database.
- Sau mỗi thay đổi dữ liệu phải persist database vào IndexedDB.
- Không hard-code KPI/chart data trong Dashboard.
- Dùng một nguồn dữ liệu thống nhất từ repository.
- Comment những phần logic khó hiểu, không comment từng dòng.

## 4. Definition of done per feature

Một chức năng chỉ hoàn thành khi:
- Có UI.
- Có validation.
- Có xử lý lỗi.
- Dữ liệu thực sự đọc/ghi SQLite.
- Dữ liệu vẫn còn sau khi refresh.
- Có trạng thái loading/empty/success phù hợp.
- Responsive ở màn hình nhỏ.
