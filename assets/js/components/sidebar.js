import { AuthService } from '../services/auth-service.js';
import { Toast } from './toast.js';

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

export const Sidebar = {
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
