import { DatabaseService } from '../db/database-service.js';
import { SupabaseService } from '../services/supabase-service.js';

export const CategoryRepository = {
  listAll() {
    const db = DatabaseService.getVideosDb();
    return DatabaseService.queryAll(
      db,
      `SELECT c.id, c.name, c.description, c.created_at,
              COUNT(v.id) AS video_count
       FROM categories c
       LEFT JOIN videos v ON v.category_id = c.id
       GROUP BY c.id
       ORDER BY c.name ASC`
    );
  },

  getById(id) {
    const db = DatabaseService.getVideosDb();
    return DatabaseService.queryOne(
      db,
      'SELECT id, name, description, created_at FROM categories WHERE id = ?',
      [Number(id)]
    );
  },

  async create({ name, description = '' }) {
    const db = DatabaseService.getVideosDb();
    const trimmed = String(name || '').trim();
    if (!trimmed) throw new Error('Tên danh mục không được để trống.');

    const exists = DatabaseService.queryOne(
      db,
      'SELECT id FROM categories WHERE LOWER(name) = LOWER(?)',
      [trimmed]
    );
    if (exists) throw new Error('Danh mục này đã tồn tại.');

    DatabaseService.run(
      db,
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [trimmed, String(description || '').trim()]
    );
    const lastRow = DatabaseService.queryOne(db, 'SELECT last_insert_rowid() AS id');
    await DatabaseService.persistVideos();
    if (lastRow) {
      await SupabaseService.syncCategoryUpsert(this.getById(lastRow.id));
    }
  },

  async update(id, { name, description = '' }) {
    const db = DatabaseService.getVideosDb();
    const trimmed = String(name || '').trim();
    if (!trimmed) throw new Error('Tên danh mục không được để trống.');

    const duplicate = DatabaseService.queryOne(
      db,
      'SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND id <> ?',
      [trimmed, Number(id)]
    );
    if (duplicate) throw new Error('Tên danh mục đã được sử dụng.');

    DatabaseService.run(
      db,
      'UPDATE categories SET name = ?, description = ? WHERE id = ?',
      [trimmed, String(description || '').trim(), Number(id)]
    );
    await DatabaseService.persistVideos();
    await SupabaseService.syncCategoryUpsert(this.getById(id));
  },

  async delete(id) {
    const db = DatabaseService.getVideosDb();
    DatabaseService.run(db, 'DELETE FROM categories WHERE id = ?', [Number(id)]);
    await DatabaseService.persistVideos();
    await SupabaseService.syncCategoryDelete(id);
  }
};
