import { StorageService } from '../services/storage-service.js';

export const DataTable = {
  renderVideoTable({ items = [], onEdit, onDelete, onAddClick }) {
    const wrapper = document.createElement('div');

    if (!items || items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';

      const icon = document.createElement('div');
      icon.className = 'empty-state-icon';
      icon.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="4" width="20" height="16" rx="2"/>
          <polygon points="10 9 15 12 10 15 10 9"/>
        </svg>
      `;

      const title = document.createElement('div');
      title.className = 'empty-state-title';
      title.textContent = 'Không tìm thấy video nào';

      const desc = document.createElement('div');
      desc.className = 'empty-state-desc';
      desc.textContent = 'Chưa có dữ liệu video phù hợp với điều kiện lọc hoặc cơ sở dữ liệu đang trống.';

      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'btn btn-primary';
      addBtn.textContent = '+ Add Video';
      addBtn.addEventListener('click', () => {
        if (typeof onAddClick === 'function') onAddClick();
      });

      empty.appendChild(icon);
      empty.appendChild(title);
      empty.appendChild(desc);
      empty.appendChild(addBtn);
      wrapper.appendChild(empty);
      return wrapper;
    }

    const responsive = document.createElement('div');
    responsive.className = 'table-responsive';

    const table = document.createElement('table');
    table.className = 'data-table';

    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>ID</th>
        <th>Thumbnail & Title</th>
        <th>Category</th>
        <th class="text-right">Views</th>
        <th class="text-right">File Size</th>
        <th>Status</th>
        <th>Created Date</th>
        <th class="text-right">Actions</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    items.forEach((video) => {
      const tr = document.createElement('tr');

      // ID
      const tdId = document.createElement('td');
      tdId.style.fontFamily = 'var(--font-mono)';
      tdId.style.color = 'var(--color-text-muted)';
      tdId.textContent = `#${String(video.id).padStart(2, '0')}`;

      // Thumbnail & Title
      const tdVideo = document.createElement('td');
      const videoCell = document.createElement('div');
      videoCell.className = 'video-cell';

      const thumbWrap = document.createElement('div');
      thumbWrap.className = 'video-thumb-wrap';

      const img = document.createElement('img');
      img.className = 'video-thumb';
      img.src = video.thumbnail_url || 'assets/images/placeholder-thumbnail.svg';
      img.alt = video.title || 'Video thumbnail';
      img.loading = 'lazy';
      img.addEventListener('error', () => {
        img.src = 'assets/images/placeholder-thumbnail.svg';
      });
      thumbWrap.appendChild(img);

      const meta = document.createElement('div');
      meta.className = 'video-meta';

      const titleEl = document.createElement('div');
      titleEl.className = 'video-title';
      titleEl.textContent = video.title;

      const subEl = document.createElement('div');
      subEl.className = 'video-sub';
      subEl.textContent = video.file_name || 'Metadata only';

      meta.appendChild(titleEl);
      meta.appendChild(subEl);
      videoCell.appendChild(thumbWrap);
      videoCell.appendChild(meta);
      tdVideo.appendChild(videoCell);

      // Category
      const tdCat = document.createElement('td');
      const catBadge = document.createElement('span');
      catBadge.className = 'badge badge-category';
      catBadge.textContent = video.category_name || 'Uncategorized';
      tdCat.appendChild(catBadge);

      // Views
      const tdViews = document.createElement('td');
      tdViews.className = 'text-right';
      tdViews.style.fontWeight = '600';
      tdViews.textContent = StorageService.formatNumber(video.views);

      // File size
      const tdSize = document.createElement('td');
      tdSize.className = 'text-right';
      tdSize.style.color = 'var(--color-text-secondary)';
      tdSize.textContent = StorageService.formatBytes(video.file_size_bytes);

      // Status
      const tdStatus = document.createElement('td');
      const statusBadge = document.createElement('span');
      const st = video.status || 'active';
      statusBadge.className = `badge badge-${st}`;
      statusBadge.textContent = st.charAt(0).toUpperCase() + st.slice(1);
      tdStatus.appendChild(statusBadge);

      // Created date
      const tdCreated = document.createElement('td');
      tdCreated.style.color = 'var(--color-text-secondary)';
      tdCreated.textContent = StorageService.formatDate(video.created_at);

      // Actions
      const tdActions = document.createElement('td');
      tdActions.className = 'text-right';

      const actionsGroup = document.createElement('div');
      actionsGroup.className = 'table-actions';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn-icon';
      editBtn.title = 'Chỉnh sửa video';
      editBtn.setAttribute('aria-label', `Chỉnh sửa video ${video.title}`);
      editBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      `;
      editBtn.addEventListener('click', () => {
        if (typeof onEdit === 'function') onEdit(video);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'btn-icon danger';
      deleteBtn.title = 'Xóa video';
      deleteBtn.setAttribute('aria-label', `Xóa video ${video.title}`);
      deleteBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          <line x1="10" y1="11" x2="10" y2="17"/>
          <line x1="14" y1="11" x2="14" y2="17"/>
        </svg>
      `;
      deleteBtn.addEventListener('click', () => {
        if (typeof onDelete === 'function') onDelete(video);
      });

      actionsGroup.appendChild(editBtn);
      actionsGroup.appendChild(deleteBtn);
      tdActions.appendChild(actionsGroup);

      tr.appendChild(tdId);
      tr.appendChild(tdVideo);
      tr.appendChild(tdCat);
      tr.appendChild(tdViews);
      tr.appendChild(tdSize);
      tr.appendChild(tdStatus);
      tr.appendChild(tdCreated);
      tr.appendChild(tdActions);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    responsive.appendChild(table);
    wrapper.appendChild(responsive);
    return wrapper;
  },

  renderPagination({ page, totalPages, total, pageSize, onPageChange }) {
    const bar = document.createElement('div');
    bar.className = 'pagination-bar';

    const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);

    const info = document.createElement('div');
    info.className = 'pagination-info';
    info.textContent = `Hiển thị ${start}–${end} trong tổng số ${total} video`;

    const controls = document.createElement('div');
    controls.className = 'pagination-controls';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'page-btn';
    prevBtn.disabled = page <= 1;
    prevBtn.setAttribute('aria-label', 'Trang trước');
    prevBtn.textContent = '‹ Trước';
    prevBtn.addEventListener('click', () => {
      if (page > 1 && typeof onPageChange === 'function') onPageChange(page - 1);
    });
    controls.appendChild(prevBtn);

    for (let p = 1; p <= totalPages; p++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `page-btn${p === page ? ' active' : ''}`;
      btn.textContent = String(p);
      btn.setAttribute('aria-label', `Trang ${p}`);
      btn.addEventListener('click', () => {
        if (p !== page && typeof onPageChange === 'function') onPageChange(p);
      });
      controls.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'page-btn';
    nextBtn.disabled = page >= totalPages;
    nextBtn.setAttribute('aria-label', 'Trang sau');
    nextBtn.textContent = 'Sau ›';
    nextBtn.addEventListener('click', () => {
      if (page < totalPages && typeof onPageChange === 'function') onPageChange(page + 1);
    });
    controls.appendChild(nextBtn);

    bar.appendChild(info);
    bar.appendChild(controls);
    return bar;
  }
};
