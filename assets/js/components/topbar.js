import { AuthService } from '../services/auth-service.js';
import { SupabaseService } from '../services/supabase-service.js';

export const Topbar = {
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
