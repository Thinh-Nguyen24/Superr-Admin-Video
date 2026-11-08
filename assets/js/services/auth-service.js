import { DATABASE_CONFIG } from '../config/database-config.js';

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const AuthService = {
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
