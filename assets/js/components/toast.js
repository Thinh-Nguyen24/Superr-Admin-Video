let toastContainer = null;

function ensureContainer() {
  if (toastContainer && document.body.contains(toastContainer)) {
    return toastContainer;
  }
  toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  toastContainer.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastContainer);
  return toastContainer;
}

export const Toast = {
  show(message, type = 'info', duration = 3500) {
    const container = ensureContainer();

    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${type}`;
    toastEl.setAttribute('role', 'status');

    const msgEl = document.createElement('div');
    msgEl.className = 'toast-message';
    msgEl.textContent = String(message || '');

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn-icon';
    closeBtn.setAttribute('aria-label', 'Đóng thông báo');
    closeBtn.textContent = '✕';

    const removeToast = () => {
      if (toastEl.parentNode) {
        toastEl.parentNode.removeChild(toastEl);
      }
    };

    closeBtn.addEventListener('click', removeToast);

    toastEl.appendChild(msgEl);
    toastEl.appendChild(closeBtn);
    container.appendChild(toastEl);

    if (duration > 0) {
      setTimeout(removeToast, duration);
    }
  },

  success(message) {
    this.show(message, 'success', 3200);
  },

  error(message) {
    this.show(message, 'error', 4500);
  },

  info(message) {
    this.show(message, 'info', 3200);
  }
};
