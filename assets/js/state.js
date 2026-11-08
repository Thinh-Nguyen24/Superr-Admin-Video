export const AppState = {
  currentUser: null,
  currentRoute: '/dashboard',
  videoFilters: {
    search: '',
    categoryId: '',
    status: '',
    sortBy: 'created_desc',
    page: 1,
    pageSize: 8
  },
  dashboardTimeRange: 'daily', // 'daily' | 'monthly'

  setUser(user) {
    this.currentUser = user;
  },

  resetVideoFilters() {
    this.videoFilters = {
      search: '',
      categoryId: '',
      status: '',
      sortBy: 'created_desc',
      page: 1,
      pageSize: 8
    };
  }
};
