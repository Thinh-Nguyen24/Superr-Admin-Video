let activeModalCleanup = null;

export const Modal = {
  confirm({
    title = 'Xác nhận thao tác',
    message = 'Bạn có chắc chắn muốn thực hiện thao tác này?',
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    danger = false
  } = {}) {
    this.close();

    return new Promise((resolve) => {
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop';
      backdrop.setAttribute('role', 'dialog');
      backdrop.setAttribute('aria-modal', 'true');

      const card = document.createElement('div');
      card.className = 'modal-card';

      const header = document.createElement('div');
      header.className = 'modal-header';

      const titleEl = document.createElement('h3');
      titleEl.className = 'modal-title';
      titleEl.textContent = title;

      const closeIconBtn = document.createElement('button');
      closeIconBtn.type = 'button';
      closeIconBtn.className = 'btn-icon';
      closeIconBtn.setAttribute('aria-label', 'Đóng hộp thoại');
      closeIconBtn.textContent = '✕';

      header.appendChild(titleEl);
      header.appendChild(closeIconBtn);

      const body = document.createElement('div');
      body.className = 'modal-body';
      body.textContent = message;

      const footer = document.createElement('div');
      footer.className = 'modal-footer';

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'btn btn-secondary';
      cancelBtn.textContent = cancelText;

      const confirmBtn = document.createElement('button');
      confirmBtn.type = 'button';
      confirmBtn.className = `btn ${danger ? 'btn-danger' : 'btn-primary'}`;
      confirmBtn.textContent = confirmText;

      footer.appendChild(cancelBtn);
      footer.appendChild(confirmBtn);

      card.appendChild(header);
      card.appendChild(body);
      card.appendChild(footer);
      backdrop.appendChild(card);
      document.body.appendChild(backdrop);

      const finish = (result) => {
        if (activeModalCleanup) {
          activeModalCleanup();
          activeModalCleanup = null;
        }
        resolve(result);
      };

      const onKeyDown = (e) => {
        if (e.key === 'Escape') {
          finish(false);
        }
      };

      cancelBtn.addEventListener('click', () => finish(false));
      closeIconBtn.addEventListener('click', () => finish(false));
      confirmBtn.addEventListener('click', () => finish(true));
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) finish(false);
      });
      document.addEventListener('keydown', onKeyDown);

      activeModalCleanup = () => {
        document.removeEventListener('keydown', onKeyDown);
        if (backdrop.parentNode) {
          backdrop.parentNode.removeChild(backdrop);
        }
      };

      confirmBtn.focus();
    });
  },

  close() {
    if (activeModalCleanup) {
      activeModalCleanup();
      activeModalCleanup = null;
    }
  }
};
