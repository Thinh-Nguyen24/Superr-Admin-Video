const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ValidationService = {
  validateLogin({ email, password }) {
    const errors = {};
    const trimmedEmail = String(email || '').trim();

    if (!trimmedEmail) {
      errors.email = 'Vui lòng nhập địa chỉ email.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Định dạng email không hợp lệ.';
    }

    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  validateRegister({ fullName, email, password, confirmPassword }) {
    const errors = {};
    const trimmedName = String(fullName || '').trim();
    const trimmedEmail = String(email || '').trim();

    if (!trimmedName) {
      errors.fullName = 'Vui lòng nhập họ và tên.';
    } else if (trimmedName.length < 2) {
      errors.fullName = 'Họ và tên phải có ít nhất 2 ký tự.';
    }

    if (!trimmedEmail) {
      errors.email = 'Vui lòng nhập địa chỉ email.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Định dạng email không hợp lệ.';
    }

    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu.';
    } else if (String(password).length < 8) {
      errors.password = 'Mật khẩu phải có tối thiểu 8 ký tự.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  validateForgotPassword({ email, newPassword, confirmPassword }) {
    const errors = {};
    const trimmedEmail = String(email || '').trim();

    if (!trimmedEmail) {
      errors.email = 'Vui lòng nhập email đã đăng ký.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Định dạng email không hợp lệ.';
    }

    if (!newPassword) {
      errors.newPassword = 'Vui lòng nhập mật khẩu mới.';
    } else if (String(newPassword).length < 8) {
      errors.newPassword = 'Mật khẩu mới phải có tối thiểu 8 ký tự.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Vui lòng nhập lại mật khẩu mới.';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  validateVideoForm({ title, thumbnailUrl, views, fileSizeBytes, status }) {
    const errors = {};
    const trimmedTitle = String(title || '').trim();
    const trimmedThumb = String(thumbnailUrl || '').trim();

    if (!trimmedTitle) {
      errors.title = 'Tiêu đề video không được để trống.';
    } else if (trimmedTitle.length > 200) {
      errors.title = 'Tiêu đề không vượt quá 200 ký tự.';
    }

    const parsedViews = Number(views);
    if (views === '' || views === null || views === undefined || !Number.isInteger(parsedViews) || parsedViews < 0) {
      errors.views = 'Lượt xem phải là số nguyên không âm (>= 0).';
    }

    const parsedSize = Number(fileSizeBytes);
    if (fileSizeBytes === '' || fileSizeBytes === null || fileSizeBytes === undefined || Number.isNaN(parsedSize) || parsedSize < 0) {
      errors.fileSizeBytes = 'Dung lượng file phải là số không âm (>= 0).';
    }

    if (trimmedThumb && !trimmedThumb.startsWith('data:image/') && !trimmedThumb.startsWith('assets/')) {
      try {
        const u = new URL(trimmedThumb);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') {
          errors.thumbnailUrl = 'URL thumbnail phải bắt đầu bằng http:// hoặc https://.';
        }
      } catch {
        errors.thumbnailUrl = 'URL thumbnail không hợp lệ.';
      }
    }

    if (!['active', 'draft', 'archived'].includes(status)) {
      errors.status = 'Trạng thái không hợp lệ.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};
