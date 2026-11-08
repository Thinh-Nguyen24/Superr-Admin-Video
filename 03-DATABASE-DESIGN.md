# 03 — Database Design

## 1. Database files

| File | Chứa dữ liệu |
|---|---|
| `users.db` | Người dùng và thông tin xác thực local |
| `videos.db` | Video, categories, thống kê lượt xem |

**Lý do:** categories có quan hệ trực tiếp với videos nên đặt cùng `videos.db`. Tránh tách `video_categories.db` vì foreign key và transaction giữa hai database độc lập sẽ phức tạp/không được SQLite hỗ trợ như quan hệ trong cùng database.

## 2. users.db schema

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name       TEXT NOT NULL,
    email           TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash   TEXT NOT NULL,
    password_salt   TEXT NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'disabled'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

Không tạo cột `password` để lưu mật khẩu gốc. Hash cần được tạo ở JavaScript bằng Web Crypto API trước khi insert.

## 3. videos.db schema

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS videos (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    title           TEXT NOT NULL,
    description     TEXT,
    thumbnail_url   TEXT,
    file_name       TEXT,
    file_path       TEXT,
    mime_type       TEXT,
    file_size_bytes INTEGER NOT NULL DEFAULT 0
                    CHECK (file_size_bytes >= 0),
    views           INTEGER NOT NULL DEFAULT 0
                    CHECK (views >= 0),
    category_id     INTEGER,
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'draft', 'archived')),
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES categories(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_videos_title ON videos(title);
CREATE INDEX IF NOT EXISTS idx_videos_views ON videos(views DESC);
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category_id);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at);

CREATE TABLE IF NOT EXISTS video_view_stats (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id    INTEGER NOT NULL,
    view_date   TEXT NOT NULL, -- YYYY-MM-DD
    views       INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (video_id) REFERENCES videos(id)
        ON DELETE CASCADE,
    UNIQUE (video_id, view_date)
);

CREATE INDEX IF NOT EXISTS idx_view_stats_date
    ON video_view_stats(view_date);
CREATE INDEX IF NOT EXISTS idx_view_stats_video
    ON video_view_stats(video_id);
```

## 4. Dashboard queries

### Total videos

```sql
SELECT COUNT(*) AS total_videos
FROM videos
WHERE status <> 'archived';
```

### Total views

```sql
SELECT COALESCE(SUM(views), 0) AS total_views
FROM videos
WHERE status <> 'archived';
```

### Storage used

```sql
SELECT COALESCE(SUM(file_size_bytes), 0) AS storage_bytes
FROM videos
WHERE status <> 'archived';
```

### Top 10 videos

```sql
SELECT id, title, thumbnail_url, views
FROM videos
WHERE status <> 'archived'
ORDER BY views DESC, id DESC
LIMIT 10;
```

### Views per day

```sql
SELECT view_date, SUM(views) AS total_views
FROM video_view_stats
WHERE view_date >= date('now', '-29 days')
GROUP BY view_date
ORDER BY view_date ASC;
```

### Views per month

```sql
SELECT strftime('%Y-%m', view_date) AS month,
       SUM(views) AS total_views
FROM video_view_stats
WHERE view_date >= date('now', 'start of month', '-11 months')
GROUP BY strftime('%Y-%m', view_date)
ORDER BY month ASC;
```

## 5. Data consistency rules

- `videos.views` là tổng lượt xem hiện tại hiển thị trên danh sách và Top 10.
- `video_view_stats` lưu số lượt xem phát sinh theo ngày cho biểu đồ xu hướng.
- Khi có dữ liệu view mới, cần cập nhật cả `videos.views` và `video_view_stats` trong cùng transaction.
- Nếu admin chỉ nhập tổng views mà không có lịch sử theo ngày, không tự tạo dữ liệu lịch sử giả.
- Xóa video sẽ xóa các dòng thống kê liên quan nhờ `ON DELETE CASCADE`.
- Xóa category sẽ đặt `category_id` của video thành NULL.

## 6. Sample data

Tạo tối thiểu:
- 5 categories.
- 15 videos với title, thumbnail URL mẫu, views và file_size_bytes.
- 30 ngày dữ liệu view stats cho một số video để kiểm tra biểu đồ Daily.
- 12 tháng dữ liệu mẫu để kiểm tra Monthly.

Gắn nhãn hoặc ghi chú rõ đây là dữ liệu demo.
