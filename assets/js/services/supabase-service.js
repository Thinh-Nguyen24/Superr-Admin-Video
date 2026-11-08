import { DATABASE_CONFIG } from '../config/database-config.js';

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

export const SUPABASE_SQL_SCHEMA_SCRIPT = `-- Chạy script này trong Supabase Dashboard -> SQL Editor -> New Query
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

export const SupabaseService = {
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
