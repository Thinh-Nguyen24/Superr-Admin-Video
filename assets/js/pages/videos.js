import { VideoRepository } from '../repositories/video-repository.js';
import { CategoryRepository } from '../repositories/category-repository.js';
import { DataTable } from '../components/data-table.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { AppState } from '../state.js';

export const VideosPage = {
  render() {
    const container = document.createElement('div');
    const categories = CategoryRepository.listAll();

    // Page Header
    const header = document.createElement('div');
    header.className = 'page-header';

    const headerLeft = document.createElement('div');
    const title = document.createElement('h2');
    title.className = 'page-header-title';
    title.textContent = 'Videos Management';

    const subtitle = document.createElement('p');
    subtitle.className = 'page-header-subtitle';
    subtitle.textContent = 'Tìm kiếm, lọc, sắp xếp và quản lý danh sách video trong videos.db.';

    headerLeft.appendChild(title);
    headerLeft.appendChild(subtitle);

    const headerActions = document.createElement('div');
    headerActions.className = 'page-header-actions';

    const addBtn = document.createElement('a');
    addBtn.href = '#/videos/new';
    addBtn.className = 'btn btn-primary';
    addBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      <span>Add Video</span>
    `;
    headerActions.appendChild(addBtn);

    header.appendChild(headerLeft);
    header.appendChild(headerActions);
    container.appendChild(header);

    // Main Card
    const card = document.createElement('section');
    card.className = 'card';

    // Filter Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'filter-toolbar';

    // 1. Search Input
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
    searchInput.placeholder = 'Tìm kiếm theo tiêu đề video...';
    searchInput.setAttribute('aria-label', 'Tìm kiếm theo tiêu đề video');
    searchInput.value = AppState.videoFilters.search;
    searchBox.appendChild(searchInput);

    // 2. Category Filter
    const categorySelect = document.createElement('select');
    categorySelect.className = 'form-control';
    categorySelect.setAttribute('aria-label', 'Lọc theo danh mục');
    const defaultCatOpt = document.createElement('option');
    defaultCatOpt.value = '';
    defaultCatOpt.textContent = 'Tất cả danh mục';
    categorySelect.appendChild(defaultCatOpt);

    categories.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = String(cat.id);
      opt.textContent = cat.name;
      if (String(AppState.videoFilters.categoryId) === String(cat.id)) {
        opt.selected = true;
      }
      categorySelect.appendChild(opt);
    });

    // 3. Sort Filter
    const sortSelect = document.createElement('select');
    sortSelect.className = 'form-control';
    sortSelect.setAttribute('aria-label', 'Sắp xếp danh sách video');
    const sortOptions = [
      { value: 'created_desc', label: 'Mới nhất trước' },
      { value: 'created_asc', label: 'Cũ nhất trước' },
      { value: 'views_desc', label: 'Lượt xem: Cao → Thấp' },
      { value: 'views_asc', label: 'Lượt xem: Thấp → Cao' },
      { value: 'title_asc', label: 'Tiêu đề: A → Z' },
      { value: 'title_desc', label: 'Tiêu đề: Z → A' }
    ];
    sortOptions.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s.value;
      opt.textContent = s.label;
      if (AppState.videoFilters.sortBy === s.value) {
        opt.selected = true;
      }
      sortSelect.appendChild(opt);
    });

    toolbar.appendChild(searchBox);
    toolbar.appendChild(categorySelect);
    toolbar.appendChild(sortSelect);
    card.appendChild(toolbar);

    // Table Content Container
    const tableHost = document.createElement('div');
    card.appendChild(tableHost);

    const refreshTable = () => {
      tableHost.innerHTML = '';
      const result = VideoRepository.list(AppState.videoFilters);

      const tableEl = DataTable.renderVideoTable({
        items: result.items,
        onAddClick: () => {
          window.location.hash = '#/videos/new';
        },
        onEdit: (video) => {
          window.location.hash = `#/videos/${video.id}/edit`;
        },
        onDelete: async (video) => {
          const confirmed = await Modal.confirm({
            title: 'Xóa video',
            message: `Bạn có chắc chắn muốn xóa video "${video.title}"? Dữ liệu thống kê lượt xem liên quan cũng sẽ bị xóa khỏi videos.db.`,
            confirmText: 'Xóa vĩnh viễn',
            cancelText: 'Hủy',
            danger: true
          });

          if (!confirmed) return;

          try {
            await VideoRepository.delete(video.id);
            Toast.success(`Đã xóa video "${video.title}".`);
            refreshTable();
          } catch (err) {
            Toast.error(err.message || 'Không thể xóa video.');
          }
        }
      });

      tableHost.appendChild(tableEl);

      if (result.total > 0) {
        const paginationEl = DataTable.renderPagination({
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
          pageSize: result.pageSize,
          onPageChange: (newPage) => {
            AppState.videoFilters.page = newPage;
            refreshTable();
          }
        });
        tableHost.appendChild(paginationEl);
      }
    };

    searchInput.addEventListener('input', () => {
      AppState.videoFilters.search = searchInput.value;
      AppState.videoFilters.page = 1;
      refreshTable();
    });

    categorySelect.addEventListener('change', () => {
      AppState.videoFilters.categoryId = categorySelect.value;
      AppState.videoFilters.page = 1;
      refreshTable();
    });

    sortSelect.addEventListener('change', () => {
      AppState.videoFilters.sortBy = sortSelect.value;
      AppState.videoFilters.page = 1;
      refreshTable();
    });

    refreshTable();
    container.appendChild(card);

    return container;
  }
};
