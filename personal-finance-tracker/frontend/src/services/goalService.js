import api from './api';

const goalService = {
  // Get all goals
  getGoals: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/goals?${queryString}`);
    return response.data;
  },

  // Get single goal
  getGoal: async (id) => {
    const response = await api.get(`/goals/${id}`);
    return response.data;
  },

  // Create new goal
  createGoal: async (goalData) => {
    const response = await api.post('/goals', goalData);
    return response.data;
  },

  // Update goal
  updateGoal: async (id, goalData) => {
    const response = await api.put(`/goals/${id}`, goalData);
    return response.data;
  },

  // Delete goal
  deleteGoal: async (id) => {
    const response = await api.delete(`/goals/${id}`);
    return response.data;
  },

  // Add contribution to goal
  addContribution: async (id, contributionData) => {
    const response = await api.post(`/goals/${id}/contribute`, contributionData);
    return response.data;
  },

  // Get goal contributions
  getContributions: async (id) => {
    const response = await api.get(`/goals/${id}/contributions`);
    return response.data;
  },

  // Update goal status
  updateGoalStatus: async (id, status) => {
    const response = await api.put(`/goals/${id}/status`, { status });
    return response.data;
  }
};

export default goalService;