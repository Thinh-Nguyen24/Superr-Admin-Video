// Auto-generated fallback for file:// protocol when browser blocks ES Module imports
(function() {
  if (window.__VIDEO_ADMIN_BOOTSTRAPPED__) return;
  // --- assets/js/config/database-config.js ---
const DATABASE_CONFIG = {
  IDB_NAME: 'VideoAdminSQLiteStorage',
  IDB_VERSION: 1,
  IDB_STORE: 'databases',
  USERS_DB_KEY: 'users.db',
  VIDEOS_DB_KEY: 'videos.db',
  SQL_WASM_CDN_BASE: 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/',
  SESSION_STORAGE_KEY: 'video_admin_session_v1',

  // Supabase connection config (from supabase.txt)
  SUPABASE_URL: 'https://eaqxubxumykgthvpibiq.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_pyBt2uv7YJkaWtYCe7Lfpg_8lrA665r',
  VERIFY_GMAIL_ADDRESS: 'huuthinhit2203@gmail.com',
  GMAIL_APP_PASS_STORAGE_KEY: 'video_admin_gmail_app_password_v1'
};

  // --- assets/js/db/schema-users.js ---
const USERS_SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name       TEXT NOT NULL,
    email           TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash   TEXT NOT NULL,
    password_salt   TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'USER'
                    CHECK (role IN ('ADMIN', 'USER')),
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'disabled'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS password_reset_otps (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    account_email   TEXT NOT NULL COLLATE NOCASE,
    verify_gmail    TEXT NOT NULL DEFAULT 'huuthinhit2203@gmail.com',
    otp_code        TEXT NOT NULL,
    used            INTEGER NOT NULL DEFAULT 0,
    expires_at      TEXT NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reset_otps_email ON password_reset_otps(account_email);
`;

  // --- assets/js/db/schema-videos.js ---
const VIDEOS_SCHEMA_SQL = `
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
    view_date   TEXT NOT NULL,
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
`;

  // --- assets/js/services/storage-service.js ---

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_CONFIG.IDB_NAME, DATABASE_CONFIG.IDB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(DATABASE_CONFIG.IDB_STORE)) {
        db.createObjectStore(DATABASE_CONFIG.IDB_STORE);
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error || new Error('Không thể mở IndexedDB'));
  });
}
const StorageService = {
  async loadDatabaseBytes(key) {
    const idb = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(DATABASE_CONFIG.IDB_STORE, 'readonly');
      const store = tx.objectStore(DATABASE_CONFIG.IDB_STORE);
      const req = store.get(key);

      req.onsuccess = () => {
        idb.close();
        resolve(req.result ? new Uint8Array(req.result) : null);
      };
      req.onerror = () => {
        idb.close();
        reject(req.error || new Error(`Lỗi đọc ${key} từ IndexedDB`));
      };
    });
  },

  async saveDatabaseBytes(key, uint8Array) {
    const idb = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(DATABASE_CONFIG.IDB_STORE, 'readwrite');
      const store = tx.objectStore(DATABASE_CONFIG.IDB_STORE);
      const req = store.put(uint8Array, key);

      tx.oncomplete = () => {
        idb.close();
        resolve();
      };
      tx.onerror = () => {
        idb.close();
        reject(req.error || tx.error || new Error(`Lỗi lưu ${key} vào IndexedDB`));
      };
    });
  },

  async deleteDatabaseBytes(key) {
    const idb = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(DATABASE_CONFIG.IDB_STORE, 'readwrite');
      const store = tx.objectStore(DATABASE_CONFIG.IDB_STORE);
      store.delete(key);

      tx.oncomplete = () => {
        idb.close();
        resolve();
      };
      tx.onerror = () => {
        idb.close();
        reject(tx.error || new Error(`Lỗi xóa ${key} khỏi IndexedDB`));
      };
    });
  },

  downloadBytesAsFile(uint8Array, fileName) {
    const blob = new Blob([uint8Array], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  readFileAsUint8Array(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(new Uint8Array(reader.result));
      };
      reader.onerror = () => reject(new Error('Không thể đọc file được chọn.'));
      reader.readAsArrayBuffer(file);
    });
  },

  formatBytes(bytes) {
    const num = Number(bytes);
    if (!Number.isFinite(num) || num <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.min(Math.floor(Math.log(num) / Math.log(k)), units.length - 1);
    const val = num / Math.pow(k, i);
    return `${val >= 10 || i === 0 ? val.toFixed(i === 0 ? 0 : 1) : val.toFixed(2)} ${units[i]}`;
  },

  formatNumber(value) {
    const num = Number(value) || 0;
    return new Intl.NumberFormat('en-US').format(num);
  },

  formatDate(dateStr) {
    if (!dateStr) return '—';
    const normalized = String(dateStr).replace(' ', 'T');
    const d = new Date(normalized);
    if (Number.isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
};

  // --- assets/js/services/auth-service.js ---

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
const AuthService = {
  generateSalt(length = 16) {
    const randomBytes = new Uint8Array(length);
    window.crypto.getRandomValues(randomBytes);
    return bufferToHex(randomBytes);
  },

  async hashPassword(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await window.crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: 10000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );

    return bufferToHex(derivedBits);
  },

  async verifyPassword(password, salt, expectedHash) {
    const computed = await this.hashPassword(password, salt);
    return computed === expectedHash;
  },

  setSession(user, remember = false) {
    const expiresAt = Date.now() + (remember ? 7 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000);
    const role = user.role || (String(user.email || '').toLowerCase() === 'admin@example.com' ? 'ADMIN' : 'USER');
    const payload = JSON.stringify({
      userId: user.id,
      fullName: user.full_name,
      email: user.email,
      role,
      expiresAt
    });

    sessionStorage.setItem(DATABASE_CONFIG.SESSION_STORAGE_KEY, payload);
    if (remember) {
      localStorage.setItem(DATABASE_CONFIG.SESSION_STORAGE_KEY, payload);
    } else {
      localStorage.removeItem(DATABASE_CONFIG.SESSION_STORAGE_KEY);
    }
  },

  getSession() {
    const raw =
      sessionStorage.getItem(DATABASE_CONFIG.SESSION_STORAGE_KEY) ||
      localStorage.getItem(DATABASE_CONFIG.SESSION_STORAGE_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      if (!parsed.expiresAt || Date.now() > parsed.expiresAt) {
        this.clearSession();
        return null;
      }
      if (!parsed.role) {
        parsed.role =
          String(parsed.email || '').toLowerCase() === 'admin@example.com' ? 'ADMIN' : 'USER';
      }
      return parsed;
    } catch {
      this.clearSession();
      return null;
    }
  },

  clearSession() {
    sessionStorage.removeItem(DATABASE_CONFIG.SESSION_STORAGE_KEY);
    localStorage.removeItem(DATABASE_CONFIG.SESSION_STORAGE_KEY);
  },

  isAuthenticated() {
    return Boolean(this.getSession());
  },

  isAdmin() {
    const session = this.getSession();
    return Boolean(session && session.role === 'ADMIN');
  }
};

  // --- assets/js/services/validation-service.js ---
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ValidationService = {
  validateLogin({ email, password }) {
    const errors = {};
    const trimmedEmail = String(email || '').trim();

    if (!trimmedEmail) {
      errors.email = 'Vui lòng nhập địa chỉ email.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Định dạng email không hợp lệ.';
    }

    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  validateRegister({ fullName, email, password, confirmPassword }) {
    const errors = {};
    const trimmedName = String(fullName || '').trim();
    const trimmedEmail = String(email || '').trim();

    if (!trimmedName) {
      errors.fullName = 'Vui lòng nhập họ và tên.';
    } else if (trimmedName.length < 2) {
      errors.fullName = 'Họ và tên phải có ít nhất 2 ký tự.';
    }

    if (!trimmedEmail) {
      errors.email = 'Vui lòng nhập địa chỉ email.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Định dạng email không hợp lệ.';
    }

    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu.';
    } else if (String(password).length < 8) {
      errors.password = 'Mật khẩu phải có tối thiểu 8 ký tự.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  validateForgotPassword({ email, newPassword, confirmPassword }) {
    const errors = {};
    const trimmedEmail = String(email || '').trim();

    if (!trimmedEmail) {
      errors.email = 'Vui lòng nhập email đã đăng ký.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Định dạng email không hợp lệ.';
    }

    if (!newPassword) {
      errors.newPassword = 'Vui lòng nhập mật khẩu mới.';
    } else if (String(newPassword).length < 8) {
      errors.newPassword = 'Mật khẩu mới phải có tối thiểu 8 ký tự.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Vui lòng nhập lại mật khẩu mới.';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  validateVideoForm({ title, thumbnailUrl, views, fileSizeBytes, status }) {
    const errors = {};
    const trimmedTitle = String(title || '').trim();
    const trimmedThumb = String(thumbnailUrl || '').trim();

    if (!trimmedTitle) {
      errors.title = 'Tiêu đề video không được để trống.';
    } else if (trimmedTitle.length > 200) {
      errors.title = 'Tiêu đề không vượt quá 200 ký tự.';
    }

    const parsedViews = Number(views);
    if (views === '' || views === null || views === undefined || !Number.isInteger(parsedViews) || parsedViews < 0) {
      errors.views = 'Lượt xem phải là số nguyên không âm (>= 0).';
    }

    const parsedSize = Number(fileSizeBytes);
    if (fileSizeBytes === '' || fileSizeBytes === null || fileSizeBytes === undefined || Number.isNaN(parsedSize) || parsedSize < 0) {
      errors.fileSizeBytes = 'Dung lượng file phải là số không âm (>= 0).';
    }

    if (trimmedThumb && !trimmedThumb.startsWith('data:image/') && !trimmedThumb.startsWith('assets/')) {
      try {
        const u = new URL(trimmedThumb);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') {
          errors.thumbnailUrl = 'URL thumbnail phải bắt đầu bằng http:// hoặc https://.';
        }
      } catch {
        errors.thumbnailUrl = 'URL thumbnail không hợp lệ.';
      }
    }

    if (!['active', 'draft', 'archived'].includes(status)) {
      errors.status = 'Trạng thái không hợp lệ.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};

  // --- assets/js/services/supabase-service.js ---

let supabaseClient = null;
let connectionStatus = 'checking'; // 'checking' | 'connected' | 'missing_tables' | 'error'
let lastErrorMessage = '';
const statusListeners = new Set();

function notifyListeners() {
  statusListeners.forEach((fn) => {
    try {
      fn({ status: connectionStatus, error: lastErrorMessage });
    } catch {
      // ignore listener errors
    }
  });
}

function setStatus(status, errorMsg = '') {
  connectionStatus = status;
  lastErrorMessage = errorMsg;
  notifyListeners();
}
const SUPABASE_SQL_SCHEMA_SCRIPT = `-- Chạy script này trong Supabase Dashboard -> SQL Editor -> New Query
CREATE TABLE IF NOT EXISTS public.users (
    id              BIGSERIAL PRIMARY KEY,
    full_name       TEXT NOT NULL,
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    password_salt   TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('ADMIN', 'USER')),
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
    id          BIGSERIAL PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.videos (
    id              BIGSERIAL PRIMARY KEY,
    title           TEXT NOT NULL,
    description     TEXT,
    thumbnail_url   TEXT,
    file_name       TEXT,
    file_path       TEXT,
    mime_type       TEXT,
    file_size_bytes BIGINT NOT NULL DEFAULT 0 CHECK (file_size_bytes >= 0),
    views           BIGINT NOT NULL DEFAULT 0 CHECK (views >= 0),
    category_id     BIGINT REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL,
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.video_view_stats (
    id          BIGSERIAL PRIMARY KEY,
    video_id    BIGINT NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
    view_date   TEXT NOT NULL,
    views       BIGINT NOT NULL DEFAULT 0 CHECK (views >= 0),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (video_id, view_date)
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_view_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access to users" ON public.users;
CREATE POLICY "Allow public access to users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to categories" ON public.categories;
CREATE POLICY "Allow public access to categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to videos" ON public.videos;
CREATE POLICY "Allow public access to videos" ON public.videos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to video_view_stats" ON public.video_view_stats;
CREATE POLICY "Allow public access to video_view_stats" ON public.video_view_stats FOR ALL USING (true) WITH CHECK (true);`;
const SupabaseService = {
  getClient() {
    if (supabaseClient) return supabaseClient;
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      supabaseClient = window.supabase.createClient(
        DATABASE_CONFIG.SUPABASE_URL,
        DATABASE_CONFIG.SUPABASE_PUBLISHABLE_KEY,
        {
          auth: { persistSession: false }
        }
      );
    }
    return supabaseClient;
  },

  getStatus() {
    return {
      status: connectionStatus,
      error: lastErrorMessage,
      url: DATABASE_CONFIG.SUPABASE_URL,
      publishableKey: DATABASE_CONFIG.SUPABASE_PUBLISHABLE_KEY
    };
  },

  onStatusChange(callback) {
    statusListeners.add(callback);
    return () => statusListeners.delete(callback);
  },

  async checkConnection() {
    const client = this.getClient();
    if (!client) {
      setStatus('error', 'Thư viện @supabase/supabase-js chưa được nạp.');
      return this.getStatus();
    }

    setStatus('checking', '');

    try {
      const { error } = await client.from('users').select('id').limit(1);

      if (!error) {
        setStatus('connected', '');
        return this.getStatus();
      }

      const code = String(error.code || '');
      const msg = String(error.message || '');

      if (
        code === '42P01' ||
        code === 'PGRST205' ||
        msg.includes('relation') ||
        msg.includes('does not exist') ||
        msg.includes('schema cache')
      ) {
        setStatus(
          'missing_tables',
          'Đã kết nối tới Supabase Project nhưng chưa khởi tạo các bảng (users, categories, videos, video_view_stats).'
        );
      } else {
        setStatus('error', msg || 'Lỗi truy vấn Supabase.');
      }
    } catch (err) {
      setStatus('error', err.message || 'Không thể kết nối mạng tới Supabase.');
    }

    return this.getStatus();
  },

  isReady() {
    return connectionStatus === 'connected' && Boolean(this.getClient());
  },

  // --- Cloud CRUD Sync Helpers ---
  async syncUserUpsert(userRow) {
    if (!this.isReady() || !userRow) return;
    const client = this.getClient();
    await client.from('users').upsert(
      {
        id: Number(userRow.id),
        full_name: userRow.full_name,
        email: userRow.email,
        password_hash: userRow.password_hash,
        password_salt: userRow.password_salt,
        role: userRow.role || 'USER',
        status: userRow.status || 'active'
      },
      { onConflict: 'email' }
    );
  },

  async syncUserRole(userId, email, newRole) {
    if (!this.isReady()) return;
    const client = this.getClient();
    if (email) {
      await client
        .from('users')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('email', email);
    } else {
      await client
        .from('users')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', Number(userId));
    }
  },

  async syncUserPassword(userId, email, passwordHash, passwordSalt) {
    if (!this.isReady()) return;
    const client = this.getClient();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const nowIso = new Date().toISOString();

    if (cleanEmail === 'admin@example.com' || cleanEmail === 'huuthinhit2203@gmail.com') {
      await client
        .from('users')
        .update({
          password_hash: passwordHash,
          password_salt: passwordSalt,
          updated_at: nowIso
        })
        .in('email', ['admin@example.com', 'huuthinhit2203@gmail.com']);
      return;
    }

    if (cleanEmail) {
      await client
        .from('users')
        .update({
          password_hash: passwordHash,
          password_salt: passwordSalt,
          updated_at: nowIso
        })
        .ilike('email', cleanEmail);
    } else {
      await client
        .from('users')
        .update({
          password_hash: passwordHash,
          password_salt: passwordSalt,
          updated_at: nowIso
        })
        .eq('id', Number(userId));
    }
  },

  async fetchUserByEmail(email) {
    if (!this.isReady()) return null;
    const client = this.getClient();
    const { data, error } = await client
      .from('users')
      .select('*')
      .ilike('email', String(email || '').trim())
      .limit(1);

    if (error || !data || data.length === 0) return null;
    return data[0];
  },

  async syncCategoryUpsert(catRow) {
    if (!this.isReady() || !catRow) return;
    const client = this.getClient();
    await client.from('categories').upsert(
      {
        id: Number(catRow.id),
        name: catRow.name,
        description: catRow.description || ''
      },
      { onConflict: 'id' }
    );
  },

  async syncCategoryDelete(categoryId) {
    if (!this.isReady()) return;
    const client = this.getClient();
    await client.from('categories').delete().eq('id', Number(categoryId));
  },

  async syncVideoUpsert(videoRow) {
    if (!this.isReady() || !videoRow) return;
    const client = this.getClient();
    await client.from('videos').upsert(
      {
        id: Number(videoRow.id),
        title: videoRow.title,
        description: videoRow.description || '',
        thumbnail_url: videoRow.thumbnail_url || '',
        file_name: videoRow.file_name || null,
        file_path: videoRow.file_path || null,
        mime_type: videoRow.mime_type || null,
        file_size_bytes: Number(videoRow.file_size_bytes) || 0,
        views: Number(videoRow.views) || 0,
        category_id: videoRow.category_id ? Number(videoRow.category_id) : null,
        status: videoRow.status || 'active'
      },
      { onConflict: 'id' }
    );
  },

  async syncVideoDelete(videoId) {
    if (!this.isReady()) return;
    const client = this.getClient();
    await client.from('videos').delete().eq('id', Number(videoId));
  },

  async createAndSendGmailOtp({ accountEmail, verifyGmail, otpCode, expiresAt, gmailAppPassword = '' }) {
    const client = this.getClient();
    if (client && this.isReady()) {
      await client.from('password_reset_otps').insert({
        account_email: accountEmail,
        verify_gmail: verifyGmail,
        otp_code: otpCode,
        used: false,
        expires_at: expiresAt
      });
    }

    // Call deployed Supabase Edge Function 'send-gmail-otp'
    const fnUrl = `${DATABASE_CONFIG.SUPABASE_URL}/functions/v1/send-gmail-otp`;
    const response = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: DATABASE_CONFIG.SUPABASE_PUBLISHABLE_KEY
      },
      body: JSON.stringify({
        accountEmail,
        verifyGmail,
        otpCode,
        gmailAppPassword
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Không thể gửi email OTP qua Gmail SMTP.');
    }
    return data;
  },

  async verifyCloudOtp(accountEmail, otpCode) {
    if (!this.isReady()) return null;
    const client = this.getClient();
    const { data, error } = await client
      .from('password_reset_otps')
      .select('*')
      .ilike('account_email', accountEmail)
      .eq('otp_code', String(otpCode).trim())
      .eq('used', false)
      .order('id', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return null;
    const row = data[0];
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return { expired: true };
    }
    return { valid: true, row };
  },

  async markCloudOtpUsed(accountEmail, otpCode) {
    if (!this.isReady()) return;
    const client = this.getClient();
    await client
      .from('password_reset_otps')
      .update({ used: true })
      .ilike('account_email', accountEmail)
      .eq('otp_code', String(otpCode).trim());
  },

  async fetchAllCloudData() {
    const statusInfo = await this.checkConnection();
    if (statusInfo.status !== 'connected') {
      throw new Error(statusInfo.error || 'Chưa kết nối được tới các bảng trên Supabase.');
    }

    const client = this.getClient();
    const [usersRes, catsRes, videosRes, statsRes] = await Promise.all([
      client.from('users').select('*').order('id', { ascending: true }),
      client.from('categories').select('*').order('id', { ascending: true }),
      client.from('videos').select('*').order('id', { ascending: true }),
      client.from('video_view_stats').select('*').order('id', { ascending: true })
    ]);

    if (usersRes.error) throw new Error(usersRes.error.message);
    if (catsRes.error) throw new Error(catsRes.error.message);
    if (videosRes.error) throw new Error(videosRes.error.message);
    if (statsRes.error) throw new Error(statsRes.error.message);

    return {
      users: usersRes.data || [],
      categories: catsRes.data || [],
      videos: videosRes.data || [],
      stats: statsRes.data || []
    };
  },

  async pushAllLocalData({ users = [], categories = [], videos = [], stats = [] }) {
    const statusInfo = await this.checkConnection();
    if (statusInfo.status !== 'connected') {
      throw new Error(statusInfo.error || 'Chưa kết nối được tới các bảng trên Supabase.');
    }

    const client = this.getClient();

    if (users.length > 0) {
      const payload = users.map((u) => ({
        id: Number(u.id),
        full_name: u.full_name,
        email: u.email,
        password_hash: u.password_hash,
        password_salt: u.password_salt,
        role: u.role || 'USER',
        status: u.status || 'active'
      }));
      const { error } = await client.from('users').upsert(payload, { onConflict: 'id' });
      if (error) throw new Error(`Lỗi đồng bộ bảng users: ${error.message}`);
    }

    if (categories.length > 0) {
      const payload = categories.map((c) => ({
        id: Number(c.id),
        name: c.name,
        description: c.description || ''
      }));
      const { error } = await client.from('categories').upsert(payload, { onConflict: 'id' });
      if (error) throw new Error(`Lỗi đồng bộ bảng categories: ${error.message}`);
    }

    if (videos.length > 0) {
      const payload = videos.map((v) => ({
        id: Number(v.id),
        title: v.title,
        description: v.description || '',
        thumbnail_url: v.thumbnail_url || '',
        file_name: v.file_name || null,
        file_path: v.file_path || null,
        mime_type: v.mime_type || null,
        file_size_bytes: Number(v.file_size_bytes) || 0,
        views: Number(v.views) || 0,
        category_id: v.category_id ? Number(v.category_id) : null,
        status: v.status || 'active'
      }));
      const { error } = await client.from('videos').upsert(payload, { onConflict: 'id' });
      if (error) throw new Error(`Lỗi đồng bộ bảng videos: ${error.message}`);
    }

    if (stats.length > 0) {
      const payload = stats.map((s) => ({
        video_id: Number(s.video_id),
        view_date: s.view_date,
        views: Number(s.views) || 0
      }));
      const { error } = await client
        .from('video_view_stats')
        .upsert(payload, { onConflict: 'video_id,view_date' });
      if (error) throw new Error(`Lỗi đồng bộ bảng video_view_stats: ${error.message}`);
    }
  }
};

  // --- assets/js/db/database-service.js ---






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
const DatabaseService = {
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

  // --- assets/js/repositories/user-repository.js ---
const UserRepository = {
  findByEmail(email) {
    const db = DatabaseService.getUsersDb();
    return DatabaseService.queryOne(
      db,
      `SELECT id, full_name, email, password_hash, password_salt, role, status, created_at
       FROM users
       WHERE email = ? COLLATE NOCASE`,
      [String(email || '').trim()]
    );
  },

  async findByEmailFresh(email) {
    const trimmed = String(email || '').trim();
    if (!trimmed) return null;

    try {
      const cloudUser = await SupabaseService.fetchUserByEmail(trimmed);
      if (cloudUser) {
        const db = DatabaseService.getUsersDb();
        const existingLocal = this.findByEmail(trimmed);
        if (existingLocal) {
          DatabaseService.run(
            db,
            `UPDATE users
             SET full_name = ?, password_hash = ?, password_salt = ?, role = ?, status = ?
             WHERE LOWER(email) = LOWER(?)`,
            [
              cloudUser.full_name,
              cloudUser.password_hash,
              cloudUser.password_salt,
              cloudUser.role || 'USER',
              cloudUser.status || 'active',
              trimmed
            ]
          );
        } else {
          DatabaseService.run(
            db,
            `INSERT INTO users (full_name, email, password_hash, password_salt, role, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              cloudUser.full_name,
              cloudUser.email,
              cloudUser.password_hash,
              cloudUser.password_salt,
              cloudUser.role || 'USER',
              cloudUser.status || 'active'
            ]
          );
        }
        await DatabaseService.persistUsers();
      }
    } catch {
      // Fallback to local SQLite
    }

    return this.findByEmail(trimmed);
  },

  findById(id) {
    const db = DatabaseService.getUsersDb();
    return DatabaseService.queryOne(
      db,
      `SELECT id, full_name, email, role, status, created_at, updated_at
       FROM users
       WHERE id = ?`,
      [Number(id)]
    );
  },

  listUsers({ search = '', role = '' } = {}) {
    const db = DatabaseService.getUsersDb();
    const conditions = [];
    const params = [];

    const trimmedSearch = String(search || '').trim();
    if (trimmedSearch) {
      conditions.push('(full_name LIKE ? OR email LIKE ?)');
      params.push(`%${trimmedSearch}%`, `%${trimmedSearch}%`);
    }

    if (role && ['ADMIN', 'USER'].includes(role)) {
      conditions.push('role = ?');
      params.push(role);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    return DatabaseService.queryAll(
      db,
      `SELECT id, full_name, email, role, status, created_at, updated_at
       FROM users
       ${whereClause}
       ORDER BY id ASC`,
      params
    );
  },

  getRoleSummary() {
    const db = DatabaseService.getUsersDb();
    const totalRow = DatabaseService.queryOne(db, 'SELECT COUNT(*) AS total FROM users');
    const adminRow = DatabaseService.queryOne(
      db,
      "SELECT COUNT(*) AS total FROM users WHERE role = 'ADMIN'"
    );
    const userRow = DatabaseService.queryOne(
      db,
      "SELECT COUNT(*) AS total FROM users WHERE role = 'USER'"
    );

    return {
      total: totalRow ? Number(totalRow.total) : 0,
      adminCount: adminRow ? Number(adminRow.total) : 0,
      userCount: userRow ? Number(userRow.total) : 0
    };
  },

  async createUser({ fullName, email, passwordHash, passwordSalt, role = 'USER' }) {
    const db = DatabaseService.getUsersDb();
    const existing = this.findByEmail(email);
    if (existing) {
      throw new Error('Địa chỉ email này đã được đăng ký trong users.db.');
    }

    const safeRole = ['ADMIN', 'USER'].includes(role) ? role : 'USER';

    DatabaseService.run(
      db,
      `INSERT INTO users (full_name, email, password_hash, password_salt, role, status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [String(fullName).trim(), String(email).trim(), passwordHash, passwordSalt, safeRole]
    );

    await DatabaseService.persistUsers();
    const createdUser = this.findByEmail(email);
    await SupabaseService.syncUserUpsert(createdUser);
    return createdUser;
  },

  async updateUserRole(targetUserId, newRole, actingUserId) {
    if (!['ADMIN', 'USER'].includes(newRole)) {
      throw new Error('Quyền (Role) không hợp lệ. Chỉ chấp nhận ADMIN hoặc USER.');
    }

    if (Number(targetUserId) === Number(actingUserId)) {
      throw new Error('Không thể tự thay đổi quyền của chính tài khoản đang đăng nhập.');
    }

    const target = this.findById(targetUserId);
    if (!target) {
      throw new Error('Không tìm thấy tài khoản cần phân quyền.');
    }

    const db = DatabaseService.getUsersDb();
    DatabaseService.run(
      db,
      `UPDATE users
       SET role = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [newRole, Number(targetUserId)]
    );

    await DatabaseService.persistUsers();
    await SupabaseService.syncUserRole(target.id, target.email, newRole);
    return this.findById(targetUserId);
  },

  async updatePassword(userId, passwordHash, passwordSalt) {
    const db = DatabaseService.getUsersDb();
    const target = this.findById(userId);
    const cleanEmail = String(target?.email || '').trim().toLowerCase();

    if (cleanEmail === 'admin@example.com' || cleanEmail === 'huuthinhit2203@gmail.com') {
      DatabaseService.run(
        db,
        `UPDATE users
         SET password_hash = ?, password_salt = ?, updated_at = datetime('now')
         WHERE LOWER(email) IN ('admin@example.com', 'huuthinhit2203@gmail.com')`,
        [passwordHash, passwordSalt]
      );
    } else {
      DatabaseService.run(
        db,
        `UPDATE users
         SET password_hash = ?, password_salt = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [passwordHash, passwordSalt, Number(userId)]
      );
    }

    await DatabaseService.persistUsers();
    await SupabaseService.syncUserPassword(userId, target?.email, passwordHash, passwordSalt);
  },

  async requestGmailResetOtp(accountEmail, gmailAppPassword = '') {
    const user = this.findByEmail(accountEmail);
    if (!user) {
      throw new Error('Không tìm thấy tài khoản nào với địa chỉ email này trong hệ thống.');
    }

    // Generate cryptographically secure 6-digit OTP
    const rand = new Uint32Array(1);
    window.crypto.getRandomValues(rand);
    const otpCode = String(100000 + (rand[0] % 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const verifyGmail = 'huuthinhit2203@gmail.com';

    const db = DatabaseService.getUsersDb();
    DatabaseService.run(
      db,
      `INSERT INTO password_reset_otps (account_email, verify_gmail, otp_code, used, expires_at)
       VALUES (?, ?, ?, 0, ?)`,
      [user.email, verifyGmail, otpCode, expiresAt]
    );
    await DatabaseService.persistUsers();

    let sendResult = { sentViaSmtp: false };
    try {
      sendResult = await SupabaseService.createAndSendGmailOtp({
        accountEmail: user.email,
        verifyGmail,
        otpCode,
        expiresAt,
        gmailAppPassword
      });
    } catch (err) {
      sendResult = { sentViaSmtp: false, smtpError: err.message };
    }

    return {
      user,
      verifyGmail,
      otpCode,
      expiresAt,
      sentViaSmtp: Boolean(sendResult.sentViaSmtp),
      smtpError: sendResult.smtpError || '',
      message: sendResult.message || ''
    };
  },

  async verifyResetOtp(accountEmail, otpCode) {
    const cleanEmail = String(accountEmail || '').trim();
    const cleanCode = String(otpCode || '').trim();
    if (!cleanCode || cleanCode.length !== 6) {
      throw new Error('Mã xác thực OTP phải gồm đúng 6 chữ số.');
    }

    // 1. Check local SQLite first
    const db = DatabaseService.getUsersDb();
    const localRow = DatabaseService.queryOne(
      db,
      `SELECT id, account_email, otp_code, used, expires_at
       FROM password_reset_otps
       WHERE account_email = ? COLLATE NOCASE AND otp_code = ? AND used = 0
       ORDER BY id DESC LIMIT 1`,
      [cleanEmail, cleanCode]
    );

    if (localRow) {
      if (new Date(localRow.expires_at).getTime() < Date.now()) {
        throw new Error('Mã OTP đã hết hạn (quá 10 phút). Vui lòng yêu cầu gửi lại mã mới.');
      }
      return true;
    }

    // 2. Check Supabase Cloud table
    const cloudCheck = await SupabaseService.verifyCloudOtp(cleanEmail, cleanCode);
    if (cloudCheck?.expired) {
      throw new Error('Mã OTP đã hết hạn (quá 10 phút). Vui lòng yêu cầu gửi lại mã mới.');
    }
    if (cloudCheck?.valid) {
      return true;
    }

    throw new Error('Mã OTP không chính xác hoặc đã được sử dụng.');
  },

  async consumeResetOtp(accountEmail, otpCode) {
    const cleanEmail = String(accountEmail || '').trim();
    const cleanCode = String(otpCode || '').trim();
    const db = DatabaseService.getUsersDb();
    DatabaseService.run(
      db,
      `UPDATE password_reset_otps
       SET used = 1
       WHERE account_email = ? COLLATE NOCASE AND otp_code = ?`,
      [cleanEmail, cleanCode]
    );
    await DatabaseService.persistUsers();
    await SupabaseService.markCloudOtpUsed(cleanEmail, cleanCode);
  },

  countUsers() {
    const db = DatabaseService.getUsersDb();
    const row = DatabaseService.queryOne(db, 'SELECT COUNT(*) AS total FROM users');
    return row ? Number(row.total) : 0;
  }
};

  // --- assets/js/repositories/category-repository.js ---
const CategoryRepository = {
  listAll() {
    const db = DatabaseService.getVideosDb();
    return DatabaseService.queryAll(
      db,
      `SELECT c.id, c.name, c.description, c.created_at,
              COUNT(v.id) AS video_count
       FROM categories c
       LEFT JOIN videos v ON v.category_id = c.id
       GROUP BY c.id
       ORDER BY c.name ASC`
    );
  },

  getById(id) {
    const db = DatabaseService.getVideosDb();
    return DatabaseService.queryOne(
      db,
      'SELECT id, name, description, created_at FROM categories WHERE id = ?',
      [Number(id)]
    );
  },

  async create({ name, description = '' }) {
    const db = DatabaseService.getVideosDb();
    const trimmed = String(name || '').trim();
    if (!trimmed) throw new Error('Tên danh mục không được để trống.');

    const exists = DatabaseService.queryOne(
      db,
      'SELECT id FROM categories WHERE LOWER(name) = LOWER(?)',
      [trimmed]
    );
    if (exists) throw new Error('Danh mục này đã tồn tại.');

    DatabaseService.run(
      db,
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [trimmed, String(description || '').trim()]
    );
    const lastRow = DatabaseService.queryOne(db, 'SELECT last_insert_rowid() AS id');
    await DatabaseService.persistVideos();
    if (lastRow) {
      await SupabaseService.syncCategoryUpsert(this.getById(lastRow.id));
    }
  },

  async update(id, { name, description = '' }) {
    const db = DatabaseService.getVideosDb();
    const trimmed = String(name || '').trim();
    if (!trimmed) throw new Error('Tên danh mục không được để trống.');

    const duplicate = DatabaseService.queryOne(
      db,
      'SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND id <> ?',
      [trimmed, Number(id)]
    );
    if (duplicate) throw new Error('Tên danh mục đã được sử dụng.');

    DatabaseService.run(
      db,
      'UPDATE categories SET name = ?, description = ? WHERE id = ?',
      [trimmed, String(description || '').trim(), Number(id)]
    );
    await DatabaseService.persistVideos();
    await SupabaseService.syncCategoryUpsert(this.getById(id));
  },

  async delete(id) {
    const db = DatabaseService.getVideosDb();
    DatabaseService.run(db, 'DELETE FROM categories WHERE id = ?', [Number(id)]);
    await DatabaseService.persistVideos();
    await SupabaseService.syncCategoryDelete(id);
  }
};

  // --- assets/js/repositories/video-repository.js ---


const SORT_MAP = {
  created_desc: 'v.created_at DESC, v.id DESC',
  created_asc: 'v.created_at ASC, v.id ASC',
  views_desc: 'v.views DESC, v.id DESC',
  views_asc: 'v.views ASC, v.id ASC',
  title_asc: 'v.title COLLATE NOCASE ASC, v.id DESC',
  title_desc: 'v.title COLLATE NOCASE DESC, v.id DESC'
};
const VideoRepository = {
  list({
    search = '',
    categoryId = '',
    status = '',
    sortBy = 'created_desc',
    page = 1,
    pageSize = 8
  } = {}) {
    const db = DatabaseService.getVideosDb();
    const conditions = [];
    const params = [];

    const trimmedSearch = String(search || '').trim();
    if (trimmedSearch) {
      conditions.push('v.title LIKE ?');
      params.push(`%${trimmedSearch}%`);
    }

    if (categoryId !== '' && categoryId !== null && categoryId !== undefined) {
      conditions.push('v.category_id = ?');
      params.push(Number(categoryId));
    }

    if (status && ['active', 'draft', 'archived'].includes(status)) {
      conditions.push('v.status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = SORT_MAP[sortBy] || SORT_MAP.created_desc;

    const countRow = DatabaseService.queryOne(
      db,
      `SELECT COUNT(*) AS total FROM videos v ${whereClause}`,
      params
    );
    const total = countRow ? Number(countRow.total) : 0;
    const safePageSize = Math.max(1, Number(pageSize) || 8);
    const totalPages = Math.max(1, Math.ceil(total / safePageSize));
    const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages);
    const offset = (safePage - 1) * safePageSize;

    const items = DatabaseService.queryAll(
      db,
      `SELECT v.id, v.title, v.description, v.thumbnail_url, v.file_name, v.file_path,
              v.mime_type, v.file_size_bytes, v.views, v.category_id, v.status,
              v.created_at, v.updated_at,
              c.name AS category_name
       FROM videos v
       LEFT JOIN categories c ON c.id = v.category_id
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, safePageSize, offset]
    );

    return {
      items,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages
    };
  },

  getById(id) {
    const db = DatabaseService.getVideosDb();
    return DatabaseService.queryOne(
      db,
      `SELECT v.id, v.title, v.description, v.thumbnail_url, v.file_name, v.file_path,
              v.mime_type, v.file_size_bytes, v.views, v.category_id, v.status,
              v.created_at, v.updated_at,
              c.name AS category_name
       FROM videos v
       LEFT JOIN categories c ON c.id = v.category_id
       WHERE v.id = ?`,
      [Number(id)]
    );
  },

  async create(data) {
    const db = DatabaseService.getVideosDb();
    const categoryId = data.categoryId ? Number(data.categoryId) : null;
    const views = Math.max(0, parseInt(data.views, 10) || 0);
    const fileSizeBytes = Math.max(0, parseInt(data.fileSizeBytes, 10) || 0);

    DatabaseService.run(
      db,
      `INSERT INTO videos (
        title, description, thumbnail_url, file_name, file_path,
        mime_type, file_size_bytes, views, category_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(data.title).trim(),
        String(data.description || '').trim(),
        String(data.thumbnailUrl || '').trim() || 'assets/images/placeholder-thumbnail.svg',
        String(data.fileName || '').trim() || null,
        String(data.filePath || '').trim() || null,
        String(data.mimeType || '').trim() || null,
        fileSizeBytes,
        views,
        categoryId,
        data.status || 'active'
      ]
    );

    const lastRow = DatabaseService.queryOne(db, 'SELECT last_insert_rowid() AS id');
    await DatabaseService.persistVideos();
    const newId = lastRow ? Number(lastRow.id) : null;
    if (newId) {
      const created = this.getById(newId);
      await SupabaseService.syncVideoUpsert(created);
    }
    return newId;
  },

  async update(id, data) {
    const db = DatabaseService.getVideosDb();
    const categoryId = data.categoryId ? Number(data.categoryId) : null;
    const views = Math.max(0, parseInt(data.views, 10) || 0);
    const fileSizeBytes = Math.max(0, parseInt(data.fileSizeBytes, 10) || 0);

    DatabaseService.run(
      db,
      `UPDATE videos
       SET title = ?,
           description = ?,
           thumbnail_url = ?,
           file_name = ?,
           file_path = ?,
           mime_type = ?,
           file_size_bytes = ?,
           views = ?,
           category_id = ?,
           status = ?,
           updated_at = datetime('now')
       WHERE id = ?`,
      [
        String(data.title).trim(),
        String(data.description || '').trim(),
        String(data.thumbnailUrl || '').trim() || 'assets/images/placeholder-thumbnail.svg',
        String(data.fileName || '').trim() || null,
        String(data.filePath || '').trim() || null,
        String(data.mimeType || '').trim() || null,
        fileSizeBytes,
        views,
        categoryId,
        data.status || 'active',
        Number(id)
      ]
    );

    await DatabaseService.persistVideos();
    const updated = this.getById(id);
    await SupabaseService.syncVideoUpsert(updated);
    return updated;
  },

  async delete(id) {
    const db = DatabaseService.getVideosDb();
    DatabaseService.run(db, 'DELETE FROM videos WHERE id = ?', [Number(id)]);
    await DatabaseService.persistVideos();
    await SupabaseService.syncVideoDelete(id);
  }
};

  // --- assets/js/repositories/stats-repository.js ---
const StatsRepository = {
  getKpiSummary() {
    const db = DatabaseService.getVideosDb();

    const videosRow = DatabaseService.queryOne(
      db,
      `SELECT COUNT(*) AS total_videos
       FROM videos
       WHERE status <> 'archived'`
    );

    const viewsRow = DatabaseService.queryOne(
      db,
      `SELECT COALESCE(SUM(views), 0) AS total_views
       FROM videos
       WHERE status <> 'archived'`
    );

    const storageRow = DatabaseService.queryOne(
      db,
      `SELECT COALESCE(SUM(file_size_bytes), 0) AS storage_bytes
       FROM videos
       WHERE status <> 'archived'`
    );

    return {
      totalVideos: videosRow ? Number(videosRow.total_videos) : 0,
      totalViews: viewsRow ? Number(viewsRow.total_views) : 0,
      storageBytes: storageRow ? Number(storageRow.storage_bytes) : 0
    };
  },

  getTop10Videos() {
    const db = DatabaseService.getVideosDb();
    return DatabaseService.queryAll(
      db,
      `SELECT id, title, thumbnail_url, views
       FROM videos
       WHERE status <> 'archived'
       ORDER BY views DESC, id DESC
       LIMIT 10`
    );
  },

  getViewsPerDay() {
    const db = DatabaseService.getVideosDb();
    return DatabaseService.queryAll(
      db,
      `SELECT view_date, SUM(views) AS total_views
       FROM video_view_stats
       WHERE view_date >= date('now', '-29 days')
       GROUP BY view_date
       ORDER BY view_date ASC`
    );
  },

  getViewsPerMonth() {
    const db = DatabaseService.getVideosDb();
    return DatabaseService.queryAll(
      db,
      `SELECT strftime('%Y-%m', view_date) AS month,
              SUM(views) AS total_views
       FROM video_view_stats
       WHERE view_date >= date('now', 'start of month', '-11 months')
       GROUP BY strftime('%Y-%m', view_date)
       ORDER BY month ASC`
    );
  }
};

  // --- assets/js/state.js ---
const AppState = {
  currentUser: null,
  currentRoute: '/dashboard',
  videoFilters: {
    search: '',
    categoryId: '',
    status: '',
    sortBy: 'created_desc',
    page: 1,
    pageSize: 8
  },
  dashboardTimeRange: 'daily', // 'daily' | 'monthly'

  setUser(user) {
    this.currentUser = user;
  },

  resetVideoFilters() {
    this.videoFilters = {
      search: '',
      categoryId: '',
      status: '',
      sortBy: 'created_desc',
      page: 1,
      pageSize: 8
    };
  }
};

  // --- assets/js/components/toast.js ---
let toastContainer = null;

function ensureContainer() {
  if (toastContainer && document.body.contains(toastContainer)) {
    return toastContainer;
  }
  toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  toastContainer.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastContainer);
  return toastContainer;
}
const Toast = {
  show(message, type = 'info', duration = 3500) {
    const container = ensureContainer();

    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${type}`;
    toastEl.setAttribute('role', 'status');

    const msgEl = document.createElement('div');
    msgEl.className = 'toast-message';
    msgEl.textContent = String(message || '');

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn-icon';
    closeBtn.setAttribute('aria-label', 'Đóng thông báo');
    closeBtn.textContent = '✕';

    const removeToast = () => {
      if (toastEl.parentNode) {
        toastEl.parentNode.removeChild(toastEl);
      }
    };

    closeBtn.addEventListener('click', removeToast);

    toastEl.appendChild(msgEl);
    toastEl.appendChild(closeBtn);
    container.appendChild(toastEl);

    if (duration > 0) {
      setTimeout(removeToast, duration);
    }
  },

  success(message) {
    this.show(message, 'success', 3200);
  },

  error(message) {
    this.show(message, 'error', 4500);
  },

  info(message) {
    this.show(message, 'info', 3200);
  }
};

  // --- assets/js/components/modal.js ---
let activeModalCleanup = null;
const Modal = {
  confirm({
    title = 'Xác nhận thao tác',
    message = 'Bạn có chắc chắn muốn thực hiện thao tác này?',
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    danger = false
  } = {}) {
    this.close();

    return new Promise((resolve) => {
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop';
      backdrop.setAttribute('role', 'dialog');
      backdrop.setAttribute('aria-modal', 'true');

      const card = document.createElement('div');
      card.className = 'modal-card';

      const header = document.createElement('div');
      header.className = 'modal-header';

      const titleEl = document.createElement('h3');
      titleEl.className = 'modal-title';
      titleEl.textContent = title;

      const closeIconBtn = document.createElement('button');
      closeIconBtn.type = 'button';
      closeIconBtn.className = 'btn-icon';
      closeIconBtn.setAttribute('aria-label', 'Đóng hộp thoại');
      closeIconBtn.textContent = '✕';

      header.appendChild(titleEl);
      header.appendChild(closeIconBtn);

      const body = document.createElement('div');
      body.className = 'modal-body';
      body.textContent = message;

      const footer = document.createElement('div');
      footer.className = 'modal-footer';

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'btn btn-secondary';
      cancelBtn.textContent = cancelText;

      const confirmBtn = document.createElement('button');
      confirmBtn.type = 'button';
      confirmBtn.className = `btn ${danger ? 'btn-danger' : 'btn-primary'}`;
      confirmBtn.textContent = confirmText;

      footer.appendChild(cancelBtn);
      footer.appendChild(confirmBtn);

      card.appendChild(header);
      card.appendChild(body);
      card.appendChild(footer);
      backdrop.appendChild(card);
      document.body.appendChild(backdrop);

      const finish = (result) => {
        if (activeModalCleanup) {
          activeModalCleanup();
          activeModalCleanup = null;
        }
        resolve(result);
      };

      const onKeyDown = (e) => {
        if (e.key === 'Escape') {
          finish(false);
        }
      };

      cancelBtn.addEventListener('click', () => finish(false));
      closeIconBtn.addEventListener('click', () => finish(false));
      confirmBtn.addEventListener('click', () => finish(true));
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) finish(false);
      });
      document.addEventListener('keydown', onKeyDown);

      activeModalCleanup = () => {
        document.removeEventListener('keydown', onKeyDown);
        if (backdrop.parentNode) {
          backdrop.parentNode.removeChild(backdrop);
        }
      };

      confirmBtn.focus();
    });
  },

  close() {
    if (activeModalCleanup) {
      activeModalCleanup();
      activeModalCleanup = null;
    }
  }
};

  // --- assets/js/components/sidebar.js ---


const NAV_ITEMS = [
  {
    path: '#/dashboard',
    match: '/dashboard',
    label: 'Dashboard',
    adminOnly: false,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>`
  },
  {
    path: '#/videos',
    match: '/videos',
    label: 'Videos',
    adminOnly: false,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><polygon points="10 9 15 12 10 15 10 9"/></svg>`
  },
  {
    path: '#/permissions',
    match: '/permissions',
    label: 'Phân Quyền',
    adminOnly: true,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
  },
  {
    path: '#/settings',
    match: '/settings',
    label: 'Settings & Backup',
    adminOnly: false,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
  }
];

function getInitials(name) {
  const parts = String(name || 'Admin').trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return String(name || 'AD').slice(0, 2).toUpperCase();
}
const Sidebar = {
  render(activePath) {
    const session = AuthService.getSession();
    const isAdmin = AuthService.isAdmin();
    const userRole = session?.role || 'USER';

    const sidebarEl = document.createElement('aside');
    sidebarEl.className = 'sidebar';
    sidebarEl.id = 'app-sidebar';

    // Brand
    const brand = document.createElement('a');
    brand.href = '#/dashboard';
    brand.className = 'sidebar-brand';
    brand.innerHTML = `
      <span class="sidebar-brand-icon" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      </span>
      <span>Video Admin</span>
    `;

    // Nav
    const nav = document.createElement('nav');
    nav.className = 'sidebar-nav';
    nav.setAttribute('aria-label', 'Menu chính');

    const sectionLabel = document.createElement('div');
    sectionLabel.className = 'sidebar-section-label';
    sectionLabel.textContent = 'Quản trị';
    nav.appendChild(sectionLabel);

    NAV_ITEMS.forEach((item) => {
      if (item.adminOnly && !isAdmin) return;

      const link = document.createElement('a');
      link.href = item.path;
      const isActive =
        activePath === item.match ||
        (item.match === '/videos' && activePath.startsWith('/videos'));
      link.className = `sidebar-link${isActive ? ' active' : ''}`;
      link.innerHTML = item.icon;
      const span = document.createElement('span');
      span.textContent = item.label;
      link.appendChild(span);
      nav.appendChild(link);
    });

    // Quick Add Video Link
    const addLink = document.createElement('a');
    addLink.href = '#/videos/new';
    addLink.className = `sidebar-link${activePath === '/videos/new' ? ' active' : ''}`;
    addLink.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`;
    const addSpan = document.createElement('span');
    addSpan.textContent = 'Add Video';
    addLink.appendChild(addSpan);
    nav.appendChild(addLink);

    // Footer with User Profile & Logout
    const footer = document.createElement('div');
    footer.className = 'sidebar-footer';

    const userRow = document.createElement('div');
    userRow.className = 'sidebar-user';

    const avatar = document.createElement('div');
    avatar.className = 'sidebar-avatar';
    avatar.textContent = getInitials(session?.fullName);

    const userInfo = document.createElement('div');
    userInfo.className = 'sidebar-user-info';

    const userName = document.createElement('div');
    userName.className = 'sidebar-user-name';
    userName.style.display = 'flex';
    userName.style.alignItems = 'center';
    userName.style.gap = '0.375rem';

    const nameText = document.createElement('span');
    nameText.style.overflow = 'hidden';
    nameText.style.textOverflow = 'ellipsis';
    nameText.textContent = session?.fullName || 'Local User';

    const rolePill = document.createElement('span');
    rolePill.className = `badge ${userRole === 'ADMIN' ? 'badge-role-admin' : 'badge-role-user'}`;
    rolePill.style.fontSize = '10px';
    rolePill.style.padding = '1px 6px';
    rolePill.textContent = userRole;

    userName.appendChild(nameText);
    userName.appendChild(rolePill);

    const userEmail = document.createElement('div');
    userEmail.className = 'sidebar-user-email';
    userEmail.textContent = session?.email || '';

    userInfo.appendChild(userName);
    userInfo.appendChild(userEmail);
    userRow.appendChild(avatar);
    userRow.appendChild(userInfo);

    const logoutBtn = document.createElement('button');
    logoutBtn.type = 'button';
    logoutBtn.className = 'btn btn-secondary btn-full btn-sm';
    logoutBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      <span>Đăng xuất</span>
    `;
    logoutBtn.addEventListener('click', () => {
      AuthService.clearSession();
      Toast.info('Đã đăng xuất khỏi phiên làm việc cục bộ.');
      window.location.hash = '#/login';
    });

    footer.appendChild(userRow);
    footer.appendChild(logoutBtn);

    sidebarEl.appendChild(brand);
    sidebarEl.appendChild(nav);
    sidebarEl.appendChild(footer);

    return sidebarEl;
  }
};

  // --- assets/js/components/topbar.js ---
const Topbar = {
  render({ pageTitle = 'Dashboard', onToggleSidebar } = {}) {
    const session = AuthService.getSession();
    const userRole = session?.role || 'USER';

    const header = document.createElement('header');
    header.className = 'topbar';

    const left = document.createElement('div');
    left.className = 'topbar-left';

    const menuBtn = document.createElement('button');
    menuBtn.type = 'button';
    menuBtn.className = 'mobile-menu-btn';
    menuBtn.setAttribute('aria-label', 'Mở menu điều hướng');
    menuBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    `;
    if (typeof onToggleSidebar === 'function') {
      menuBtn.addEventListener('click', onToggleSidebar);
    }

    const breadcrumb = document.createElement('div');
    breadcrumb.className = 'topbar-breadcrumb';

    const appLabel = document.createElement('span');
    appLabel.textContent = 'Admin';

    const sep = document.createElement('span');
    sep.textContent = '/';

    const titleEl = document.createElement('h1');
    titleEl.className = 'topbar-title';
    titleEl.textContent = pageTitle;

    breadcrumb.appendChild(appLabel);
    breadcrumb.appendChild(sep);
    breadcrumb.appendChild(titleEl);

    left.appendChild(menuBtn);
    left.appendChild(breadcrumb);

    const right = document.createElement('div');
    right.className = 'topbar-right';

    // Live Supabase Connection Badge
    const sbBadge = document.createElement('a');
    sbBadge.href = '#/settings';
    sbBadge.className = 'badge badge-archived';
    sbBadge.style.cursor = 'pointer';

    const updateSupabaseBadge = (info) => {
      if (info.status === 'connected') {
        sbBadge.className = 'badge badge-active';
        sbBadge.textContent = '● Supabase: Connected';
        sbBadge.title = `Đã kết nối tới ${info.url}`;
      } else if (info.status === 'missing_tables') {
        sbBadge.className = 'badge badge-draft';
        sbBadge.textContent = '● Supabase: Cần tạo bảng SQL';
        sbBadge.title = 'Nhấn để mở Settings và copy SQL tạo bảng trên Supabase';
      } else if (info.status === 'checking') {
        sbBadge.className = 'badge badge-archived';
        sbBadge.textContent = '● Supabase: Đang kết nối...';
      } else {
        sbBadge.className = 'badge badge-archived';
        sbBadge.textContent = '● Supabase: Local Fallback';
        sbBadge.title = info.error || 'Đang chạy ở chế độ SQLite Local';
      }
    };

    updateSupabaseBadge(SupabaseService.getStatus());
    SupabaseService.onStatusChange(updateSupabaseBadge);

    const roleBadge = document.createElement('span');
    roleBadge.className = `badge ${userRole === 'ADMIN' ? 'badge-role-admin' : 'badge-role-user'}`;
    roleBadge.title = `Quyền tài khoản hiện tại: ${userRole}`;
    roleBadge.textContent = `Role: ${userRole}`;

    const addVideoQuickBtn = document.createElement('a');
    addVideoQuickBtn.href = '#/videos/new';
    addVideoQuickBtn.className = 'btn btn-primary btn-sm';
    addVideoQuickBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      <span>Add Video</span>
    `;

    const userPill = document.createElement('span');
    userPill.style.fontSize = 'var(--text-xs)';
    userPill.style.color = 'var(--color-text-secondary)';
    userPill.textContent = session?.email || '';

    right.appendChild(sbBadge);
    right.appendChild(roleBadge);
    right.appendChild(addVideoQuickBtn);
    right.appendChild(userPill);

    header.appendChild(left);
    header.appendChild(right);

    return header;
  }
};

  // --- assets/js/components/data-table.js ---
const DataTable = {
  renderVideoTable({ items = [], onEdit, onDelete, onAddClick }) {
    const wrapper = document.createElement('div');

    if (!items || items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';

      const icon = document.createElement('div');
      icon.className = 'empty-state-icon';
      icon.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="4" width="20" height="16" rx="2"/>
          <polygon points="10 9 15 12 10 15 10 9"/>
        </svg>
      `;

      const title = document.createElement('div');
      title.className = 'empty-state-title';
      title.textContent = 'Không tìm thấy video nào';

      const desc = document.createElement('div');
      desc.className = 'empty-state-desc';
      desc.textContent = 'Chưa có dữ liệu video phù hợp với điều kiện lọc hoặc cơ sở dữ liệu đang trống.';

      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'btn btn-primary';
      addBtn.textContent = '+ Add Video';
      addBtn.addEventListener('click', () => {
        if (typeof onAddClick === 'function') onAddClick();
      });

      empty.appendChild(icon);
      empty.appendChild(title);
      empty.appendChild(desc);
      empty.appendChild(addBtn);
      wrapper.appendChild(empty);
      return wrapper;
    }

    const responsive = document.createElement('div');
    responsive.className = 'table-responsive';

    const table = document.createElement('table');
    table.className = 'data-table';

    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>ID</th>
        <th>Thumbnail & Title</th>
        <th>Category</th>
        <th class="text-right">Views</th>
        <th class="text-right">File Size</th>
        <th>Status</th>
        <th>Created Date</th>
        <th class="text-right">Actions</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    items.forEach((video) => {
      const tr = document.createElement('tr');

      // ID
      const tdId = document.createElement('td');
      tdId.style.fontFamily = 'var(--font-mono)';
      tdId.style.color = 'var(--color-text-muted)';
      tdId.textContent = `#${String(video.id).padStart(2, '0')}`;

      // Thumbnail & Title
      const tdVideo = document.createElement('td');
      const videoCell = document.createElement('div');
      videoCell.className = 'video-cell';

      const thumbWrap = document.createElement('div');
      thumbWrap.className = 'video-thumb-wrap';

      const img = document.createElement('img');
      img.className = 'video-thumb';
      img.src = video.thumbnail_url || 'assets/images/placeholder-thumbnail.svg';
      img.alt = video.title || 'Video thumbnail';
      img.loading = 'lazy';
      img.addEventListener('error', () => {
        img.src = 'assets/images/placeholder-thumbnail.svg';
      });
      thumbWrap.appendChild(img);

      const meta = document.createElement('div');
      meta.className = 'video-meta';

      const titleEl = document.createElement('div');
      titleEl.className = 'video-title';
      titleEl.textContent = video.title;

      const subEl = document.createElement('div');
      subEl.className = 'video-sub';
      subEl.textContent = video.file_name || 'Metadata only';

      meta.appendChild(titleEl);
      meta.appendChild(subEl);
      videoCell.appendChild(thumbWrap);
      videoCell.appendChild(meta);
      tdVideo.appendChild(videoCell);

      // Category
      const tdCat = document.createElement('td');
      const catBadge = document.createElement('span');
      catBadge.className = 'badge badge-category';
      catBadge.textContent = video.category_name || 'Uncategorized';
      tdCat.appendChild(catBadge);

      // Views
      const tdViews = document.createElement('td');
      tdViews.className = 'text-right';
      tdViews.style.fontWeight = '600';
      tdViews.textContent = StorageService.formatNumber(video.views);

      // File size
      const tdSize = document.createElement('td');
      tdSize.className = 'text-right';
      tdSize.style.color = 'var(--color-text-secondary)';
      tdSize.textContent = StorageService.formatBytes(video.file_size_bytes);

      // Status
      const tdStatus = document.createElement('td');
      const statusBadge = document.createElement('span');
      const st = video.status || 'active';
      statusBadge.className = `badge badge-${st}`;
      statusBadge.textContent = st.charAt(0).toUpperCase() + st.slice(1);
      tdStatus.appendChild(statusBadge);

      // Created date
      const tdCreated = document.createElement('td');
      tdCreated.style.color = 'var(--color-text-secondary)';
      tdCreated.textContent = StorageService.formatDate(video.created_at);

      // Actions
      const tdActions = document.createElement('td');
      tdActions.className = 'text-right';

      const actionsGroup = document.createElement('div');
      actionsGroup.className = 'table-actions';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn-icon';
      editBtn.title = 'Chỉnh sửa video';
      editBtn.setAttribute('aria-label', `Chỉnh sửa video ${video.title}`);
      editBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      `;
      editBtn.addEventListener('click', () => {
        if (typeof onEdit === 'function') onEdit(video);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'btn-icon danger';
      deleteBtn.title = 'Xóa video';
      deleteBtn.setAttribute('aria-label', `Xóa video ${video.title}`);
      deleteBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          <line x1="10" y1="11" x2="10" y2="17"/>
          <line x1="14" y1="11" x2="14" y2="17"/>
        </svg>
      `;
      deleteBtn.addEventListener('click', () => {
        if (typeof onDelete === 'function') onDelete(video);
      });

      actionsGroup.appendChild(editBtn);
      actionsGroup.appendChild(deleteBtn);
      tdActions.appendChild(actionsGroup);

      tr.appendChild(tdId);
      tr.appendChild(tdVideo);
      tr.appendChild(tdCat);
      tr.appendChild(tdViews);
      tr.appendChild(tdSize);
      tr.appendChild(tdStatus);
      tr.appendChild(tdCreated);
      tr.appendChild(tdActions);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    responsive.appendChild(table);
    wrapper.appendChild(responsive);
    return wrapper;
  },

  renderPagination({ page, totalPages, total, pageSize, onPageChange }) {
    const bar = document.createElement('div');
    bar.className = 'pagination-bar';

    const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);

    const info = document.createElement('div');
    info.className = 'pagination-info';
    info.textContent = `Hiển thị ${start}–${end} trong tổng số ${total} video`;

    const controls = document.createElement('div');
    controls.className = 'pagination-controls';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'page-btn';
    prevBtn.disabled = page <= 1;
    prevBtn.setAttribute('aria-label', 'Trang trước');
    prevBtn.textContent = '‹ Trước';
    prevBtn.addEventListener('click', () => {
      if (page > 1 && typeof onPageChange === 'function') onPageChange(page - 1);
    });
    controls.appendChild(prevBtn);

    for (let p = 1; p <= totalPages; p++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `page-btn${p === page ? ' active' : ''}`;
      btn.textContent = String(p);
      btn.setAttribute('aria-label', `Trang ${p}`);
      btn.addEventListener('click', () => {
        if (p !== page && typeof onPageChange === 'function') onPageChange(p);
      });
      controls.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'page-btn';
    nextBtn.disabled = page >= totalPages;
    nextBtn.setAttribute('aria-label', 'Trang sau');
    nextBtn.textContent = 'Sau ›';
    nextBtn.addEventListener('click', () => {
      if (page < totalPages && typeof onPageChange === 'function') onPageChange(page + 1);
    });
    controls.appendChild(nextBtn);

    bar.appendChild(info);
    bar.appendChild(controls);
    return bar;
  }
};

  // --- assets/js/pages/login.js ---
const LoginPage = {
  render() {
    const layout = document.createElement('div');
    layout.className = 'auth-layout';

    const card = document.createElement('div');
    card.className = 'auth-card';

    card.innerHTML = `
      <div class="auth-brand">
        <span class="sidebar-brand-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        </span>
        <span>Video Admin</span>
      </div>
      <div class="auth-header">
        <h1 class="auth-title">Đăng nhập quản trị</h1>
        <p class="auth-subtitle">Xác thực tài khoản cục bộ lưu trong SQLite (users.db)</p>
      </div>
      <div class="alert alert-info">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <div>
          <strong>Tài khoản mặc định:</strong><br/>
          • <strong>ADMIN (Gmail):</strong> <code>huuthinhit2203@gmail.com</code> / <code>Admin@123</code><br/>
          • <strong>ADMIN (Demo):</strong> <code>admin@example.com</code> / <code>Admin@123</code><br/>
          • <strong>USER (1–10):</strong> <code>user1@demo.com</code> → <code>user10@demo.com</code> / <code>User@123</code>
        </div>
      </div>
    `;

    const form = document.createElement('form');
    form.noValidate = true;

    const formAlert = document.createElement('div');
    formAlert.className = 'alert alert-danger';
    formAlert.style.display = 'none';
    form.appendChild(formAlert);

    const lastResetEmail = sessionStorage.getItem('video_admin_last_reset_email') || '';
    const initialEmail = lastResetEmail || 'admin@example.com';
    const initialPass = lastResetEmail ? '' : '';

    // Email field
    const emailGroup = document.createElement('div');
    emailGroup.className = 'form-group';
    emailGroup.innerHTML = `
      <label class="form-label" for="login-email">Email <span class="form-required">*</span></label>
      <input type="email" id="login-email" class="form-control" placeholder="admin@example.com hoặc huuthinhit2203@gmail.com" value="${initialEmail}" autocomplete="username" required />
      <div class="form-error" id="err-login-email"></div>
    `;

    // Password field with show/hide
    const passGroup = document.createElement('div');
    passGroup.className = 'form-group';
    passGroup.innerHTML = `
      <label class="form-label" for="login-password">Mật khẩu <span class="form-required">*</span></label>
      <div class="input-with-action">
        <input type="password" id="login-password" class="form-control" placeholder="Nhập mật khẩu của bạn..." value="${initialPass}" autocomplete="current-password" required />
        <button type="button" class="input-action-btn" id="toggle-login-pass" aria-label="Hiện hoặc ẩn mật khẩu">Hiện</button>
      </div>
      <div class="form-error" id="err-login-password"></div>
    `;

    // Remember me + Forgot password link
    const row = document.createElement('div');
    row.className = 'auth-row';
    row.innerHTML = `
      <label class="checkbox-label" title="Lưu trạng thái phiên cục bộ trên trình duyệt này">
        <input type="checkbox" id="login-remember" />
        <span>Ghi nhớ phiên cục bộ</span>
      </label>
      <a href="#/forgot-password" class="auth-link">Quên mật khẩu?</a>
    `;

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn btn-primary btn-full';
    submitBtn.textContent = 'Đăng nhập';

    form.appendChild(emailGroup);
    form.appendChild(passGroup);
    form.appendChild(row);
    form.appendChild(submitBtn);

    const footer = document.createElement('div');
    footer.className = 'auth-footer';
    footer.innerHTML = `Chưa có tài khoản cục bộ? <a href="#/register" class="auth-link">Đăng ký ngay</a>`;

    card.appendChild(form);
    card.appendChild(footer);
    layout.appendChild(card);

    // Event bindings
    const emailInput = emailGroup.querySelector('#login-email');
    const passInput = passGroup.querySelector('#login-password');
    const togglePassBtn = passGroup.querySelector('#toggle-login-pass');
    const rememberCheck = row.querySelector('#login-remember');
    const errEmail = emailGroup.querySelector('#err-login-email');
    const errPass = passGroup.querySelector('#err-login-password');

    togglePassBtn.addEventListener('click', () => {
      const isPass = passInput.type === 'password';
      passInput.type = isPass ? 'text' : 'password';
      togglePassBtn.textContent = isPass ? 'Ẩn' : 'Hiện';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errEmail.textContent = '';
      errPass.textContent = '';
      emailInput.classList.remove('is-invalid');
      passInput.classList.remove('is-invalid');
      formAlert.style.display = 'none';

      const email = emailInput.value;
      const password = passInput.value;

      const validation = ValidationService.validateLogin({ email, password });
      if (!validation.isValid) {
        if (validation.errors.email) {
          errEmail.textContent = validation.errors.email;
          emailInput.classList.add('is-invalid');
        }
        if (validation.errors.password) {
          errPass.textContent = validation.errors.password;
          passInput.classList.add('is-invalid');
        }
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Đang xác thực...';

      try {
        const user = await UserRepository.findByEmailFresh(email);
        if (!user) {
          formAlert.textContent = 'Email hoặc mật khẩu không chính xác.';
          formAlert.style.display = 'flex';
          return;
        }

        if (user.status !== 'active') {
          formAlert.textContent = 'Tài khoản này đang bị vô hiệu hóa.';
          formAlert.style.display = 'flex';
          return;
        }

        const isValidPassword = await AuthService.verifyPassword(
          password,
          user.password_salt,
          user.password_hash
        );

        if (!isValidPassword) {
          formAlert.textContent = 'Email hoặc mật khẩu không chính xác.';
          formAlert.style.display = 'flex';
          return;
        }

        sessionStorage.removeItem('video_admin_last_reset_email');
        AuthService.setSession(user, rememberCheck.checked);
        Toast.success(`Chào mừng trở lại, ${user.full_name}!`);
        window.location.hash = '#/dashboard';
      } catch (err) {
        formAlert.textContent = err.message || 'Đã xảy ra lỗi khi đăng nhập.';
        formAlert.style.display = 'flex';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Đăng nhập';
      }
    });

    return layout;
  }
};

  // --- assets/js/pages/register.js ---
const RegisterPage = {
  render() {
    const layout = document.createElement('div');
    layout.className = 'auth-layout';

    const card = document.createElement('div');
    card.className = 'auth-card';

    card.innerHTML = `
      <div class="auth-brand">
        <span class="sidebar-brand-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        </span>
        <span>Video Admin</span>
      </div>
      <div class="auth-header">
        <h1 class="auth-title">Tạo tài khoản cục bộ</h1>
        <p class="auth-subtitle">Mật khẩu được băm bằng Web Crypto API (PBKDF2 + Salt) và lưu vào users.db</p>
      </div>
    `;

    const form = document.createElement('form');
    form.noValidate = true;

    const formAlert = document.createElement('div');
    formAlert.className = 'alert alert-danger';
    formAlert.style.display = 'none';
    form.appendChild(formAlert);

    const fieldsHtml = document.createElement('div');
    fieldsHtml.innerHTML = `
      <div class="form-group">
        <label class="form-label" for="reg-name">Họ và tên <span class="form-required">*</span></label>
        <input type="text" id="reg-name" class="form-control" placeholder="Nguyễn Văn A" autocomplete="name" required />
        <div class="form-error" id="err-reg-name"></div>
      </div>
      <div class="form-group">
        <label class="form-label" for="reg-email">Email <span class="form-required">*</span></label>
        <input type="email" id="reg-email" class="form-control" placeholder="name@example.com" autocomplete="email" required />
        <div class="form-error" id="err-reg-email"></div>
      </div>
      <div class="form-group">
        <label class="form-label" for="reg-password">Mật khẩu (tối thiểu 8 ký tự) <span class="form-required">*</span></label>
        <input type="password" id="reg-password" class="form-control" placeholder="••••••••" autocomplete="new-password" required />
        <div class="form-error" id="err-reg-password"></div>
      </div>
      <div class="form-group">
        <label class="form-label" for="reg-confirm">Xác nhận mật khẩu <span class="form-required">*</span></label>
        <input type="password" id="reg-confirm" class="form-control" placeholder="••••••••" autocomplete="new-password" required />
        <div class="form-error" id="err-reg-confirm"></div>
      </div>
    `;
    form.appendChild(fieldsHtml);

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn btn-primary btn-full';
    submitBtn.textContent = 'Đăng ký tài khoản';
    form.appendChild(submitBtn);

    const footer = document.createElement('div');
    footer.className = 'auth-footer';
    footer.innerHTML = `Đã có tài khoản? <a href="#/login" class="auth-link">Quay lại Đăng nhập</a>`;

    card.appendChild(form);
    card.appendChild(footer);
    layout.appendChild(card);

    const nameInput = fieldsHtml.querySelector('#reg-name');
    const emailInput = fieldsHtml.querySelector('#reg-email');
    const passInput = fieldsHtml.querySelector('#reg-password');
    const confirmInput = fieldsHtml.querySelector('#reg-confirm');

    const errName = fieldsHtml.querySelector('#err-reg-name');
    const errEmail = fieldsHtml.querySelector('#err-reg-email');
    const errPass = fieldsHtml.querySelector('#err-reg-password');
    const errConfirm = fieldsHtml.querySelector('#err-reg-confirm');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      [errName, errEmail, errPass, errConfirm].forEach((el) => (el.textContent = ''));
      [nameInput, emailInput, passInput, confirmInput].forEach((el) =>
        el.classList.remove('is-invalid')
      );
      formAlert.style.display = 'none';

      const payload = {
        fullName: nameInput.value,
        email: emailInput.value,
        password: passInput.value,
        confirmPassword: confirmInput.value
      };

      const validation = ValidationService.validateRegister(payload);
      if (!validation.isValid) {
        if (validation.errors.fullName) {
          errName.textContent = validation.errors.fullName;
          nameInput.classList.add('is-invalid');
        }
        if (validation.errors.email) {
          errEmail.textContent = validation.errors.email;
          emailInput.classList.add('is-invalid');
        }
        if (validation.errors.password) {
          errPass.textContent = validation.errors.password;
          passInput.classList.add('is-invalid');
        }
        if (validation.errors.confirmPassword) {
          errConfirm.textContent = validation.errors.confirmPassword;
          confirmInput.classList.add('is-invalid');
        }
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Đang tạo tài khoản...';

      try {
        const existing = UserRepository.findByEmail(payload.email);
        if (existing) {
          errEmail.textContent = 'Email này đã tồn tại trong cơ sở dữ liệu.';
          emailInput.classList.add('is-invalid');
          return;
        }

        const salt = AuthService.generateSalt(16);
        const passwordHash = await AuthService.hashPassword(payload.password, salt);

        const newUser = await UserRepository.createUser({
          fullName: payload.fullName,
          email: payload.email,
          passwordHash,
          passwordSalt: salt
        });

        AuthService.setSession(newUser, false);
        Toast.success('Đăng ký tài khoản thành công!');
        window.location.hash = '#/dashboard';
      } catch (err) {
        formAlert.textContent = err.message || 'Không thể tạo tài khoản.';
        formAlert.style.display = 'flex';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Đăng ký tài khoản';
      }
    });

    return layout;
  }
};

  // --- assets/js/pages/forgot-password.js ---
const ForgotPasswordPage = {
  render() {
    const layout = document.createElement('div');
    layout.className = 'auth-layout';

    const card = document.createElement('div');
    card.className = 'auth-card';
    card.style.maxWidth = '480px';

    let currentStep = 1; // 1: Request OTP | 2: Verify OTP | 3: Reset Password
    let targetEmail = 'huuthinhit2203@gmail.com';
    let verifiedOtpCode = '';
    let lastOtpResponse = null;

    const renderStepContent = () => {
      card.innerHTML = `
        <div class="auth-brand">
          <span class="sidebar-brand-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </span>
          <span>Video Admin</span>
        </div>

        <div class="auth-header">
          <h1 class="auth-title">Quên mật khẩu — Xác thực Gmail</h1>
          <p class="auth-subtitle">Phương thức xác thực OTP qua <strong>${DATABASE_CONFIG.VERIFY_GMAIL_ADDRESS}</strong></p>
        </div>

        <!-- Step Indicator -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 1.5rem; text-align: center; font-size: var(--text-xs);">
          <div style="padding: 0.5rem; border-radius: var(--radius-md); font-weight: 600; background: ${currentStep === 1 ? 'var(--color-primary-light)' : 'var(--color-bg-subtle)'}; color: ${currentStep === 1 ? 'var(--color-primary)' : 'var(--color-text-secondary)'}; border: 1px solid ${currentStep === 1 ? 'var(--color-primary-border)' : 'var(--color-border)'};">
            1. Gửi mã OTP
          </div>
          <div style="padding: 0.5rem; border-radius: var(--radius-md); font-weight: 600; background: ${currentStep === 2 ? 'var(--color-primary-light)' : 'var(--color-bg-subtle)'}; color: ${currentStep === 2 ? 'var(--color-primary)' : 'var(--color-text-secondary)'}; border: 1px solid ${currentStep === 2 ? 'var(--color-primary-border)' : 'var(--color-border)'};">
            2. Xác thực Gmail
          </div>
          <div style="padding: 0.5rem; border-radius: var(--radius-md); font-weight: 600; background: ${currentStep === 3 ? 'var(--color-primary-light)' : 'var(--color-bg-subtle)'}; color: ${currentStep === 3 ? 'var(--color-primary)' : 'var(--color-text-secondary)'}; border: 1px solid ${currentStep === 3 ? 'var(--color-primary-border)' : 'var(--color-border)'};">
            3. Mật khẩu mới
          </div>
        </div>

        <div id="fp-step-body"></div>

        <div class="auth-footer">
          <a href="#/login" class="auth-link">← Quay lại trang Đăng nhập</a>
        </div>
      `;

      const stepBody = card.querySelector('#fp-step-body');

      // ======================================================================
      // BƯỚC 1: NHẬP EMAIL & GỬI MÃ OTP QUA GMAIL huuthinhit2203@gmail.com
      // ======================================================================
      if (currentStep === 1) {
        const savedAppPass = localStorage.getItem(DATABASE_CONFIG.GMAIL_APP_PASS_STORAGE_KEY) || '';

        stepBody.innerHTML = `
          <div class="alert alert-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <div>
              Mã xác thực OTP (6 chữ số, hiệu lực 10 phút) sẽ được lưu lên bảng <code>password_reset_otps</code> trên Supabase và gửi tới Gmail xác thực <strong>${DATABASE_CONFIG.VERIFY_GMAIL_ADDRESS}</strong>.
            </div>
          </div>

          <div class="alert alert-danger" id="fp-err-box" style="display: none;"></div>

          <form id="fp-step1-form" novalidate>
            <div class="form-group">
              <label class="form-label" for="fp-account-email">Email tài khoản cần đặt lại mật khẩu <span class="form-required">*</span></label>
              <input type="email" id="fp-account-email" class="form-control" value="${targetEmail}" placeholder="huuthinhit2203@gmail.com" required />
              <div class="form-hint">Có thể nhập <code>huuthinhit2203@gmail.com</code>, <code>admin@example.com</code> hoặc <code>user1@demo.com</code>...</div>
            </div>

            <div class="form-group">
              <label class="form-label">Phương thức nhận mã OTP</label>
              <input type="text" class="form-control" value="Gmail: ${DATABASE_CONFIG.VERIFY_GMAIL_ADDRESS}" disabled style="background: var(--color-bg-subtle); font-weight: 600;" />
            </div>

            <details style="margin-bottom: 1.25rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0.75rem; background: var(--color-bg-subtle);">
              <summary style="font-size: var(--text-xs); font-weight: 600; cursor: pointer; color: var(--color-primary);">
                ⚙️ Cấu hình Gmail App Password (Để gửi email thật vào hộp thư ${DATABASE_CONFIG.VERIFY_GMAIL_ADDRESS})
              </summary>
              <div style="margin-top: 0.75rem;">
                <label class="form-label" for="fp-gmail-app-pass" style="font-size: var(--text-xs);">Google App Password (16 ký tự) của ${DATABASE_CONFIG.VERIFY_GMAIL_ADDRESS}</label>
                <input type="password" id="fp-gmail-app-pass" class="form-control" placeholder="xxxx xxxx xxxx xxxx (Không phải mật khẩu Gmail thường)" value="${savedAppPass}" />
                <div class="form-hint" style="margin-top: 0.375rem;">
                  • Nếu điền App Password: Supabase Edge Function (<code>send-gmail-otp</code>) sẽ gửi email thật qua <code>smtp.gmail.com</code> tới <strong>${DATABASE_CONFIG.VERIFY_GMAIL_ADDRESS}</strong>.<br/>
                  • Nếu để trống: Bạn vẫn nhận được mã OTP trực tiếp trên màn hình (Sandbox Preview) để test ngay lập tức.
                </div>
              </div>
            </details>

            <button type="submit" class="btn btn-primary btn-full" id="fp-send-otp-btn">
              Gửi mã xác thực OTP qua Gmail
            </button>
          </form>
        `;

        const form1 = stepBody.querySelector('#fp-step1-form');
        const emailInput = stepBody.querySelector('#fp-account-email');
        const appPassInput = stepBody.querySelector('#fp-gmail-app-pass');
        const errBox = stepBody.querySelector('#fp-err-box');
        const sendBtn = stepBody.querySelector('#fp-send-otp-btn');

        form1.addEventListener('submit', async (e) => {
          e.preventDefault();
          errBox.style.display = 'none';

          const enteredEmail = emailInput.value.trim();
          const appPass = appPassInput.value.trim();

          if (!enteredEmail) {
            errBox.textContent = 'Vui lòng nhập địa chỉ email tài khoản cần khôi phục.';
            errBox.style.display = 'flex';
            return;
          }

          if (appPass) {
            localStorage.setItem(DATABASE_CONFIG.GMAIL_APP_PASS_STORAGE_KEY, appPass);
          } else {
            localStorage.removeItem(DATABASE_CONFIG.GMAIL_APP_PASS_STORAGE_KEY);
          }

          sendBtn.disabled = true;
          sendBtn.textContent = 'Đang tạo mã OTP & kết nối Gmail...';

          try {
            const res = await UserRepository.requestGmailResetOtp(enteredEmail, appPass);
            targetEmail = res.user.email;
            lastOtpResponse = res;
            currentStep = 2;

            if (res.sentViaSmtp) {
              Toast.success(`Đã gửi email chứa mã OTP tới hộp thư ${res.verifyGmail}!`);
            } else {
              Toast.info('Đã tạo mã OTP trên Supabase! Xem mã xác thực ở bước tiếp theo.');
            }
            renderStepContent();
          } catch (err) {
            errBox.textContent = err.message || 'Không thể tạo mã xác thực OTP.';
            errBox.style.display = 'flex';
            sendBtn.disabled = false;
            sendBtn.textContent = 'Gửi mã xác thực OTP qua Gmail';
          }
        });
      }

      // ======================================================================
      // BƯỚC 2: NHẬP MÃ OTP 6 CHỮ SỐ
      // ======================================================================
      else if (currentStep === 2) {
        const sentRealMail = Boolean(lastOtpResponse?.sentViaSmtp);
        const smtpErr = lastOtpResponse?.smtpError || '';

        stepBody.innerHTML = `
          ${
            sentRealMail
              ? `
            <div class="alert alert-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <div>
                <strong>Đã gửi Email thật thành công!</strong><br/>
                Vui lòng mở hộp thư Gmail <strong>${DATABASE_CONFIG.VERIFY_GMAIL_ADDRESS}</strong> (kiểm tra cả mục Hộp thư đến / Spam) để lấy mã OTP 6 chữ số.
              </div>
            </div>
          `
              : `
            <div class="alert alert-warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <div style="width: 100%;">
                <strong>Hộp thư Gmail mô phỏng (${DATABASE_CONFIG.VERIFY_GMAIL_ADDRESS}):</strong><br/>
                ${smtpErr ? `<span style="color: var(--color-danger);">Lưu ý SMTP: ${smtpErr}</span><br/>` : 'Chưa cấu hình Google App Password 16 ký tự nên hệ thống hiển thị trực tiếp mã OTP từ bảng <code>password_reset_otps</code> của Supabase tại đây:'}
                <div style="margin-top: 0.5rem; padding: 0.625rem; background: #FFF; border: 1px dashed var(--color-warning); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between;">
                  <span style="font-family: var(--font-mono); font-size: 1.25rem; font-weight: 700; letter-spacing: 4px; color: var(--color-primary);">${lastOtpResponse?.otpCode || ''}</span>
                  <button type="button" class="btn btn-secondary btn-sm" id="fp-autofill-otp">Điền nhanh OTP</button>
                </div>
              </div>
            </div>
          `
          }

          <div class="alert alert-danger" id="fp-step2-err" style="display: none;"></div>

          <form id="fp-step2-form" novalidate>
            <div class="form-group">
              <label class="form-label">Tài khoản đang khôi phục</label>
              <input type="text" class="form-control" value="${targetEmail}" disabled style="background: var(--color-bg-subtle);" />
            </div>

            <div class="form-group">
              <label class="form-label" for="fp-otp-input">Mã xác thực OTP (6 chữ số) <span class="form-required">*</span></label>
              <input type="text" id="fp-otp-input" class="form-control" placeholder="Nhập 6 chữ số (vd: 123456)" maxlength="6" style="font-family: var(--font-mono); font-size: 1.25rem; letter-spacing: 6px; text-align: center; font-weight: 700;" required />
            </div>

            <div style="display: flex; gap: 0.75rem;">
              <button type="button" class="btn btn-secondary" id="fp-back-step1">← Quay lại</button>
              <button type="submit" class="btn btn-primary btn-full" id="fp-verify-btn">Xác nhận mã OTP</button>
            </div>
          </form>
        `;

        const otpInput = stepBody.querySelector('#fp-otp-input');
        const autofillBtn = stepBody.querySelector('#fp-autofill-otp');
        const backBtn = stepBody.querySelector('#fp-back-step1');
        const form2 = stepBody.querySelector('#fp-step2-form');
        const errBox2 = stepBody.querySelector('#fp-step2-err');
        const verifyBtn = stepBody.querySelector('#fp-verify-btn');

        if (autofillBtn && lastOtpResponse?.otpCode) {
          autofillBtn.addEventListener('click', () => {
            otpInput.value = lastOtpResponse.otpCode;
            otpInput.focus();
          });
        }

        backBtn.addEventListener('click', () => {
          currentStep = 1;
          renderStepContent();
        });

        form2.addEventListener('submit', async (e) => {
          e.preventDefault();
          errBox2.style.display = 'none';

          const enteredOtp = otpInput.value.trim();
          verifyBtn.disabled = true;
          verifyBtn.textContent = 'Đang kiểm tra OTP...';

          try {
            await UserRepository.verifyResetOtp(targetEmail, enteredOtp);
            verifiedOtpCode = enteredOtp;
            currentStep = 3;
            Toast.success('Xác thực mã OTP thành công! Hãy đặt mật khẩu mới.');
            renderStepContent();
          } catch (err) {
            errBox2.textContent = err.message || 'Mã OTP không hợp lệ.';
            errBox2.style.display = 'flex';
            verifyBtn.disabled = false;
            verifyBtn.textContent = 'Xác nhận mã OTP';
          }
        });
      }

      // ======================================================================
      // BƯỚC 3: ĐẶT MẬT KHẨU MỚI
      // ======================================================================
      else if (currentStep === 3) {
        stepBody.innerHTML = `
          <div class="alert alert-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <div>
              Đã xác thực OTP thành công qua Gmail <strong>${DATABASE_CONFIG.VERIFY_GMAIL_ADDRESS}</strong> cho tài khoản <strong>${targetEmail}</strong>.
            </div>
          </div>

          <div class="alert alert-danger" id="fp-step3-err" style="display: none;"></div>

          <form id="fp-step3-form" novalidate>
            <div class="form-group">
              <label class="form-label" for="fp-new-pass">Mật khẩu mới (tối thiểu 8 ký tự) <span class="form-required">*</span></label>
              <input type="password" id="fp-new-pass" class="form-control" placeholder="••••••••" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="fp-confirm-pass">Xác nhận mật khẩu mới <span class="form-required">*</span></label>
              <input type="password" id="fp-confirm-pass" class="form-control" placeholder="••••••••" required />
            </div>

            <button type="submit" class="btn btn-primary btn-full" id="fp-save-pass-btn">
              Lưu mật khẩu mới
            </button>
          </form>
        `;

        const form3 = stepBody.querySelector('#fp-step3-form');
        const newPassInput = stepBody.querySelector('#fp-new-pass');
        const confirmPassInput = stepBody.querySelector('#fp-confirm-pass');
        const errBox3 = stepBody.querySelector('#fp-step3-err');
        const saveBtn = stepBody.querySelector('#fp-save-pass-btn');

        form3.addEventListener('submit', async (e) => {
          e.preventDefault();
          errBox3.style.display = 'none';

          const newPass = newPassInput.value;
          const confirmPass = confirmPassInput.value;

          if (!newPass || newPass.length < 8) {
            errBox3.textContent = 'Mật khẩu mới phải có ít nhất 8 ký tự.';
            errBox3.style.display = 'flex';
            return;
          }

          if (newPass !== confirmPass) {
            errBox3.textContent = 'Mật khẩu xác nhận không khớp.';
            errBox3.style.display = 'flex';
            return;
          }

          saveBtn.disabled = true;
          saveBtn.textContent = 'Đang cập nhật mật khẩu...';

          try {
            const user = await UserRepository.findByEmailFresh(targetEmail);
            if (!user) throw new Error('Không tìm thấy tài khoản.');

            const newSalt = AuthService.generateSalt(16);
            const newHash = await AuthService.hashPassword(newPass, newSalt);

            await UserRepository.updatePassword(user.id, newHash, newSalt);
            await UserRepository.consumeResetOtp(targetEmail, verifiedOtpCode);

            sessionStorage.setItem('video_admin_last_reset_email', targetEmail);
            Toast.success(`Đã đổi mật khẩu thành công cho ${targetEmail}! Vui lòng đăng nhập bằng mật khẩu mới.`);
            window.location.hash = '#/login';
          } catch (err) {
            errBox3.textContent = err.message || 'Lỗi khi lưu mật khẩu mới.';
            errBox3.style.display = 'flex';
            saveBtn.disabled = false;
            saveBtn.textContent = 'Lưu mật khẩu mới';
          }
        });
      }
    };

    renderStepContent();
    layout.appendChild(card);
    return layout;
  }
};

  // --- assets/js/pages/dashboard.js ---




let top10ChartInstance = null;
let viewsTimeChartInstance = null;

function destroyCharts() {
  if (top10ChartInstance) {
    top10ChartInstance.destroy();
    top10ChartInstance = null;
  }
  if (viewsTimeChartInstance) {
    viewsTimeChartInstance.destroy();
    viewsTimeChartInstance = null;
  }
}

function truncateLabel(text, maxLength = 22) {
  const str = String(text || '');
  return str.length > maxLength ? `${str.slice(0, maxLength)}…` : str;
}
const DashboardPage = {
  cleanup() {
    destroyCharts();
  },

  render() {
    destroyCharts();

    const session = AuthService.getSession();
    const kpi = StatsRepository.getKpiSummary();
    const top10 = StatsRepository.getTop10Videos();

    const container = document.createElement('div');

    // Page Header
    const header = document.createElement('div');
    header.className = 'page-header';

    const headerLeft = document.createElement('div');
    const title = document.createElement('h2');
    title.className = 'page-header-title';
    title.textContent = `Welcome back, ${session?.fullName || 'Admin'}`;

    const subtitle = document.createElement('p');
    subtitle.className = 'page-header-subtitle';
    subtitle.textContent = 'Tổng quan số liệu thống kê thời gian thực từ cơ sở dữ liệu SQLite (videos.db).';

    headerLeft.appendChild(title);
    headerLeft.appendChild(subtitle);

    const headerActions = document.createElement('div');
    headerActions.className = 'page-header-actions';
    const manageBtn = document.createElement('a');
    manageBtn.href = '#/videos';
    manageBtn.className = 'btn btn-secondary';
    manageBtn.textContent = 'Quản lý danh sách Video';
    headerActions.appendChild(manageBtn);

    header.appendChild(headerLeft);
    header.appendChild(headerActions);
    container.appendChild(header);

    // KPI Cards
    const kpiGrid = document.createElement('div');
    kpiGrid.className = 'kpi-grid';

    const kpiItems = [
      {
        label: 'Total Videos',
        value: StorageService.formatNumber(kpi.totalVideos),
        helper: kpi.totalVideos === 0 ? 'Chưa có video hoạt động' : 'Video chưa bị lưu trữ (active & draft)',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><polygon points="10 9 15 12 10 15 10 9"/></svg>`
      },
      {
        label: 'Total Views',
        value: StorageService.formatNumber(kpi.totalViews),
        helper: kpi.totalViews === 0 ? 'Chưa có lượt xem' : 'Tổng lượt xem tích lũy từ videos.db',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
      },
      {
        label: 'Storage Used',
        value: StorageService.formatBytes(kpi.storageBytes),
        helper: `${StorageService.formatNumber(kpi.storageBytes)} bytes metadata`,
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`
      }
    ];

    kpiItems.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'kpi-card';

      const info = document.createElement('div');
      const labelEl = document.createElement('div');
      labelEl.className = 'kpi-label';
      labelEl.textContent = item.label;

      const valueEl = document.createElement('div');
      valueEl.className = 'kpi-value';
      valueEl.textContent = item.value;

      const helperEl = document.createElement('div');
      helperEl.className = 'kpi-helper';
      helperEl.textContent = item.helper;

      info.appendChild(labelEl);
      info.appendChild(valueEl);
      info.appendChild(helperEl);

      const iconBox = document.createElement('div');
      iconBox.className = 'kpi-icon';
      iconBox.innerHTML = item.icon;

      card.appendChild(info);
      card.appendChild(iconBox);
      kpiGrid.appendChild(card);
    });

    container.appendChild(kpiGrid);

    // Charts Section
    const chartsGrid = document.createElement('div');
    chartsGrid.className = 'dashboard-charts';

    // 1. Top 10 Videos Bar Chart Card
    const top10Card = document.createElement('section');
    top10Card.className = 'card';

    const top10Header = document.createElement('div');
    top10Header.className = 'card-header';
    top10Header.innerHTML = `
      <div>
        <h3 class="card-title">Top 10 Videos — Lượt xem cao nhất</h3>
        <p class="card-subtitle">Sắp xếp giảm dần theo số lượt xem từ bảng videos</p>
      </div>
    `;
    top10Card.appendChild(top10Header);

    const top10Body = document.createElement('div');
    top10Body.className = 'card-body';

    if (!top10 || top10.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = `
        <div class="empty-state-title">Chưa có dữ liệu video</div>
        <div class="empty-state-desc">Hãy thêm video mới để xem biểu đồ Top 10 video theo lượt xem.</div>
        <a href="#/videos/new" class="btn btn-primary">+ Add Video</a>
      `;
      top10Body.appendChild(empty);
    } else {
      const chartWrap = document.createElement('div');
      chartWrap.className = 'chart-container';
      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-label', 'Biểu đồ Top 10 video theo lượt xem');
      chartWrap.appendChild(canvas);
      top10Body.appendChild(chartWrap);

      requestAnimationFrame(() => {
        if (typeof window.Chart === 'function') {
          const fullTitles = top10.map((v) => v.title);
          const shortLabels = top10.map((v) => truncateLabel(v.title, 20));
          const dataValues = top10.map((v) => Number(v.views) || 0);

          top10ChartInstance = new window.Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
              labels: shortLabels,
              datasets: [
                {
                  label: 'Views',
                  data: dataValues,
                  backgroundColor: '#2563EB',
                  hoverBackgroundColor: '#1D4ED8',
                  borderRadius: 6,
                  maxBarThickness: 48
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    title(items) {
                      const idx = items[0]?.dataIndex ?? 0;
                      return fullTitles[idx] || '';
                    },
                    label(item) {
                      return ` Lượt xem: ${StorageService.formatNumber(item.raw)}`;
                    }
                  }
                }
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { color: '#475569', font: { size: 11 } }
                },
                y: {
                  beginAtZero: true,
                  grid: { color: '#F1F5F9' },
                  ticks: {
                    color: '#475569',
                    callback: (val) => StorageService.formatNumber(val)
                  }
                }
              }
            }
          });
        }
      });
    }

    top10Card.appendChild(top10Body);
    chartsGrid.appendChild(top10Card);

    // 2. Views Over Time Line Chart Card (Daily / Monthly)
    const timeCard = document.createElement('section');
    timeCard.className = 'card';

    const timeHeader = document.createElement('div');
    timeHeader.className = 'card-header';

    const timeTitleWrap = document.createElement('div');
    timeTitleWrap.innerHTML = `
      <h3 class="card-title">Views Over Time — Xu hướng lượt xem</h3>
      <p class="card-subtitle">Dữ liệu thống kê thực từ bảng video_view_stats (không tự suy diễn từ tổng lượt xem)</p>
    `;

    const toggleWrap = document.createElement('div');
    toggleWrap.className = 'segmented-control';

    const dailyBtn = document.createElement('button');
    dailyBtn.type = 'button';
    dailyBtn.className = `segmented-btn${AppState.dashboardTimeRange === 'daily' ? ' active' : ''}`;
    dailyBtn.textContent = 'Daily (30 ngày)';

    const monthlyBtn = document.createElement('button');
    monthlyBtn.type = 'button';
    monthlyBtn.className = `segmented-btn${AppState.dashboardTimeRange === 'monthly' ? ' active' : ''}`;
    monthlyBtn.textContent = 'Monthly (12 tháng)';

    toggleWrap.appendChild(dailyBtn);
    toggleWrap.appendChild(monthlyBtn);

    timeHeader.appendChild(timeTitleWrap);
    timeHeader.appendChild(toggleWrap);
    timeCard.appendChild(timeHeader);

    const timeBody = document.createElement('div');
    timeBody.className = 'card-body';
    timeCard.appendChild(timeBody);

    const renderTimeChart = (mode) => {
      if (viewsTimeChartInstance) {
        viewsTimeChartInstance.destroy();
        viewsTimeChartInstance = null;
      }
      timeBody.innerHTML = '';

      const rows =
        mode === 'monthly'
          ? StatsRepository.getViewsPerMonth()
          : StatsRepository.getViewsPerDay();

      if (!rows || rows.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.innerHTML = `
          <div class="empty-state-title">Chưa có dữ liệu lượt xem theo thời gian</div>
          <div class="empty-state-desc">Bảng video_view_stats hiện chưa có bản ghi thống kê cho khoảng thời gian này.</div>
        `;
        timeBody.appendChild(empty);
        return;
      }

      const chartWrap = document.createElement('div');
      chartWrap.className = 'chart-container';
      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-label', 'Biểu đồ lượt xem theo thời gian');
      chartWrap.appendChild(canvas);
      timeBody.appendChild(chartWrap);

      const labels = rows.map((r) => (mode === 'monthly' ? r.month : r.view_date));
      const values = rows.map((r) => Number(r.total_views) || 0);

      requestAnimationFrame(() => {
        if (typeof window.Chart === 'function') {
          viewsTimeChartInstance = new window.Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
              labels,
              datasets: [
                {
                  label: mode === 'monthly' ? 'Views theo tháng' : 'Views theo ngày',
                  data: values,
                  borderColor: '#2563EB',
                  backgroundColor: 'rgba(37, 99, 235, 0.10)',
                  borderWidth: 2.5,
                  pointBackgroundColor: '#FFFFFF',
                  pointBorderColor: '#2563EB',
                  pointBorderWidth: 2,
                  pointRadius: 3.5,
                  fill: true,
                  tension: 0.3
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label(item) {
                      return ` Tổng lượt xem: ${StorageService.formatNumber(item.raw)}`;
                    }
                  }
                }
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { color: '#475569', maxTicksLimit: 12 }
                },
                y: {
                  beginAtZero: true,
                  grid: { color: '#F1F5F9' },
                  ticks: {
                    color: '#475569',
                    callback: (val) => StorageService.formatNumber(val)
                  }
                }
              }
            }
          });
        }
      });
    };

    dailyBtn.addEventListener('click', () => {
      if (AppState.dashboardTimeRange === 'daily') return;
      AppState.dashboardTimeRange = 'daily';
      dailyBtn.classList.add('active');
      monthlyBtn.classList.remove('active');
      renderTimeChart('daily');
    });

    monthlyBtn.addEventListener('click', () => {
      if (AppState.dashboardTimeRange === 'monthly') return;
      AppState.dashboardTimeRange = 'monthly';
      monthlyBtn.classList.add('active');
      dailyBtn.classList.remove('active');
      renderTimeChart('monthly');
    });

    renderTimeChart(AppState.dashboardTimeRange);

    chartsGrid.appendChild(timeCard);
    container.appendChild(chartsGrid);

    return container;
  }
};

  // --- assets/js/pages/videos.js ---
const VideosPage = {
  render() {
    const container = document.createElement('div');
    const categories = CategoryRepository.listAll();

    // Page Header
    const header = document.createElement('div');
    header.className = 'page-header';

    const headerLeft = document.createElement('div');
    const title = document.createElement('h2');
    title.className = 'page-header-title';
    title.textContent = 'Videos Management';

    const subtitle = document.createElement('p');
    subtitle.className = 'page-header-subtitle';
    subtitle.textContent = 'Tìm kiếm, lọc, sắp xếp và quản lý danh sách video trong videos.db.';

    headerLeft.appendChild(title);
    headerLeft.appendChild(subtitle);

    const headerActions = document.createElement('div');
    headerActions.className = 'page-header-actions';

    const addBtn = document.createElement('a');
    addBtn.href = '#/videos/new';
    addBtn.className = 'btn btn-primary';
    addBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      <span>Add Video</span>
    `;
    headerActions.appendChild(addBtn);

    header.appendChild(headerLeft);
    header.appendChild(headerActions);
    container.appendChild(header);

    // Main Card
    const card = document.createElement('section');
    card.className = 'card';

    // Filter Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'filter-toolbar';

    // 1. Search Input
    const searchBox = document.createElement('div');
    searchBox.className = 'search-box';
    searchBox.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    `;
    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.className = 'form-control';
    searchInput.placeholder = 'Tìm kiếm theo tiêu đề video...';
    searchInput.setAttribute('aria-label', 'Tìm kiếm theo tiêu đề video');
    searchInput.value = AppState.videoFilters.search;
    searchBox.appendChild(searchInput);

    // 2. Category Filter
    const categorySelect = document.createElement('select');
    categorySelect.className = 'form-control';
    categorySelect.setAttribute('aria-label', 'Lọc theo danh mục');
    const defaultCatOpt = document.createElement('option');
    defaultCatOpt.value = '';
    defaultCatOpt.textContent = 'Tất cả danh mục';
    categorySelect.appendChild(defaultCatOpt);

    categories.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = String(cat.id);
      opt.textContent = cat.name;
      if (String(AppState.videoFilters.categoryId) === String(cat.id)) {
        opt.selected = true;
      }
      categorySelect.appendChild(opt);
    });

    // 3. Sort Filter
    const sortSelect = document.createElement('select');
    sortSelect.className = 'form-control';
    sortSelect.setAttribute('aria-label', 'Sắp xếp danh sách video');
    const sortOptions = [
      { value: 'created_desc', label: 'Mới nhất trước' },
      { value: 'created_asc', label: 'Cũ nhất trước' },
      { value: 'views_desc', label: 'Lượt xem: Cao → Thấp' },
      { value: 'views_asc', label: 'Lượt xem: Thấp → Cao' },
      { value: 'title_asc', label: 'Tiêu đề: A → Z' },
      { value: 'title_desc', label: 'Tiêu đề: Z → A' }
    ];
    sortOptions.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s.value;
      opt.textContent = s.label;
      if (AppState.videoFilters.sortBy === s.value) {
        opt.selected = true;
      }
      sortSelect.appendChild(opt);
    });

    toolbar.appendChild(searchBox);
    toolbar.appendChild(categorySelect);
    toolbar.appendChild(sortSelect);
    card.appendChild(toolbar);

    // Table Content Container
    const tableHost = document.createElement('div');
    card.appendChild(tableHost);

    const refreshTable = () => {
      tableHost.innerHTML = '';
      const result = VideoRepository.list(AppState.videoFilters);

      const tableEl = DataTable.renderVideoTable({
        items: result.items,
        onAddClick: () => {
          window.location.hash = '#/videos/new';
        },
        onEdit: (video) => {
          window.location.hash = `#/videos/${video.id}/edit`;
        },
        onDelete: async (video) => {
          const confirmed = await Modal.confirm({
            title: 'Xóa video',
            message: `Bạn có chắc chắn muốn xóa video "${video.title}"? Dữ liệu thống kê lượt xem liên quan cũng sẽ bị xóa khỏi videos.db.`,
            confirmText: 'Xóa vĩnh viễn',
            cancelText: 'Hủy',
            danger: true
          });

          if (!confirmed) return;

          try {
            await VideoRepository.delete(video.id);
            Toast.success(`Đã xóa video "${video.title}".`);
            refreshTable();
          } catch (err) {
            Toast.error(err.message || 'Không thể xóa video.');
          }
        }
      });

      tableHost.appendChild(tableEl);

      if (result.total > 0) {
        const paginationEl = DataTable.renderPagination({
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
          pageSize: result.pageSize,
          onPageChange: (newPage) => {
            AppState.videoFilters.page = newPage;
            refreshTable();
          }
        });
        tableHost.appendChild(paginationEl);
      }
    };

    searchInput.addEventListener('input', () => {
      AppState.videoFilters.search = searchInput.value;
      AppState.videoFilters.page = 1;
      refreshTable();
    });

    categorySelect.addEventListener('change', () => {
      AppState.videoFilters.categoryId = categorySelect.value;
      AppState.videoFilters.page = 1;
      refreshTable();
    });

    sortSelect.addEventListener('change', () => {
      AppState.videoFilters.sortBy = sortSelect.value;
      AppState.videoFilters.page = 1;
      refreshTable();
    });

    refreshTable();
    container.appendChild(card);

    return container;
  }
};

  // --- assets/js/pages/video-form.js ---





let activeVideoObjectUrl = null;

function revokeActiveVideoUrl() {
  if (activeVideoObjectUrl) {
    URL.revokeObjectURL(activeVideoObjectUrl);
    activeVideoObjectUrl = null;
  }
}
const VideoFormPage = {
  cleanup() {
    revokeActiveVideoUrl();
  },

  render({ videoId = null } = {}) {
    revokeActiveVideoUrl();

    const isEdit = videoId !== null && videoId !== undefined;
    const existingVideo = isEdit ? VideoRepository.getById(videoId) : null;

    const container = document.createElement('div');

    if (isEdit && !existingVideo) {
      const notFound = document.createElement('div');
      notFound.className = 'card card-body';
      notFound.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-title">Không tìm thấy video #${Number(videoId)}</div>
          <div class="empty-state-desc">Video này có thể đã bị xóa khỏi cơ sở dữ liệu videos.db.</div>
          <a href="#/videos" class="btn btn-primary">Quay lại danh sách Video</a>
        </div>
      `;
      container.appendChild(notFound);
      return container;
    }

    const categories = CategoryRepository.listAll();

    // Header
    const header = document.createElement('div');
    header.className = 'page-header';

    const headerLeft = document.createElement('div');
    const titleEl = document.createElement('h2');
    titleEl.className = 'page-header-title';
    titleEl.textContent = isEdit ? `Edit Video #${existingVideo.id}` : 'Add New Video';

    const subEl = document.createElement('p');
    subEl.className = 'page-header-subtitle';
    subEl.textContent = isEdit
      ? 'Cập nhật thông tin metadata và lưu thay đổi vào videos.db.'
      : 'Thêm mới bản ghi video vào cơ sở dữ liệu SQLite (videos.db).';

    headerLeft.appendChild(titleEl);
    headerLeft.appendChild(subEl);

    const backBtn = document.createElement('a');
    backBtn.href = '#/videos';
    backBtn.className = 'btn btn-secondary';
    backBtn.textContent = '← Quay lại danh sách';

    header.appendChild(headerLeft);
    header.appendChild(backBtn);
    container.appendChild(header);

    // Form
    const form = document.createElement('form');
    form.noValidate = true;

    const grid = document.createElement('div');
    grid.className = 'form-grid-layout';

    // Left column: Basic Info & Metadata
    const leftCard = document.createElement('div');
    leftCard.className = 'card';
    leftCard.innerHTML = `
      <div class="card-header">
        <div>
          <h3 class="card-title">Thông tin cơ bản & Metadata</h3>
          <p class="card-subtitle">Các trường có dấu (*) là bắt buộc</p>
        </div>
      </div>
      <div class="card-body">
        <div class="form-group">
          <label class="form-label" for="vf-title">Title <span class="form-required">*</span></label>
          <input type="text" id="vf-title" class="form-control" placeholder="Nhập tiêu đề video..." required />
          <div class="form-error" id="err-vf-title"></div>
        </div>

        <div class="form-group">
          <label class="form-label" for="vf-desc">Description</label>
          <textarea id="vf-desc" class="form-control" placeholder="Mô tả nội dung video (không bắt buộc)..."></textarea>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label" for="vf-category">Category</label>
            <select id="vf-category" class="form-control">
              <option value="">-- Chọn danh mục --</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="vf-status">Status <span class="form-required">*</span></label>
            <select id="vf-status" class="form-control">
              <option value="active">Active (Hoạt động)</option>
              <option value="draft">Draft (Bản nháp)</option>
              <option value="archived">Archived (Lưu trữ)</option>
            </select>
            <div class="form-error" id="err-vf-status"></div>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label" for="vf-views">Views (Demo / Nhập thủ công) <span class="form-required">*</span></label>
            <input type="number" id="vf-views" class="form-control" min="0" step="1" value="0" required />
            <div class="form-hint">Số nguyên không âm</div>
            <div class="form-error" id="err-vf-views"></div>
          </div>

          <div class="form-group">
            <label class="form-label" for="vf-size">File Size (Bytes) <span class="form-required">*</span></label>
            <input type="number" id="vf-size" class="form-control" min="0" step="1" value="0" required />
            <div class="form-hint" id="vf-size-human">Tương đương: 0 B</div>
            <div class="form-error" id="err-vf-size"></div>
          </div>
        </div>
      </div>
    `;

    // Right column: Media (Thumbnail & Local Video File metadata)
    const rightCard = document.createElement('div');
    rightCard.className = 'card';
    rightCard.innerHTML = `
      <div class="card-header">
        <div>
          <h3 class="card-title">Media & Xem trước</h3>
          <p class="card-subtitle">Lưu URL hoặc trích xuất metadata từ file máy tính</p>
        </div>
      </div>
      <div class="card-body">
        <div class="form-group">
          <label class="form-label" for="vf-thumb-url">Thumbnail URL</label>
          <input type="url" id="vf-thumb-url" class="form-control" placeholder="https://example.com/thumbnail.jpg" />
          <div class="form-error" id="err-vf-thumb"></div>
        </div>

        <div class="form-group">
          <label class="form-label" for="vf-thumb-file">Hoặc chọn ảnh Thumbnail từ máy</label>
          <input type="file" id="vf-thumb-file" class="form-control" accept="image/*" />
          <div class="thumbnail-preview-box">
            <img id="vf-thumb-preview" src="assets/images/placeholder-thumbnail.svg" alt="Thumbnail preview" />
          </div>
        </div>

        <div class="form-group" style="margin-top: 1.25rem;">
          <label class="form-label" for="vf-video-file">Chọn Video File (Tùy chọn — Chỉ lưu Metadata)</label>
          <input type="file" id="vf-video-file" class="form-control" accept="video/*" />
          <div class="form-hint" id="vf-video-meta-info">Không nhúng binary video vào SQLite; tự động điền tên file và dung lượng.</div>
          <video id="vf-video-preview" class="video-preview-player" controls style="display: none;"></video>
        </div>

        <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--color-border);">
          <a href="#/videos" class="btn btn-secondary">Cancel</a>
          <button type="submit" class="btn btn-primary" id="vf-submit-btn">${isEdit ? 'Lưu thay đổi' : 'Tạo Video'}</button>
        </div>
      </div>
    `;

    grid.appendChild(leftCard);
    grid.appendChild(rightCard);
    form.appendChild(grid);
    container.appendChild(form);

    // References
    const titleInput = leftCard.querySelector('#vf-title');
    const descInput = leftCard.querySelector('#vf-desc');
    const categorySelect = leftCard.querySelector('#vf-category');
    const statusSelect = leftCard.querySelector('#vf-status');
    const viewsInput = leftCard.querySelector('#vf-views');
    const sizeInput = leftCard.querySelector('#vf-size');
    const sizeHuman = leftCard.querySelector('#vf-size-human');

    const thumbUrlInput = rightCard.querySelector('#vf-thumb-url');
    const thumbFileInput = rightCard.querySelector('#vf-thumb-file');
    const thumbPreview = rightCard.querySelector('#vf-thumb-preview');
    const videoFileInput = rightCard.querySelector('#vf-video-file');
    const videoMetaInfo = rightCard.querySelector('#vf-video-meta-info');
    const videoPreview = rightCard.querySelector('#vf-video-preview');
    const submitBtn = rightCard.querySelector('#vf-submit-btn');

    const errTitle = leftCard.querySelector('#err-vf-title');
    const errStatus = leftCard.querySelector('#err-vf-status');
    const errViews = leftCard.querySelector('#err-vf-views');
    const errSize = leftCard.querySelector('#err-vf-size');
    const errThumb = rightCard.querySelector('#err-vf-thumb');

    // Populate categories
    categories.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = String(c.id);
      opt.textContent = c.name;
      categorySelect.appendChild(opt);
    });

    let selectedFileMeta = {
      fileName: existingVideo?.file_name || '',
      filePath: existingVideo?.file_path || '',
      mimeType: existingVideo?.mime_type || ''
    };

    // Populate initial values if editing
    if (isEdit && existingVideo) {
      titleInput.value = existingVideo.title || '';
      descInput.value = existingVideo.description || '';
      categorySelect.value = existingVideo.category_id ? String(existingVideo.category_id) : '';
      statusSelect.value = existingVideo.status || 'active';
      viewsInput.value = String(existingVideo.views ?? 0);
      sizeInput.value = String(existingVideo.file_size_bytes ?? 0);
      sizeHuman.textContent = `Tương đương: ${StorageService.formatBytes(existingVideo.file_size_bytes)}`;
      thumbUrlInput.value = existingVideo.thumbnail_url || '';
      thumbPreview.src = existingVideo.thumbnail_url || 'assets/images/placeholder-thumbnail.svg';
      if (existingVideo.file_name) {
        videoMetaInfo.textContent = `File hiện tại: ${existingVideo.file_name} (${existingVideo.mime_type || 'video/mp4'})`;
      }
    }

    sizeInput.addEventListener('input', () => {
      sizeHuman.textContent = `Tương đương: ${StorageService.formatBytes(sizeInput.value)}`;
    });

    thumbUrlInput.addEventListener('input', () => {
      const val = thumbUrlInput.value.trim();
      thumbPreview.src = val || 'assets/images/placeholder-thumbnail.svg';
    });

    thumbPreview.addEventListener('error', () => {
      thumbPreview.src = 'assets/images/placeholder-thumbnail.svg';
    });

    // Local thumbnail image reader
    thumbFileInput.addEventListener('change', () => {
      const file = thumbFileInput.files?.[0];
      if (!file) return;
      if (file.size > 1.5 * 1024 * 1024) {
        Toast.error('Ảnh thumbnail quá lớn (> 1.5MB). Vui lòng chọn ảnh nhẹ hơn hoặc dùng URL.');
        thumbFileInput.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          thumbUrlInput.value = reader.result;
          thumbPreview.src = reader.result;
        }
      };
      reader.readAsDataURL(file);
    });

    // Local video file metadata extraction + temporary preview via URL.createObjectURL
    videoFileInput.addEventListener('change', () => {
      revokeActiveVideoUrl();
      const file = videoFileInput.files?.[0];
      if (!file) {
        videoPreview.style.display = 'none';
        videoPreview.removeAttribute('src');
        return;
      }

      selectedFileMeta = {
        fileName: file.name,
        filePath: `/local-selected/${file.name}`,
        mimeType: file.type || 'video/mp4'
      };

      sizeInput.value = String(file.size);
      sizeHuman.textContent = `Tương đương: ${StorageService.formatBytes(file.size)}`;
      videoMetaInfo.textContent = `Đã chọn: ${file.name} (${StorageService.formatBytes(file.size)})`;

      if (!titleInput.value.trim()) {
        titleInput.value = file.name.replace(/\.[^/.]+$/, '');
      }

      activeVideoObjectUrl = URL.createObjectURL(file);
      videoPreview.src = activeVideoObjectUrl;
      videoPreview.style.display = 'block';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      [errTitle, errStatus, errViews, errSize, errThumb].forEach((el) => (el.textContent = ''));
      [titleInput, statusSelect, viewsInput, sizeInput, thumbUrlInput].forEach((el) =>
        el.classList.remove('is-invalid')
      );

      const payload = {
        title: titleInput.value,
        description: descInput.value,
        thumbnailUrl: thumbUrlInput.value,
        categoryId: categorySelect.value,
        status: statusSelect.value,
        views: viewsInput.value === '' ? NaN : Number(viewsInput.value),
        fileSizeBytes: sizeInput.value === '' ? NaN : Number(sizeInput.value),
        fileName: selectedFileMeta.fileName,
        filePath: selectedFileMeta.filePath,
        mimeType: selectedFileMeta.mimeType
      };

      const validation = ValidationService.validateVideoForm(payload);
      if (!validation.isValid) {
        if (validation.errors.title) {
          errTitle.textContent = validation.errors.title;
          titleInput.classList.add('is-invalid');
        }
        if (validation.errors.views) {
          errViews.textContent = validation.errors.views;
          viewsInput.classList.add('is-invalid');
        }
        if (validation.errors.fileSizeBytes) {
          errSize.textContent = validation.errors.fileSizeBytes;
          sizeInput.classList.add('is-invalid');
        }
        if (validation.errors.thumbnailUrl) {
          errThumb.textContent = validation.errors.thumbnailUrl;
          thumbUrlInput.classList.add('is-invalid');
        }
        if (validation.errors.status) {
          errStatus.textContent = validation.errors.status;
          statusSelect.classList.add('is-invalid');
        }
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Đang lưu...';

      try {
        if (isEdit) {
          await VideoRepository.update(videoId, payload);
          Toast.success('Đã cập nhật thông tin video thành công!');
        } else {
          await VideoRepository.create(payload);
          Toast.success('Đã thêm video mới vào cơ sở dữ liệu!');
        }
        window.location.hash = '#/videos';
      } catch (err) {
        Toast.error(err.message || 'Không thể lưu video vào database.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = isEdit ? 'Lưu thay đổi' : 'Tạo Video';
      }
    });

    return container;
  }
};

  // --- assets/js/pages/permissions.js ---




function getInitials(name) {
  const parts = String(name || 'U').trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return String(name || 'US').slice(0, 2).toUpperCase();
}
const PermissionsPage = {
  render() {
    const session = AuthService.getSession();
    const container = document.createElement('div');

    if (!AuthService.isAdmin()) {
      const deniedCard = document.createElement('div');
      deniedCard.className = 'card card-body';
      deniedCard.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-title">Không có quyền truy cập (Access Denied)</div>
          <div class="empty-state-desc">Chỉ tài khoản có quyền ADMIN mới được phép truy cập trang Phân Quyền.</div>
          <a href="#/dashboard" class="btn btn-primary">Quay lại Dashboard</a>
        </div>
      `;
      container.appendChild(deniedCard);
      return container;
    }

    const filterState = {
      search: '',
      role: ''
    };

    // Page Header
    const header = document.createElement('div');
    header.className = 'page-header';

    const headerLeft = document.createElement('div');
    const title = document.createElement('h2');
    title.className = 'page-header-title';
    title.textContent = 'Phân Quyền (Permission Management)';

    const subtitle = document.createElement('p');
    subtitle.className = 'page-header-subtitle';
    subtitle.textContent = 'Quản lý danh sách tài khoản và phân quyền vai trò ADMIN / USER trong cơ sở dữ liệu users.db.';

    headerLeft.appendChild(title);
    headerLeft.appendChild(subtitle);
    header.appendChild(headerLeft);
    container.appendChild(header);

    // Info Alert about roles & demo accounts
    const infoAlert = document.createElement('div');
    infoAlert.className = 'alert alert-info';
    infoAlert.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      <div>
        <strong>Quy tắc Phân Quyền:</strong> Hệ thống có 2 quyền <code>ADMIN</code> và <code>USER</code>. Tài khoản <code>ADMIN</code> có thể truy cập trang Phân Quyền và thay đổi quyền của các tài khoản khác. Đã khởi tạo sẵn 10 tài khoản <code>user1@demo.com</code> → <code>user10@demo.com</code> (mật khẩu chung: <code>User@123</code>) để kiểm thử.
      </div>
    `;
    container.appendChild(infoAlert);

    // KPI Summary Host
    const kpiHost = document.createElement('div');
    container.appendChild(kpiHost);

    const renderKpiSummary = () => {
      kpiHost.innerHTML = '';
      const summary = UserRepository.getRoleSummary();

      const kpiGrid = document.createElement('div');
      kpiGrid.className = 'kpi-grid';

      const cards = [
        {
          label: 'Tổng số tài khoản',
          value: StorageService.formatNumber(summary.total),
          helper: 'Tài khoản lưu trong users.db',
          icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
        },
        {
          label: 'Quyền ADMIN',
          value: StorageService.formatNumber(summary.adminCount),
          helper: 'Toàn quyền quản trị & phân quyền',
          icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
        },
        {
          label: 'Quyền USER',
          value: StorageService.formatNumber(summary.userCount),
          helper: 'Tài khoản người dùng tiêu chuẩn',
          icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
        }
      ];

      cards.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'kpi-card';

        const info = document.createElement('div');
        const labelEl = document.createElement('div');
        labelEl.className = 'kpi-label';
        labelEl.textContent = item.label;

        const valueEl = document.createElement('div');
        valueEl.className = 'kpi-value';
        valueEl.textContent = item.value;

        const helperEl = document.createElement('div');
        helperEl.className = 'kpi-helper';
        helperEl.textContent = item.helper;

        info.appendChild(labelEl);
        info.appendChild(valueEl);
        info.appendChild(helperEl);

        const iconBox = document.createElement('div');
        iconBox.className = 'kpi-icon';
        iconBox.innerHTML = item.icon;

        card.appendChild(info);
        card.appendChild(iconBox);
        kpiGrid.appendChild(card);
      });

      kpiHost.appendChild(kpiGrid);
    };

    // Main Table Card
    const card = document.createElement('section');
    card.className = 'card';

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'permissions-toolbar';

    const searchBox = document.createElement('div');
    searchBox.className = 'search-box';
    searchBox.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    `;
    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.className = 'form-control';
    searchInput.placeholder = 'Tìm kiếm theo tên hoặc email (vd: user1@demo.com)...';
    searchInput.setAttribute('aria-label', 'Tìm kiếm tài khoản theo tên hoặc email');
    searchBox.appendChild(searchInput);

    const roleFilterSelect = document.createElement('select');
    roleFilterSelect.className = 'form-control';
    roleFilterSelect.setAttribute('aria-label', 'Lọc theo quyền');
    [
      { value: '', label: 'Tất cả quyền (All Roles)' },
      { value: 'ADMIN', label: 'Chỉ quyền ADMIN' },
      { value: 'USER', label: 'Chỉ quyền USER' }
    ].forEach((optData) => {
      const opt = document.createElement('option');
      opt.value = optData.value;
      opt.textContent = optData.label;
      roleFilterSelect.appendChild(opt);
    });

    toolbar.appendChild(searchBox);
    toolbar.appendChild(roleFilterSelect);
    card.appendChild(toolbar);

    const tableHost = document.createElement('div');
    card.appendChild(tableHost);

    const renderUsersTable = () => {
      tableHost.innerHTML = '';
      const users = UserRepository.listUsers(filterState);

      if (!users || users.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.innerHTML = `
          <div class="empty-state-title">Không tìm thấy tài khoản nào</div>
          <div class="empty-state-desc">Không có tài khoản khớp với từ khóa hoặc bộ lọc quyền hiện tại.</div>
        `;
        tableHost.appendChild(empty);
        return;
      }

      const responsive = document.createElement('div');
      responsive.className = 'table-responsive';

      const table = document.createElement('table');
      table.className = 'data-table';

      const thead = document.createElement('thead');
      thead.innerHTML = `
        <tr>
          <th>ID</th>
          <th>Tài khoản (Họ tên & Email)</th>
          <th>Quyền hiện tại (Role)</th>
          <th>Trạng thái</th>
          <th>Ngày cập nhật</th>
          <th class="text-right">Chỉnh sửa Quyền</th>
        </tr>
      `;
      table.appendChild(thead);

      const tbody = document.createElement('tbody');

      users.forEach((user) => {
        const tr = document.createElement('tr');
        const isCurrentUser = Number(user.id) === Number(session?.userId);
        const currentRole = user.role || 'USER';

        // 1. ID
        const tdId = document.createElement('td');
        tdId.style.fontFamily = 'var(--font-mono)';
        tdId.style.color = 'var(--color-text-muted)';
        tdId.textContent = `#${String(user.id).padStart(2, '0')}`;

        // 2. Account Info
        const tdAccount = document.createElement('td');
        const accountCell = document.createElement('div');
        accountCell.className = 'user-account-cell';

        const avatar = document.createElement('div');
        avatar.className = 'sidebar-avatar';
        avatar.textContent = getInitials(user.full_name);

        const meta = document.createElement('div');
        meta.className = 'user-account-meta';

        const nameRow = document.createElement('div');
        nameRow.className = 'user-account-name';
        const nameSpan = document.createElement('span');
        nameSpan.textContent = user.full_name;
        nameRow.appendChild(nameSpan);

        if (isCurrentUser) {
          const selfBadge = document.createElement('span');
          selfBadge.className = 'badge badge-active';
          selfBadge.textContent = 'Bạn';
          nameRow.appendChild(selfBadge);
        }

        const emailEl = document.createElement('div');
        emailEl.className = 'user-account-email';
        emailEl.textContent = user.email;

        meta.appendChild(nameRow);
        meta.appendChild(emailEl);
        accountCell.appendChild(avatar);
        accountCell.appendChild(meta);
        tdAccount.appendChild(accountCell);

        // 3. Current Role Badge
        const tdRole = document.createElement('td');
        const roleBadge = document.createElement('span');
        roleBadge.className = `badge ${currentRole === 'ADMIN' ? 'badge-role-admin' : 'badge-role-user'}`;
        roleBadge.textContent = currentRole;
        tdRole.appendChild(roleBadge);

        // 4. Status
        const tdStatus = document.createElement('td');
        const statusBadge = document.createElement('span');
        statusBadge.className = `badge ${user.status === 'active' ? 'badge-active' : 'badge-archived'}`;
        statusBadge.textContent = user.status === 'active' ? 'Active' : 'Disabled';
        tdStatus.appendChild(statusBadge);

        // 5. Updated Date
        const tdUpdated = document.createElement('td');
        tdUpdated.style.color = 'var(--color-text-secondary)';
        tdUpdated.textContent = StorageService.formatDate(user.updated_at || user.created_at);

        // 6. Edit Role Controls
        const tdAction = document.createElement('td');
        tdAction.className = 'text-right';

        if (isCurrentUser) {
          const selfNote = document.createElement('span');
          selfNote.style.fontSize = 'var(--text-xs)';
          selfNote.style.color = 'var(--color-text-muted)';
          selfNote.textContent = 'Tài khoản đang đăng nhập';
          tdAction.appendChild(selfNote);
        } else {
          const controls = document.createElement('div');
          controls.className = 'role-edit-controls';

          const select = document.createElement('select');
          select.className = 'form-control role-select';
          select.setAttribute('aria-label', `Chọn quyền cho ${user.email}`);

          ['USER', 'ADMIN'].forEach((r) => {
            const opt = document.createElement('option');
            opt.value = r;
            opt.textContent = r;
            if (currentRole === r) opt.selected = true;
            select.appendChild(opt);
          });

          const saveBtn = document.createElement('button');
          saveBtn.type = 'button';
          saveBtn.className = 'btn btn-primary btn-sm';
          saveBtn.textContent = 'Lưu quyền';
          saveBtn.disabled = true;

          select.addEventListener('change', () => {
            saveBtn.disabled = select.value === currentRole;
          });

          saveBtn.addEventListener('click', async () => {
            const newRole = select.value;
            if (newRole === currentRole) return;

            saveBtn.disabled = true;
            saveBtn.textContent = 'Đang lưu...';

            try {
              await UserRepository.updateUserRole(user.id, newRole, session.userId);
              Toast.success(`Đã cập nhật quyền của ${user.email} thành ${newRole}.`);
              renderKpiSummary();
              renderUsersTable();
            } catch (err) {
              Toast.error(err.message || 'Không thể cập nhật quyền.');
              saveBtn.disabled = false;
              saveBtn.textContent = 'Lưu quyền';
            }
          });

          controls.appendChild(select);
          controls.appendChild(saveBtn);
          tdAction.appendChild(controls);
        }

        tr.appendChild(tdId);
        tr.appendChild(tdAccount);
        tr.appendChild(tdRole);
        tr.appendChild(tdStatus);
        tr.appendChild(tdUpdated);
        tr.appendChild(tdAction);
        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
      responsive.appendChild(table);
      tableHost.appendChild(responsive);
    };

    searchInput.addEventListener('input', () => {
      filterState.search = searchInput.value;
      renderUsersTable();
    });

    roleFilterSelect.addEventListener('change', () => {
      filterState.role = roleFilterSelect.value;
      renderUsersTable();
    });

    renderKpiSummary();
    renderUsersTable();

    container.appendChild(card);
    return container;
  }
};

  // --- assets/js/pages/settings.js ---
const SettingsPage = {
  render() {
    const container = document.createElement('div');

    // Page Header
    const header = document.createElement('div');
    header.className = 'page-header';
    header.innerHTML = `
      <div>
        <h2 class="page-header-title">Settings, Supabase Cloud & Database Backup</h2>
        <p class="page-header-subtitle">Quản lý kết nối Supabase Cloud, sao lưu/khôi phục file SQLite (.db), danh mục và dữ liệu mẫu.</p>
      </div>
    `;
    container.appendChild(header);

    // 0. Supabase Cloud Connection Card
    const supabaseCard = document.createElement('section');
    supabaseCard.className = 'card';
    supabaseCard.style.marginBottom = '1.5rem';

    const renderSupabaseCard = () => {
      const sbInfo = SupabaseService.getStatus();
      let statusBadgeHtml = '';
      if (sbInfo.status === 'connected') {
        statusBadgeHtml = `<span class="badge badge-active">● Đã kết nối Supabase (Bảng dữ liệu sẵn sàng)</span>`;
      } else if (sbInfo.status === 'missing_tables') {
        statusBadgeHtml = `<span class="badge badge-draft">● Đã kết nối Project — Cần tạo bảng SQL trên Supabase</span>`;
      } else if (sbInfo.status === 'checking') {
        statusBadgeHtml = `<span class="badge badge-archived">● Đang kiểm tra kết nối...</span>`;
      } else {
        statusBadgeHtml = `<span class="badge badge-archived">● Chưa kết nối (${sbInfo.error || 'Offline'})</span>`;
      }

      supabaseCard.innerHTML = `
        <div class="card-header">
          <div>
            <h3 class="card-title">Kết nối Supabase Cloud (PostgreSQL + REST API)</h3>
            <p class="card-subtitle">Tự động đồng bộ tài khoản, phân quyền (ADMIN/USER), danh mục và video với Supabase</p>
          </div>
          <div>${statusBadgeHtml}</div>
        </div>
        <div class="card-body">
          <div class="db-stat-row">
            <span><strong>Project URL</strong></span>
            <code style="font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-primary);">${sbInfo.url}</code>
          </div>
          <div class="db-stat-row">
            <span><strong>Publishable Key</strong></span>
            <code style="font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-text-secondary);">${sbInfo.publishableKey}</code>
          </div>

          ${
            sbInfo.status === 'missing_tables'
              ? `
            <div class="alert alert-warning" style="margin-top: 1rem;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <div>
                <strong>Hướng dẫn khởi tạo bảng lần đầu trên Supabase:</strong><br/>
                Website đã kết nối thành công tới project <code>eaqxubxumykgthvpibiq.supabase.co</code> nhưng trên Supabase chưa có các bảng <code>users</code>, <code>categories</code>, <code>videos</code>, <code>video_view_stats</code>. Hãy nhấn nút <strong>"Copy SQL Tạo Bảng"</strong> bên dưới (hoặc mở file <code>docs/supabase-schema.sql</code>), dán vào <strong>Supabase Dashboard → SQL Editor → Run</strong>, sau đó nhấn <strong>"Push Local → Supabase"</strong>.
              </div>
            </div>
          `
              : ''
          }

          <div class="settings-actions">
            <button type="button" class="btn btn-secondary" id="btn-sb-test">
              Kiểm tra kết nối
            </button>
            <button type="button" class="btn btn-primary" id="btn-sb-push">
              Push Local → Supabase (Đồng bộ lên Cloud)
            </button>
            <button type="button" class="btn btn-secondary" id="btn-sb-pull">
              Pull Supabase → Local (Tải từ Cloud về)
            </button>
            <button type="button" class="btn btn-secondary" id="btn-sb-copy-sql">
              Copy SQL Tạo Bảng (supabase-schema.sql)
            </button>
          </div>
        </div>
      `;

      const testBtn = supabaseCard.querySelector('#btn-sb-test');
      const pushBtn = supabaseCard.querySelector('#btn-sb-push');
      const pullBtn = supabaseCard.querySelector('#btn-sb-pull');
      const copySqlBtn = supabaseCard.querySelector('#btn-sb-copy-sql');

      testBtn.addEventListener('click', async () => {
        testBtn.disabled = true;
        testBtn.textContent = 'Đang kiểm tra...';
        const res = await SupabaseService.checkConnection();
        renderSupabaseCard();
        if (res.status === 'connected') {
          Toast.success('Kết nối Supabase thành công! Tất cả các bảng đã sẵn sàng.');
        } else if (res.status === 'missing_tables') {
          Toast.info('Đã kết nối tới Supabase Project, vui lòng chạy SQL tạo bảng trong SQL Editor.');
        } else {
          Toast.error(res.error || 'Không thể kết nối tới Supabase.');
        }
      });

      pushBtn.addEventListener('click', async () => {
        pushBtn.disabled = true;
        pushBtn.textContent = 'Đang đồng bộ lên Supabase...';
        try {
          await DatabaseService.pushLocalToSupabase();
          Toast.success('Đã đồng bộ toàn bộ dữ liệu (Users, Roles, Categories, Videos, Stats) lên Supabase!');
          renderSupabaseCard();
        } catch (err) {
          Toast.error(err.message || 'Lỗi khi đẩy dữ liệu lên Supabase.');
          renderSupabaseCard();
        }
      });

      pullBtn.addEventListener('click', async () => {
        pullBtn.disabled = true;
        pullBtn.textContent = 'Đang tải từ Supabase...';
        try {
          await DatabaseService.pullSupabaseToLocal();
          Toast.success('Đã tải dữ liệu mới nhất từ Supabase về trình duyệt!');
          renderSupabaseCard();
          renderDbStats();
          renderCategoriesSection();
        } catch (err) {
          Toast.error(err.message || 'Lỗi khi tải dữ liệu từ Supabase.');
          renderSupabaseCard();
        }
      });

      copySqlBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA_SCRIPT);
          Toast.success('Đã copy nội dung SQL Schema vào Clipboard! Hãy dán vào Supabase SQL Editor và nhấn Run.');
        } catch {
          Toast.info('Vui lòng mở file docs/supabase-schema.sql trong thư mục dự án để copy.');
        }
      });
    };

    renderSupabaseCard();
    container.appendChild(supabaseCard);

    const grid = document.createElement('div');
    grid.className = 'settings-grid';

    // 1. Database Status & Export Card
    const dbCard = document.createElement('section');
    dbCard.className = 'card';

    const renderDbStats = () => {
      const sizes = DatabaseService.getDatabaseSizes();
      const userCount = UserRepository.countUsers();
      const kpi = StatsRepository.getKpiSummary();
      const categories = CategoryRepository.listAll();

      dbCard.innerHTML = `
        <div class="card-header">
          <div>
            <h3 class="card-title">SQLite Databases (IndexedDB Persistence)</h3>
            <p class="card-subtitle">Hai cơ sở dữ liệu độc lập chạy qua WebAssembly</p>
          </div>
        </div>
        <div class="card-body">
          <div class="db-stat-row">
            <span><strong>users.db</strong> (${userCount} tài khoản)</span>
            <span class="badge badge-category">${StorageService.formatBytes(sizes.usersDbBytes)}</span>
          </div>
          <div class="db-stat-row">
            <span><strong>videos.db</strong> (${kpi.totalVideos} video, ${categories.length} danh mục)</span>
            <span class="badge badge-category">${StorageService.formatBytes(sizes.videosDbBytes)}</span>
          </div>
          <div class="db-stat-row">
            <span>Tổng dung lượng lưu trong IndexedDB</span>
            <strong>${StorageService.formatBytes(sizes.totalBytes)}</strong>
          </div>

          <div class="settings-actions">
            <button type="button" class="btn btn-primary" id="btn-export-users">
              Export users.db
            </button>
            <button type="button" class="btn btn-primary" id="btn-export-videos">
              Export videos.db
            </button>
          </div>
        </div>
      `;

      dbCard.querySelector('#btn-export-users').addEventListener('click', () => {
        try {
          DatabaseService.exportDatabaseFile('users');
          Toast.success('Đã xuất file users.db thành công.');
        } catch (err) {
          Toast.error(err.message || 'Lỗi khi xuất users.db.');
        }
      });

      dbCard.querySelector('#btn-export-videos').addEventListener('click', () => {
        try {
          DatabaseService.exportDatabaseFile('videos');
          Toast.success('Đã xuất file videos.db thành công.');
        } catch (err) {
          Toast.error(err.message || 'Lỗi khi xuất videos.db.');
        }
      });
    };

    renderDbStats();
    grid.appendChild(dbCard);

    // 2. Import & Reset Card
    const importCard = document.createElement('section');
    importCard.className = 'card';
    importCard.innerHTML = `
      <div class="card-header">
        <div>
          <h3 class="card-title">Khôi phục (Import) & Reset Demo Data</h3>
          <p class="card-subtitle">Kiểm tra định dạng SQLite 3 và cấu trúc bảng trước khi ghi đè</p>
        </div>
      </div>
      <div class="card-body">
        <div class="form-group">
          <label class="form-label" for="import-users-input">Import file <code>users.db</code></label>
          <input type="file" id="import-users-input" class="form-control" accept=".db,.sqlite,.sqlite3" />
        </div>

        <div class="form-group">
          <label class="form-label" for="import-videos-input">Import file <code>videos.db</code></label>
          <input type="file" id="import-videos-input" class="form-control" accept=".db,.sqlite,.sqlite3" />
        </div>

        <div style="margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid var(--color-border);">
          <div class="form-label" style="margin-bottom: 0.375rem;">Khôi phục dữ liệu mẫu ban đầu</div>
          <p class="form-hint" style="margin-bottom: 0.875rem;">
            Xóa các thay đổi hiện tại và tạo lại 11 tài khoản (1 ADMIN + 10 USER), 5 danh mục, 15 video mẫu cùng lịch sử lượt xem.
          </p>
          <button type="button" class="btn btn-danger-outline" id="btn-reset-demo">
            Reset Demo Data
          </button>
        </div>
      </div>
    `;

    const importUsersInput = importCard.querySelector('#import-users-input');
    const importVideosInput = importCard.querySelector('#import-videos-input');
    const resetDemoBtn = importCard.querySelector('#btn-reset-demo');

    importUsersInput.addEventListener('change', async () => {
      const file = importUsersInput.files?.[0];
      if (!file) return;

      const confirmed = await Modal.confirm({
        title: 'Ghi đè users.db',
        message: `Bạn có chắc chắn muốn nạp file "${file.name}" và ghi đè toàn bộ cơ sở dữ liệu users.db hiện tại?`,
        confirmText: 'Ghi đè users.db',
        cancelText: 'Hủy',
        danger: true
      });

      if (!confirmed) {
        importUsersInput.value = '';
        return;
      }

      try {
        await DatabaseService.importDatabaseFile('users', file);
        Toast.success('Đã import users.db thành công!');
        renderDbStats();
      } catch (err) {
        Toast.error(err.message || 'File users.db không hợp lệ.');
      } finally {
        importUsersInput.value = '';
      }
    });

    importVideosInput.addEventListener('change', async () => {
      const file = importVideosInput.files?.[0];
      if (!file) return;

      const confirmed = await Modal.confirm({
        title: 'Ghi đè videos.db',
        message: `Bạn có chắc chắn muốn nạp file "${file.name}" và ghi đè toàn bộ cơ sở dữ liệu videos.db hiện tại?`,
        confirmText: 'Ghi đè videos.db',
        cancelText: 'Hủy',
        danger: true
      });

      if (!confirmed) {
        importVideosInput.value = '';
        return;
      }

      try {
        await DatabaseService.importDatabaseFile('videos', file);
        Toast.success('Đã import videos.db thành công!');
        renderDbStats();
        renderCategoriesSection();
      } catch (err) {
        Toast.error(err.message || 'File videos.db không hợp lệ.');
      } finally {
        importVideosInput.value = '';
      }
    });

    resetDemoBtn.addEventListener('click', async () => {
      const step1 = await Modal.confirm({
        title: 'Xác nhận Reset Demo Data (Bước 1/2)',
        message: 'Thao tác này sẽ xóa toàn bộ dữ liệu hiện tại trong cả users.db và videos.db để khôi phục dữ liệu mẫu ban đầu. Bạn có muốn tiếp tục?',
        confirmText: 'Tiếp tục',
        cancelText: 'Hủy',
        danger: true
      });
      if (!step1) return;

      const step2 = await Modal.confirm({
        title: 'Xác nhận cuối cùng (Bước 2/2)',
        message: 'Xác nhận lần cuối: Toàn bộ dữ liệu sẽ được đặt lại về trạng thái Demo mặc định ngay bây giờ.',
        confirmText: 'Đồng ý Reset ngay',
        cancelText: 'Hủy bỏ',
        danger: true
      });
      if (!step2) return;

      try {
        await DatabaseService.resetDemoData();
        if (SupabaseService.isReady()) {
          await DatabaseService.pushLocalToSupabase();
        }
        Toast.success('Đã khôi phục toàn bộ dữ liệu Demo thành công!');
        renderDbStats();
        renderCategoriesSection();
      } catch (err) {
        Toast.error(err.message || 'Lỗi khi reset dữ liệu demo.');
      }
    });

    grid.appendChild(importCard);
    container.appendChild(grid);

    // 3. Categories Management Section (stored in videos.db)
    const catSection = document.createElement('section');
    catSection.className = 'card';
    catSection.style.marginTop = '1.5rem';

    const renderCategoriesSection = () => {
      const categories = CategoryRepository.listAll();
      catSection.innerHTML = `
        <div class="card-header">
          <div>
            <h3 class="card-title">Quản lý Danh mục Video (Bảng categories trong videos.db)</h3>
            <p class="card-subtitle">Xóa danh mục sẽ tự động đặt category_id của video liên quan về NULL (ON DELETE SET NULL)</p>
          </div>
        </div>
        <div class="card-body">
          <form id="add-cat-form" style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1.25rem;">
            <input type="text" id="new-cat-name" class="form-control" placeholder="Tên danh mục mới..." style="max-width: 260px;" required />
            <input type="text" id="new-cat-desc" class="form-control" placeholder="Mô tả ngắn..." style="flex: 1; min-width: 200px;" />
            <button type="submit" class="btn btn-primary">+ Thêm danh mục</button>
          </form>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên danh mục</th>
                  <th>Mô tả</th>
                  <th class="text-right">Số video</th>
                  <th class="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody id="cat-table-body"></tbody>
            </table>
          </div>
        </div>
      `;

      const tbody = catSection.querySelector('#cat-table-body');
      categories.forEach((cat) => {
        const tr = document.createElement('tr');

        const tdId = document.createElement('td');
        tdId.textContent = `#${cat.id}`;

        const tdName = document.createElement('td');
        tdName.style.fontWeight = '600';
        tdName.textContent = cat.name;

        const tdDesc = document.createElement('td');
        tdDesc.style.color = 'var(--color-text-secondary)';
        tdDesc.textContent = cat.description || '—';

        const tdCount = document.createElement('td');
        tdCount.className = 'text-right';
        tdCount.textContent = String(cat.video_count || 0);

        const tdAction = document.createElement('td');
        tdAction.className = 'text-right';

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'btn btn-danger-outline btn-sm';
        delBtn.textContent = 'Xóa';
        delBtn.addEventListener('click', async () => {
          const ok = await Modal.confirm({
            title: 'Xóa danh mục',
            message: `Bạn có chắc muốn xóa danh mục "${cat.name}"? Các video thuộc danh mục này sẽ chuyển sang trạng thái Uncategorized.`,
            confirmText: 'Xóa danh mục',
            cancelText: 'Hủy',
            danger: true
          });
          if (!ok) return;

          try {
            await CategoryRepository.delete(cat.id);
            Toast.success(`Đã xóa danh mục "${cat.name}".`);
            renderCategoriesSection();
            renderDbStats();
          } catch (err) {
            Toast.error(err.message || 'Không thể xóa danh mục.');
          }
        });

        tdAction.appendChild(delBtn);

        tr.appendChild(tdId);
        tr.appendChild(tdName);
        tr.appendChild(tdDesc);
        tr.appendChild(tdCount);
        tr.appendChild(tdAction);
        tbody.appendChild(tr);
      });

      const addCatForm = catSection.querySelector('#add-cat-form');
      const nameInput = catSection.querySelector('#new-cat-name');
      const descInput = catSection.querySelector('#new-cat-desc');

      addCatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          await CategoryRepository.create({
            name: nameInput.value,
            description: descInput.value
          });
          Toast.success('Đã thêm danh mục mới.');
          renderCategoriesSection();
          renderDbStats();
        } catch (err) {
          Toast.error(err.message || 'Lỗi khi thêm danh mục.');
        }
      });
    };

    renderCategoriesSection();
    container.appendChild(catSection);

    return container;
  }
};

  // --- assets/js/router.js ---














const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password'];

let activePageModule = null;

function parseHash() {
  const raw = window.location.hash || '#/dashboard';
  const path = raw.replace(/^#/, '') || '/dashboard';
  return path.startsWith('/') ? path : `/${path}`;
}

function cleanupCurrentPage() {
  Modal.close();
  if (activePageModule && typeof activePageModule.cleanup === 'function') {
    activePageModule.cleanup();
  }
  activePageModule = null;
}
const Router = {
  init(rootElement) {
    this.root = rootElement;
    window.addEventListener('hashchange', () => this.resolve());
    this.resolve();
  },

  resolve() {
    cleanupCurrentPage();

    const path = parseHash();
    const session = AuthService.getSession();
    const isAuthenticated = Boolean(session);
    const isPublic = PUBLIC_ROUTES.includes(path);

    if (!isAuthenticated && !isPublic) {
      window.location.hash = '#/login';
      return;
    }

    if (isAuthenticated && isPublic) {
      window.location.hash = '#/dashboard';
      return;
    }

    // Keep current user's role synchronized with users.db
    if (session && session.userId) {
      const dbUser = UserRepository.findById(session.userId);
      if (dbUser && dbUser.role && dbUser.role !== session.role) {
        AuthService.setSession(dbUser, false);
      }
    }

    this.root.innerHTML = '';

    // Auth routes (no sidebar/topbar)
    if (path === '/login') {
      activePageModule = LoginPage;
      this.root.appendChild(LoginPage.render());
      return;
    }
    if (path === '/register') {
      activePageModule = RegisterPage;
      this.root.appendChild(RegisterPage.render());
      return;
    }
    if (path === '/forgot-password') {
      activePageModule = ForgotPasswordPage;
      this.root.appendChild(ForgotPasswordPage.render());
      return;
    }

    // Protected routes (with Sidebar + Topbar shell)
    let pageTitle = 'Dashboard';
    let pageNode = null;

    const editMatch = path.match(/^\/videos\/(\d+)\/edit$/);

    if (path === '/dashboard') {
      pageTitle = 'Dashboard';
      activePageModule = DashboardPage;
      pageNode = DashboardPage.render();
    } else if (path === '/videos') {
      pageTitle = 'Videos';
      activePageModule = VideosPage;
      pageNode = VideosPage.render();
    } else if (path === '/videos/new') {
      pageTitle = 'Add Video';
      activePageModule = VideoFormPage;
      pageNode = VideoFormPage.render({ videoId: null });
    } else if (editMatch) {
      const videoId = Number(editMatch[1]);
      pageTitle = `Edit Video #${videoId}`;
      activePageModule = VideoFormPage;
      pageNode = VideoFormPage.render({ videoId });
    } else if (path === '/permissions') {
      if (!AuthService.isAdmin()) {
        Toast.error('Chỉ tài khoản có quyền ADMIN mới được phép vào trang Phân Quyền.');
        window.location.hash = '#/dashboard';
        return;
      }
      pageTitle = 'Phân Quyền';
      activePageModule = PermissionsPage;
      pageNode = PermissionsPage.render();
    } else if (path === '/settings') {
      pageTitle = 'Settings & Backup';
      activePageModule = SettingsPage;
      pageNode = SettingsPage.render();
    } else {
      window.location.hash = '#/dashboard';
      return;
    }

    const shell = document.createElement('div');
    shell.className = 'app-shell';

    const sidebarEl = Sidebar.render(path);
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';

    const toggleSidebar = () => {
      sidebarEl.classList.toggle('open');
      overlay.classList.toggle('open');
    };

    overlay.addEventListener('click', () => {
      sidebarEl.classList.remove('open');
      overlay.classList.remove('open');
    });

    const mainWrapper = document.createElement('div');
    mainWrapper.className = 'main-wrapper';

    const topbarEl = Topbar.render({
      pageTitle,
      onToggleSidebar: toggleSidebar
    });

    const pageContainer = document.createElement('main');
    pageContainer.className = 'page-container';
    pageContainer.appendChild(pageNode);

    mainWrapper.appendChild(topbarEl);
    mainWrapper.appendChild(pageContainer);

    shell.appendChild(sidebarEl);
    shell.appendChild(overlay);
    shell.appendChild(mainWrapper);

    this.root.appendChild(shell);
    window.scrollTo(0, 0);
  }
};

  // --- assets/js/app.js ---


window.__VIDEO_ADMIN_BOOTSTRAPPED__ = true;

async function bootstrap() {
  const appRoot = document.getElementById('app');
  if (!appRoot) return;

  appRoot.innerHTML = `
    <div class="auth-layout">
      <div class="card card-body" style="max-width: 420px; text-align: center;">
        <div class="sidebar-brand-icon" style="margin: 0 auto 1rem;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        </div>
        <h2 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">Đang khởi tạo SQLite (WebAssembly)...</h2>
        <p style="font-size: 0.875rem; color: var(--color-text-secondary);">
          Đang nạp <code>users.db</code> và <code>videos.db</code> từ IndexedDB.
        </p>
      </div>
    </div>
  `;

  try {
    await DatabaseService.init();
    Router.init(appRoot);
  } catch (err) {
    appRoot.innerHTML = '';
    const errWrap = document.createElement('div');
    errWrap.className = 'auth-layout';

    const card = document.createElement('div');
    card.className = 'card card-body';
    card.style.maxWidth = '480px';

    const title = document.createElement('h2');
    title.style.color = 'var(--color-danger)';
    title.style.marginBottom = '0.5rem';
    title.textContent = 'Không thể khởi tạo cơ sở dữ liệu SQLite';

    const msg = document.createElement('p');
    msg.style.fontSize = 'var(--text-sm)';
    msg.style.color = 'var(--color-text-secondary)';
    msg.style.marginBottom = '1rem';
    msg.textContent = err.message || 'Lỗi không xác định khi tải sql.js hoặc IndexedDB.';

    const retryBtn = document.createElement('button');
    retryBtn.type = 'button';
    retryBtn.className = 'btn btn-primary';
    retryBtn.textContent = 'Thử tải lại trang';
    retryBtn.addEventListener('click', () => window.location.reload());

    card.appendChild(title);
    card.appendChild(msg);
    card.appendChild(retryBtn);
    errWrap.appendChild(card);
    appRoot.appendChild(errWrap);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

})();
