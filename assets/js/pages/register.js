import { UserRepository } from '../repositories/user-repository.js';
import { AuthService } from '../services/auth-service.js';
import { ValidationService } from '../services/validation-service.js';
import { Toast } from '../components/toast.js';

export const RegisterPage = {
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
        <h1 class="auth-title">Tạo tài khoản cục bộ</h1>
        <p class="auth-subtitle">Mật khẩu được băm bằng Web Crypto API (PBKDF2 + Salt) và lưu vào users.db</p>
      </div>
    `;

    const form = document.createElement('form');
    form.noValidate = true;

    const formAlert = document.createElement('div');
    formAlert.className = 'alert alert-danger';
    formAlert.style.display = 'none';
    form.appendChild(formAlert);

    const fieldsHtml = document.createElement('div');
    fieldsHtml.innerHTML = `
      <div class="form-group">
        <label class="form-label" for="reg-name">Họ và tên <span class="form-required">*</span></label>
        <input type="text" id="reg-name" class="form-control" placeholder="Nguyễn Văn A" autocomplete="name" required />
        <div class="form-error" id="err-reg-name"></div>
      </div>
      <div class="form-group">
        <label class="form-label" for="reg-email">Email <span class="form-required">*</span></label>
        <input type="email" id="reg-email" class="form-control" placeholder="name@example.com" autocomplete="email" required />
        <div class="form-error" id="err-reg-email"></div>
      </div>
      <div class="form-group">
        <label class="form-label" for="reg-password">Mật khẩu (tối thiểu 8 ký tự) <span class="form-required">*</span></label>
        <input type="password" id="reg-password" class="form-control" placeholder="••••••••" autocomplete="new-password" required />
        <div class="form-error" id="err-reg-password"></div>
      </div>
      <div class="form-group">
        <label class="form-label" for="reg-confirm">Xác nhận mật khẩu <span class="form-required">*</span></label>
        <input type="password" id="reg-confirm" class="form-control" placeholder="••••••••" autocomplete="new-password" required />
        <div class="form-error" id="err-reg-confirm"></div>
      </div>
    `;
    form.appendChild(fieldsHtml);

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn btn-primary btn-full';
    submitBtn.textContent = 'Đăng ký tài khoản';
    form.appendChild(submitBtn);

    const footer = document.createElement('div');
    footer.className = 'auth-footer';
    footer.innerHTML = `Đã có tài khoản? <a href="#/login" class="auth-link">Quay lại Đăng nhập</a>`;

    card.appendChild(form);
    card.appendChild(footer);
    layout.appendChild(card);

    const nameInput = fieldsHtml.querySelector('#reg-name');
    const emailInput = fieldsHtml.querySelector('#reg-email');
    const passInput = fieldsHtml.querySelector('#reg-password');
    const confirmInput = fieldsHtml.querySelector('#reg-confirm');

    const errName = fieldsHtml.querySelector('#err-reg-name');
    const errEmail = fieldsHtml.querySelector('#err-reg-email');
    const errPass = fieldsHtml.querySelector('#err-reg-password');
    const errConfirm = fieldsHtml.querySelector('#err-reg-confirm');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      [errName, errEmail, errPass, errConfirm].forEach((el) => (el.textContent = ''));
      [nameInput, emailInput, passInput, confirmInput].forEach((el) =>
        el.classList.remove('is-invalid')
      );
      formAlert.style.display = 'none';

      const payload = {
        fullName: nameInput.value,
        email: emailInput.value,
        password: passInput.value,
        confirmPassword: confirmInput.value
      };

      const validation = ValidationService.validateRegister(payload);
      if (!validation.isValid) {
        if (validation.errors.fullName) {
          errName.textContent = validation.errors.fullName;
          nameInput.classList.add('is-invalid');
        }
        if (validation.errors.email) {
          errEmail.textContent = validation.errors.email;
          emailInput.classList.add('is-invalid');
        }
        if (validation.errors.password) {
          errPass.textContent = validation.errors.password;
          passInput.classList.add('is-invalid');
        }
        if (validation.errors.confirmPassword) {
          errConfirm.textContent = validation.errors.confirmPassword;
          confirmInput.classList.add('is-invalid');
        }
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Đang tạo tài khoản...';

      try {
        const existing = UserRepository.findByEmail(payload.email);
        if (existing) {
          errEmail.textContent = 'Email này đã tồn tại trong cơ sở dữ liệu.';
          emailInput.classList.add('is-invalid');
          return;
        }

        const salt = AuthService.generateSalt(16);
        const passwordHash = await AuthService.hashPassword(payload.password, salt);

        const newUser = await UserRepository.createUser({
          fullName: payload.fullName,
          email: payload.email,
          passwordHash,
          passwordSalt: salt
        });

        AuthService.setSession(newUser, false);
        Toast.success('Đăng ký tài khoản thành công!');
        window.location.hash = '#/dashboard';
      } catch (err) {
        formAlert.textContent = err.message || 'Không thể tạo tài khoản.';
        formAlert.style.display = 'flex';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Đăng ký tài khoản';
      }
    });

    return layout;
  }
};
