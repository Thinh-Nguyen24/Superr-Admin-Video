import { UserRepository } from '../repositories/user-repository.js';
import { AuthService } from '../services/auth-service.js';
import { ValidationService } from '../services/validation-service.js';
import { Toast } from '../components/toast.js';

export const LoginPage = {
  render() {
    const layout = document.createElement('div');
    layout.className = 'auth-layout';

    const card = document.createElement('div');
    card.className = 'auth-card';

    card.innerHTML = `
      <div class="auth-brand">
        <span class="sidebar-brand-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        </span>
        <span>Video Admin</span>
      </div>
      <div class="auth-header">
        <h1 class="auth-title">Đăng nhập quản trị</h1>
        <p class="auth-subtitle">Xác thực tài khoản cục bộ lưu trong SQLite (users.db)</p>
      </div>
      <div class="alert alert-info">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <div>
          <strong>Tài khoản mặc định:</strong><br/>
          • <strong>ADMIN (Gmail):</strong> <code>huuthinhit2203@gmail.com</code> / <code>Admin@123</code><br/>
          • <strong>ADMIN (Demo):</strong> <code>admin@example.com</code> / <code>Admin@123</code><br/>
          • <strong>USER (1–10):</strong> <code>user1@demo.com</code> → <code>user10@demo.com</code> / <code>User@123</code>
        </div>
      </div>
    `;

    const form = document.createElement('form');
    form.noValidate = true;

    const formAlert = document.createElement('div');
    formAlert.className = 'alert alert-danger';
    formAlert.style.display = 'none';
    form.appendChild(formAlert);

    const lastResetEmail = sessionStorage.getItem('video_admin_last_reset_email') || '';
    const initialEmail = lastResetEmail || 'admin@example.com';
    const initialPass = lastResetEmail ? '' : '';

    // Email field
    const emailGroup = document.createElement('div');
    emailGroup.className = 'form-group';
    emailGroup.innerHTML = `
      <label class="form-label" for="login-email">Email <span class="form-required">*</span></label>
      <input type="email" id="login-email" class="form-control" placeholder="admin@example.com hoặc huuthinhit2203@gmail.com" value="${initialEmail}" autocomplete="username" required />
      <div class="form-error" id="err-login-email"></div>
    `;

    // Password field with show/hide
    const passGroup = document.createElement('div');
    passGroup.className = 'form-group';
    passGroup.innerHTML = `
      <label class="form-label" for="login-password">Mật khẩu <span class="form-required">*</span></label>
      <div class="input-with-action">
        <input type="password" id="login-password" class="form-control" placeholder="Nhập mật khẩu của bạn..." value="${initialPass}" autocomplete="current-password" required />
        <button type="button" class="input-action-btn" id="toggle-login-pass" aria-label="Hiện hoặc ẩn mật khẩu">Hiện</button>
      </div>
      <div class="form-error" id="err-login-password"></div>
    `;

    // Remember me + Forgot password link
    const row = document.createElement('div');
    row.className = 'auth-row';
    row.innerHTML = `
      <label class="checkbox-label" title="Lưu trạng thái phiên cục bộ trên trình duyệt này">
        <input type="checkbox" id="login-remember" />
        <span>Ghi nhớ phiên cục bộ</span>
      </label>
      <a href="#/forgot-password" class="auth-link">Quên mật khẩu?</a>
    `;

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn btn-primary btn-full';
    submitBtn.textContent = 'Đăng nhập';

    form.appendChild(emailGroup);
    form.appendChild(passGroup);
    form.appendChild(row);
    form.appendChild(submitBtn);

    const footer = document.createElement('div');
    footer.className = 'auth-footer';
    footer.innerHTML = `Chưa có tài khoản cục bộ? <a href="#/register" class="auth-link">Đăng ký ngay</a>`;

    card.appendChild(form);
    card.appendChild(footer);
    layout.appendChild(card);

    // Event bindings
    const emailInput = emailGroup.querySelector('#login-email');
    const passInput = passGroup.querySelector('#login-password');
    const togglePassBtn = passGroup.querySelector('#toggle-login-pass');
    const rememberCheck = row.querySelector('#login-remember');
    const errEmail = emailGroup.querySelector('#err-login-email');
    const errPass = passGroup.querySelector('#err-login-password');

    togglePassBtn.addEventListener('click', () => {
      const isPass = passInput.type === 'password';
      passInput.type = isPass ? 'text' : 'password';
      togglePassBtn.textContent = isPass ? 'Ẩn' : 'Hiện';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errEmail.textContent = '';
      errPass.textContent = '';
      emailInput.classList.remove('is-invalid');
      passInput.classList.remove('is-invalid');
      formAlert.style.display = 'none';

      const email = emailInput.value;
      const password = passInput.value;

      const validation = ValidationService.validateLogin({ email, password });
      if (!validation.isValid) {
        if (validation.errors.email) {
          errEmail.textContent = validation.errors.email;
          emailInput.classList.add('is-invalid');
        }
        if (validation.errors.password) {
          errPass.textContent = validation.errors.password;
          passInput.classList.add('is-invalid');
        }
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Đang xác thực...';

      try {
        const user = await UserRepository.findByEmailFresh(email);
        if (!user) {
          formAlert.textContent = 'Email hoặc mật khẩu không chính xác.';
          formAlert.style.display = 'flex';
          return;
        }

        if (user.status !== 'active') {
          formAlert.textContent = 'Tài khoản này đang bị vô hiệu hóa.';
          formAlert.style.display = 'flex';
          return;
        }

        const isValidPassword = await AuthService.verifyPassword(
          password,
          user.password_salt,
          user.password_hash
        );

        if (!isValidPassword) {
          formAlert.textContent = 'Email hoặc mật khẩu không chính xác.';
          formAlert.style.display = 'flex';
          return;
        }

        sessionStorage.removeItem('video_admin_last_reset_email');
        AuthService.setSession(user, rememberCheck.checked);
        Toast.success(`Chào mừng trở lại, ${user.full_name}!`);
        window.location.hash = '#/dashboard';
      } catch (err) {
        formAlert.textContent = err.message || 'Đã xảy ra lỗi khi đăng nhập.';
        formAlert.style.display = 'flex';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Đăng nhập';
      }
    });

    return layout;
  }
};
