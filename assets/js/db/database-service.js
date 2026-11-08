import { DATABASE_CONFIG } from '../config/database-config.js';
import { USERS_SCHEMA_SQL } from './schema-users.js';
import { VIDEOS_SCHEMA_SQL } from './schema-videos.js';
import { StorageService } from '../services/storage-service.js';
import { AuthService } from '../services/auth-service.js';
import { SupabaseService } from '../services/supabase-service.js';

let SQL = null;
let usersDb = null;
let videosDb = null;

function formatISODate(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function createSvgThumbnailDataUri(label, bgColor, accentColor) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
    <rect width="320" height="180" fill="${bgColor}"/>
    <circle cx="265" cy="40" r="65" fill="${accentColor}" opacity="0.18"/>
    <circle cx="55" cy="150" r="55" fill="${accentColor}" opacity="0.14"/>
    <rect x="24" y="24" width="44" height="24" rx="4" fill="${accentColor}"/>
    <polygon points="42,31 42,41 51,36" fill="#FFFFFF"/>
    <text x="24" y="132" fill="#FFFFFF" font-family="Inter, system-ui, sans-serif" font-size="16" font-weight="700">${label}</text>
    <text x="24" y="154" fill="rgba(255,255,255,0.8)" font-family="Inter, system-ui, sans-serif" font-size="11">DEMO VIDEO METADATA</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const DEMO_USER_ACCOUNTS = [
  { fullName: 'Nguyễn Văn An (User 1)', email: 'user1@demo.com' },
  { fullName: 'Trần Thị Bình (User 2)', email: 'user2@demo.com' },
  { fullName: 'Lê Hoàng Cường (User 3)', email: 'user3@demo.com' },
  { fullName: 'Phạm Minh Dung (User 4)', email: 'user4@demo.com' },
  { fullName: 'Hoàng Quốc Đạt (User 5)', email: 'user5@demo.com' },
  { fullName: 'Vũ Thị Giang (User 6)', email: 'user6@demo.com' },
  { fullName: 'Đặng Tuấn Hải (User 7)', email: 'user7@demo.com' },
  { fullName: 'Bùi Ngọc Khánh (User 8)', email: 'user8@demo.com' },
  { fullName: 'Đỗ Thanh Lâm (User 9)', email: 'user9@demo.com' },
  { fullName: 'Ngô Phương Mai (User 10)', email: 'user10@demo.com' }
];

async function seedDemoUsers(db) {
  const adminSalt = AuthService.generateSalt(16);
  const adminHash = await AuthService.hashPassword('Admin@123', adminSalt);

  const stmt = db.prepare(`
    INSERT INTO users (full_name, email, password_hash, password_salt, role, status)
    VALUES (?, ?, ?, ?, ?, 'active')
  `);
  stmt.run(['Demo Admin', 'admin@example.com', adminHash, adminSalt, 'ADMIN']);
  stmt.run(['Hữu Thịnh (Gmail Admin)', 'huuthinhit2203@gmail.com', adminHash, adminSalt, 'ADMIN']);

  // Seed 10 USER accounts (user1@demo.com -> user10@demo.com)
  const userSalt = AuthService.generateSalt(16);
  const userHash = await AuthService.hashPassword('User@123', userSalt);

  DEMO_USER_ACCOUNTS.forEach((u) => {
    stmt.run([u.fullName, u.email, userHash, userSalt, 'USER']);
  });

  stmt.free();
}

async function ensureUsersRoleSchemaAndDemoAccounts(db) {
  let changed = false;

  // 0. Ensure password_reset_otps table exists in users.db
  db.run(`
    CREATE TABLE IF NOT EXISTS password_reset_otps (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      account_email   TEXT NOT NULL COLLATE NOCASE,
      verify_gmail    TEXT NOT NULL DEFAULT 'huuthinhit2203@gmail.com',
      otp_code        TEXT NOT NULL,
      used            INTEGER NOT NULL DEFAULT 0,
      expires_at      TEXT NOT NULL,
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // 1. Check if 'role' column exists in users table (in case users.db was created before Permission module)
  const colsStmt = db.prepare('PRAGMA table_info(users)');
  const colNames = [];
  while (colsStmt.step()) {
    const row = colsStmt.getAsObject();
    colNames.push(row.name);
  }
  colsStmt.free();

  if (!colNames.includes('role')) {
    db.run("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('ADMIN', 'USER'));");
    db.run('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);');
    db.run("UPDATE users SET role = 'ADMIN' WHERE LOWER(email) IN ('admin@example.com', 'huuthinhit2203@gmail.com');");
    changed = true;
  }

  // 2. Ensure admin@example.com and huuthinhit2203@gmail.com exist and have ADMIN role
  for (const adminAcc of [
    { fullName: 'Demo Admin', email: 'admin@example.com' },
    { fullName: 'Hữu Thịnh (Gmail Admin)', email: 'huuthinhit2203@gmail.com' }
  ]) {
    const checkAdminStmt = db.prepare('SELECT id, role FROM users WHERE LOWER(email) = LOWER(?)');
    checkAdminStmt.bind([adminAcc.email]);
    const adminRow = checkAdminStmt.step() ? checkAdminStmt.getAsObject() : null;
    checkAdminStmt.free();

    if (!adminRow) {
      const adminSalt = AuthService.generateSalt(16);
      const adminHash = await AuthService.hashPassword('Admin@123', adminSalt);
      const insAdmin = db.prepare(`
        INSERT INTO users (full_name, email, password_hash, password_salt, role, status)
        VALUES (?, ?, ?, ?, 'ADMIN', 'active')
      `);
      insAdmin.run([adminAcc.fullName, adminAcc.email, adminHash, adminSalt]);
      insAdmin.free();
      changed = true;
    } else if (adminRow.role !== 'ADMIN') {
      const updAdmin = db.prepare("UPDATE users SET role = 'ADMIN' WHERE LOWER(email) = LOWER(?)");
      updAdmin.run([adminAcc.email]);
      updAdmin.free();
      changed = true;
    }
  }

  // 3. Ensure the 10 demo USER accounts (user1@demo.com .. user10@demo.com) exist
  let sharedUserSalt = null;
  let sharedUserHash = null;

  for (const demoUser of DEMO_USER_ACCOUNTS) {
    const checkStmt = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)');
    checkStmt.bind([demoUser.email]);
    const exists = checkStmt.step();
    checkStmt.free();

    if (!exists) {
      if (!sharedUserSalt) {
        sharedUserSalt = AuthService.generateSalt(16);
        sharedUserHash = await AuthService.hashPassword('User@123', sharedUserSalt);
      }
      const insStmt = db.prepare(`
        INSERT INTO users (full_name, email, password_hash, password_salt, role, status)
        VALUES (?, ?, ?, ?, 'USER', 'active')
      `);
      insStmt.run([demoUser.fullName, demoUser.email, sharedUserHash, sharedUserSalt]);
      insStmt.free();
      changed = true;
    }
  }

  return changed;
}

function seedDemoVideos(db) {
  const categories = [
    ['Tutorial & Coding', '[Demo] Video hướng dẫn lập trình và kiến trúc phần mềm'],
    ['Product Demo', '[Demo] Video giới thiệu tính năng sản phẩm mới'],
    ['AI & Machine Learning', '[Demo] Kiến thức và ứng dụng trí tuệ nhân tạo'],
    ['UI/UX Design', '[Demo] Thiết kế giao diện và trải nghiệm người dùng'],
    ['Webinar & Workshop', '[Demo] Bản ghi các buổi hội thảo trực tuyến']
  ];

  const catStmt = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
  categories.forEach((c) => catStmt.run(c));
  catStmt.free();

  const demoVideos = [
    {
      title: '[Demo] Xây dựng SPA với Vanilla JavaScript & ES Modules',
      description: 'Hướng dẫn tổ chức kiến trúc Single Page Application thuần JavaScript không cần framework.',
      thumb: createSvgThumbnailDataUri('Vanilla JS SPA', '#1E3A8A', '#3B82F6'),
      fileName: 'vanilla-js-spa-guide.mp4',
      fileSize: 148500000,
      views: 18420,
      categoryId: 1,
      status: 'active',
      daysAgo: 28
    },
    {
      title: '[Demo] Tích hợp SQLite trên trình duyệt bằng WebAssembly (sql.js)',
      description: 'Cách chạy SQLite trực tiếp trong browser và lưu trữ bền vững vào IndexedDB.',
      thumb: createSvgThumbnailDataUri('SQLite WebAssembly', '#0F172A', '#38BDF8'),
      fileName: 'sqlite-wasm-browser.mp4',
      fileSize: 215400000,
      views: 15930,
      categoryId: 1,
      status: 'active',
      daysAgo: 25
    },
    {
      title: '[Demo] Vibe Coding Workflow: Từ PRD đến sản phẩm hoàn chỉnh',
      description: 'Quy trình làm việc cùng AI Coding Agent dựa trên bộ tài liệu đặc tả chuẩn kỹ thuật.',
      thumb: createSvgThumbnailDataUri('Vibe Coding', '#312E81', '#818CF8'),
      fileName: 'vibe-coding-workflow.mp4',
      fileSize: 312000000,
      views: 24650,
      categoryId: 3,
      status: 'active',
      daysAgo: 22
    },
    {
      title: '[Demo] Thiết kế Minimal Admin Dashboard chuẩn UI/UX 2026',
      description: 'Nguyên tắc phối màu Light Mode, phân cấp chữ và thiết kế bảng dữ liệu dễ đọc.',
      thumb: createSvgThumbnailDataUri('Admin UI Design', '#064E3B', '#10B981'),
      fileName: 'minimal-admin-ui.mp4',
      fileSize: 184200000,
      views: 12380,
      categoryId: 4,
      status: 'active',
      daysAgo: 20
    },
    {
      title: '[Demo] Bảo mật ứng dụng Frontend: Phòng chống XSS & SQL Injection',
      description: 'Sử dụng Parameterized Queries và textContent để bảo vệ dữ liệu người dùng.',
      thumb: createSvgThumbnailDataUri('Frontend Security', '#7F1D1D', '#F87171'),
      fileName: 'frontend-security-xss.mp4',
      fileSize: 162800000,
      views: 11240,
      categoryId: 1,
      status: 'active',
      daysAgo: 18
    },
    {
      title: '[Demo] Ra mắt Video Admin Platform v2.0 — Tổng quan tính năng',
      description: 'Video demo giới thiệu các tính năng quản trị, thống kê và sao lưu cơ sở dữ liệu.',
      thumb: createSvgThumbnailDataUri('Product Launch 2.0', '#1E40AF', '#60A5FA'),
      fileName: 'product-launch-v2.mp4',
      fileSize: 95400000,
      views: 9870,
      categoryId: 2,
      status: 'active',
      daysAgo: 16
    },
    {
      title: '[Demo] Tối ưu hóa hiệu năng biểu đồ với Chart.js',
      description: 'Kỹ thuật hiển thị dữ liệu thống kê theo ngày và tháng mượt mà không rò rỉ bộ nhớ.',
      thumb: createSvgThumbnailDataUri('Chart.js Analytics', '#3B0764', '#C084FC'),
      fileName: 'chartjs-performance.mp4',
      fileSize: 128000000,
      views: 8640,
      categoryId: 1,
      status: 'active',
      daysAgo: 15
    },
    {
      title: '[Demo] Prompt Engineering nâng cao cho kỹ sư phần mềm',
      description: 'Cách chia nhỏ yêu cầu thành từng milestone để kiểm soát chất lượng mã nguồn.',
      thumb: createSvgThumbnailDataUri('Prompt Engineering', '#134E4A', '#2DD4BF'),
      fileName: 'prompt-engineering-dev.mp4',
      fileSize: 276500000,
      views: 14190,
      categoryId: 3,
      status: 'active',
      daysAgo: 14
    },
    {
      title: '[Demo] Hệ thống Design Tokens với CSS Variables hiện đại',
      description: 'Quản lý màu sắc, khoảng cách và typography nhất quán không cần trình biên dịch CSS.',
      thumb: createSvgThumbnailDataUri('CSS Variables', '#7C2D12', '#FB923C'),
      fileName: 'css-variables-tokens.mp4',
      fileSize: 110500000,
      views: 7420,
      categoryId: 4,
      status: 'active',
      daysAgo: 12
    },
    {
      title: '[Demo] Workshop: Xây dựng ứng dụng Offline-First với IndexedDB',
      description: 'Bản ghi buổi workshop chuyên sâu về lưu trữ dữ liệu phía trình duyệt.',
      thumb: createSvgThumbnailDataUri('IndexedDB Workshop', '#1E293B', '#94A3B8'),
      fileName: 'indexeddb-offline-workshop.mp4',
      fileSize: 420000000,
      views: 10560,
      categoryId: 5,
      status: 'active',
      daysAgo: 10
    },
    {
      title: '[Demo] Hướng dẫn sử dụng Web Crypto API để băm mật khẩu',
      description: 'Thực hành PBKDF2 và SHA-256 trực tiếp trên trình duyệt chuẩn W3C.',
      thumb: createSvgThumbnailDataUri('Web Crypto API', '#14532D', '#4ADE80'),
      fileName: 'web-crypto-pbkdf2.mp4',
      fileSize: 134000000,
      views: 6890,
      categoryId: 1,
      status: 'active',
      daysAgo: 8
    },
    {
      title: '[Demo] Thiết kế Responsive Data Table cho thiết bị di động',
      description: 'Giải pháp hiển thị bảng nhiều cột trên màn hình nhỏ mà vẫn giữ trải nghiệm tốt.',
      thumb: createSvgThumbnailDataUri('Responsive Tables', '#4C1D95', '#A78BFA'),
      fileName: 'responsive-data-tables.mp4',
      fileSize: 88200000,
      views: 5430,
      categoryId: 4,
      status: 'active',
      daysAgo: 6
    },
    {
      title: '[Demo] Kiến trúc Repository Pattern trong JavaScript',
      description: 'Tách biệt hoàn toàn câu lệnh SQL khỏi tầng giao diện người dùng.',
      thumb: createSvgThumbnailDataUri('Repository Pattern', '#0C4A6E', '#38BDF8'),
      fileName: 'repository-pattern-js.mp4',
      fileSize: 156000000,
      views: 8120,
      categoryId: 1,
      status: 'active',
      daysAgo: 4
    },
    {
      title: '[Demo] Hỏi đáp trực tuyến: Lộ trình học AI & Web Development',
      description: 'Tổng hợp các câu hỏi thường gặp trong buổi giao lưu cuối tuần.',
      thumb: createSvgThumbnailDataUri('Q&A Webinar', '#701A75', '#F472B6'),
      fileName: 'qa-webinar-ai-web.mp4',
      fileSize: 350000000,
      views: 4290,
      categoryId: 5,
      status: 'draft',
      daysAgo: 2
    },
    {
      title: '[Demo] Bản thử nghiệm tính năng xuất báo cáo v1 (Archived)',
      description: 'Video lưu trữ từ phiên bản cũ để kiểm tra bộ lọc trạng thái Archived.',
      thumb: createSvgThumbnailDataUri('Legacy Preview', '#334155', '#64748B'),
      fileName: 'legacy-report-v1.mp4',
      fileSize: 64000000,
      views: 1950,
      categoryId: 2,
      status: 'archived',
      daysAgo: 45
    }
  ];

  const vidStmt = db.prepare(`
    INSERT INTO videos (
      title, description, thumbnail_url, file_name, file_path, mime_type,
      file_size_bytes, views, category_id, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'video/mp4', ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  demoVideos.forEach((v) => {
    const createdDate = new Date(now);
    createdDate.setDate(now.getDate() - v.daysAgo);
    const isoCreated = `${formatISODate(createdDate)} 09:30:00`;

    vidStmt.run([
      v.title,
      v.description,
      v.thumb,
      v.fileName,
      `/local-media/${v.fileName}`,
      v.fileSize,
      v.views,
      v.categoryId,
      v.status,
      isoCreated,
      isoCreated
    ]);
  });
  vidStmt.free();

  // Seed 30 days of daily view stats for the Daily Line Chart
  const statsStmt = db.prepare(`
    INSERT OR REPLACE INTO video_view_stats (video_id, view_date, views)
    VALUES (?, ?, ?)
  `);

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = formatISODate(d);

    // Distribute daily views across top 6 active demo videos
    for (let vid = 1; vid <= 6; vid++) {
      const wave = Math.sin((29 - i) * 0.35 + vid) * 140;
      const base = 220 + vid * 45 + (29 - i) * 8;
      const dailyViews = Math.max(45, Math.round(base + wave));
      statsStmt.run([vid, dateStr, dailyViews]);
    }
  }

  // Seed historical monthly view stats across the past 11 months for the Monthly Line Chart
  for (let m = 11; m >= 1; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 15);
    const dateStr = formatISODate(d);

    for (let vid = 1; vid <= 5; vid++) {
      const monthlyViews = 1800 + (12 - m) * 320 + vid * 290;
      statsStmt.run([vid, dateStr, monthlyViews]);
    }
  }

  statsStmt.free();
}

function isSQLiteHeaderValid(uint8Array) {
  if (!uint8Array || uint8Array.byteLength < 16) return false;
  const header = new TextDecoder('ascii').decode(uint8Array.slice(0, 15));
  return header === 'SQLite format 3';
}

export const DatabaseService = {
  async init() {
    if (usersDb && videosDb) return;

    if (typeof window.initSqlJs !== 'function') {
      throw new Error('Thư viện sql.js chưa được nạp. Vui lòng kiểm tra kết nối mạng hoặc thư mục vendor/.');
    }

    SQL = await window.initSqlJs({
      locateFile: (file) => `${DATABASE_CONFIG.SQL_WASM_CDN_BASE}${file}`
    });

    // 1. Load or initialize users.db
    const savedUsersBytes = await StorageService.loadDatabaseBytes(DATABASE_CONFIG.USERS_DB_KEY);
    if (savedUsersBytes && isSQLiteHeaderValid(savedUsersBytes)) {
      usersDb = new SQL.Database(savedUsersBytes);
      usersDb.run('PRAGMA foreign_keys = ON;');
      const migrated = await ensureUsersRoleSchemaAndDemoAccounts(usersDb);
      if (migrated) {
        await this.persistUsers();
      }
    } else {
      usersDb = new SQL.Database();
      usersDb.run(USERS_SCHEMA_SQL);
      await seedDemoUsers(usersDb);
      await this.persistUsers();
    }

    // 2. Load or initialize videos.db
    const savedVideosBytes = await StorageService.loadDatabaseBytes(DATABASE_CONFIG.VIDEOS_DB_KEY);
    if (savedVideosBytes && isSQLiteHeaderValid(savedVideosBytes)) {
      videosDb = new SQL.Database(savedVideosBytes);
      videosDb.run('PRAGMA foreign_keys = ON;');
    } else {
      videosDb = new SQL.Database();
      videosDb.run(VIDEOS_SCHEMA_SQL);
      seedDemoVideos(videosDb);
      await this.persistVideos();
    }

    // 3. Connect and synchronize with Supabase Cloud (non-blocking if offline or tables not created yet)
    await this.syncWithSupabaseOnBoot();
  },

  async syncWithSupabaseOnBoot() {
    try {
      const statusInfo = await SupabaseService.checkConnection();
      if (statusInfo.status !== 'connected') return;

      const cloud = await SupabaseService.fetchAllCloudData();
      if (cloud.users.length === 0 && cloud.videos.length === 0) {
        // Cloud tables are empty -> seed cloud from local SQLite
        await this.pushLocalToSupabase();
      } else {
        // Cloud has data -> pull cloud into local SQLite
        await this.applyCloudDataToLocal(cloud);
      }
    } catch {
      // Fallback gracefully to local SQLite
    }
  },

  async pushLocalToSupabase() {
    const users = this.queryAll(this.getUsersDb(), 'SELECT * FROM users ORDER BY id ASC');
    const categories = this.queryAll(this.getVideosDb(), 'SELECT * FROM categories ORDER BY id ASC');
    const videos = this.queryAll(this.getVideosDb(), 'SELECT * FROM videos ORDER BY id ASC');
    const stats = this.queryAll(this.getVideosDb(), 'SELECT * FROM video_view_stats ORDER BY id ASC');

    await SupabaseService.pushAllLocalData({ users, categories, videos, stats });
  },

  async pullSupabaseToLocal() {
    const cloud = await SupabaseService.fetchAllCloudData();
    await this.applyCloudDataToLocal(cloud);
  },

  async applyCloudDataToLocal(cloud) {
    if (cloud.users && cloud.users.length > 0) {
      const uDb = this.getUsersDb();
      uDb.run('DELETE FROM users;');
      const uStmt = uDb.prepare(`
        INSERT INTO users (id, full_name, email, password_hash, password_salt, role, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')), COALESCE(?, datetime('now')))
      `);
      cloud.users.forEach((u) => {
        uStmt.run([
          Number(u.id),
          u.full_name,
          u.email,
          u.password_hash,
          u.password_salt,
          u.role || 'USER',
          u.status || 'active',
          u.created_at || null,
          u.updated_at || null
        ]);
      });
      uStmt.free();
      await this.persistUsers();
    }

    if (cloud.categories && cloud.categories.length > 0) {
      const vDb = this.getVideosDb();
      vDb.run('PRAGMA foreign_keys = OFF;');
      vDb.run('DELETE FROM video_view_stats;');
      vDb.run('DELETE FROM videos;');
      vDb.run('DELETE FROM categories;');

      const cStmt = vDb.prepare(`
        INSERT INTO categories (id, name, description, created_at)
        VALUES (?, ?, ?, COALESCE(?, datetime('now')))
      `);
      cloud.categories.forEach((c) => {
        cStmt.run([Number(c.id), c.name, c.description || '', c.created_at || null]);
      });
      cStmt.free();

      if (cloud.videos && cloud.videos.length > 0) {
        const vStmt = vDb.prepare(`
          INSERT INTO videos (
            id, title, description, thumbnail_url, file_name, file_path, mime_type,
            file_size_bytes, views, category_id, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')), COALESCE(?, datetime('now')))
        `);
        cloud.videos.forEach((v) => {
          vStmt.run([
            Number(v.id),
            v.title,
            v.description || '',
            v.thumbnail_url || '',
            v.file_name || null,
            v.file_path || null,
            v.mime_type || null,
            Number(v.file_size_bytes) || 0,
            Number(v.views) || 0,
            v.category_id ? Number(v.category_id) : null,
            v.status || 'active',
            v.created_at || null,
            v.updated_at || null
          ]);
        });
        vStmt.free();
      }

      if (cloud.stats && cloud.stats.length > 0) {
        const sStmt = vDb.prepare(`
          INSERT OR REPLACE INTO video_view_stats (video_id, view_date, views)
          VALUES (?, ?, ?)
        `);
        cloud.stats.forEach((s) => {
          sStmt.run([Number(s.video_id), s.view_date, Number(s.views) || 0]);
        });
        sStmt.free();
      }

      vDb.run('PRAGMA foreign_keys = ON;');
      await this.persistVideos();
    }
  },

  getUsersDb() {
    if (!usersDb) throw new Error('users.db chưa được khởi tạo.');
    return usersDb;
  },

  getVideosDb() {
    if (!videosDb) throw new Error('videos.db chưa được khởi tạo.');
    return videosDb;
  },

  async persistUsers() {
    if (!usersDb) return;
    const bytes = usersDb.export();
    await StorageService.saveDatabaseBytes(DATABASE_CONFIG.USERS_DB_KEY, bytes);
  },

  async persistVideos() {
    if (!videosDb) return;
    const bytes = videosDb.export();
    await StorageService.saveDatabaseBytes(DATABASE_CONFIG.VIDEOS_DB_KEY, bytes);
  },

  queryAll(db, sql, params = []) {
    const stmt = db.prepare(sql);
    try {
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      return rows;
    } finally {
      stmt.free();
    }
  },

  queryOne(db, sql, params = []) {
    const rows = this.queryAll(db, sql, params);
    return rows.length > 0 ? rows[0] : null;
  },

  run(db, sql, params = []) {
    const stmt = db.prepare(sql);
    try {
      stmt.run(params);
    } finally {
      stmt.free();
    }
  },

  getDatabaseSizes() {
    const usersBytes = usersDb ? usersDb.export().byteLength : 0;
    const videosBytes = videosDb ? videosDb.export().byteLength : 0;
    return {
      usersDbBytes: usersBytes,
      videosDbBytes: videosBytes,
      totalBytes: usersBytes + videosBytes
    };
  },

  exportDatabaseFile(target) {
    if (target === 'users') {
      const bytes = this.getUsersDb().export();
      StorageService.downloadBytesAsFile(bytes, 'users.db');
    } else if (target === 'videos') {
      const bytes = this.getVideosDb().export();
      StorageService.downloadBytesAsFile(bytes, 'videos.db');
    } else {
      throw new Error('Loại database cần export không hợp lệ.');
    }
  },

  async importDatabaseFile(target, file) {
    if (!file) throw new Error('Chưa chọn file database.');
    const bytes = await StorageService.readFileAsUint8Array(file);

    if (!isSQLiteHeaderValid(bytes)) {
      throw new Error('File không phải là định dạng SQLite 3 hợp lệ.');
    }

    let tempDb = null;
    try {
      tempDb = new SQL.Database(bytes);
      const tables = this.queryAll(
        tempDb,
        "SELECT name FROM sqlite_master WHERE type='table'"
      ).map((r) => r.name);

      if (target === 'users') {
        if (!tables.includes('users')) {
          throw new Error('File SQLite không chứa bảng "users" hợp lệ cho users.db.');
        }
        if (usersDb) usersDb.close();
        usersDb = tempDb;
        usersDb.run('PRAGMA foreign_keys = ON;');
        await this.persistUsers();
      } else if (target === 'videos') {
        const required = ['videos', 'categories', 'video_view_stats'];
        const missing = required.filter((t) => !tables.includes(t));
        if (missing.length > 0) {
          throw new Error(`File SQLite thiếu bảng bắt buộc cho videos.db: ${missing.join(', ')}`);
        }
        if (videosDb) videosDb.close();
        videosDb = tempDb;
        videosDb.run('PRAGMA foreign_keys = ON;');
        await this.persistVideos();
      } else {
        tempDb.close();
        throw new Error('Đích import không hợp lệ.');
      }
    } catch (err) {
      if (tempDb && tempDb !== usersDb && tempDb !== videosDb) {
        tempDb.close();
      }
      throw err;
    }
  },

  async resetDemoData() {
    if (usersDb) usersDb.close();
    if (videosDb) videosDb.close();

    usersDb = new SQL.Database();
    usersDb.run(USERS_SCHEMA_SQL);
    await seedDemoUsers(usersDb);
    await this.persistUsers();

    videosDb = new SQL.Database();
    videosDb.run(VIDEOS_SCHEMA_SQL);
    seedDemoVideos(videosDb);
    await this.persistVideos();
  }
};
