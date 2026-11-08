import { VideoRepository } from '../repositories/video-repository.js';
import { CategoryRepository } from '../repositories/category-repository.js';
import { ValidationService } from '../services/validation-service.js';
import { StorageService } from '../services/storage-service.js';
import { Toast } from '../components/toast.js';

let activeVideoObjectUrl = null;

function revokeActiveVideoUrl() {
  if (activeVideoObjectUrl) {
    URL.revokeObjectURL(activeVideoObjectUrl);
    activeVideoObjectUrl = null;
  }
}

export const VideoFormPage = {
  cleanup() {
    revokeActiveVideoUrl();
  },

  render({ videoId = null } = {}) {
    revokeActiveVideoUrl();

    const isEdit = videoId !== null && videoId !== undefined;
    const existingVideo = isEdit ? VideoRepository.getById(videoId) : null;

    const container = document.createElement('div');

    if (isEdit && !existingVideo) {
      const notFound = document.createElement('div');
      notFound.className = 'card card-body';
      notFound.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-title">Không tìm thấy video #${Number(videoId)}</div>
          <div class="empty-state-desc">Video này có thể đã bị xóa khỏi cơ sở dữ liệu videos.db.</div>
          <a href="#/videos" class="btn btn-primary">Quay lại danh sách Video</a>
        </div>
      `;
      container.appendChild(notFound);
      return container;
    }

    const categories = CategoryRepository.listAll();

    // Header
    const header = document.createElement('div');
    header.className = 'page-header';

    const headerLeft = document.createElement('div');
    const titleEl = document.createElement('h2');
    titleEl.className = 'page-header-title';
    titleEl.textContent = isEdit ? `Edit Video #${existingVideo.id}` : 'Add New Video';

    const subEl = document.createElement('p');
    subEl.className = 'page-header-subtitle';
    subEl.textContent = isEdit
      ? 'Cập nhật thông tin metadata và lưu thay đổi vào videos.db.'
      : 'Thêm mới bản ghi video vào cơ sở dữ liệu SQLite (videos.db).';

    headerLeft.appendChild(titleEl);
    headerLeft.appendChild(subEl);

    const backBtn = document.createElement('a');
    backBtn.href = '#/videos';
    backBtn.className = 'btn btn-secondary';
    backBtn.textContent = '← Quay lại danh sách';

    header.appendChild(headerLeft);
    header.appendChild(backBtn);
    container.appendChild(header);

    // Form
    const form = document.createElement('form');
    form.noValidate = true;

    const grid = document.createElement('div');
    grid.className = 'form-grid-layout';

    // Left column: Basic Info & Metadata
    const leftCard = document.createElement('div');
    leftCard.className = 'card';
    leftCard.innerHTML = `
      <div class="card-header">
        <div>
          <h3 class="card-title">Thông tin cơ bản & Metadata</h3>
          <p class="card-subtitle">Các trường có dấu (*) là bắt buộc</p>
        </div>
      </div>
      <div class="card-body">
        <div class="form-group">
          <label class="form-label" for="vf-title">Title <span class="form-required">*</span></label>
          <input type="text" id="vf-title" class="form-control" placeholder="Nhập tiêu đề video..." required />
          <div class="form-error" id="err-vf-title"></div>
        </div>

        <div class="form-group">
          <label class="form-label" for="vf-desc">Description</label>
          <textarea id="vf-desc" class="form-control" placeholder="Mô tả nội dung video (không bắt buộc)..."></textarea>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label" for="vf-category">Category</label>
            <select id="vf-category" class="form-control">
              <option value="">-- Chọn danh mục --</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="vf-status">Status <span class="form-required">*</span></label>
            <select id="vf-status" class="form-control">
              <option value="active">Active (Hoạt động)</option>
              <option value="draft">Draft (Bản nháp)</option>
              <option value="archived">Archived (Lưu trữ)</option>
            </select>
            <div class="form-error" id="err-vf-status"></div>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label" for="vf-views">Views (Demo / Nhập thủ công) <span class="form-required">*</span></label>
            <input type="number" id="vf-views" class="form-control" min="0" step="1" value="0" required />
            <div class="form-hint">Số nguyên không âm</div>
            <div class="form-error" id="err-vf-views"></div>
          </div>

          <div class="form-group">
            <label class="form-label" for="vf-size">File Size (Bytes) <span class="form-required">*</span></label>
            <input type="number" id="vf-size" class="form-control" min="0" step="1" value="0" required />
            <div class="form-hint" id="vf-size-human">Tương đương: 0 B</div>
            <div class="form-error" id="err-vf-size"></div>
          </div>
        </div>
      </div>
    `;

    // Right column: Media (Thumbnail & Local Video File metadata)
    const rightCard = document.createElement('div');
    rightCard.className = 'card';
    rightCard.innerHTML = `
      <div class="card-header">
        <div>
          <h3 class="card-title">Media & Xem trước</h3>
          <p class="card-subtitle">Lưu URL hoặc trích xuất metadata từ file máy tính</p>
        </div>
      </div>
      <div class="card-body">
        <div class="form-group">
          <label class="form-label" for="vf-thumb-url">Thumbnail URL</label>
          <input type="url" id="vf-thumb-url" class="form-control" placeholder="https://example.com/thumbnail.jpg" />
          <div class="form-error" id="err-vf-thumb"></div>
        </div>

        <div class="form-group">
          <label class="form-label" for="vf-thumb-file">Hoặc chọn ảnh Thumbnail từ máy</label>
          <input type="file" id="vf-thumb-file" class="form-control" accept="image/*" />
          <div class="thumbnail-preview-box">
            <img id="vf-thumb-preview" src="assets/images/placeholder-thumbnail.svg" alt="Thumbnail preview" />
          </div>
        </div>

        <div class="form-group" style="margin-top: 1.25rem;">
          <label class="form-label" for="vf-video-file">Chọn Video File (Tùy chọn — Chỉ lưu Metadata)</label>
          <input type="file" id="vf-video-file" class="form-control" accept="video/*" />
          <div class="form-hint" id="vf-video-meta-info">Không nhúng binary video vào SQLite; tự động điền tên file và dung lượng.</div>
          <video id="vf-video-preview" class="video-preview-player" controls style="display: none;"></video>
        </div>

        <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--color-border);">
          <a href="#/videos" class="btn btn-secondary">Cancel</a>
          <button type="submit" class="btn btn-primary" id="vf-submit-btn">${isEdit ? 'Lưu thay đổi' : 'Tạo Video'}</button>
        </div>
      </div>
    `;

    grid.appendChild(leftCard);
    grid.appendChild(rightCard);
    form.appendChild(grid);
    container.appendChild(form);

    // References
    const titleInput = leftCard.querySelector('#vf-title');
    const descInput = leftCard.querySelector('#vf-desc');
    const categorySelect = leftCard.querySelector('#vf-category');
    const statusSelect = leftCard.querySelector('#vf-status');
    const viewsInput = leftCard.querySelector('#vf-views');
    const sizeInput = leftCard.querySelector('#vf-size');
    const sizeHuman = leftCard.querySelector('#vf-size-human');

    const thumbUrlInput = rightCard.querySelector('#vf-thumb-url');
    const thumbFileInput = rightCard.querySelector('#vf-thumb-file');
    const thumbPreview = rightCard.querySelector('#vf-thumb-preview');
    const videoFileInput = rightCard.querySelector('#vf-video-file');
    const videoMetaInfo = rightCard.querySelector('#vf-video-meta-info');
    const videoPreview = rightCard.querySelector('#vf-video-preview');
    const submitBtn = rightCard.querySelector('#vf-submit-btn');

    const errTitle = leftCard.querySelector('#err-vf-title');
    const errStatus = leftCard.querySelector('#err-vf-status');
    const errViews = leftCard.querySelector('#err-vf-views');
    const errSize = leftCard.querySelector('#err-vf-size');
    const errThumb = rightCard.querySelector('#err-vf-thumb');

    // Populate categories
    categories.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = String(c.id);
      opt.textContent = c.name;
      categorySelect.appendChild(opt);
    });

    let selectedFileMeta = {
      fileName: existingVideo?.file_name || '',
      filePath: existingVideo?.file_path || '',
      mimeType: existingVideo?.mime_type || ''
    };

    // Populate initial values if editing
    if (isEdit && existingVideo) {
      titleInput.value = existingVideo.title || '';
      descInput.value = existingVideo.description || '';
      categorySelect.value = existingVideo.category_id ? String(existingVideo.category_id) : '';
      statusSelect.value = existingVideo.status || 'active';
      viewsInput.value = String(existingVideo.views ?? 0);
      sizeInput.value = String(existingVideo.file_size_bytes ?? 0);
      sizeHuman.textContent = `Tương đương: ${StorageService.formatBytes(existingVideo.file_size_bytes)}`;
      thumbUrlInput.value = existingVideo.thumbnail_url || '';
      thumbPreview.src = existingVideo.thumbnail_url || 'assets/images/placeholder-thumbnail.svg';
      if (existingVideo.file_name) {
        videoMetaInfo.textContent = `File hiện tại: ${existingVideo.file_name} (${existingVideo.mime_type || 'video/mp4'})`;
      }
    }

    sizeInput.addEventListener('input', () => {
      sizeHuman.textContent = `Tương đương: ${StorageService.formatBytes(sizeInput.value)}`;
    });

    thumbUrlInput.addEventListener('input', () => {
      const val = thumbUrlInput.value.trim();
      thumbPreview.src = val || 'assets/images/placeholder-thumbnail.svg';
    });

    thumbPreview.addEventListener('error', () => {
      thumbPreview.src = 'assets/images/placeholder-thumbnail.svg';
    });

    // Local thumbnail image reader
    thumbFileInput.addEventListener('change', () => {
      const file = thumbFileInput.files?.[0];
      if (!file) return;
      if (file.size > 1.5 * 1024 * 1024) {
        Toast.error('Ảnh thumbnail quá lớn (> 1.5MB). Vui lòng chọn ảnh nhẹ hơn hoặc dùng URL.');
        thumbFileInput.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          thumbUrlInput.value = reader.result;
          thumbPreview.src = reader.result;
        }
      };
      reader.readAsDataURL(file);
    });

    // Local video file metadata extraction + temporary preview via URL.createObjectURL
    videoFileInput.addEventListener('change', () => {
      revokeActiveVideoUrl();
      const file = videoFileInput.files?.[0];
      if (!file) {
        videoPreview.style.display = 'none';
        videoPreview.removeAttribute('src');
        return;
      }

      selectedFileMeta = {
        fileName: file.name,
        filePath: `/local-selected/${file.name}`,
        mimeType: file.type || 'video/mp4'
      };

      sizeInput.value = String(file.size);
      sizeHuman.textContent = `Tương đương: ${StorageService.formatBytes(file.size)}`;
      videoMetaInfo.textContent = `Đã chọn: ${file.name} (${StorageService.formatBytes(file.size)})`;

      if (!titleInput.value.trim()) {
        titleInput.value = file.name.replace(/\.[^/.]+$/, '');
      }

      activeVideoObjectUrl = URL.createObjectURL(file);
      videoPreview.src = activeVideoObjectUrl;
      videoPreview.style.display = 'block';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      [errTitle, errStatus, errViews, errSize, errThumb].forEach((el) => (el.textContent = ''));
      [titleInput, statusSelect, viewsInput, sizeInput, thumbUrlInput].forEach((el) =>
        el.classList.remove('is-invalid')
      );

      const payload = {
        title: titleInput.value,
        description: descInput.value,
        thumbnailUrl: thumbUrlInput.value,
        categoryId: categorySelect.value,
        status: statusSelect.value,
        views: viewsInput.value === '' ? NaN : Number(viewsInput.value),
        fileSizeBytes: sizeInput.value === '' ? NaN : Number(sizeInput.value),
        fileName: selectedFileMeta.fileName,
        filePath: selectedFileMeta.filePath,
        mimeType: selectedFileMeta.mimeType
      };

      const validation = ValidationService.validateVideoForm(payload);
      if (!validation.isValid) {
        if (validation.errors.title) {
          errTitle.textContent = validation.errors.title;
          titleInput.classList.add('is-invalid');
        }
        if (validation.errors.views) {
          errViews.textContent = validation.errors.views;
          viewsInput.classList.add('is-invalid');
        }
        if (validation.errors.fileSizeBytes) {
          errSize.textContent = validation.errors.fileSizeBytes;
          sizeInput.classList.add('is-invalid');
        }
        if (validation.errors.thumbnailUrl) {
          errThumb.textContent = validation.errors.thumbnailUrl;
          thumbUrlInput.classList.add('is-invalid');
        }
        if (validation.errors.status) {
          errStatus.textContent = validation.errors.status;
          statusSelect.classList.add('is-invalid');
        }
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Đang lưu...';

      try {
        if (isEdit) {
          await VideoRepository.update(videoId, payload);
          Toast.success('Đã cập nhật thông tin video thành công!');
        } else {
          await VideoRepository.create(payload);
          Toast.success('Đã thêm video mới vào cơ sở dữ liệu!');
        }
        window.location.hash = '#/videos';
      } catch (err) {
        Toast.error(err.message || 'Không thể lưu video vào database.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = isEdit ? 'Lưu thay đổi' : 'Tạo Video';
      }
    });

    return container;
  }
};
