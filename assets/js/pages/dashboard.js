import { StatsRepository } from '../repositories/stats-repository.js';
import { StorageService } from '../services/storage-service.js';
import { AuthService } from '../services/auth-service.js';
import { AppState } from '../state.js';

let top10ChartInstance = null;
let viewsTimeChartInstance = null;

function destroyCharts() {
  if (top10ChartInstance) {
    top10ChartInstance.destroy();
    top10ChartInstance = null;
  }
  if (viewsTimeChartInstance) {
    viewsTimeChartInstance.destroy();
    viewsTimeChartInstance = null;
  }
}

function truncateLabel(text, maxLength = 22) {
  const str = String(text || '');
  return str.length > maxLength ? `${str.slice(0, maxLength)}…` : str;
}

export const DashboardPage = {
  cleanup() {
    destroyCharts();
  },

  render() {
    destroyCharts();

    const session = AuthService.getSession();
    const kpi = StatsRepository.getKpiSummary();
    const top10 = StatsRepository.getTop10Videos();

    const container = document.createElement('div');

    // Page Header
    const header = document.createElement('div');
    header.className = 'page-header';

    const headerLeft = document.createElement('div');
    const title = document.createElement('h2');
    title.className = 'page-header-title';
    title.textContent = `Welcome back, ${session?.fullName || 'Admin'}`;

    const subtitle = document.createElement('p');
    subtitle.className = 'page-header-subtitle';
    subtitle.textContent = 'Tổng quan số liệu thống kê thời gian thực từ cơ sở dữ liệu SQLite (videos.db).';

    headerLeft.appendChild(title);
    headerLeft.appendChild(subtitle);

    const headerActions = document.createElement('div');
    headerActions.className = 'page-header-actions';
    const manageBtn = document.createElement('a');
    manageBtn.href = '#/videos';
    manageBtn.className = 'btn btn-secondary';
    manageBtn.textContent = 'Quản lý danh sách Video';
    headerActions.appendChild(manageBtn);

    header.appendChild(headerLeft);
    header.appendChild(headerActions);
    container.appendChild(header);

    // KPI Cards
    const kpiGrid = document.createElement('div');
    kpiGrid.className = 'kpi-grid';

    const kpiItems = [
      {
        label: 'Total Videos',
        value: StorageService.formatNumber(kpi.totalVideos),
        helper: kpi.totalVideos === 0 ? 'Chưa có video hoạt động' : 'Video chưa bị lưu trữ (active & draft)',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><polygon points="10 9 15 12 10 15 10 9"/></svg>`
      },
      {
        label: 'Total Views',
        value: StorageService.formatNumber(kpi.totalViews),
        helper: kpi.totalViews === 0 ? 'Chưa có lượt xem' : 'Tổng lượt xem tích lũy từ videos.db',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
      },
      {
        label: 'Storage Used',
        value: StorageService.formatBytes(kpi.storageBytes),
        helper: `${StorageService.formatNumber(kpi.storageBytes)} bytes metadata`,
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`
      }
    ];

    kpiItems.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'kpi-card';

      const info = document.createElement('div');
      const labelEl = document.createElement('div');
      labelEl.className = 'kpi-label';
      labelEl.textContent = item.label;

      const valueEl = document.createElement('div');
      valueEl.className = 'kpi-value';
      valueEl.textContent = item.value;

      const helperEl = document.createElement('div');
      helperEl.className = 'kpi-helper';
      helperEl.textContent = item.helper;

      info.appendChild(labelEl);
      info.appendChild(valueEl);
      info.appendChild(helperEl);

      const iconBox = document.createElement('div');
      iconBox.className = 'kpi-icon';
      iconBox.innerHTML = item.icon;

      card.appendChild(info);
      card.appendChild(iconBox);
      kpiGrid.appendChild(card);
    });

    container.appendChild(kpiGrid);

    // Charts Section
    const chartsGrid = document.createElement('div');
    chartsGrid.className = 'dashboard-charts';

    // 1. Top 10 Videos Bar Chart Card
    const top10Card = document.createElement('section');
    top10Card.className = 'card';

    const top10Header = document.createElement('div');
    top10Header.className = 'card-header';
    top10Header.innerHTML = `
      <div>
        <h3 class="card-title">Top 10 Videos — Lượt xem cao nhất</h3>
        <p class="card-subtitle">Sắp xếp giảm dần theo số lượt xem từ bảng videos</p>
      </div>
    `;
    top10Card.appendChild(top10Header);

    const top10Body = document.createElement('div');
    top10Body.className = 'card-body';

    if (!top10 || top10.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = `
        <div class="empty-state-title">Chưa có dữ liệu video</div>
        <div class="empty-state-desc">Hãy thêm video mới để xem biểu đồ Top 10 video theo lượt xem.</div>
        <a href="#/videos/new" class="btn btn-primary">+ Add Video</a>
      `;
      top10Body.appendChild(empty);
    } else {
      const chartWrap = document.createElement('div');
      chartWrap.className = 'chart-container';
      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-label', 'Biểu đồ Top 10 video theo lượt xem');
      chartWrap.appendChild(canvas);
      top10Body.appendChild(chartWrap);

      requestAnimationFrame(() => {
        if (typeof window.Chart === 'function') {
          const fullTitles = top10.map((v) => v.title);
          const shortLabels = top10.map((v) => truncateLabel(v.title, 20));
          const dataValues = top10.map((v) => Number(v.views) || 0);

          top10ChartInstance = new window.Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
              labels: shortLabels,
              datasets: [
                {
                  label: 'Views',
                  data: dataValues,
                  backgroundColor: '#2563EB',
                  hoverBackgroundColor: '#1D4ED8',
                  borderRadius: 6,
                  maxBarThickness: 48
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    title(items) {
                      const idx = items[0]?.dataIndex ?? 0;
                      return fullTitles[idx] || '';
                    },
                    label(item) {
                      return ` Lượt xem: ${StorageService.formatNumber(item.raw)}`;
                    }
                  }
                }
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { color: '#475569', font: { size: 11 } }
                },
                y: {
                  beginAtZero: true,
                  grid: { color: '#F1F5F9' },
                  ticks: {
                    color: '#475569',
                    callback: (val) => StorageService.formatNumber(val)
                  }
                }
              }
            }
          });
        }
      });
    }

    top10Card.appendChild(top10Body);
    chartsGrid.appendChild(top10Card);

    // 2. Views Over Time Line Chart Card (Daily / Monthly)
    const timeCard = document.createElement('section');
    timeCard.className = 'card';

    const timeHeader = document.createElement('div');
    timeHeader.className = 'card-header';

    const timeTitleWrap = document.createElement('div');
    timeTitleWrap.innerHTML = `
      <h3 class="card-title">Views Over Time — Xu hướng lượt xem</h3>
      <p class="card-subtitle">Dữ liệu thống kê thực từ bảng video_view_stats (không tự suy diễn từ tổng lượt xem)</p>
    `;

    const toggleWrap = document.createElement('div');
    toggleWrap.className = 'segmented-control';

    const dailyBtn = document.createElement('button');
    dailyBtn.type = 'button';
    dailyBtn.className = `segmented-btn${AppState.dashboardTimeRange === 'daily' ? ' active' : ''}`;
    dailyBtn.textContent = 'Daily (30 ngày)';

    const monthlyBtn = document.createElement('button');
    monthlyBtn.type = 'button';
    monthlyBtn.className = `segmented-btn${AppState.dashboardTimeRange === 'monthly' ? ' active' : ''}`;
    monthlyBtn.textContent = 'Monthly (12 tháng)';

    toggleWrap.appendChild(dailyBtn);
    toggleWrap.appendChild(monthlyBtn);

    timeHeader.appendChild(timeTitleWrap);
    timeHeader.appendChild(toggleWrap);
    timeCard.appendChild(timeHeader);

    const timeBody = document.createElement('div');
    timeBody.className = 'card-body';
    timeCard.appendChild(timeBody);

    const renderTimeChart = (mode) => {
      if (viewsTimeChartInstance) {
        viewsTimeChartInstance.destroy();
        viewsTimeChartInstance = null;
      }
      timeBody.innerHTML = '';

      const rows =
        mode === 'monthly'
          ? StatsRepository.getViewsPerMonth()
          : StatsRepository.getViewsPerDay();

      if (!rows || rows.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.innerHTML = `
          <div class="empty-state-title">Chưa có dữ liệu lượt xem theo thời gian</div>
          <div class="empty-state-desc">Bảng video_view_stats hiện chưa có bản ghi thống kê cho khoảng thời gian này.</div>
        `;
        timeBody.appendChild(empty);
        return;
      }

      const chartWrap = document.createElement('div');
      chartWrap.className = 'chart-container';
      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-label', 'Biểu đồ lượt xem theo thời gian');
      chartWrap.appendChild(canvas);
      timeBody.appendChild(chartWrap);

      const labels = rows.map((r) => (mode === 'monthly' ? r.month : r.view_date));
      const values = rows.map((r) => Number(r.total_views) || 0);

      requestAnimationFrame(() => {
        if (typeof window.Chart === 'function') {
          viewsTimeChartInstance = new window.Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
              labels,
              datasets: [
                {
                  label: mode === 'monthly' ? 'Views theo tháng' : 'Views theo ngày',
                  data: values,
                  borderColor: '#2563EB',
                  backgroundColor: 'rgba(37, 99, 235, 0.10)',
                  borderWidth: 2.5,
                  pointBackgroundColor: '#FFFFFF',
                  pointBorderColor: '#2563EB',
                  pointBorderWidth: 2,
                  pointRadius: 3.5,
                  fill: true,
                  tension: 0.3
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label(item) {
                      return ` Tổng lượt xem: ${StorageService.formatNumber(item.raw)}`;
                    }
                  }
                }
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { color: '#475569', maxTicksLimit: 12 }
                },
                y: {
                  beginAtZero: true,
                  grid: { color: '#F1F5F9' },
                  ticks: {
                    color: '#475569',
                    callback: (val) => StorageService.formatNumber(val)
                  }
                }
              }
            }
          });
        }
      });
    };

    dailyBtn.addEventListener('click', () => {
      if (AppState.dashboardTimeRange === 'daily') return;
      AppState.dashboardTimeRange = 'daily';
      dailyBtn.classList.add('active');
      monthlyBtn.classList.remove('active');
      renderTimeChart('daily');
    });

    monthlyBtn.addEventListener('click', () => {
      if (AppState.dashboardTimeRange === 'monthly') return;
      AppState.dashboardTimeRange = 'monthly';
      monthlyBtn.classList.add('active');
      dailyBtn.classList.remove('active');
      renderTimeChart('monthly');
    });

    renderTimeChart(AppState.dashboardTimeRange);

    chartsGrid.appendChild(timeCard);
    container.appendChild(chartsGrid);

    return container;
  }
};
