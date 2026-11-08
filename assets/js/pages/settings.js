import { DatabaseService } from '../db/database-service.js';
import { UserRepository } from '../repositories/user-repository.js';
import { CategoryRepository } from '../repositories/category-repository.js';
import { StatsRepository } from '../repositories/stats-repository.js';
import { StorageService } from '../services/storage-service.js';
import { SupabaseService, SUPABASE_SQL_SCHEMA_SCRIPT } from '../services/supabase-service.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';

export const SettingsPage = {
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
