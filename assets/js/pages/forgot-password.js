import { DATABASE_CONFIG } from '../config/database-config.js';
import { UserRepository } from '../repositories/user-repository.js';
import { AuthService } from '../services/auth-service.js';
import { Toast } from '../components/toast.js';

export const ForgotPasswordPage = {
  render() {
    const layout = document.createElement('div');
    layout.className = 'auth-layout';

    const card = document.createElement('div');
    card.className = 'auth-card';
    card.style.maxWidth = '480px';

    let currentStep = 1; // 1: Request OTP | 2: Verify OTP | 3: Reset Password
    let targetEmail = 'huuthinhit2203@gmail.com';
    let verifiedOtpCode = '';
    let lastOtpResponse = null;

    const renderStepContent = () => {
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
          <h1 class="auth-title">Quên mật khẩu — Xác thực Gmail</h1>
          <p class="auth-subtitle">Phương thức xác thực OTP qua <strong>${DATABASE_CONFIG.VERIFY_GMAIL_ADDRESS}</strong></p>
        </div>

        <!-- Step Indicator -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 1.5rem; text-align: center; font-size: var(--text-xs);">
          <div style="padding: 0.5rem; border-radius: var(--radius-md); font-weight: 600; background: ${currentStep === 1 ? 'var(--color-primary-light)' : 'var(--color-bg-subtle)'}; color: ${currentStep === 1 ? 'var(--color-primary)' : 'var(--color-text-secondary)'}; border: 1px solid ${currentStep === 1 ? 'var(--color-primary-border)' : 'var(--color-border)'};">
            1. Gửi mã OTP
          </div>
          <div style="padding: 0.5rem; border-radius: var(--radius-md); font-weight: 600; background: ${currentStep === 2 ? 'var(--color-primary-light)' : 'var(--color-bg-subtle)'}; color: ${currentStep === 2 ? 'var(--color-primary)' : 'var(--color-text-secondary)'}; border: 1px solid ${currentStep === 2 ? 'var(--color-primary-border)' : 'var(--color-border)'};">
            2. Xác thực Gmail
          </div>
          <div style="padding: 0.5rem; border-radius: var(--radius-md); font-weight: 600; background: ${currentStep === 3 ? 'var(--color-primary-light)' : 'var(--color-bg-subtle)'}; color: ${currentStep === 3 ? 'var(--color-primary)' : 'var(--color-text-secondary)'}; border: 1px solid ${currentStep === 3 ? 'var(--color-primary-border)' : 'var(--color-border)'};">
            3. Mật khẩu mới
          </div>
        </div>

        <div id="fp-step-body"></div>

        <div class="auth-footer">
          <a href="#/login" class="auth-link">← Quay lại trang Đăng nhập</a>
        </div>
      `;

      const stepBody = card.querySelector('#fp-step-body');

      // ======================================================================
      // BƯỚC 1: NHẬP EMAIL & GỬI MÃ OTP QUA GMAIL huuthinhit2203@gmail.com
      // ======================================================================
      if (currentStep === 1) {
        const savedAppPass = localStorage.getItem(DATABASE_CONFIG.GMAIL_APP_PASS_STORAGE_KEY) || '';

        stepBody.innerHTML = `
          <div class="alert alert-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <div>
              Mã xác thực OTP (6 chữ số, hiệu lực 10 phút) sẽ được lưu lên bảng <code>password_reset_otps</code> trên Supabase và gửi tới Gmail xác thực <strong>${DATABASE_CONFIG.VERIFY_GMAIL_ADDRESS}</strong>.
            </div>
          </div>

          <div class="alert alert-danger" id="fp-err-box" style="display: none;"></div>

          <form id="fp-step1-form" novalidate>
            <div class="form-group">
              <label class="form-label" for="fp-account-email">Email tài khoản cần đặt lại mật khẩu <span class="form-required">*</span></label>
              <input type="email" id="fp-account-email" class="form-control" value="${targetEmail}" placeholder="huuthinhit2203@gmail.com" required />
              <div class="form-hint">Có thể nhập <code>huuthinhit2203@gmail.com</code>, <code>admin@example.com</code> hoặc <code>user1@demo.com</code>...</div>
            </div>

            <div class="form-group">
              <label class="form-label">Phương thức nhận mã OTP</label>
              <input type="text" class="form-control" value="Gmail: ${DATABASE_CONFIG.VERIFY_GMAIL_ADDRESS}" disabled style="background: var(--color-bg-subtle); font-weight: 600;" />
            </div>

            <details style="margin-bottom: 1.25rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0.75rem; background: var(--color-bg-subtle);">
              <summary style="font-size: var(--text-xs); font-weight: 600; cursor: pointer; color: var(--color-primary);">
                ⚙️ Cấu hình Gmail App Password (Để gửi email thật vào hộp thư ${DATABASE_CONFIG.VERIFY_GMAIL_ADDRESS})
              </summary>
              <div style="margin-top: 0.75rem;">
                <label class="form-label" for="fp-gmail-app-pass" style="font-size: var(--text-xs);">Google App Password (16 ký tự) của ${DATABASE_CONFIG.VERIFY_GMAIL_ADDRESS}</label>
                <input type="password" id="fp-gmail-app-pass" class="form-control" placeholder="xxxx xxxx xxxx xxxx (Không phải mật khẩu Gmail thường)" value="${savedAppPass}" />
                <div class="form-hint" style="margin-top: 0.375rem;">
                  • Nếu điền App Password: Supabase Edge Function (<code>send-gmail-otp</code>) sẽ gửi email thật qua <code>smtp.gmail.com</code> tới <strong>${DATABASE_CONFIG.VERIFY_GMAIL_ADDRESS}</strong>.<br/>
                  • Nếu để trống: Bạn vẫn nhận được mã OTP trực tiếp trên màn hình (Sandbox Preview) để test ngay lập tức.
                </div>
              </div>
            </details>

            <button type="submit" class="btn btn-primary btn-full" id="fp-send-otp-btn">
              Gửi mã xác thực OTP qua Gmail
            </button>
          </form>
        `;

        const form1 = stepBody.querySelector('#fp-step1-form');
        const emailInput = stepBody.querySelector('#fp-account-email');
        const appPassInput = stepBody.querySelector('#fp-gmail-app-pass');
        const errBox = stepBody.querySelector('#fp-err-box');
        const sendBtn = stepBody.querySelector('#fp-send-otp-btn');

        form1.addEventListener('submit', async (e) => {
          e.preventDefault();
          errBox.style.display = 'none';

          const enteredEmail = emailInput.value.trim();
          const appPass = appPassInput.value.trim();

          if (!enteredEmail) {
            errBox.textContent = 'Vui lòng nhập địa chỉ email tài khoản cần khôi phục.';
            errBox.style.display = 'flex';
            return;
          }

          if (appPass) {
            localStorage.setItem(DATABASE_CONFIG.GMAIL_APP_PASS_STORAGE_KEY, appPass);
          } else {
            localStorage.removeItem(DATABASE_CONFIG.GMAIL_APP_PASS_STORAGE_KEY);
          }

          sendBtn.disabled = true;
          sendBtn.textContent = 'Đang tạo mã OTP & kết nối Gmail...';

          try {
            const res = await UserRepository.requestGmailResetOtp(enteredEmail, appPass);
            targetEmail = res.user.email;
            lastOtpResponse = res;
            currentStep = 2;

            if (res.sentViaSmtp) {
              Toast.success(`Đã gửi email chứa mã OTP tới hộp thư ${res.verifyGmail}!`);
            } else {
              Toast.info('Đã tạo mã OTP trên Supabase! Xem mã xác thực ở bước tiếp theo.');
            }
            renderStepContent();
          } catch (err) {
            errBox.textContent = err.message || 'Không thể tạo mã xác thực OTP.';
            errBox.style.display = 'flex';
            sendBtn.disabled = false;
            sendBtn.textContent = 'Gửi mã xác thực OTP qua Gmail';
          }
        });
      }

      // ======================================================================
      // BƯỚC 2: NHẬP MÃ OTP 6 CHỮ SỐ
      // ======================================================================
      else if (currentStep === 2) {
        const sentRealMail = Boolean(lastOtpResponse?.sentViaSmtp);
        const smtpErr = lastOtpResponse?.smtpError || '';

        stepBody.innerHTML = `
          ${
            sentRealMail
              ? `
            <div class="alert alert-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <div>
                <strong>Đã gửi Email thật thành công!</strong><br/>
                Vui lòng mở hộp thư Gmail <strong>${DATABASE_CONFIG.VERIFY_GMAIL_ADDRESS}</strong> (kiểm tra cả mục Hộp thư đến / Spam) để lấy mã OTP 6 chữ số.
              </div>
            </div>
          `
              : `
            <div class="alert alert-warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <div style="width: 100%;">
                <strong>Hộp thư Gmail mô phỏng (${DATABASE_CONFIG.VERIFY_GMAIL_ADDRESS}):</strong><br/>
                ${smtpErr ? `<span style="color: var(--color-danger);">Lưu ý SMTP: ${smtpErr}</span><br/>` : 'Chưa cấu hình Google App Password 16 ký tự nên hệ thống hiển thị trực tiếp mã OTP từ bảng <code>password_reset_otps</code> của Supabase tại đây:'}
                <div style="margin-top: 0.5rem; padding: 0.625rem; background: #FFF; border: 1px dashed var(--color-warning); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between;">
                  <span style="font-family: var(--font-mono); font-size: 1.25rem; font-weight: 700; letter-spacing: 4px; color: var(--color-primary);">${lastOtpResponse?.otpCode || ''}</span>
                  <button type="button" class="btn btn-secondary btn-sm" id="fp-autofill-otp">Điền nhanh OTP</button>
                </div>
              </div>
            </div>
          `
          }

          <div class="alert alert-danger" id="fp-step2-err" style="display: none;"></div>

          <form id="fp-step2-form" novalidate>
            <div class="form-group">
              <label class="form-label">Tài khoản đang khôi phục</label>
              <input type="text" class="form-control" value="${targetEmail}" disabled style="background: var(--color-bg-subtle);" />
            </div>

            <div class="form-group">
              <label class="form-label" for="fp-otp-input">Mã xác thực OTP (6 chữ số) <span class="form-required">*</span></label>
              <input type="text" id="fp-otp-input" class="form-control" placeholder="Nhập 6 chữ số (vd: 123456)" maxlength="6" style="font-family: var(--font-mono); font-size: 1.25rem; letter-spacing: 6px; text-align: center; font-weight: 700;" required />
            </div>

            <div style="display: flex; gap: 0.75rem;">
              <button type="button" class="btn btn-secondary" id="fp-back-step1">← Quay lại</button>
              <button type="submit" class="btn btn-primary btn-full" id="fp-verify-btn">Xác nhận mã OTP</button>
            </div>
          </form>
        `;

        const otpInput = stepBody.querySelector('#fp-otp-input');
        const autofillBtn = stepBody.querySelector('#fp-autofill-otp');
        const backBtn = stepBody.querySelector('#fp-back-step1');
        const form2 = stepBody.querySelector('#fp-step2-form');
        const errBox2 = stepBody.querySelector('#fp-step2-err');
        const verifyBtn = stepBody.querySelector('#fp-verify-btn');

        if (autofillBtn && lastOtpResponse?.otpCode) {
          autofillBtn.addEventListener('click', () => {
            otpInput.value = lastOtpResponse.otpCode;
            otpInput.focus();
          });
        }

        backBtn.addEventListener('click', () => {
          currentStep = 1;
          renderStepContent();
        });

        form2.addEventListener('submit', async (e) => {
          e.preventDefault();
          errBox2.style.display = 'none';

          const enteredOtp = otpInput.value.trim();
          verifyBtn.disabled = true;
          verifyBtn.textContent = 'Đang kiểm tra OTP...';

          try {
            await UserRepository.verifyResetOtp(targetEmail, enteredOtp);
            verifiedOtpCode = enteredOtp;
            currentStep = 3;
            Toast.success('Xác thực mã OTP thành công! Hãy đặt mật khẩu mới.');
            renderStepContent();
          } catch (err) {
            errBox2.textContent = err.message || 'Mã OTP không hợp lệ.';
            errBox2.style.display = 'flex';
            verifyBtn.disabled = false;
            verifyBtn.textContent = 'Xác nhận mã OTP';
          }
        });
      }

      // ======================================================================
      // BƯỚC 3: ĐẶT MẬT KHẨU MỚI
      // ======================================================================
      else if (currentStep === 3) {
        stepBody.innerHTML = `
          <div class="alert alert-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <div>
              Đã xác thực OTP thành công qua Gmail <strong>${DATABASE_CONFIG.VERIFY_GMAIL_ADDRESS}</strong> cho tài khoản <strong>${targetEmail}</strong>.
            </div>
          </div>

          <div class="alert alert-danger" id="fp-step3-err" style="display: none;"></div>

          <form id="fp-step3-form" novalidate>
            <div class="form-group">
              <label class="form-label" for="fp-new-pass">Mật khẩu mới (tối thiểu 8 ký tự) <span class="form-required">*</span></label>
              <input type="password" id="fp-new-pass" class="form-control" placeholder="••••••••" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="fp-confirm-pass">Xác nhận mật khẩu mới <span class="form-required">*</span></label>
              <input type="password" id="fp-confirm-pass" class="form-control" placeholder="••••••••" required />
            </div>

            <button type="submit" class="btn btn-primary btn-full" id="fp-save-pass-btn">
              Lưu mật khẩu mới
            </button>
          </form>
        `;

        const form3 = stepBody.querySelector('#fp-step3-form');
        const newPassInput = stepBody.querySelector('#fp-new-pass');
        const confirmPassInput = stepBody.querySelector('#fp-confirm-pass');
        const errBox3 = stepBody.querySelector('#fp-step3-err');
        const saveBtn = stepBody.querySelector('#fp-save-pass-btn');

        form3.addEventListener('submit', async (e) => {
          e.preventDefault();
          errBox3.style.display = 'none';

          const newPass = newPassInput.value;
          const confirmPass = confirmPassInput.value;

          if (!newPass || newPass.length < 8) {
            errBox3.textContent = 'Mật khẩu mới phải có ít nhất 8 ký tự.';
            errBox3.style.display = 'flex';
            return;
          }

          if (newPass !== confirmPass) {
            errBox3.textContent = 'Mật khẩu xác nhận không khớp.';
            errBox3.style.display = 'flex';
            return;
          }

          saveBtn.disabled = true;
          saveBtn.textContent = 'Đang cập nhật mật khẩu...';

          try {
            const user = await UserRepository.findByEmailFresh(targetEmail);
            if (!user) throw new Error('Không tìm thấy tài khoản.');

            const newSalt = AuthService.generateSalt(16);
            const newHash = await AuthService.hashPassword(newPass, newSalt);

            await UserRepository.updatePassword(user.id, newHash, newSalt);
            await UserRepository.consumeResetOtp(targetEmail, verifiedOtpCode);

            sessionStorage.setItem('video_admin_last_reset_email', targetEmail);
            Toast.success(`Đã đổi mật khẩu thành công cho ${targetEmail}! Vui lòng đăng nhập bằng mật khẩu mới.`);
            window.location.hash = '#/login';
          } catch (err) {
            errBox3.textContent = err.message || 'Lỗi khi lưu mật khẩu mới.';
            errBox3.style.display = 'flex';
            saveBtn.disabled = false;
            saveBtn.textContent = 'Lưu mật khẩu mới';
          }
        });
      }
    };

    renderStepContent();
    layout.appendChild(card);
    return layout;
  }
};
