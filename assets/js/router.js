import { AuthService } from './services/auth-service.js';
import { UserRepository } from './repositories/user-repository.js';
import { Sidebar } from './components/sidebar.js';
import { Topbar } from './components/topbar.js';
import { Modal } from './components/modal.js';
import { Toast } from './components/toast.js';
import { LoginPage } from './pages/login.js';
import { RegisterPage } from './pages/register.js';
import { ForgotPasswordPage } from './pages/forgot-password.js';
import { DashboardPage } from './pages/dashboard.js';
import { VideosPage } from './pages/videos.js';
import { VideoFormPage } from './pages/video-form.js';
import { PermissionsPage } from './pages/permissions.js';
import { SettingsPage } from './pages/settings.js';

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

export const Router = {
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
