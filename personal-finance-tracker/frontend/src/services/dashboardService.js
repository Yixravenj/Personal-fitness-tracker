import api from './api';

const dashboardService = {
  // Get dashboard overview
  getOverview: async () => {
    const response = await api.get('/dashboard/overview');
    return response.data;
  },

  // Get spending trends
  getSpendingTrends: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/dashboard/spending-trends?${queryString}`);
    return response.data;
  },

  // Get category analysis
  getCategoryAnalysis: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/dashboard/category-analysis?${queryString}`);
    return response.data;
  },

  // Get goals progress
  getGoalsProgress: async () => {
    const response = await api.get('/dashboard/goals-progress');
    return response.data;
  },

  // Get monthly report
  getMonthlyReport: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/dashboard/monthly-report?${queryString}`);
    return response.data;
  }
};

export default dashboardService;