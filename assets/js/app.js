import { DatabaseService } from './db/database-service.js';
import { Router } from './router.js';

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
