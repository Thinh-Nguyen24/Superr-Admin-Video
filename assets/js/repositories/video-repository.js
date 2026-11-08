import { DatabaseService } from '../db/database-service.js';
import { SupabaseService } from '../services/supabase-service.js';

const SORT_MAP = {
  created_desc: 'v.created_at DESC, v.id DESC',
  created_asc: 'v.created_at ASC, v.id ASC',
  views_desc: 'v.views DESC, v.id DESC',
  views_asc: 'v.views ASC, v.id ASC',
  title_asc: 'v.title COLLATE NOCASE ASC, v.id DESC',
  title_desc: 'v.title COLLATE NOCASE DESC, v.id DESC'
};

export const VideoRepository = {
  list({
    search = '',
    categoryId = '',
    status = '',
    sortBy = 'created_desc',
    page = 1,
    pageSize = 8
  } = {}) {
    const db = DatabaseService.getVideosDb();
    const conditions = [];
    const params = [];

    const trimmedSearch = String(search || '').trim();
    if (trimmedSearch) {
      conditions.push('v.title LIKE ?');
      params.push(`%${trimmedSearch}%`);
    }

    if (categoryId !== '' && categoryId !== null && categoryId !== undefined) {
      conditions.push('v.category_id = ?');
      params.push(Number(categoryId));
    }

    if (status && ['active', 'draft', 'archived'].includes(status)) {
      conditions.push('v.status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = SORT_MAP[sortBy] || SORT_MAP.created_desc;

    const countRow = DatabaseService.queryOne(
      db,
      `SELECT COUNT(*) AS total FROM videos v ${whereClause}`,
      params
    );
    const total = countRow ? Number(countRow.total) : 0;
    const safePageSize = Math.max(1, Number(pageSize) || 8);
    const totalPages = Math.max(1, Math.ceil(total / safePageSize));
    const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages);
    const offset = (safePage - 1) * safePageSize;

    const items = DatabaseService.queryAll(
      db,
      `SELECT v.id, v.title, v.description, v.thumbnail_url, v.file_name, v.file_path,
              v.mime_type, v.file_size_bytes, v.views, v.category_id, v.status,
              v.created_at, v.updated_at,
              c.name AS category_name
       FROM videos v
       LEFT JOIN categories c ON c.id = v.category_id
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, safePageSize, offset]
    );

    return {
      items,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages
    };
  },

  getById(id) {
    const db = DatabaseService.getVideosDb();
    return DatabaseService.queryOne(
      db,
      `SELECT v.id, v.title, v.description, v.thumbnail_url, v.file_name, v.file_path,
              v.mime_type, v.file_size_bytes, v.views, v.category_id, v.status,
              v.created_at, v.updated_at,
              c.name AS category_name
       FROM videos v
       LEFT JOIN categories c ON c.id = v.category_id
       WHERE v.id = ?`,
      [Number(id)]
    );
  },

  async create(data) {
    const db = DatabaseService.getVideosDb();
    const categoryId = data.categoryId ? Number(data.categoryId) : null;
    const views = Math.max(0, parseInt(data.views, 10) || 0);
    const fileSizeBytes = Math.max(0, parseInt(data.fileSizeBytes, 10) || 0);

    DatabaseService.run(
      db,
      `INSERT INTO videos (
        title, description, thumbnail_url, file_name, file_path,
        mime_type, file_size_bytes, views, category_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(data.title).trim(),
        String(data.description || '').trim(),
        String(data.thumbnailUrl || '').trim() || 'assets/images/placeholder-thumbnail.svg',
        String(data.fileName || '').trim() || null,
        String(data.filePath || '').trim() || null,
        String(data.mimeType || '').trim() || null,
        fileSizeBytes,
        views,
        categoryId,
        data.status || 'active'
      ]
    );

    const lastRow = DatabaseService.queryOne(db, 'SELECT last_insert_rowid() AS id');
    await DatabaseService.persistVideos();
    const newId = lastRow ? Number(lastRow.id) : null;
    if (newId) {
      const created = this.getById(newId);
      await SupabaseService.syncVideoUpsert(created);
    }
    return newId;
  },

  async update(id, data) {
    const db = DatabaseService.getVideosDb();
    const categoryId = data.categoryId ? Number(data.categoryId) : null;
    const views = Math.max(0, parseInt(data.views, 10) || 0);
    const fileSizeBytes = Math.max(0, parseInt(data.fileSizeBytes, 10) || 0);

    DatabaseService.run(
      db,
      `UPDATE videos
       SET title = ?,
           description = ?,
           thumbnail_url = ?,
           file_name = ?,
           file_path = ?,
           mime_type = ?,
           file_size_bytes = ?,
           views = ?,
           category_id = ?,
           status = ?,
           updated_at = datetime('now')
       WHERE id = ?`,
      [
        String(data.title).trim(),
        String(data.description || '').trim(),
        String(data.thumbnailUrl || '').trim() || 'assets/images/placeholder-thumbnail.svg',
        String(data.fileName || '').trim() || null,
        String(data.filePath || '').trim() || null,
        String(data.mimeType || '').trim() || null,
        fileSizeBytes,
        views,
        categoryId,
        data.status || 'active',
        Number(id)
      ]
    );

    await DatabaseService.persistVideos();
    const updated = this.getById(id);
    await SupabaseService.syncVideoUpsert(updated);
    return updated;
  },

  async delete(id) {
    const db = DatabaseService.getVideosDb();
    DatabaseService.run(db, 'DELETE FROM videos WHERE id = ?', [Number(id)]);
    await DatabaseService.persistVideos();
    await SupabaseService.syncVideoDelete(id);
  }
};
