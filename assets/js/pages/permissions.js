import { UserRepository } from '../repositories/user-repository.js';
import { AuthService } from '../services/auth-service.js';
import { StorageService } from '../services/storage-service.js';
import { Toast } from '../components/toast.js';

function getInitials(name) {
  const parts = String(name || 'U').trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return String(name || 'US').slice(0, 2).toUpperCase();
}

export const PermissionsPage = {
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
