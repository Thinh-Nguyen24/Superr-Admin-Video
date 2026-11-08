import { DatabaseService } from '../db/database-service.js';

export const StatsRepository = {
  getKpiSummary() {
    const db = DatabaseService.getVideosDb();

    const videosRow = DatabaseService.queryOne(
      db,
      `SELECT COUNT(*) AS total_videos
       FROM videos
       WHERE status <> 'archived'`
    );

    const viewsRow = DatabaseService.queryOne(
      db,
      `SELECT COALESCE(SUM(views), 0) AS total_views
       FROM videos
       WHERE status <> 'archived'`
    );

    const storageRow = DatabaseService.queryOne(
      db,
      `SELECT COALESCE(SUM(file_size_bytes), 0) AS storage_bytes
       FROM videos
       WHERE status <> 'archived'`
    );

    return {
      totalVideos: videosRow ? Number(videosRow.total_videos) : 0,
      totalViews: viewsRow ? Number(viewsRow.total_views) : 0,
      storageBytes: storageRow ? Number(storageRow.storage_bytes) : 0
    };
  },

  getTop10Videos() {
    const db = DatabaseService.getVideosDb();
    return DatabaseService.queryAll(
      db,
      `SELECT id, title, thumbnail_url, views
       FROM videos
       WHERE status <> 'archived'
       ORDER BY views DESC, id DESC
       LIMIT 10`
    );
  },

  getViewsPerDay() {
    const db = DatabaseService.getVideosDb();
    return DatabaseService.queryAll(
      db,
      `SELECT view_date, SUM(views) AS total_views
       FROM video_view_stats
       WHERE view_date >= date('now', '-29 days')
       GROUP BY view_date
       ORDER BY view_date ASC`
    );
  },

  getViewsPerMonth() {
    const db = DatabaseService.getVideosDb();
    return DatabaseService.queryAll(
      db,
      `SELECT strftime('%Y-%m', view_date) AS month,
              SUM(views) AS total_views
       FROM video_view_stats
       WHERE view_date >= date('now', 'start of month', '-11 months')
       GROUP BY strftime('%Y-%m', view_date)
       ORDER BY month ASC`
    );
  }
};
