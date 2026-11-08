import { DATABASE_CONFIG } from '../config/database-config.js';

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

export const StorageService = {
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
