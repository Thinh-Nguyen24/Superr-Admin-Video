import { DatabaseService } from '../db/database-service.js';
import { SupabaseService } from '../services/supabase-service.js';

export const UserRepository = {
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
